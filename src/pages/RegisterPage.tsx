import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, MenuItem } from '@mui/material';
import axios from 'axios';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { email, password, role });
      setSuccess('Registration successful! Please log in.');
      setLoading(false);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Paper sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" gutterBottom>Register</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Role"
            select
            value={role}
            onChange={e => setRole(e.target.value)}
            fullWidth
            margin="normal"
            required
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </Button>
        </form>
        <Button
          color="secondary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => (window.location.href = '/login')}
        >
          Already have an account? Login
        </Button>
      </Paper>
    </Box>
  );
};

export default RegisterPage;