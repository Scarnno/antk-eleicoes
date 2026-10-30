export type Phase = "registration" | "registration_closed" | "round1" | "round1_closed" | "round2" | "round2_closed";
export type Candidate = {id:string;name:string;number:string;proposals:string};
export type RankedCandidate = Candidate & {votes:number;percent:number};
export type PublicBallot = {voterName:string|null;candidateId:string|null};
export type RoundResult = {round:number;total:number;valid:number;blank:number;ranking:RankedCandidate[];ballots:PublicBallot[]};
export type ElectionSnapshot = {
  phase:Phase;activeRound:number;version:number;candidates:Candidate[];finalists:string[];
  currentTotal:number;results:RoundResult[];winner:RankedCandidate|null;finalTie:boolean;
  cutoff:{locked:string[];pool:string[];slots:number}|null;adminConfigured:boolean;
};
export function isVoting(phase:string) {return phase==="round1"||phase==="round2";}
export function roundLabel(round:number) {return round===1?"1º turno":round===2?"2º turno":`Desempate ${round-2}`;}
export function phaseLabel(snapshot:Pick<ElectionSnapshot,"phase"|"activeRound"|"winner">) {
  if(snapshot.winner)return "Novo adm eleito";
  if(snapshot.phase==="registration")return "Inscrições abertas";
  if(snapshot.phase==="registration_closed")return "Candidaturas encerradas · aguardando comissão";
  if(isVoting(snapshot.phase))return `${roundLabel(snapshot.activeRound)} aberto`;
  if(snapshot.phase==="round1_closed")return "1º turno apurado";
  return "Desempate necessário";
}
export function classify(ranking:RankedCandidate[]) {
  if(ranking.length<2)return null;
  const cutoff=ranking[1].votes;
  const locked=ranking.filter(c=>c.votes>cutoff).map(c=>c.id);
  const pool=ranking.filter(c=>c.votes===cutoff).map(c=>c.id);
  return {locked,pool,slots:2-locked.length};
}
export function validFinalists(ids:string[],cutoff:NonNullable<ElectionSnapshot["cutoff"]>) {
  return ids.length===2&&new Set(ids).size===2&&cutoff.locked.every(id=>ids.includes(id))&&ids.every(id=>cutoff.locked.includes(id)||cutoff.pool.includes(id));
}
export function normalizeName(name: string) { return name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g," "); }
export function validateCandidate(data: {name?:unknown;number?:unknown;proposals?:unknown}) {
  if(typeof data.name!=="string" || data.name.trim().length<2 || data.name.length>60 || !/[\p{L}]/u.test(data.name)) return "Informe um nome entre 2 e 60 caracteres.";
  if(typeof data.number!=="string" || !/^\d{2}$/.test(data.number)) return "Escolha um número com exatamente dois dígitos.";
  if(typeof data.proposals!=="string" || data.proposals.trim().length<20) return "Escreva suas propostas com pelo menos 20 caracteres.";
  return null;
}
export function validateVote(data: {name?:unknown;number?:unknown;blank?:unknown}) {
  if(typeof data.name!=="string" || data.name.trim().length<2 || data.name.length>60 || !/[\p{L}]/u.test(data.name)) return "Informe seu nome para se identificar.";
  if(data.blank !== true && (typeof data.number!=="string" || !/^\d{2}$/.test(data.number))) return "Digite os dois dígitos de um candidato.";
  return null;
}
