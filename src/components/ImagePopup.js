import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

const ImagePopup = ({ open, handleClose, image,response }) => {
const theme = useTheme();
  return (
    <Dialog open={open} onClose={handleClose}>
        <div style={{backgroundColor:theme.palette.accent.main}}>

      <DialogTitle> visionary response</DialogTitle>
      <DialogContent >
        <DialogContentText>
          <img src={image} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%',borderRadius:8 }} />
        </DialogContentText>
      </DialogContent>
      <Typography variant="body1" className="response-text" color="secondary" m ={4}>{response} </Typography>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Close
        </Button>
      </DialogActions>
        </div>
    </Dialog>
  );
};

export default ImagePopup;
