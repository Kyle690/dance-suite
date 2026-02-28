import { safeAction } from "@/app/lib/safeAction";
import { RoundMarkSchema } from "@/app/schemas/MarksSchemas";
import { groupBy, keys, forEach, sortBy, flatten } from "lodash";
import { prisma } from "@/app/lib/prisma";
import { CompetitionLogEventType, HeatMarkInputType, HeatStatus } from "@prisma/client";
import { UidSchema } from "@/app/schemas/CommonSchema";
import { SectionHeatRoundResultSchema } from "@/app/schemas/SectionSchema";
import { getCompetitionUser } from "@/app/server/competitions/competitionActions";
import { TableCellProps } from "@mui/material/TableCell";


export const submitRoundMarks = safeAction.inputSchema(RoundMarkSchema).action(async({
    parsedInput,
    ctx
})=>{

    const adjudicators = groupBy(parsedInput, 'adjudicator_id');

    const competitionUser = await getCompetitionUser({
        userId:ctx.user.id,
        competitionId:String(ctx.competition_id)
    })

    for(const adjudicatorId of keys(adjudicators)){

        const danceMarks= adjudicators[adjudicatorId].reduce((a:{dancer_id:string, dancer_number:number, dance:string}[],v)=>{

            v.marks.forEach((mark)=>{
                a.push({
                    dancer_id:mark.uid,
                    dancer_number:Number(mark.number),
                    dance:v.dance
                })
            })


            return a;
        },[])


        await prisma.heat_marks.create({
            data:{
                adjudicator_id:adjudicatorId,
                input_type: HeatMarkInputType.SCRUTINEER,
                heat_id:parsedInput[0].heat_id,
                scrutineer_id:competitionUser?.data?.uid || null,
                marks:{
                    createMany:{
                        data:danceMarks
                    }
                }
            }
        })

    }





    const updatedHeat = await prisma.heat.update({
        where:{
            uid:parsedInput[0].heat_id
        },
        data:{
            status:HeatStatus.REVIEWING,
            competition_log:{
                create:{
                    user_id:competitionUser?.data?.uid || null,
                    competition_id: String(ctx.competition_id),
                    event_type: CompetitionLogEventType.HEAT_MARKS_ENTERED,
                    data:parsedInput,
                    note:`Marks entered for heat by scrutineer ${ctx.user?.name || 'Unknown User'}`,
                }
            }
        },
        include:{
            heat_marks:{
                include:{
                    marks:{
                        include:{
                            dancer:true
                        }
                    }
                }
            },
            section:{
                select:{
                    name:true
                }
            },

        }
    })

    // Return the marks and the heat for the heat so the scrutineer can make a decision for which dancers to carry through and the next heat if any

    console.log("Updated heat after marks submission:", JSON.stringify(updatedHeat));


    return updatedHeat;

})

export const getHeatRoundMarks = safeAction.inputSchema(UidSchema).action(async({ parsedInput })=>{
    return prisma.heat.findUnique({
        where:{
            uid:parsedInput
        },
        include:{
            panel:{
                include:{
                    panels_adjudicators:{
                        include:{
                            adjudicator:true
                        }
                    }
                }
            },
            heat_marks:{
                include:{
                    marks:{
                        include:{
                            dancer:true
                        }
                    }
                }
            },
            start_list:true,
            section:{
                include:{
                    competition:{
                        select:{
                            name:true,
                            venue:true,
                            date:true,
                            organization:true,
                        }
                    }
                }
            },
            heat_result:{
                include:{
                    heat_result_dancer:{
                        include:{
                            dancer:true
                        }
                    }
                }
            },
        }
    })
})

