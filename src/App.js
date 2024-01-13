import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import './App.css';
import CameraComponent from './components/CameraComponent.js';
import logo from "./assets/images/logo.png"



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
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: 0 }}>
      <img src={logo} alt="Logo" style={{ width: 70,marginRight: 10}} />
        <h1>visionary</h1>
        </div>
        <CameraComponent />
      </div>
    </ThemeProvider>
  );
}

export default App;
