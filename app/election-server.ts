import { env } from "cloudflare:workers";
import { classify, isVoting, validFinalists, normalizeName, validateCandidate, validateVote, type Candidate, type ElectionSnapshot, type Phase, type RoundResult } from "./election-rules";
export class ElectionError extends Error {constructor(message:string,public status=409){super(message);}}
function db(){if(!env.DB)throw new ElectionError("Banco indisponível. Tente novamente.",503);return env.DB.withSession("first-primary");}
export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
export function handleError(error:unknown){
  if(error instanceof ElectionError)return json({error:error.message},error.status);
  const detail=String(error)+String((error as {cause?:unknown})?.cause??"");
  if(/unique/i.test(detail))return json({error:"Este nome ou número já está cadastrado, ou este eleitor já votou neste turno."},409);
  return json({error:"Não foi possível concluir. Atualize a página e tente novamente."},503);
}
export async function readBody(request:Request){
  if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)throw new ElectionError("Origem inválida.",403);
  const text=await request.text();
  let data;try{data=JSON.parse(text);}catch{throw new ElectionError("Dados inválidos.",400);}
  if(!data||typeof data!=="object"||Array.isArray(data))throw new ElectionError("Dados inválidos.",400);
  return data as Record<string,unknown>;
}
export async function snapshot():Promise<ElectionSnapshot>{
 const database=db();
 const batch=await database.batch([
  database.prepare("INSERT INTO election (id) VALUES (1) ON CONFLICT(id) DO NOTHING"),
  database.prepare("SELECT * FROM election WHERE id = 1"),
  database.prepare("SELECT id,name,number,proposals FROM candidates ORDER BY number"),
  database.prepare("SELECT round,candidate_id,COUNT(*) AS count FROM ballots GROUP BY round,candidate_id"),
  database.prepare("SELECT round,candidate_id,voter_name FROM ballots WHERE round < (SELECT round FROM election WHERE id=1) OR (round = (SELECT round FROM election WHERE id=1) AND (SELECT phase FROM election WHERE id=1) IN ('round1_closed','round2_closed')) ORDER BY created_at,id"),
 ]);
 const state=batch[1].results[0] as unknown as {phase:Phase;round:number;version:number;finalists:string};
 const candidates=batch[2].results as unknown as Candidate[];
 const totals=batch[3].results as unknown as {round:number;candidate_id:string|null;count:number}[];
 const publicBallots=batch[4].results as unknown as {round:number;candidate_id:string|null;voter_name:string|null}[];
 const finalists=JSON.parse(state.finalists) as string[];
 const closedThrough=state.phase==="round1_closed"?1:state.phase==="round2_closed"?state.round:state.phase==="round2"?state.round-1:0;
 const results:RoundResult[]=[];
 for(let round=1;round<=closedThrough;round++){
  const counts=totals.filter(t=>t.round===round);
  const blank=counts.find(t=>t.candidate_id===null)?.count??0;
  const valid=counts.filter(t=>t.candidate_id!==null).reduce((a,t)=>a+t.count,0);
  const eligible=round===1?candidates:candidates.filter(c=>finalists.includes(c.id));
  const ranking=eligible.map(c=>({...c,votes:counts.find(t=>t.candidate_id===c.id)?.count??0,percent:valid?((counts.find(t=>t.candidate_id===c.id)?.count??0)/valid*100):0})).sort((a,b)=>b.votes-a.votes||a.number.localeCompare(b.number));
  results.push({round,total:valid+blank,valid,blank,ranking,ballots:publicBallots.filter(b=>b.round===round).map(b=>({voterName:b.voter_name,candidateId:b.candidate_id}))});
 }
 const last=results.find(r=>r.round===state.round);
 const winner=state.phase==="round2_closed"&&last&&last.valid>0&&last.ranking[0]?.votes>last.ranking[1]?.votes?last.ranking[0]:null;
 const first=results.find(r=>r.round===1);
 return {phase:state.phase,activeRound:state.round,version:state.version,candidates,finalists,currentTotal:totals.filter(t=>t.round===state.round).reduce((a,t)=>a+t.count,0),results,winner,finalTie:state.phase==="round2_closed"&&!winner,cutoff:first?classify(first.ranking):null,adminConfigured:!!env.ANTK_ADMIN_KEY};
}
export async function register(data:Record<string,unknown>){
 const error=validateCandidate(data);if(error)throw new ElectionError(error,400);
 const name=(data.name as string).trim().replace(/\s+/g," ");
 const result=await db().prepare("INSERT INTO candidates (id,name,normalized_name,number,proposals,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM election WHERE id=1 AND phase='registration')")
 .bind(crypto.randomUUID(),name,normalizeName(name),data.number,(data.proposals as string).trim(),new Date().toISOString()).run();
 if(!result.meta.changes)throw new ElectionError("As inscrições estão encerradas. Atualize a página.");
}
async function digest(value:string){return new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)));}
export async function castVote(data:Record<string,unknown>){
 const error=validateVote(data);if(error)throw new ElectionError(error,400);
 const current=await snapshot();
 if(!isVoting(current.phase))throw new ElectionError("A urna está fechada. Nenhum voto foi registrado.");
 if(data.round!==current.activeRound)throw new ElectionError("O turno mudou. Atualize a página antes de votar.");
 let candidateId:string|null=null;
 if(data.blank!==true){
  const candidate=current.candidates.find(c=>c.number===data.number);
  if(!candidate)throw new ElectionError("Número não encontrado. Corrija seu voto.",400);
  if(current.activeRound>1&&!current.finalists.includes(candidate.id))throw new ElectionError("Este candidato não está neste turno. Escolha um dos finalistas.",400);
  if(normalizeName(candidate.name)===normalizeName(data.name as string))throw new ElectionError("Você não pode votar em si mesmo. Escolha outro candidato.",403);
  candidateId=candidate.id;
 }
 const voterHash=Array.from(await digest("ANTK-2026:"+normalizeName(data.name as string)),b=>b.toString(16).padStart(2,"0")).join("");
 if(data.disclosureAccepted!==true)throw new ElectionError("Atualize a página e confirme a ciência sobre a divulgação do nome e do voto após o encerramento.",400);
 const voterName=(data.name as string).trim().replace(/\s+/g," ");
 const result=await db().prepare("INSERT INTO ballots (id,voter_hash,voter_name,round,candidate_id,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM election WHERE id=1 AND round=? AND phase IN ('round1','round2') AND version=?)")
 .bind(crypto.randomUUID(),voterHash,voterName,current.activeRound,candidateId,new Date().toISOString(),current.activeRound,current.version).run();
 if(!result.meta.changes)throw new ElectionError("O turno foi encerrado durante o envio. Seu voto não foi registrado.");
}
export async function requireAdmin(request:Request){
 const secret=env.ANTK_ADMIN_KEY;
 if(!secret)throw new ElectionError("A chave da comissão eleitoral ainda não foi configurada no servidor.",503);
 const supplied=request.headers.get("authorization")?.replace(/^Bearer /,"")??"";
 const [a,b]=await Promise.all([digest(secret),digest(supplied)]);let difference=0;
 for(let i=0;i<a.length;i++)difference|=a[i]^b[i];
 if(difference!==0)throw new ElectionError("Chave de acesso inválida.",401);
}
export async function transition(data:Record<string,unknown>){
 const current=await snapshot();
 if(data.version!==current.version)throw new ElectionError("A etapa foi alterada em outra janela. Atualize antes de continuar.");
 let phase=current.phase,round=current.activeRound,finalists=current.finalists;
 if(data.action==="close_registration"){
  if(phase!=="registration")throw new ElectionError("As candidaturas já foram encerradas.");
  phase="registration_closed";
 }else if(data.action==="open_first"){
  if(phase!=="registration"&&phase!=="registration_closed")throw new ElectionError("O primeiro turno já foi iniciado.");
  if(current.candidates.length<2)throw new ElectionError("Cadastre pelo menos dois candidatos antes de abrir o primeiro turno.");
  phase="round1";
 }else if(data.action==="close"){
  if(!isVoting(phase))throw new ElectionError("A urna já está fechada.");
  phase=phase==="round1"?"round1_closed":"round2_closed";
 }else if(data.action==="open_second"){
  if(phase!=="round1_closed"||!current.cutoff)throw new ElectionError("Encerre o primeiro turno antes de abrir o segundo.");
  if(!current.results[0]?.valid)throw new ElectionError("O primeiro turno não teve votos válidos. Reabra-o para receber votos.");
  const cutoff=current.cutoff;
  const automatic=cutoff.pool.length===cutoff.slots?[...cutoff.locked,...cutoff.pool]:null;
  const ids=automatic??data.finalists;
  if(!Array.isArray(ids)||!ids.every(id=>typeof id==="string")||!validFinalists(ids,cutoff))throw new ElectionError("Há empate na classificação. Selecione os candidatos empatados conforme o desempate acordado pelo grupo.");
  finalists=ids;phase="round2";round=2;
 }else if(data.action==="reopen_first"){
  if(phase!=="round1_closed"||current.results[0]?.valid)throw new ElectionError("A reabertura só está disponível se não houve votos válidos no primeiro turno.");
  phase="round1";
 }else if(data.action==="tiebreak"){
  if(phase!=="round2_closed"||current.winner)throw new ElectionError("Não há empate final a resolver.");
  phase="round2";round++;
 }else throw new ElectionError("Ação inválida.",400);
 const result=await db().prepare("UPDATE election SET phase=?,round=?,finalists=?,version=version+1 WHERE id=1 AND version=?")
 .bind(phase,round,JSON.stringify(finalists),current.version).run();
 if(!result.meta.changes)throw new ElectionError("A etapa mudou durante a operação. Atualize a página.");
 return snapshot();
}
export async function updateCandidateProposals(data:Record<string,unknown>){
 if(typeof data.candidateId!=="string"||typeof data.expectedProposals!=="string"||typeof data.proposals!=="string"||data.proposals.trim().length<20)throw new ElectionError("Informe a candidatura e o texto completo das propostas.",400);
 const result=await db().prepare("UPDATE candidates SET proposals=? WHERE id=? AND proposals=?")
 .bind(data.proposals.trim(),data.candidateId,data.expectedProposals).run();
 if(result.meta.changes!==1)throw new ElectionError("A candidatura foi alterada ou não foi encontrada. Atualize antes de tentar novamente.");
 return snapshot();
}
export async function removeUnvotedCandidates(data:Record<string,unknown>){
 const current=await snapshot();
 if(current.phase!=="registration"||data.version!==current.version)throw new ElectionError("A etapa mudou. A remoção só é permitida antes da votação.");
 const ids=data.candidateIds;
 if(!Array.isArray(ids)||ids.length<1||ids.length>25||new Set(ids).size!==ids.length||!ids.every(id=>typeof id==="string"&&current.candidates.some(c=>c.id===id)))throw new ElectionError("Seleção de candidaturas inválida.",400);
 if(current.currentTotal>0||current.results.length>0)throw new ElectionError("Há votos registrados. A remoção foi bloqueada.");
 const database=db();
 const result=await database.batch([
  database.prepare("UPDATE election SET version=version+1 WHERE id=1 AND phase='registration' AND version=? AND NOT EXISTS (SELECT 1 FROM ballots) AND NOT EXISTS (SELECT 1 FROM votes)").bind(current.version),
  database.prepare(`DELETE FROM candidates WHERE id IN (${ids.map(()=>"?").join(",")}) AND changes()=1 AND EXISTS (SELECT 1 FROM election WHERE id=1 AND phase='registration' AND version=?)`).bind(...ids as string[],current.version+1),
 ]);
 if(!result[0].meta.changes)throw new ElectionError("A eleição mudou durante a operação. Nenhuma candidatura foi removida.");
 return {...await snapshot(),removed:result[1].meta.changes};
}
