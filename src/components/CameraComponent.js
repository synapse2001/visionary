import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import { GoogleGenerativeAI } from "@google/generative-ai";
import ImagePopup from './ImagePopup';
import SettingPopup from './SettingPopup';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_AI_KEY);

const CameraComponent = () => {

  const [selectedCamera, setSelectedCamera] = useState(null);
  const [cameraList, setCameraList] = useState([]);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingCamera, setUpdatingCamera] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState(JSON.parse((localStorage.getItem('lastusedprompt')) && JSON.parse(localStorage.getItem('lastusedprompt')).prompt) ? JSON.parse(localStorage.getItem('lastusedprompt')).prompt: "assistant");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPromptDialog, setShowCustomPromptDialog] = useState(false);
  const theme = useTheme();
  const webcamRef = useRef(null);
  const [imageList, setImageList] = useState([]);
  const [imageListProp, setImageListProp] = useState([]);
  const [isSessionBusy, setIsSessionBusy] = useState(false);
  const [utterance, setUtterance] = useState(null);
  const [voice, setVoice] = useState(null);

  const defaultPrompt = "What do you see in this image?, If you see a girl compliment her on looks and smile, If you see a product, specify the brand only if you are sure.";
  const loadSettings = () => {
    const savedSettings = JSON.parse(localStorage.getItem('settings')) || {};
    console.log(savedSettings);
    return {
      temperature: savedSettings.temperature || 0.1,
      selectedModel: savedSettings.selectedModel || 'gemini-pro-vision',
      silenceThresholdSeconds: savedSettings.silenceThresholdSeconds || 2.5,
      voice: voice,
      rate: savedSettings.rate || 1.0,
      usetextTospeech: savedSettings.usetextTospeech || false,
      userecurringSession: savedSettings.userecurringSession || false,
      imageLimitValue: savedSettings.imageLimitValue || 5,
    };
  };


  const [settings, setSettings] = useState(loadSettings());

  const {
    temperature,
    silenceThresholdSeconds,
    rate,
    usetextTospeech,
    userecurringSession,
    imageLimitValue,
  } = settings;

  const handleSettingUpdate = (newSettings) => {
    // console.log(newSettings);
    let prevSet = settings;
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
    const updatedSettings = { ...prevSet, ...newSettings };
    console.log(JSON.stringify(updatedSettings))
    localStorage.setItem('settings', JSON.stringify(updatedSettings));
    setVoice(newSettings.voice)
  };



  const [generationConfig, setgenerationConfig] = useState({ candidateCount: 1, temperature: temperature })
  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision", generationConfig });
  const synth = window.speechSynthesis;

  const startListening = () => SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });

  const handleRestartSession = () => {
    if (userecurringSession && !isSessionBusy) {
      startListening();
    }
  }

  useEffect(() => {
    if (!isSessionBusy && usetextTospeech) {
      const u = new SpeechSynthesisUtterance(responseText);

      setUtterance(u);
      if (voice === null) {
        const voices = synth.getVoices();
        console.log(voices);
        setVoice(voices[2]);
      }
      return () => {
        synth.cancel();
      };
    }
  }, [isSessionBusy, responseText]);

  useEffect(() => {
    if (usetextTospeech && utterance && responseText && !isSessionBusy) {
      console.log(voice);
      utterance.voice = voice;
      utterance.rate = rate;
      utterance.onend = () => handleRestartSession();
      console.log(utterance);
      synth.speak(utterance);
    }
  }, [utterance]);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const cameras = devices.filter(device => device.kind === 'videoinput');
        setCameraList(cameras);
        if (JSON.parse(localStorage.getItem('lastusedcamera')) === null) {
          setSelectedCamera(cameras.length > 0 ? cameras[0].deviceId : null);
        } else {
          setSelectedCamera(JSON.parse(localStorage.getItem('lastusedcamera')).camera)
          localStorage.setItem('lastusedcamera', JSON.stringify({ camera: JSON.parse(localStorage.getItem('lastusedcamera')).camera }))
        }
        localStorage.setItem('lastusedcamera', JSON.stringify({ camera: cameras[0].deviceId }))
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
    localStorage.setItem('lastusedprompt', JSON.stringify({ prompt: selectedPromptValue }))
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

    let prompt = selectedPrompt === "default" ? defaultPrompt : customPrompt;
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
        setLoading(false);
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

  const multipleCapture = async () => {
    if (imageList.length >= imageLimitValue) return;
    const imageSrc = webcamRef.current.getScreenshot();
    setImageList([...imageList, imageSrc]);
  }

  const sendMultipleCapture = async () => {
    setLoading(true);
    setIsSessionBusy(true);
    const imageParts = imageList.map((img) => ({
      inlineData: {
        data: img.split(',')[1],
        mimeType: "image/jpeg",
      },
    }));
    let prompt = selectedPrompt === "default" ? defaultPrompt : customPrompt;

    try {
      // Make API call to Gemini model
      const result = await model.generateContentStream([prompt, ...imageParts]);

      let text = '';
      for await (const chunk of result.stream) {
        setLoading(false);
        const chunkText = chunk.text();
        text += chunkText;
        setResponseText(text);
      }
      console.log(text)
    } catch (error) {
      console.error('Error sending images to Gemini model:', error);
    } finally {
      setLoading(false);
      setIsSessionBusy(false);
      // console.log("response text", responseText);
    }
  }

  const handleCameraChange = (event) => {
    const selectedDeviceId = event.target.value;
    setSelectedCamera(selectedDeviceId);
    localStorage.setItem('lastusedcamera', JSON.stringify({ camera: selectedDeviceId }))
  };

  const [showImagePopup, setShowImagePopup] = useState(false);

  const handleImagePopupOpen = () => {
    // console.log(imageListProp)
    setShowImagePopup(true);
  };

  const handleImagePopupClose = () => {
    setShowImagePopup(false);
  };

  const [showSettingPopup, setShowSettingPopup] = useState(false);

  const handleSettingPopupOpen = () => {
    setShowSettingPopup(true);
  }
  const handleSettingPopupClose = () => {
    setShowSettingPopup(false);
  }

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const [lastTranscriptUpdateTime, setLastTranscriptUpdateTime] = useState(0);

  // Log the transcript to the console whenever it changes
  useEffect(() => {
    // console.log('Transcript:', transcript);
    // Update the last transcript update time
    if (listening) {
      multipleCapture()
      setLastTranscriptUpdateTime(Date.now());
      setCustomPrompt(transcript)
    }
  }, [transcript]);

  // Use a timer to check if the transcript hasn't updated for 2 seconds
  useEffect(() => {
    const timerId = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastTranscriptUpdateTime;
      if (lastTranscriptUpdateTime !== 0) {

        if (elapsedTime > silenceThresholdSeconds * 1000 && listening) {
          SpeechRecognition.stopListening();
          resetTranscript();
          sendMultipleCapture();
          setImageListProp(imageList)
          setImageList([]);
          setLastTranscriptUpdateTime(0);
          // console.log('Recording stopped due to inactivity.');
        }
      }
    }, 500);
    return () => clearInterval(timerId);
  }, [lastTranscriptUpdateTime, listening]);


  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const webcamContainerStyle = {
    mt: 2,
    boxShadow: listening ? '0 0 10px 2px rgba(255, 0, 0, 0.5)' : 'none',
  };

  return (
    <Box className="card-container" mt={2}>
      <Card className="card" elevation={3} style={{ backgroundColor: theme.palette.background.default, borderRadius: 8 }}>
        <CardContent>
          <div className='flexrow'>
            <div>

              {(selectedPrompt === "custom" || selectedPrompt === "assistant") && (
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
              <Box className="webcam-container" mt={2} style={webcamContainerStyle} >
                <Webcam
                  key={selectedCamera} // Add key to trigger re-render when the camera changes
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoSource={selectedCamera}
                  ref={webcamRef}
                />
              </Box>
              <Box m={2}>
                <IconButton onClick={handleSettingPopupOpen} color="primary">
                  <SettingsIcon />
                </IconButton>
              </Box>
            </div>
            <div className='response'>
              <Box m={2} >
                {selectedPrompt === "assistant" ? (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={startListening}
                    disabled={loading || updatingCamera || listening}
                    className="start-session-button"
                  >
                    {updatingCamera ? 'Updating Camera...' : 'Start Session'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={captureAndGenerate}
                    disabled={loading || updatingCamera}
                    className="capture-button"
                  >
                    {updatingCamera ? 'Updating Camera...' : 'Capture Image'}
                  </Button>
                )}
              </Box>
              {(
                <Box m={2} >
                  <Card className="card" elevation={3} style={{ backgroundColor: theme.palette.accent.main }}>
                    <CardContent>
                      <Typography variant="h6" mb={2}>
                        {selectedPrompt === "custom" || selectedPrompt === "assistant" ? (
                          <>
                            {customPrompt}
                            <IconButton style={{ marginBottom: 8 }} onClick={() => setShowCustomPromptDialog(true)} color="primary">
                              <EditIcon />
                            </IconButton>
                          </>
                        ) : (
                          "Default Prompt"
                        )}
                      </Typography>
                      {loading ? (
                        <CircularProgress className="progress" color="secondary" />
                      ) : responseText ? (
                        <>
                          <Typography variant="h7" className="generated-text">
                            Response:
                          </Typography>
                          <Typography variant="body1" className="response-text" color="secondary" mt={1} mb={2} border={1} style={{ padding: '10px', whiteSpace: 'pre-wrap' }} borderRadius={1.5} >{(responseText)} </Typography>
                          <Button variant="contained" color="primary" onClick={handleImagePopupOpen}>
                            Captures
                          </Button>
                        </>
                      ) : (
                        <Typography variant="body1" color="textSecondary">
                          Click 40px above to get the response xd.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}

            </div>
          </div>
          <ImagePopup open={showImagePopup} handleClose={handleImagePopupClose} image={image} imagelistprop={imageListProp} response={responseText} />
          <SettingPopup
            open={showSettingPopup}
            handleClose={handleSettingPopupClose}
            selectedCamera={selectedCamera}
            handleCameraChange={handleCameraChange}
            selectedPrompt={selectedPrompt}
            handlePromptChange={handlePromptChange}
            cameraList={cameraList}
            settings={settings}
            handleSettingUpdate={handleSettingUpdate}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default CameraComponent;


