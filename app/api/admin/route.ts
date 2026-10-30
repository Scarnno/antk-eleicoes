import { handleError,json,readBody,requireAdmin,snapshot,transition,removeUnvotedCandidates,updateCandidateProposals } from "../../election-server";
export const dynamic="force-dynamic";
export async function POST(request:Request){try{const data=await readBody(request);await requireAdmin(request);return json(data.action==="authenticate"?await snapshot():data.action==="remove_unvoted_candidates"?await removeUnvotedCandidates(data):data.action==="update_candidate_proposals"?await updateCandidateProposals(data):await transition(data));}catch(error){return handleError(error);}}
