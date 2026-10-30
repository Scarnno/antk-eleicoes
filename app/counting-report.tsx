"use client";
import {useEffect,useState} from 'react';
import {CheckCircle2,Pause,Play,RotateCcw,SkipForward,Vote} from 'lucide-react';
import {roundLabel,type RoundResult} from './election-rules';
import {countingFrame,countingDelay} from './counting';
import {CandidatePortrait,validatePhotoMap,type PhotoMap} from './candidate-media';
const colors=['#edc849','#55c498','#7ab7f5','#d6a1f0','#f7977f','#77ced1'];

export function RoundReport({result,finalists,onComplete}:{result:RoundResult;finalists:string[];onComplete?:()=>void}){
 const [cursor,setCursor]=useState(0),[playing,setPlaying]=useState(true),[speed,setSpeed]=useState(1),[filter,setFilter]=useState('');
 const [photos,setPhotos]=useState<PhotoMap>({});
 useEffect(()=>{let active=true;fetch('/candidate-photos.json').then(r=>r.ok?r.json():{}).then(p=>{if(active)setPhotos(validatePhotoMap(p));}).catch(()=>{});return()=>{active=false;};},[]);
 const complete=cursor>=result.total;
 useEffect(()=>{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){setCursor(result.total);setPlaying(false);}},[result.round,result.total]);
 useEffect(()=>{if(!playing||complete)return;const timer=setTimeout(()=>setCursor(n=>Math.min(result.total,n+1)),countingDelay(result.total,cursor,speed));return()=>clearTimeout(timer);},[playing,complete,result.total,cursor,speed]);
 useEffect(()=>{if(complete)onComplete?.();},[complete,onComplete]);
 const frame=countingFrame(result,cursor);
 const progress=result.total?Math.round(100*frame.processed/result.total):100;
 const lastCandidate=result.ranking.find(c=>c.id===frame.last?.candidateId);
 const visibleBallots=result.ballots.filter(b=>{const c=result.ranking.find(c=>c.id===b.candidateId);return `${b.voterName??'Nome não registrado'} ${c?.name??'Em branco'} ${c?.number??''}`.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR'));});
 const leading=frame.ranking[0],tied=!!leading&&frame.ranking.filter(c=>c.votes===leading.votes).length>1;
 return <article className="round-report counting-report">
  <div className="counting-masthead"><div><span className="counting-kicker">ANTK / ELEIÇÕES 2026</span><h3>Central de apuração</h3><p>{roundLabel(result.round)} · Urna encerrada pela comissão</p></div><span className="counting-status"><CheckCircle2 size={17}/>{complete?'TOTALIZAÇÃO CONCLUÍDA':'REPRODUÇÃO DA APURAÇÃO'}</span></div>
  <div className="counting-body">
   <div className="counting-progress-title"><div><strong>{progress}<small>%</small></strong><span>dos votos recontados</span></div><b>{frame.processed} / {result.total}</b></div>
   <div className="counting-progress" role="progressbar" aria-label={`Apuração do ${roundLabel(result.round)}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${progress}%`}}/></div>
   <div className="counting-controls"><button className="outline-button" disabled={complete} onClick={()=>setPlaying(p=>!p)}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pausar':'Continuar'}</button><button className="outline-button" onClick={()=>{setCursor(0);setPlaying(true);}}><RotateCcw size={15}/>Reproduzir do início</button><button className="outline-button" onClick={()=>{setCursor(result.total);setPlaying(false);}} disabled={complete}><SkipForward size={15}/>Ver resultado final</button><label>Velocidade <select value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option></select></label></div>
   <p className="counting-explanation">Reprodução dos votos reais, na ordem de recebimento, após o encerramento. A animação não altera o resultado.</p>
   <div className="result-stats"><div><strong>{frame.processed}</strong><span>votos recontados</span></div><div><strong>{frame.valid}</strong><span>votos válidos</span></div><div><strong>{frame.blank}</strong><span>em branco</span></div></div>
   <div className="race-board" style={{height:result.ranking.length*88}} aria-label="Classificação por votos">{frame.ranking.map((c,i)=><div className={`race-row ${i===0&&c.votes>0?'race-leader':''}`} key={c.id} style={{transform:`translateY(${i*88}px)`}}><span className="race-place">{String(i+1).padStart(2,'0')}</span><CandidatePortrait name={c.name} photos={photos} className="race-portrait" size={26}/><div className="race-person"><div className="race-name"><strong>{c.name}</strong><span>{c.number}</span>{complete&&result.round===1&&finalists.includes(c.id)&&<small>FINALISTA</small>}</div><div className="race-track"><span style={{width:`${c.percent}%`,background:colors[result.ranking.findIndex(p=>p.id===c.id)%colors.length]}}/></div></div><div className="race-score"><strong>{c.percent.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%</strong><span>{c.votes} voto{c.votes!==1?'s':''}</span></div></div>)}</div>
   <div className="counting-latest">{complete?<><CheckCircle2 size={20}/><div><b>{!result.valid?'Turno sem votos válidos':tied?'Empate na liderança':`${leading?.name} lidera o resultado final`}</b><span>{tied?'A ordem de exibição não desempata a eleição.':`${result.total} votos recontados. Boletim consolidado.`}</span></div></>:<><Vote size={20}/><div><b>{frame.last?`${frame.last.voterName??'Nome não registrado'} → ${lastCandidate?.name??'Em branco'}`:'Preparando a contagem…'}</b><span>Último voto recontado · {roundLabel(result.round)}</span></div></>}</div>
   <p className="report-footnote">Percentuais sobre os votos válidos. Votos em branco não entram na classificação. Empates seguem as regras da eleição.</p>
   <details className="public-votes"><summary>Quem votou em quem <span>{result.total} votos</span></summary><div className="public-votes-content"><p>Nomes autodeclarados, divulgados somente após o encerramento deste turno.</p>{result.ballots.some(b=>b.voterName===null)&&<div className="notice">Votos anteriores a esta atualização não guardavam o nome do eleitor. Eles são contabilizados e exibidos como “Nome não registrado”.</div>}<label className="search-label">Buscar eleitor ou candidato<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Nome ou número do candidato"/></label><div className="vote-table-wrap"><table className="vote-table"><thead><tr><th scope="col">Eleitor</th><th scope="col">Votou em</th></tr></thead><tbody>{visibleBallots.map((b,i)=>{const c=result.ranking.find(c=>c.id===b.candidateId);return <tr key={i}><td>{b.voterName??'Nome não registrado'}</td><td>{c?`${c.name} · ${c.number}`:'Em branco'}</td></tr>;})}</tbody></table></div>{visibleBallots.length===0&&<p>Nenhum voto encontrado.</p>}</div></details>
  </div>
 </article>;
}
