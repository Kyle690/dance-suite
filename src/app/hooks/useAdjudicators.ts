import { useQuery } from "@tanstack/react-query";
import { getAdjudicators } from "@/app/server/competitions";


export const useAdjudicators = (competitionId:string)=>{
    const query=useQuery({
        queryKey:[ 'competition_adjudicators',competitionId ],
        queryFn:async()=>{
            if(!competitionId){
                return null
            }
            const result = await getAdjudicators(competitionId)
            if(result?.data){
                return result.data;
            }
            return null;
        }
    })

    return query
}
