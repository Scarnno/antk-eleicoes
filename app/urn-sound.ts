"use client";
import {useEffect,useRef,useState} from "react";
type Sound="key"|"correct"|"confirmed";
export function useUrnSound(){
 const [enabled,setEnabled]=useState(true);
 const context=useRef<AudioContext|null>(null);
 const enabledRef=useRef(true);
 useEffect(()=>{
  try{const saved=localStorage.getItem("antk-urn-sound");if(saved==="off"){enabledRef.current=false;setEnabled(false);}}catch{}
  return()=>{const current=context.current;context.current=null;if(current&&current.state!=="closed")void current.close().catch(()=>{});};
 },[]);
 function getContext(){
  if(!enabledRef.current)return null;
  try{
   const Audio=window.AudioContext??(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!Audio)return null;
   if(!context.current||context.current.state==="closed")context.current=new Audio();
   return context.current;
  }catch{return null;}
 }
 function prime(){const current=getContext();if(current&&current.state==="suspended")void current.resume().catch(()=>{});}
 function play(sound:Sound){
  const current=getContext();if(!current)return;
  function schedule(){
   if(!enabledRef.current||current!.state!=="running")return;
   try{
    const start=current!.currentTime+.008;
    const notes=sound==="confirmed"?[{f:880,t:0,d:.095},{f:1175,t:.105,d:.095},{f:880,t:.21,d:.095},{f:1175,t:.315,d:.095},{f:880,t:.42,d:.095},{f:1175,t:.525,d:.25}]:sound==="correct"?[{f:780,t:0,d:.055},{f:520,t:.065,d:.085}]:[{f:1046,t:0,d:.065}];
    for(const note of notes){
     const oscillator=current!.createOscillator(),gain=current!.createGain();
     oscillator.type="square";oscillator.frequency.setValueAtTime(note.f,start+note.t);
     gain.gain.setValueAtTime(0,start+note.t);
     gain.gain.linearRampToValueAtTime(sound==="confirmed"?.045:.035,start+note.t+.005);
     gain.gain.setValueAtTime(sound==="confirmed"?.045:.035,start+note.t+note.d-.012);
     gain.gain.linearRampToValueAtTime(0,start+note.t+note.d);
     oscillator.connect(gain);gain.connect(current!.destination);
     oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
     oscillator.start(start+note.t);oscillator.stop(start+note.t+note.d+.01);
    }
   }catch{/* Audio support must never prevent voting. */}
  }
  if(current.state==="suspended")void current.resume().then(schedule).catch(()=>{});else schedule();
 }
 function toggle(){const next=!enabledRef.current;enabledRef.current=next;setEnabled(next);try{localStorage.setItem("antk-urn-sound",next?"on":"off");}catch{}if(next)play("key");}
 return {enabled,toggle,prime,play};
}
