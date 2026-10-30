import {normalizeName,type Candidate} from "./election-rules";
import {zipFiles} from "./zip";
type Person=Pick<Candidate,"name"|"number"|"proposals">;
function wrap(ctx:CanvasRenderingContext2D,text:string,width:number){
 const lines:string[]=[];
 for(const paragraph of text.replace(/\r/g,"").split("\n")){
  if(!paragraph.trim()){lines.push("");continue;}
  let line="";
  for(const word of paragraph.trim().split(/\s+/)){
   if(ctx.measureText(line?line+" "+word:word).width<=width){line=line?line+" "+word:word;continue;}
   if(line){lines.push(line);line="";}
   for(const char of word){if(line&&ctx.measureText(line+char).width>width){lines.push(line);line="";}line+=char;}
  }
  if(line)lines.push(line);
 }
 return lines;
}
async function loadPhoto(url:string){
 const photo=new Image();photo.decoding="async";
 await new Promise<void>((resolve,reject)=>{photo.onload=()=>resolve();photo.onerror=()=>reject(Error("A foto não carregou. Atualize a página e tente baixar novamente."));photo.src=url;});return photo;
}
export async function renderLeaflet(candidate:Person,photoUrl:string|null,pageIndex=0){
 const canvas=document.createElement("canvas");canvas.width=1080;
 const ctx=canvas.getContext("2d");if(!ctx)throw Error("Este navegador não conseguiu gerar a imagem.");
 const photo=photoUrl?await loadPhoto(photoUrl):null;
 ctx.font="30px Arial";
 const allProposals=wrap(ctx,candidate.proposals.trim().replace(/\n{3,}/g,"\n\n"),920);
 const pageCount=Math.max(1,Math.ceil(allProposals.length/60));
 const proposals=allProposals.slice(pageIndex*60,(pageIndex+1)*60);
 function complete(){if(pageCount>1){ctx!.textAlign="right";ctx!.fillStyle="#b5c6d9";ctx!.font="13px Arial";ctx!.fillText(`PÁGINA ${pageIndex+1} DE ${pageCount}`,1008,canvas.height-8);}return {canvas,pageCount};}
 if(photo){
  const artworkHeight=Math.round(1080*photo.naturalHeight/photo.naturalWidth);
  const bodyTop=artworkHeight+226;
  canvas.height=bodyTop+proposals.length*44+196;
  ctx.fillStyle="#f3f5ef";ctx.fillRect(0,0,1080,canvas.height);
  ctx.drawImage(photo,0,0,1080,artworkHeight);
  ctx.fillStyle="#102c50";ctx.fillRect(0,artworkHeight,1080,160);
  ctx.fillStyle="#e5b934";ctx.fillRect(0,artworkHeight,1080,6);
  ctx.fillStyle="#ffffff";ctx.font="700 27px Arial";ctx.fillText("NA URNA, DIGITE",72,artworkHeight+71);
  ctx.font="20px Arial";ctx.fillStyle="#b5c8dd";ctx.fillText("O próximo mandato pode ser seu.",72,artworkHeight+111);
  ctx.fillStyle="#efd16c";ctx.font="900 116px Arial";ctx.textAlign="right";ctx.fillText(candidate.number,1008,artworkHeight+128);ctx.textAlign="left";
  ctx.fillStyle="#176b4b";ctx.font="700 20px Arial";ctx.fillText("MINHAS PROPOSTAS PARA O GRUPO",72,bodyTop);
  ctx.fillStyle="#2b3e45";ctx.font="30px Arial";proposals.forEach((line,i)=>ctx.fillText(line,72,bodyTop+60+i*44));
  ctx.fillStyle="#102c50";ctx.fillRect(0,canvas.height-100,1080,100);
  ctx.fillStyle="#e9d17c";ctx.font="700 23px Arial";ctx.fillText("O mandato passa. Os prints ficam.",72,canvas.height-57);
  ctx.fillStyle="#b5c6d9";ctx.font="13px Arial";ctx.fillText("ELEIÇÃO DE UM GRUPO DE AMIGOS · SEM VÍNCULO GOVERNAMENTAL",72,canvas.height-26);
  return complete();
 }
 canvas.height=Math.max(1350,775+proposals.length*44+190);
 const height=canvas.height;
 ctx.fillStyle="#f3f5ef";ctx.fillRect(0,0,1080,height);
 ctx.fillStyle="#102c50";ctx.fillRect(0,0,1080,145);
 ctx.fillStyle="#176b4b";ctx.fillRect(0,0,420,10);ctx.fillStyle="#e5b934";ctx.fillRect(420,0,260,10);ctx.fillStyle="#1b4b91";ctx.fillRect(680,0,400,10);
 ctx.fillStyle="#ffffff";ctx.font="900 61px Arial";ctx.fillText("ANTK",72,89);
 ctx.font="700 16px Arial";ctx.fillStyle="#b4c7dc";ctx.fillText("PORTAL ELEITORAL",74,118);
 ctx.textAlign="right";ctx.fillStyle="#e5cc75";ctx.font="700 23px Arial";ctx.fillText("ELEIÇÕES 2026",1008,81);ctx.font="16px Arial";ctx.fillStyle="#b4c7dc";ctx.fillText("PELO GRUPO. PARA O GRUPO.",1008,112);ctx.textAlign="left";
 ctx.fillStyle="#176b4b";ctx.font="700 17px Arial";ctx.fillText("CANDIDATURA À GESTÃO DA ANTK",72,207);
 let fontSize=64,nameLines:string[]=[];
 do{ctx.font=`800 ${fontSize}px Arial`;nameLines=wrap(ctx,candidate.name,548);if(nameLines.length<=3)break;fontSize-=2;}while(fontSize>=32);
 ctx.fillStyle="#102c50";nameLines.forEach((line,i)=>ctx.fillText(line,72,275+i*fontSize*1.1));
 ctx.fillStyle="#667989";ctx.font="700 18px Arial";ctx.fillText("NA URNA, DIGITE",76,479);
 ctx.fillStyle="#102c50";ctx.font="900 148px Arial";ctx.fillText(candidate.number,66,617);
 ctx.fillStyle="#e5b934";ctx.fillRect(74,635,184,6);
 ctx.save();ctx.beginPath();ctx.roundRect(676,225,332,390,8);ctx.clip();
 {ctx.fillStyle="#dfe9e2";ctx.fillRect(676,225,332,390);ctx.strokeStyle="#9eb2a5";ctx.lineWidth=4;ctx.beginPath();ctx.arc(842,355,48,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(842,480,86,Math.PI,0);ctx.stroke();ctx.fillStyle="#6c8375";ctx.textAlign="center";ctx.font="700 15px Arial";ctx.fillText("FOTO AINDA NÃO ENVIADA",842,570);ctx.textAlign="left";}
 ctx.restore();
 ctx.fillStyle="#cbd8ce";ctx.fillRect(72,681,936,1);
 ctx.fillStyle="#176b4b";ctx.font="700 20px Arial";ctx.fillText("MINHAS PROPOSTAS PARA O GRUPO",72,731);
 ctx.fillStyle="#2b3e45";ctx.font="30px Arial";proposals.forEach((line,i)=>ctx.fillText(line,72,793+i*44));
 ctx.fillStyle="#102c50";ctx.fillRect(0,height-140,1080,140);
 ctx.fillStyle="#e9d17c";ctx.font="700 26px Arial";ctx.fillText("O mandato passa. Os prints ficam.",72,height-81);
 ctx.fillStyle="#b5c6d9";ctx.font="14px Arial";ctx.fillText("ELEIÇÃO DE UM GRUPO DE AMIGOS · SEM VÍNCULO GOVERNAMENTAL",72,height-42);
 return complete();
}
export async function createLeafletFile(candidate:Person,photoUrl:string|null){
 const base=`antk-${normalizeName(candidate.name).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}-${candidate.number}`;
 const pages:Blob[]=[];
 let pageCount=1;
 for(let page=0;page<pageCount;page++){
  const rendered=await renderLeaflet(candidate,photoUrl,page);pageCount=rendered.pageCount;
  const canvas=rendered.canvas;
  pages.push(await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error("Não foi possível gerar o arquivo.")),"image/png")));
  canvas.width=0;canvas.height=0;
 }
 if(pages.length===1)return {blob:pages[0],pages,filename:base+".png"};
 const entries=await Promise.all(pages.map(async(blob,index)=>({name:`${base}-pagina-${String(index+1).padStart(2,"0")}.png`,data:new Uint8Array(await blob.arrayBuffer())})));
 return {blob:new Blob([zipFiles(entries).buffer as ArrayBuffer],{type:"application/zip"}),pages,filename:base+".zip"};
}

