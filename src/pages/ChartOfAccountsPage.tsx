import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface Account {
  _id: string;
  name: string;
  code: string;
  type: string;
  parent?: string;
  description?: string;
  active: boolean;
}

const ChartOfAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    type: '',
    parent: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Account[]>('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    let data = accounts;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(a =>
        a.name.toLowerCase().includes(s) ||
        a.code.toLowerCase().includes(s) ||
        a.type.toLowerCase().includes(s)
      );
    }
    return data;
  }, [accounts, search]);

  const handleOpen = (account?: Account) => {
    if (account) {
      setEditingId(account._id);
      setForm({
        name: account.name,
        code: account.code,
        type: account.type,
        parent: account.parent || '',
        description: account.description || '',
      });
    } else {
      setEditingId(null);
      setForm({ name: '', code: '', type: '', parent: '', description: '' });
    }
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setForm({ name: '', code: '', type: '', parent: '', description: '' });
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`/api/accounts/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Account updated successfully!');
      } else {
        await axios.post('/api/accounts', form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Account created successfully!');
      }
      fetchAccounts();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeactivate = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Account deactivated!');
      fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate account');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Chart of Accounts</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add Account
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name, code, or type"
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearch('')} size="small">
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 300 }}
        />
      </Paper>
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Parent</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAccounts.map((a, idx) => (
                  <TableRow key={a._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.code}</TableCell>
                    <TableCell>{a.type}</TableCell>
                    <TableCell>{accounts.find(acc => acc._id === a.parent)?.name || '-'}</TableCell>
                    <TableCell>{a.description || '-'}</TableCell>
                    <TableCell>
                      {a.active ? <Chip label="Active" color="success" size="small" /> : <Chip label="Inactive" color="default" size="small" />}
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => handleOpen(a)} sx={{ mr: 1 }}>Edit</Button>
                      {a.active && (
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDeactivate(a._id)}>
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
            <TextField label="Code" name="code" value={form.code} onChange={handleFormChange} required fullWidth />
            <TextField label="Type" name="type" value={form.type} onChange={handleFormChange} required fullWidth select>
              <MenuItem value="">Select Type</MenuItem>
              <MenuItem value="asset">Asset</MenuItem>
              <MenuItem value="liability">Liability</MenuItem>
              <MenuItem value="equity">Equity</MenuItem>
              <MenuItem value="revenue">Revenue</MenuItem>
              <MenuItem value="expense">Expense</MenuItem>
            </TextField>
            <TextField label="Parent Account" name="parent" value={form.parent} onChange={handleFormChange} fullWidth select>
              <MenuItem value="">None</MenuItem>
              {accounts.filter(a => a._id !== editingId).map(a => (
                <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Description" name="description" value={form.description} onChange={handleFormChange} fullWidth />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>{editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        message={<span style={{ display: 'flex', alignItems: 'center' }}><span role="img" aria-label="success" style={{ marginRight: 8 }}>✅</span>{success}</span>}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
};

export default ChartOfAccountsPage; 