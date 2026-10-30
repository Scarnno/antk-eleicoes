import type {RoundResult} from './election-rules';

export function countingDelay(total:number,processed:number,speed=1){
 const base=Math.max(650,Math.min(3200,52000/Math.max(1,total)));
 const finalVotes=total>3&&total-processed<=3;
 return base*(finalVotes?1.8:1)/speed;
}

// Prefixes of the recorded ballots preserve the actual receipt order.
export function countingFrame(result:RoundResult,processed:number){
 const ballots=result.ballots.slice(0,Math.max(0,Math.min(result.total,processed)));
 const counts=new Map<string,number>();let blank=0;
 for(const ballot of ballots){if(ballot.candidateId===null)blank++;else counts.set(ballot.candidateId,(counts.get(ballot.candidateId)??0)+1);}
 const valid=ballots.length-blank;
 const ranking=result.ranking.map(c=>({...c,votes:counts.get(c.id)??0,percent:valid?100*(counts.get(c.id)??0)/valid:0})).sort((a,b)=>b.votes-a.votes||a.number.localeCompare(b.number));
 return {ranking,valid,blank,processed:ballots.length,last:ballots.at(-1)};
}
