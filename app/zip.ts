type ZipEntry={name:string;data:Uint8Array};
const crcTable=Array.from({length:256},(_,value)=>{let crc=value;for(let bit=0;bit<8;bit++)crc=(crc&1)?0xedb88320^(crc>>>1):crc>>>1;return crc>>>0;});
function crc32(data:Uint8Array){let crc=0xffffffff;for(const byte of data)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
export function zipFiles(entries:ZipEntry[]){
 const encoder=new TextEncoder(),local:Uint8Array[]=[],central:Uint8Array[]=[];
 let offset=0,centralSize=0;
 for(const entry of entries){
  const name=encoder.encode(entry.name),crc=crc32(entry.data),header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,entry.data.length,true);h.setUint32(22,entry.data.length,true);h.setUint16(26,name.length,true);header.set(name,30);
  local.push(header,entry.data);
  const record=new Uint8Array(46+name.length),c=new DataView(record.buffer);
  c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,entry.data.length,true);c.setUint32(24,entry.data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);record.set(name,46);central.push(record);centralSize+=record.length;offset+=header.length+entry.data.length;
 }
 const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,entries.length,true);e.setUint16(10,entries.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);
 const result=new Uint8Array(offset+centralSize+end.length);let position=0;
 for(const chunk of [...local,...central,end]){result.set(chunk,position);position+=chunk.length;}
 return result;
}
