import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';
import CameraComponent from './components/CameraComponent.js';



const theme = createTheme({
  palette: {
    primary: {
      main: '#161A30',
    },
    secondary: {
      main: '#31304D',
    },
    background: {
      default: '#B6BBC4',
    },
    accent: {
      main: '#F0ECE5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 20 }}>
        <h1>visionary</h1>
        <CameraComponent />
      </div>
    </ThemeProvider>
  );
}

export default App;
