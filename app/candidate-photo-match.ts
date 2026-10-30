export type PhotoMap=Record<string,string>;
const particles=new Set(["de","da","do","das","dos","e"]);
const aliases:Record<string,string>={"higor galdino":"higor almeida","pedro mateus":"pedro matheus"};
function tokens(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().split(/\s+/).filter(t=>t&&!particles.has(t));}
function containsInOrder(pattern:string[],name:string[]){let position=0;for(const token of name)if(token===pattern[position])position++;return position===pattern.length;}
export function matchCandidatePhoto(name:string,photos:PhotoMap):{url:string|null;ambiguous:boolean}{
 const input=tokens(name);if(input.length<2)return {url:null,ambiguous:false};
 const entries=Object.entries(photos).map(([key,url])=>({key,tokens:tokens(key),url}));
 const patterns=[...entries];
 for(const [alias,target] of Object.entries(aliases)){
  const canonical=entries.find(entry=>entry.tokens.join(" ")===tokens(target).join(" "));
  if(canonical)patterns.push({key:alias,tokens:tokens(alias),url:canonical.url});
 }
 const exact=new Set(patterns.filter(entry=>entry.tokens.join(" ")===input.join(" ")).map(entry=>entry.url));
 if(exact.size)return {url:exact.size===1?[...exact][0]:null,ambiguous:exact.size>1};
 const matches=new Set(patterns.filter(entry=>entry.tokens.length>=2&&entry.tokens[0]===input[0]&&containsInOrder(entry.tokens,input)).map(entry=>entry.url));
 return {url:matches.size===1?[...matches][0]:null,ambiguous:matches.size>1};
}
export function photoForName(name:string,photos:PhotoMap){return matchCandidatePhoto(name,photos).url;}

