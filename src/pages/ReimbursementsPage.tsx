import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface Reimbursement {
  _id: string;
  employee: { _id: string; name: string };
  amount: number;
  description: string;
  date: string;
  status: string;
  approvedBy?: { _id: string; name: string };
  payroll?: string;
}

const ReimbursementsPage: React.FC = () => {
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    employee: '',
    amount: '',
    description: '',
    date: '',
    status: 'pending',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReimbursements();
    fetchEmployees();
  }, []);

  const fetchReimbursements = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Reimbursement[]>('/api/reimbursements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReimbursements(res.data as Reimbursement[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<{ _id: string; name: string }[]>('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data as { _id: string; name: string }[]);
    } catch {}
  };

  const filteredReimbursements = useMemo(() => {
    let data = reimbursements;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(r =>
        r.employee?.name?.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s)
      );
    }
    return data;
  }, [reimbursements, search]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      employee: '',
      amount: '',
      description: '',
      date: '',
      status: 'pending',
    });
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
      await axios.post('/api/reimbursements', {
        ...form,
        amount: Number(form.amount),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Reimbursement created successfully!');
      fetchReimbursements();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reimbursement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/reimbursements/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Reimbursement approved!');
      fetchReimbursements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve reimbursement');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/reimbursements/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Reimbursement rejected!');
      fetchReimbursements();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject reimbursement');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Reimbursements</Typography>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add Reimbursement
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by employee, description, or status"
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
                  <TableCell>Employee</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReimbursements.map((r, idx) => (
                  <TableRow key={r._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{r.employee?.name || '-'}</TableCell>
                    <TableCell>{r.amount.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{r.description}</TableCell>
                    <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>
                      {r.status === 'pending' && (
                        <>
                          <Button size="small" variant="outlined" color="success" onClick={() => handleApprove(r._id)} sx={{ mr: 1 }}>
                            Approve
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleReject(r._id)}>
                            Reject
                          </Button>
                        </>
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
        <DialogTitle>Add Reimbursement</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Employee"
              name="employee"
              value={form.employee}
              onChange={handleFormChange}
              required
              select
              fullWidth
            >
              <MenuItem value="">Select Employee</MenuItem>
              {employees.map(e => (
                <MenuItem key={e._id} value={e._id}>{e.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Amount" name="amount" value={form.amount} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Description" name="description" value={form.description} onChange={handleFormChange} required fullWidth />
            <TextField label="Date" name="date" value={form.date} onChange={handleFormChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>Create Reimbursement</Button>
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

export default ReimbursementsPage;