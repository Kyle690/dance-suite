import React, { useEffect } from 'react';
import { Box, Grid } from "@mui/material";
import {
    DataGrid, GridActionsCellItem,
    GridEventListener,
    GridRowEditStopReasons,
    GridRowId, GridRowModel,
    GridRowModes,
    GridRowModesModel
} from "@mui/x-data-grid";
import AddDancer from "@/app/components/dialogs/competition/section/_components/AddDancer";
import { DancerSchemaType,  } from "@/app/schemas/SectionSchema";
import { orderBy } from "lodash";
import { Delete, Edit, Save, Cancel } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { deleteDancer, getSectionDancers, updateDancer } from "@/app/server/competitions";
import { useSnackbar } from "notistack";
import { useDialogs } from "@toolpad/core";

type SectionDancersProps = {
    sectionId:string
}

const SectionDancers: React.FC<SectionDancersProps> = ({
    sectionId
}) => {


    const {
        data,
        isLoading,
        refetch,
    }=useQuery({
        queryKey:[ 'section-dancers', sectionId ],
        queryFn:async()=>{
            if(!sectionId)return [];
            const res = await getSectionDancers({
                section_id: sectionId
            })
            if(res?.data)return res?.data;
            return [];
        }
    })

    const [ rowModesModel, setRowModesModel ] = React.useState<GridRowModesModel>({});
    const [ rows, setRows ] = React.useState<any[]>([]);

    const dialogs = useDialogs()

    useEffect (() => {
        if(data?.length){
            setRows(data);
        }
    }, [ data ]);

    const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
        if (params.reason === GridRowEditStopReasons.rowFocusOut) {
            event.defaultMuiPrevented = true;
        }
    };

    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleSaveClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    const handleDeleteClick = (id: GridRowId) => async() => {
        await dialogs.confirm('Are you sure you want to delete this dancer? This action cannot be undone.',{
            title:'Delete Dancer',
            onClose:async(res)=>{
                if(res){
                    const response = await deleteDancer({ uid: String(id) });
                    if(!response.data){
                        enqueueSnackbar('Failed to delete dancer',{ variant:'error' });
                        return;
                    }
                    refetch();
                    enqueueSnackbar('Dancer deleted successfully',{ variant:'success' });
                }
            }
        })
    };

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
            ...rowModesModel,
            [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });

        //const editedRow = fields.find((row) => row.id === id);
    };

    const { enqueueSnackbar }=useSnackbar()

    const processRowUpdate = async(newRow: GridRowModel) => {
        const updatedRow = { ...newRow } as DancerSchemaType;
        const res = await updateDancer(updatedRow);
        if(!res?.data){
            enqueueSnackbar('Failed to update dancer',{ variant:'error' });
            return;
        }

        enqueueSnackbar('Dancer updated successfully',{ variant:'success' });

        setRows(rows.map((row) => (row.uid === newRow.uid ? updatedRow : row)));
        return updatedRow;
    };

    const handleRowModesModelChange = (newRowModesModel: GridRowModesModel) => {
        setRowModesModel(newRowModesModel);
    };


    return (
        <Box sx={{ height:500 }}>
            <DataGrid
                rows={orderBy(rows,'number','asc')}
                columns={[
                    {
                        field:'number',
                        headerName:'Number',
                        flex:1,
                        editable:true,
                        minWidth:80,
                    },
                    {
                        field:'name',
                        headerName:'Name',
                        flex:1,
                        editable:true,
                        minWidth:150
                    },
                    {
                        field:'partner_name',
                        headerName:'Partner Name',
                        flex:1,
                        editable:true,
                        minWidth:150
                    },
                    {
                        field:'studio',
                        headerName:'Studio',
                        flex:1,
                        editable:true,
                        minWidth:150
                    },
                    {
                        field:'region',
                        headerName:'Region',
                        flex:1,
                        editable:true,
                        minWidth:100
                    },
                    {
                        field:'country',
                        headerName:'Country',
                        flex:1,
                        editable:true,
                        minWidth:100
                    },
                    {
                        field: 'actions',
                        type: 'actions',
                        headerName: 'Actions',
                        width: 100,
                        cellClassName: 'actions',
                        getActions: ({ id }) => {
                            const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                            if (isInEditMode) {
                                return [
                                    <GridActionsCellItem
                                        key={id}
                                        icon={<Save />}
                                        label="Save"
                                        material={{
                                            sx: {
                                                color: 'primary.main',
                                            },
                                        }}
                                        onClick={handleSaveClick(id)}
                                    />,
                                    <GridActionsCellItem
                                        key={id}
                                        icon={<Cancel />}
                                        label="Cancel"
                                        className="textPrimary"
                                        onClick={handleCancelClick(id)}
                                        color="inherit"
                                    />,
                                ];
                            }

                            return [
                                <GridActionsCellItem
                                    key={id}
                                    icon={<Edit />}
                                    label="Edit"
                                    className="textPrimary"
                                    onClick={handleEditClick(id)}
                                    color="inherit"
                                />,
                                <GridActionsCellItem
                                    key={id}
                                    icon={<Delete />}
                                    label="Delete"
                                    onClick={handleDeleteClick(id)}
                                    color="inherit"
                                />,
                            ];
                        },
                    },
                ]}
                density={'compact'}
                getRowId={(row)=>row?.uid}
                loading={isLoading}
                rowModesModel={rowModesModel}
                onRowModesModelChange={handleRowModesModelChange}
                onRowEditStop={handleRowEditStop}
                processRowUpdate={processRowUpdate}
                editMode={'row'}
                showToolbar
                disableColumnSelector
                sx={{
                    backgroundColor:'background.paper',
                    borderRadius:4,
                    '& .MuiDataGrid-columnHeader': {
                        backgroundColor: 'background.paper',
                    },
                }}
                slotProps={{
                    toolbar: {
                        showQuickFilter: true,
                        csvOptions: { disableToolbarButton: true },
                        printOptions: { disableToolbarButton: true },
                    },
                    loadingOverlay:{
                        variant:'linear-progress',
                        noRowsVariant:'skeleton'
                    }
                }}
            />
            <AddDancer
                sectionId={sectionId}
                refetch={refetch}
                dancers={data ||[]}
            />
        </Box>
    );
}

export default SectionDancers;
