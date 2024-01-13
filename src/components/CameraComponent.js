import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton'; // Import IconButton
import EditIcon from '@mui/icons-material/Edit';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ImagePopup from './ImagePopup';

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_AI_KEY);

const CameraComponent = () => {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameraList, setCameraList] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingCamera, setUpdatingCamera] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState("default");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPromptDialog, setShowCustomPromptDialog] = useState(false);
  const theme = useTheme();
  const webcamRef = useRef(null);

  useEffect(() => {
    // Get the list of available cameras
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setCameraList(cameras);
        setSelectedCamera(cameras.length > 0 ? cameras[0].deviceId : null);
      })
      .catch(error => console.error('Error enumerating devices:', error));
  }, []);

  useEffect(() => {
    // Ensure that the webcamRef is defined before attempting to change the video source
    if (selectedCamera && webcamRef.current) {
      // Set the updatingCamera flag to true while updating the camera source
      setUpdatingCamera(true);

      // Stop the current stream
      if (webcamRef.current.stream) {
        webcamRef.current.stream.getTracks().forEach(track => track.stop());
      }

      // Get the new stream with the selected camera
      const newStream = navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: selectedCamera } },
      });

      // Update the webcamRef stream
      newStream
        .then((stream) => {
          webcamRef.current.stream = stream;
          webcamRef.current.video.srcObject = stream;
          webcamRef.current.setState({ hasUserMedia: true });
        })
        .catch(error => console.error('Error getting user media:', error))
        .finally(() => {
          // Set updatingCamera flag to false when done
          setUpdatingCamera(false);
        });
    }
  }, [selectedCamera]);

  const handlePromptChange = (event) => {
    const selectedPromptValue = event.target.value;
    setSelectedPrompt(selectedPromptValue);

    // If custom prompt is selected, show the input dialog
    if (selectedPromptValue === "custom") {
      setShowCustomPromptDialog(true);
    }
  };

  const handleCustomPromptChange = (event) => {
    setCustomPrompt(event.target.value);
  };

  const handleConfirmCustomPrompt = () => {
    setShowCustomPromptDialog(false);
  };

  const captureAndGenerate = async () => {
    setLoading(true);

    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);

    // Convert the image to a base64 string for the API call
    const imageBase64 = imageSrc.split(',')[1];

    // Use the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Set up the prompt and image parts
    let prompt = selectedPrompt === "default" ? "Default Prompt" : customPrompt;
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
        },
      },
    ];

    try {
      // Make API call to Gemini model
      const result = await model.generateContentStream([prompt, ...imageParts]);

      let text = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        // console.log(chunkText);
        text += chunkText;
        setResponseText(text);
      }
    } catch (error) {
      console.error('Error sending image to Gemini model:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraChange = (event) => {
    const selectedDeviceId = event.target.value;
    setSelectedCamera(selectedDeviceId);
  };

  const [showImagePopup, setShowImagePopup] = useState(false);

  const handleImagePopupOpen = () => {
    setShowImagePopup(true);
  };

  const handleImagePopupClose = () => {
    setShowImagePopup(false);
  };

  return (
    <Box className="card-container" mt={2}>
      <Card className="card" elevation={3} style={{ backgroundColor: theme.palette.background.default, borderRadius: 8 }}>
        <CardContent>
          <div className='flexrow'>
            <div>

              {selectedPrompt === "custom" && (
                <Dialog open={showCustomPromptDialog} onClose={() => setShowCustomPromptDialog(false)}>
                  <DialogTitle>Enter Custom Prompt</DialogTitle>
                  <DialogContent>
                    <TextField
                      autoFocus
                      margin="dense"
                      id="customPrompt"
                      label="Custom Prompt"
                      type="text"
                      fullWidth
                      value={customPrompt}
                      onChange={handleCustomPromptChange}
                    />
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setShowCustomPromptDialog(false)} color="primary">
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmCustomPrompt} color="primary">
                      Confirm
                    </Button>
                  </DialogActions>
                </Dialog>
              )}
              <Box className="webcam-container" mt={2} elevation ={3}>
                <Webcam
                  key={selectedCamera} // Add key to trigger re-render when the camera changes
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoSource={selectedCamera}
                  ref={webcamRef}
                />
              </Box>
              <Box m={2}>
                <Select value={selectedCamera} onChange={handleCameraChange}>
                  {cameraList.map(camera => (
                    <MenuItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${cameraList.indexOf(camera) + 1}`}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box m={2}>
                <Select value={selectedPrompt} onChange={handlePromptChange}>
                  <MenuItem value="default">Default Prompt</MenuItem>
                  <MenuItem value="custom">Custom Prompt</MenuItem>
                </Select>
              </Box>
            </div>
            <div className='response'>
              <Box m={2} >
                <Button
                  variant="contained"
                  color="primary"
                  onClick={captureAndGenerate}
                  disabled={loading || updatingCamera}
                  className="capture-button"
                >
                  {updatingCamera ? 'Updating Camera...' : 'Capture Photo'}
                </Button>
              </Box>
              {image && (
                <Box m = {2}>
                  <Card className="card" elevation={3} style={{ backgroundColor: theme.palette.accent.main }}>
                    <CardContent>
                    <Typography variant="h6" mb={2}>
                        {selectedPrompt === "custom" ? (
                          <>
                            {customPrompt}
                            <IconButton style={{marginBottom:8}} onClick={() => setShowCustomPromptDialog(true)} color="primary">
                              <EditIcon />
                            </IconButton>
                          </>
                        ) : (
                          "Default Prompt"
                        )}
                      </Typography>
                      {loading ? (
                        <CircularProgress className="progress" color="secondary" />
                      ) : (
                        <>
                          <Typography variant="h7" className="generated-text">
                            Response:
                          </Typography>
                          <Typography variant="body1" className="response-text" color="secondary" mt={1} mb ={2} border={1}  style={{ padding: '10px' }} borderRadius={1.5}>{responseText} </Typography>
                            <Button variant="contained" color="primary" onClick={handleImagePopupOpen}>
                            Iamges
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}
            </div>
          </div>
              <ImagePopup open={showImagePopup} handleClose={handleImagePopupClose} image={image} response ={responseText}/>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CameraComponent;
