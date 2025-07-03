import './custom.css';
import React, { useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { ColorModeContext } from './components/NavBar';

const Main = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const colorMode = useMemo(() => ({
    mode,
    toggleColorMode: () => setMode(prev => (prev === 'light' ? 'dark' : 'light')),
  }), [mode]);
  const theme = useMemo(() => createTheme({
    palette: { mode },
    components: {
      MuiGrid: {
        defaultProps: {
          // Removed invalid 'level' property
        },
      },
    },
  }), [mode]);
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
); 
