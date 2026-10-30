"use client";
import {useEffect,useRef,useState} from "react";
import {Download,UserRound,X} from "lucide-react";
import {normalizeName,type Candidate} from "./election-rules";
import {createLeafletFile} from "./leaflet";
import {photoForName,type PhotoMap} from "./candidate-photo-match";
export {photoForName};
export type {PhotoMap};
export function validatePhotoMap(raw:unknown):PhotoMap{
 const result:PhotoMap={};if(!raw||typeof raw!=="object"||Array.isArray(raw))return result;
 for(const [name,url] of Object.entries(raw)){if(typeof url==="string"&&/^\/candidate-photos\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)$/i.test(url)&&!url.includes(".."))result[normalizeName(name)]=url;}
 return result;
}
export function CandidatePortrait({name,photos,className="",size=38}:{name:string;photos:PhotoMap;className?:string;size?:number}){
 const url=photoForName(name,photos);const [failed,setFailed]=useState(false);
 useEffect(()=>{setFailed(false);},[url]);
 return <div className={`candidate-portrait ${className}`}>{url&&!failed?<img src={url} alt={`Foto de ${name}`} onError={()=>setFailed(true)}/>:<UserRound size={size} strokeWidth={1.3}/>}</div>;
}
export function DownloadLeaflet({candidate,photos}:{candidate:Pick<Candidate,"name"|"number"|"proposals">;photos:PhotoMap}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");
 const [preview,setPreview]=useState<{url:string;filename:string;pages:string[]}|null>(null),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(!preview)return;dialog.current?.showModal();return()=>{URL.revokeObjectURL(preview.url);preview.pages.forEach(url=>URL.revokeObjectURL(url));};},[preview]);
 async function download(){setBusy(true);setError("");try{const file=await createLeafletFile(candidate,photoForName(candidate.name,photos));setPreview({url:URL.createObjectURL(file.blob),filename:file.filename,pages:file.pages.map(page=>URL.createObjectURL(page))});}catch(e){setError(e instanceof Error?e.message:"Não foi possível baixar. Tente novamente.");}finally{setBusy(false);}}
 return <div className="leaflet-download"><button type="button" className="outline-button" onClick={download} disabled={busy} aria-label={`Baixar folheto de ${candidate.name}`}><Download size={16}/>{busy?"Preparando imagem...":"Baixar folheto"}</button>{error&&<p className="form-error" role="alert">{error}</p>}<dialog className="leaflet-dialog" ref={dialog} onClose={()=>setPreview(null)} aria-label={`Folheto de ${candidate.name}`}><div className="leaflet-dialog-header"><div><b>Seu folheto de candidato</b><small>{preview&&preview.pages.length>1?`${preview.pages.length} páginas PNG, reunidas em um ZIP`:"PNG pronto para compartilhar no grupo"}</small></div><button className="outline-button" type="button" onClick={()=>dialog.current?.close()} aria-label="Fechar folheto"><X size={18}/></button></div>{preview&&<><div className="leaflet-image-wrap">{preview.pages.map((url,index)=><img key={url} src={url} alt={`Folheto de ${candidate.name}, número ${candidate.number}${preview.pages.length>1?`, página ${index+1}`:""}`}/>)}</div><div className="leaflet-dialog-footer"><span>{photoForName(candidate.name,photos)?"Foto e número da candidatura incluídos.":"A foto será incluída depois de ser enviada."}</span><a className="primary" href={preview.url} download={preview.filename}><Download size={16}/>{preview.pages.length>1?`Baixar ${preview.pages.length} páginas (ZIP)`:"Salvar PNG"}</a></div></>}</dialog></div>;
}

