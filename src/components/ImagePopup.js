import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const ImagePopup = ({ open, handleClose, image, response, imagelistprop }) => {
  const theme = useTheme();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNextImage = () => {
    if (currentImageIndex < imagelistprop.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <div style={{ backgroundColor: theme.palette.accent.main }}>
        <DialogTitle> Visionary Response</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {image ? (
              <img src={image} alt="Generated" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8 }} />
            ) : (
              imagelistprop && imagelistprop.length > 0 ? (
                <img src={imagelistprop[currentImageIndex]} alt={`Generated ${currentImageIndex + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, marginBottom: 2 }} />
              ) : (
                <Typography variant="body1" color="textSecondary">
                  No images available.
                </Typography>
              )
            )}
          </DialogContentText>
        </DialogContent>
        {imagelistprop && imagelistprop.length > 1 && (
          <DialogActions>
            <IconButton onClick={handlePrevImage} color="primary" disabled={currentImageIndex === 0}>
              <ArrowBackIcon />
            </IconButton>
            <IconButton onClick={handleNextImage} style={{marginRight:20}} color="primary" disabled={currentImageIndex === imagelistprop.length - 1}>
              <ArrowForwardIcon />
            </IconButton>
          </DialogActions>
        )}
        <Typography variant="body1" className="response-text" color="secondary" style={{ padding: '10px', whiteSpace: 'pre-wrap' }} mt={2} ml={3} mr={3} border={1} borderRadius={1.5}>
          {response}
        </Typography>
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