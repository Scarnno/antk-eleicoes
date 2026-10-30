import assert from 'node:assert/strict';
import {countingFrame} from '../app/counting.ts';
const person=(id,number,votes)=>({id,number,name:id,proposals:'',votes,percent:100*votes/4});
const result={round:1,total:5,valid:4,blank:1,ranking:[person('B','22',3),person('A','11',1)],ballots:[{voterName:null,candidateId:'A'},{voterName:'Lia',candidateId:null},{voterName:'João',candidateId:'B'},{voterName:'Ana',candidateId:'B'},{voterName:'Ivo',candidateId:'B'}]};
assert.equal(countingFrame(result,0).processed,0);
assert.equal(countingFrame(result,1).ranking[0].id,'A');
assert.equal(countingFrame(result,2).blank,1);
assert.equal(countingFrame(result,2).ranking[0].percent,100);
assert.equal(countingFrame(result,3).ranking[0].votes,1);
assert.equal(countingFrame(result,4).ranking[0].id,'B','actual vote order produces a lead change');
assert.deepEqual(countingFrame(result,5).ranking,result.ranking);
assert.equal(countingFrame(result,99).processed,5);
for(let n=0;n<=5;n++){const f=countingFrame(result,n);assert.equal(f.valid+f.blank,n);assert.equal(f.ranking.reduce((s,c)=>s+c.votes,0),f.valid);}
assert.equal(countingFrame({...result,total:0,ballots:[]},0).valid,0);
console.log('Counting replay: lead changes, blank votes, ties, legacy names, bounds and exact final totals verified.');
