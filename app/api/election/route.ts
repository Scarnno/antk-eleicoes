import { castVote,handleError,json,readBody,register,snapshot } from "../../election-server";
export const dynamic="force-dynamic";
export async function GET(){try{return json(await snapshot());}catch(error){return handleError(error);}}
export async function POST(request:Request){try{const data=await readBody(request);if(data.action==="register"){await snapshot();await register(data);return json({ok:true},201);}if(data.action==="vote"){await castVote(data);return json({ok:true});}return json({error:"Ação inválida."},400);}catch(error){return handleError(error);}}
