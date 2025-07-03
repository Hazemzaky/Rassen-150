import React, { useState } from 'react';
import { Box, Typography, Button, TextField, Paper, Alert } from '@mui/material';

function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const DebugAuthPage: React.FC = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [inputToken, setInputToken] = useState('');
  const decoded = decodeJWT(token);
  const isAuthenticated = !!token && !!decoded;

  const handleClear = () => {
    localStorage.removeItem('token');
    setToken('');
    window.location.reload();
  };
  const handleSet = () => {
    localStorage.setItem('token', inputToken);
    setToken(inputToken);
    window.location.reload();
  };

  return (
    <Box p={3} display="flex" flexDirection="column" alignItems="center" minHeight="60vh">
      <Paper sx={{ p: 3, maxWidth: 600, width: '100%' }}>
        <Typography variant="h5" gutterBottom>Debug Auth Page</Typography>
        <Alert severity={isAuthenticated ? 'success' : 'error'} sx={{ mb: 2 }}>
          {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </Alert>
        <Typography variant="subtitle1">Current Token:</Typography>
        <Paper sx={{ p: 1, mb: 2, bgcolor: '#f5f5f5', wordBreak: 'break-all' }}>{token || 'No token found'}</Paper>
        <Typography variant="subtitle1">Decoded User:</Typography>
        <Paper sx={{ p: 1, mb: 2, bgcolor: '#f5f5f5', wordBreak: 'break-all' }}>
          <pre style={{ margin: 0 }}>{JSON.stringify(decoded, null, 2)}</pre>
        </Paper>
        <Box display="flex" gap={2} mb={2}>
          <Button variant="contained" color="error" onClick={handleClear}>Clear Token (Logout)</Button>
        </Box>
        <Typography variant="subtitle1">Set Test Token:</Typography>
        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <TextField
            label="Token"
            value={inputToken}
            onChange={e => setInputToken(e.target.value)}
            fullWidth
            size="small"
          />
          <Button variant="contained" onClick={handleSet}>Set</Button>
        </Box>
        <Alert severity="info">
          Use this page to debug authentication issues. You can clear or set a token, and see the decoded user info. If you are not authenticated, you will be redirected from protected pages.
        </Alert>
      </Paper>
    </Box>
  );
};

export default DebugAuthPage; 