export const createHeatResult = safeAction.inputSchema(SectionHeatRoundResultSchema).action(async({ parsedInput, ctx })=>{

    const { data:heat } = await getHeatRoundMarks(parsedInput.heat_id);

    const competitionUser = await getCompetitionUser({
        userId:ctx.user.id,
        competitionId:String(ctx.competition_id)
    })

    if(!heat){
        throw new Error('Heat not found');
    }

    // Create the heat result entry
    const result = await prisma.heat_result.create({
        data:{
            heat_id:heat.uid,
            section_id:heat.section_id,
            created_by_id:String(competitionUser?.data?.uid),
            heat_result_dancer:{
                createMany:{
                    data:parsedInput.results.map((result)=>{
                        return {
                            dancer_id:result.dancer_id,
                            no_callbacks:result.callbacks,
                            callback:result.called_back
                        }
                    })
                }
            }
        }
    })
    // console.log('Created heat result:', result);

    // Update the heat status to completed
    await prisma.heat.update({
        where:{
            uid:heat.uid,
        },
        data:{
            status:HeatStatus.CHECKING,
            reviewed_at:new Date(),
            reviewed_by_id:String(competitionUser?.data?.uid),
            competition_log:{
                create:{
                    event_type:CompetitionLogEventType.HEAT_CHECKING,
                    competition_id:String(ctx.competition_id),
                    user_id:String(competitionUser?.data?.uid),
                    note:`Heat results submitted by ${ctx.user?.name || 'Unknown User'}`,
                    data:{
                        ...parsedInput,
                        result,
                    },
                }
            }
        }
    })
    console.log('Updated heat status to CHECKING');
    // Get the next heat in the section, create the heat if no exists, add the dancers who were called back to the next heat start list

    let nextHeat = await prisma.heat.findFirst({
        where:{
            section_id:heat.section_id,
            uid:{
                not:heat.uid
            },
            item_no:{
                gt:heat.item_no
            }
        }
    })

    // No Next Heat, need to create a new one.
    if(!nextHeat){
        const latestHeat = await prisma.heat.findFirst({
            orderBy:{
                item_no:'desc'
            },
            take:1
        })

        console.log('No next heat found, creating new heat', latestHeat?.item_no);


        nextHeat = await prisma.heat.create({
            data:{
                section_id:heat.section_id,
                item_no:String(Number(latestHeat?.item_no) + 1 || 1),
                order:(heat?.order || 0) + 1,
                type:heat.type,
                status:HeatStatus.DRAFT,
                dances:{
                    set:heat.dances
                },
                panel_id:heat.panel_id,
                callback_limit:0,
                competition_log:{
                    create:{
                        event_type:CompetitionLogEventType.HEAT_CREATED,
                        competition_id:String(ctx.competition_id),
                        user_id:String(competitionUser?.data?.uid),
                        note:`Heat auto created by ${ctx.user?.name || 'Unknown User'}`,
                        data:parsedInput.results.filter((r)=>r.called_back)
                    }
                }
            }
        })
    }

    console.log('Next heat to update with callbacks:', nextHeat);
    // const updatedHeat = await prisma.heat.update({
    //     where:{
    //         uid:nextHeat?.uid,
    //     },
    //     data:{
    //         start_list:{
    //             connect:parsedInput.results.filter((r)=>r.called_back).map((r)=>{
    //                 return {
    //                     uid:r.dancer_id
    //                 }
    //             })
    //         },
    //         status:HeatStatus.ACTIVE,
    //         competition_log:{
    //             create:{
    //                 event_type:CompetitionLogEventType.HEAT_ACTIVE,
    //                 competition_id:String(ctx.competition_id),
    //                 user_id:String(competitionUser?.data?.uid),
    //                 note:`Heat list created and submitted by ${ctx.user?.name || 'Unknown User'}`,
    //                 data:parsedInput.results.filter((r)=>r.called_back)
    //             }
    //         }
    //     }
    // })

    //console.log('Next heat updated with start list and set to ACTIVE:', updatedHeat);

    return {
        //  updatedHeat,
        result,
    }

})


export const deleteMarks =safeAction.inputSchema(UidSchema).action(async({ parsedInput, ctx })=>{

    const deletedMarks = await prisma.heat_marks.deleteMany({
        where:{
            heat_id:parsedInput,
        },
    })

    // const deleteHeatResult = await prisma.heat_result.delete({
    //     where:{
    //         heat_id:parsedInput,
    //     },
    // })




})

