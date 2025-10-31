import { useQuery } from "@tanstack/react-query";
import { getPanels } from "@/app/server/competitions";


export const usePanels = (competitionId:string)=>{
    const {
        data:panels,
        isLoading:panelsLoading,
        refetch
    }=useQuery({
        queryKey:[ 'competition_panels',competitionId ],
        queryFn:async()=>{
            if(!competitionId){
                return null
            }
            const result = await getPanels(String(competitionId));
            if(result?.data){
                return result.data;
            }
            return null;
        }
    })

    return {
        panels,
        panelsLoading,
        refetchPanels:refetch
    }
}
