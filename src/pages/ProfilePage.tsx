import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Avatar, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, IconButton } from '@mui/material';
import axios from 'axios';
import CloseIcon from '@mui/icons-material/Close';

interface UserProfile {
  _id?: string;
  email: string;
  role: string;
  phone?: string;
  workEmail?: string;
  address?: string;
  position?: string;
  lastSignIn?: string;
  password?: string;
}

// Add a custom JWT decoder function
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

// Add debugging logs
console.log("ProfilePage loaded");
const token = localStorage.getItem('token');
console.log("Token:", token);
console.log("Decoded user:", decodeJWT(token || ''));

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [pwDialog, setPwDialog] = useState(false);
  const [pwForm, setPwForm] = useState({ password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [adminPwDialog, setAdminPwDialog] = useState(false);
  const [adminPwForm, setAdminPwForm] = useState({ password: '', confirm: '' });
  const [adminPwError, setAdminPwError] = useState('');
  const [showDebug, setShowDebug] = useState(true);

  // Get current user info from token
  let currentUser: any = null;
  try {
    if (token) {
      currentUser = decodeJWT(token);
    } else {
      setError('No token found. Please log in again.');
    }
  } catch (e) {
    setError('Failed to decode token. Please log in again.');
    console.error('JWT decode error:', e);
  }
  const isAdmin = currentUser?.role === 'admin';
  const isSelf = !isAdmin || (profile && currentUser?.userId === profile._id);

  useEffect(() => {
    if (!token) {
      setError('No token found. Please log in again.');
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get<UserProfile>('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setEditForm(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch profile');
        console.error('API error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSave = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (isAdmin) {
        await axios.put(`/api/auth/${profile?._id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.put('/api/auth/me', { address: editForm.address }, { headers: { Authorization: `Bearer ${token}` } });
      }
      setSuccess('Profile updated');
      setEditMode(false);
      setProfile({ ...profile, ...editForm });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };
  const handlePwSave = async () => {
    setPwError('');
    if (pwForm.password !== pwForm.confirm) {
      setPwError('Passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/auth/me', { password: pwForm.password }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Password updated');
      setPwDialog(false);
      setPwForm({ password: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to update password');
    }
  };
  const handleAdminPwSave = async () => {
    setAdminPwError('');
    if (adminPwForm.password !== adminPwForm.confirm) {
      setAdminPwError('Passwords do not match');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/auth/${profile?._id}/password`, { password: adminPwForm.password }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Password updated');
      setAdminPwDialog(false);
      setAdminPwForm({ password: '', confirm: '' });
    } catch (err: any) {
      setAdminPwError(err.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <Box p={3} display="flex" flexDirection="column" alignItems="center" minHeight="60vh">
      {/* Debug Info Modal */}
      <Dialog open={showDebug} onClose={() => setShowDebug(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Debug Info
          <IconButton
            aria-label="close"
            onClick={() => setShowDebug(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2"><b>Token:</b> {token || 'No token found'}</Typography>
          <Typography variant="body2"><b>Decoded User:</b> <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(decodeJWT(token || ''), null, 2)}</pre></Typography>
          <Typography variant="body2"><b>Profile State:</b> <pre style={{whiteSpace: 'pre-wrap'}}>{profile ? JSON.stringify(profile, null, 2) : 'No profile loaded'}</pre></Typography>
          <Typography variant="body2" color="error"><b>Error:</b> {error || 'No error'}</Typography>
        </DialogContent>
      </Dialog>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : profile ? (
        <Card sx={{ minWidth: 350, maxWidth: 500 }}>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: '#1976d2', width: 64, height: 64, mb: 1 }}>
                {profile.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h5">{profile.email}</Typography>
              <Typography color="text.secondary">{profile.position || 'User'}</Typography>
            </Box>
            {editMode ? (
              <Box display="flex" flexDirection="column" gap={2}>
                {isAdmin && (
                  <TextField label="Email" name="email" value={editForm.email || ''} onChange={handleEditChange} fullWidth />
                )}
                <TextField label="Role" name="role" value={editForm.role || ''} onChange={handleEditChange} fullWidth disabled={!isAdmin} />
                <TextField label="Phone" name="phone" value={editForm.phone || ''} onChange={handleEditChange} fullWidth disabled={!isAdmin} />
                <TextField label="Work Email" name="workEmail" value={editForm.workEmail || ''} onChange={handleEditChange} fullWidth disabled={!isAdmin} />
                <TextField label="Address" name="address" value={editForm.address || ''} onChange={handleEditChange} fullWidth disabled={!isAdmin && !isSelf} />
                <TextField label="Position" name="position" value={editForm.position || ''} onChange={handleEditChange} fullWidth disabled={!isAdmin} />
                <Box display="flex" gap={2}>
                  <Button variant="contained" color="primary" onClick={handleEditSave}>Save</Button>
                  <Button variant="outlined" onClick={() => { setEditMode(false); setEditForm(profile); }}>Cancel</Button>
                </Box>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="subtitle1">Role: <b>{profile.role}</b></Typography>
                <Typography variant="subtitle1">Phone: <b>{profile.phone || '-'}</b></Typography>
                <Typography variant="subtitle1">Work Email: <b>{profile.workEmail || '-'}</b></Typography>
                <Typography variant="subtitle1">Address: <b>{profile.address || '-'}</b></Typography>
                <Typography variant="subtitle1">Position: <b>{profile.position || '-'}</b></Typography>
                <Typography variant="subtitle1">Last Sign In: <b>{profile.lastSignIn ? new Date(profile.lastSignIn).toLocaleString() : '-'}</b></Typography>
                <Typography variant="subtitle1">Password: <b>••••••••</b></Typography>
                <Box display="flex" gap={2} mt={2}>
                  {(isAdmin || isSelf) && <Button variant="outlined" onClick={() => setEditMode(true)}>Edit</Button>}
                  {isSelf && <Button variant="outlined" onClick={() => setPwDialog(true)}>Change Password</Button>}
                  {isAdmin && <Button variant="outlined" color="secondary" onClick={() => setAdminPwDialog(true)}>Admin: Change Password</Button>}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : null}
      {/* User password dialog */}
      <Dialog open={pwDialog} onClose={() => setPwDialog(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField label="New Password" type="password" value={pwForm.password} onChange={e => setPwForm({ ...pwForm, password: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Confirm Password" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} fullWidth />
          {pwError && <Alert severity="error" sx={{ mt: 2 }}>{pwError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPwDialog(false)}>Cancel</Button>
          <Button onClick={handlePwSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Admin password dialog */}
      <Dialog open={adminPwDialog} onClose={() => setAdminPwDialog(false)}>
        <DialogTitle>Admin: Change User Password</DialogTitle>
        <DialogContent>
          <TextField label="New Password" type="password" value={adminPwForm.password} onChange={e => setAdminPwForm({ ...adminPwForm, password: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Confirm Password" type="password" value={adminPwForm.confirm} onChange={e => setAdminPwForm({ ...adminPwForm, confirm: e.target.value })} fullWidth />
          {adminPwError && <Alert severity="error" sx={{ mt: 2 }}>{adminPwError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminPwDialog(false)}>Cancel</Button>
          <Button onClick={handleAdminPwSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} message={success} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} />
    </Box>
  );
};

export default ProfilePage;
export {}; 