export const getHeatRoundResult = safeAction.inputSchema(UidSchema).action(async({ parsedInput })=>{

    const heat = await prisma.heat.findUnique({
        where:{
            uid:parsedInput
        },
        include:{
            panel:{
                include:{
                    panels_adjudicators:{
                        include:{
                            adjudicator:true
                        }
                    }
                }
            },
            heat_marks:{
                include:{
                    marks:{
                        include:{
                            dancer:true
                        }
                    }
                }
            },
            start_list:true,
            section:{
                include:{
                    competition:{
                        select:{
                            name:true,
                            venue:true,
                            date:true,
                            organization:true,
                        }
                    }
                }
            },
            heat_result:{
                include:{
                    heat_result_dancer:{
                        include:{
                            dancer:true
                        }
                    }
                }
            },
        }
    })

    const dances = heat?.dances || [];
    const adjudicators = sortBy(heat?.panel?.panels_adjudicators?.map((p)=>p.adjudicator),'letter') || [];
    const marks = dances.reduce((a:{
        [dance:string]:{
            [adjudicator_letter:string]:number[]
        }
    },v)=>{

        forEach(adjudicators, (adjudicator)=>{
            const adjudicatorHeatMarks = heat?.heat_marks.find(item=>item.adjudicator_id === adjudicator.uid) ||{ marks:[] }
            const adjudicatorDanceMarks = adjudicatorHeatMarks.marks.filter((m)=>m.dance===v)

            if(a[v]){
                a[v][adjudicator.letter]=adjudicatorDanceMarks.map(m=>m.dancer_number)
            }else{
                a[v]={
                    [adjudicator.letter]:adjudicatorDanceMarks.map(m=>m.dancer_number)
                }
            }

        })

        return a;
    },{})

    type DancerRowType = (string|number | boolean)[];

    // Use heat_result_dancer as authoritative source (immutable record of all competitors).
    // Falls back to start_list for heats not yet past REVIEWING.
    const resultDancers = heat?.heat_result?.[0]?.heat_result_dancer ?? [];
    const allDancers = sortBy(
        resultDancers.length > 0
            ? resultDancers.map((rd)=>({
                uid: rd.dancer_id,
                number: rd.dancer?.number ?? 0,
                name: rd.dancer?.name ?? '',
                partner_name: rd.dancer?.partner_name ?? null,
                callback: rd.callback,
                no_callbacks: rd.no_callbacks,
            }))
            : (heat?.start_list ?? []).map((s)=>({
                uid: s.uid,
                number: s.number ?? 0,
                name: s.name ?? '',
                partner_name: s.partner_name ?? null,
                callback: false,
                no_callbacks: 0,
            })),
        'number'
    );

    const rows = allDancers.reduce((a:DancerRowType[],v)=>{

        const dancerNumber = Number(v.number);
        const dancerRow:DancerRowType = [ dancerNumber ];

        for(const dance of dances){
            for(const adjudicator of adjudicators){
                const ticked = marks[dance]?.[adjudicator.letter]?.includes(dancerNumber);
                dancerRow.push(ticked ? 'x' :'')
            }
        }
        dancerRow.push(v.no_callbacks || 0);
        dancerRow.push(Boolean(v.callback)?'x' : '');

        a.push(dancerRow);
        return a
    },[])

    const headerRows:{
        label:string,
        rowSpan?:number,
        colSpan?:number,
        align:TableCellProps['align']
    }[][] = [
        [
            {
                label:'Dancer No.',
                rowSpan:2,
                align:'center',
            },
            ...dances.map((dance)=>({
                label:dance,
                colSpan:adjudicators.length,
                align:'center' as TableCellProps['align'],
                rowSpan:1
            })),
            {
                label:'Total',
                rowSpan:2,
                colSpan:1,
                align:'center',
            },
            {
                label:'Called Back',
                rowSpan:2,
                colSpan:1,
                align:'center',
            }
        ],
        [

            ...flatten(dances.map(()=>{
                return adjudicators.map(a=>({
                    label:a.letter,
                    align:'center' as TableCellProps['align'],
                }))
            })),
        ]
    ]


    return {
        table:{
            rows,
            headerRows,
        },
        item_no:heat?.item_no,
        section_name:heat?.section?.name,
        heat_type:heat?.type,
        heat_id:heat?.uid,
        callback_limit:heat?.callback_limit,
        min_majority: Math.ceil(adjudicators.length* dances?.length / 2)+1,
        total_called_back: allDancers.reduce((a,v)=>a+(v.callback ? 1 : 0),0),
        competition:{
            name: heat?.section?.competition?.name ?? null,
            venue: heat?.section?.competition?.venue ?? null,
            date: heat?.section?.competition?.date ?? null,
            organization: heat?.section?.competition?.organization ?? null,
        },
        heat_status: heat?.status ?? null,
        panel:adjudicators,
        called_back_dancers: allDancers
            .filter((d)=>d.callback)
            .map((d)=>({
                number: d.number,
                name: d.name,
                partner_name: d.partner_name,
            })),
    }


})


export const approveHeatResult = safeAction.inputSchema(UidSchema).action(async ({ parsedInput, ctx }) => {

    const competitionUser = await getCompetitionUser({
        userId: ctx.user.id,
        competitionId: String(ctx.competition_id),
    });

    return prisma.heat.update({
        where: {
            uid: parsedInput,
        },
        data: {
            status: HeatStatus.COMPLETE,
            checked_at: new Date(),
            checked_by_id: String(competitionUser?.data?.uid),
            competition_log: {
                create: {
                    event_type: CompetitionLogEventType.HEAT_COMPLETE,
                    competition_id: String(ctx.competition_id),
                    user_id: String(competitionUser?.data?.uid),
                    note: `Heat result approved and marked complete by ${ctx.user?.name || 'Unknown User'}`,
                },
            },
        },
        select: {
            uid: true,
            status: true,
            checked_at: true,
        },
    });
});


export default {
    submitRoundMarks,
    getHeatRoundMarks,
    createHeatResult,
    getHeatRoundResult,
    approveHeatResult,
}
