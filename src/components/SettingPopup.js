import React, { useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';

const SettingPopup = ({
  open,
  handleClose,
  settings,
  handleSettingUpdate,
  selectedCamera,
  cameraList,
  handleCameraChange,
  selectedPrompt,
  handlePromptChange,
}) => {
  const {
    temperature,
    selectedModel,
    silenceThresholdSeconds,
    voice,
    rate,
    usetextTospeech,
    userecurringSession,
    imageLimitValue,
  } = settings;

  const synth = window.speechSynthesis;
  const [voiceList,setVoiceList] = React.useState([]);
  

  useEffect(() => {
    const updateVoices = () => {
      const temp = synth.getVoices(); 
      setVoiceList(temp);
      // handleSettingUpdate({ voice: temp[2]}) // You might want to set the default voice based on your requirements
    };
    updateVoices();
  
    synth.onvoiceschanged = updateVoices;
  }, [usetextTospeech]);
  
  const handleResetToDefault = () => {
    // Define your default settings or retrieve them from a source
    const defaultSettings = {
      temperature: 0.1,
      selectedModel: 'gemini-pro-vision',
      silenceThresholdSeconds: 2.5,
      rate: 1.0,
      usetextTospeech: false,
      userecurringSession: false,
      imageLimitValue: 5,
    };

    handleSettingUpdate(defaultSettings);
  };

  return (
    <Dialog open={open} onClose={handleClose} className='settingpopup' maxWidth="md">
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <div>

        <Box m={2}>
          <Typography gutterBottom>Camera Selection</Typography>
          <Select value={selectedCamera} onChange={handleCameraChange}>
            {cameraList.map((camera) => (
              <MenuItem key={camera.deviceId} value={camera.deviceId}>
                {camera.label || `Camera ${cameraList.indexOf(camera) + 1}`}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box m={2}>
          <Typography gutterBottom>Prompt Selection</Typography>
          <Select value={selectedPrompt} onChange={handlePromptChange}>
            <MenuItem value="default">Default Prompt</MenuItem>
            <MenuItem value="custom">Custom Prompt</MenuItem>
            <MenuItem value="assistant">Assistant</MenuItem>
          </Select>
        </Box>
        <Box m={2}>
          <Typography gutterBottom>Selected Model</Typography>
          <Select value={selectedModel} onChange={(e) => handleSettingUpdate({ selectedModel: e.target.value })}>
            <MenuItem value="gemini-pro-vision">Gemini Vision Pro</MenuItem>
          </Select>
        </Box>
        <Box m={2}>
          <Typography gutterBottom>Model Temperature: {temperature}</Typography>
          <Slider
            value={temperature}
            min={0}
            max={1}
            step={0.01}
            onChange={(e, newValue) => handleSettingUpdate({ temperature: newValue })}
          />
        </Box>
        <Box m={2}>
          <Typography gutterBottom>Image Limit: {imageLimitValue}</Typography>
          <Slider
            value={imageLimitValue}
            min={1}
            max={16}
            step={1}
            disabled={selectedPrompt !== "assistant"}
            onChange={(e, newValue) => handleSettingUpdate({ imageLimitValue: newValue })}
            />
        </Box>
        <Box m={2}>
          <Typography gutterBottom>Silence Threshold (seconds):  {silenceThresholdSeconds}</Typography>
          <Slider
            value={silenceThresholdSeconds}
            min={1}
            max={10}
            step={1}
            disabled={selectedPrompt !== "assistant"}
            onChange={(e, newValue) => handleSettingUpdate({ silenceThresholdSeconds: newValue })}
          />
        </Box>
          </div>
          <div className='speechsettings'>

        <Box m={2}>
          <Typography gutterBottom>Text-to-Speech</Typography>
          <Switch
            checked={usetextTospeech}
            onChange={() => handleSettingUpdate({ usetextTospeech: !usetextTospeech, userecurringSession: userecurringSession ? false : userecurringSession})}
          />
        </Box>
        <Box m={2}>
          <Typography gutterBottom>Recurring Session</Typography>
          <Switch
            checked={userecurringSession}
            disabled={selectedPrompt !== "assistant"}
            onChange={() => handleSettingUpdate({ userecurringSession: !userecurringSession, usetextTospeech: usetextTospeech ? usetextTospeech : true})}
          />
        </Box>
        <Box m={2}>
          <Typography gutterBottom>Speech Rate Value: {rate}</Typography>
          <Slider
            value={rate}
            min={0.5}
            max={2}
            step={0.1}
            disabled={!usetextTospeech}
            onChange={(e, newValue) => handleSettingUpdate({ rate: newValue })}
          />
        </Box>
        <Box m={2}>
            <Typography gutterBottom>Voice Selection</Typography>
            <Select value={voice ? voice.name : ''} onChange={(e) => handleSettingUpdate({ voice: voiceList.find(v => v.name === e.target.value) })}
                        style={{
                            width: '100%',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                          }}
                          disabled={!usetextTospeech}
            >
                {voiceList.map((v) => (
                <MenuItem key={v.name} value={v.name}>
                    {v.name}
                </MenuItem>
                ))}
            </Select>
            </Box>
          </div>
      </DialogContent>
      <DialogActions>
        <IconButton onClick={handleClose} color="primary">
          <CloseIcon />
        </IconButton>
        <IconButton onClick={handleResetToDefault} color="primary">
            <SettingsBackupRestoreIcon />
          </IconButton>
      </DialogActions>
    </Dialog>
  );
};

export default SettingPopup;
