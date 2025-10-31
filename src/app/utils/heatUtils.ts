import { HeatStatus, HeatType } from "@prisma/client";
import { green, grey, amber, red, purple, lightBlue, deepPurple } from "@mui/material/colors";


export const getHeatStatusColor = (status:HeatStatus)=>{
    switch(status){
    case HeatStatus.DRAFT:
        return grey[300]
    case HeatStatus.ACTIVE:
        return lightBlue[300]
    case HeatStatus.MARSHALLING:
        return amber[300];
    case HeatStatus.READY:
        return purple[300];
    case HeatStatus.CANCELED:
        return red[300];
    case HeatStatus.CHECKING:
        return amber[600];
    case HeatStatus.JUDGING:
        return deepPurple[300];
    case HeatStatus.COMPLETE:
        return green[800];
    default:
        return grey[300];
    }
}
