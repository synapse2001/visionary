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
import { useTheme } from '@mui/material/styles';
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_AI_KEY);

const CameraComponent = () => {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameraList, setCameraList] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingCamera, setUpdatingCamera] = useState(false);
  const [responseText, setResponseText] = useState('');
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

  const captureAndGenerate = async () => {
    setLoading(true);

    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);

    // Convert the image to a base64 string for the API call
    const imageBase64 = imageSrc.split(',')[1];

    // Use the gemini-pro-vision model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    // Set up the prompt and image parts
    const prompt = "What do you in the Image ? if you see a girl compliment her looks and smile , if you see a product then specify the brand if you are sure."
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
        },
      },
    //   {
    //     inlineData: {
    //       data: process.env.REACT_APP_IAMGE, // Importing the image directly
    //       mimeType: "image/png",
    //     },
    //   }
    ];

    try {
      // Make API call to Gemini model
      const result = await model.generateContentStream([prompt, ...imageParts]);

      let text = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        console.log(chunkText);
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

  return (
    <Box className="card-container" mt={2}>
      <Card className="card" elevation={3} style={{ backgroundColor: theme.palette.background.default, borderRadius: 8 }}>
        <CardContent>
          {cameraList.length > 0 && (
            <>
              <Box mt={2}>
                <Typography variant="body2">Select Camera:</Typography>
                <Select value={selectedCamera} onChange={handleCameraChange}>
                  {cameraList.map(camera => (
                    <MenuItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${cameraList.indexOf(camera) + 1}`}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <Box className="webcam-container" mt={2}>
                <Webcam
                  key={selectedCamera} // Add key to trigger re-render when the camera changes
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoSource={selectedCamera}
                  ref={webcamRef}
                //   videoConstraints={{ width: 1280, height: 720 }} 
                />
              </Box>
              <Box mt={2}>
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
            </>
          )}
          {image && (
            <Box mt={2}>
              <Card className="card" elevation={3} style={{ backgroundColor: theme.palette.accent.main }}>
                <CardContent>
                  {loading ? (
                    <CircularProgress className="progress" color="secondary" />
                  ) : (
                    <>
                      <Typography variant="h6" className="generated-text">
                        Response:
                      </Typography>
                      <Typography variant="body1" className="response-text" color="secondary">{responseText}</Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CameraComponent;
