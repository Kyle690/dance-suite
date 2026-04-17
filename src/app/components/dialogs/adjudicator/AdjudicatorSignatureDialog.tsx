import React, { useState, useRef } from 'react';
import { DialogProps } from "@toolpad/core";
import { Button, Dialog, DialogContent, DialogTitle, DialogActions, Typography, Stack, Box } from "@mui/material";
import SignatureCanvas from 'react-signature-canvas'
import { Info } from "@mui/icons-material";

type AdjudicatorSignatureDialogType = {

};
const AdjudicatorSignatureDialog: React.FC<DialogProps<AdjudicatorSignatureDialogType,string|null>> = ({
    open,
    onClose,
}) => {

    const [ signature, setSignature ] = useState<string | null>(null);

    const ref = useRef<SignatureCanvas|null>(null);

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth={'md'}
        >
            <DialogTitle>
                Signature
            </DialogTitle>
            <DialogContent>
                <Stack>
                    <Stack
                        direction={'row'}
                        spacing={2}
                    >
                        <Info color={'primary'}/>
                        <Typography>
                            Please add your signature to confirm you have created the marks for this section.
                        </Typography>
                    </Stack>
                    <Box
                        sx={{
                            border:'1px solid',
                            height:'300px',
                            width:'100%',
                            borderRadius:4,
                            my:3
                        }}
                    >
                        <SignatureCanvas
                            ref={ref}
                            canvasProps={{
                                style:{
                                    width:'100%',
                                    height:'100%',
                                    borderRadius:'16px',
                                },
                            }}
                            onEnd={()=>{
                                if(ref.current) {
                                    setSignature(ref.current.getTrimmedCanvas().toDataURL('base64'));
                                }
                            }}
                        />
                    </Box>

                    <Button
                        size={'small'}
                        color={'secondary'}
                        variant={'contained'}
                        onClick={()=>{
                            setSignature(null);
                            ref.current?.clear()
                        }}
                    >
                        Clear
                    </Button>
                </Stack>

            </DialogContent>
            <DialogActions>
                <Button
                    size={'small'}
                    color={'inherit'}
                    variant={'contained'}
                    onClick={()=>onClose(null)}
                >
                    Cancel
                </Button>
                <Button
                    size={'small'}
                    color={'primary'}
                    variant={'contained'}
                    disabled={!signature}
                    onClick={()=>onClose(signature)}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AdjudicatorSignatureDialog;
