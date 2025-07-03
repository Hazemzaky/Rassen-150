import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface Leave {
  _id: string;
  employee: { _id: string; name: string };
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  cost: number;
  status: string;
  approvedBy?: { _id: string; name: string };
  requestedAt: string;
  approvedAt?: string;
}

interface Period {
  _id: string;
  period: string;
  closed: boolean;
}

const LeavePage: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    employee: '',
    type: '',
    startDate: '',
    endDate: '',
    days: '',
    cost: '',
    status: 'pending',
  });
  const [submitting, setSubmitting] = useState(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodLocked, setPeriodLocked] = useState(false);

  useEffect(() => {
    fetchLeaves();
    fetchEmployees();
    fetchPeriods();
  }, []);

  useEffect(() => {
    // Check if form.startDate's period is locked
    if (form.startDate) {
      const period = new Date(form.startDate).toISOString().slice(0, 7);
      const found = periods.find(p => p.period === period);
      setPeriodLocked(!!(found && found.closed));
    } else {
      setPeriodLocked(false);
    }
  }, [form.startDate, periods]);

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Leave[]>('/api/leave', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeaves(res.data as Leave[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch leaves');
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

  const fetchPeriods = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Period[]>('/api/periods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPeriods(res.data);
    } catch {}
  };

  const filteredLeaves = useMemo(() => {
    let data = leaves;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(l =>
        l.employee?.name?.toLowerCase().includes(s) ||
        l.type.toLowerCase().includes(s) ||
        l.status.toLowerCase().includes(s)
      );
    }
    return data;
  }, [leaves, search]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      employee: '',
      type: '',
      startDate: '',
      endDate: '',
      days: '',
      cost: '',
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
      await axios.post('/api/leave', {
        ...form,
        days: Number(form.days),
        cost: Number(form.cost),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Leave request created successfully!');
      fetchLeaves();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/leave/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Leave approved!');
      fetchLeaves();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/leave/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Leave rejected!');
      fetchLeaves();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject leave');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Leave</Typography>
        <Button variant="contained" color="primary" onClick={handleOpen} disabled={periodLocked}>
          Add Leave
        </Button>
      </Box>
      {periodLocked && <Alert severity="warning" sx={{ mb: 2 }}>This period is locked and cannot be edited.</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by employee, type, or status"
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
                  <TableCell>Type</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Days</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLeaves.map((l, idx) => (
                  <TableRow key={l._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{l.employee?.name || '-'}</TableCell>
                    <TableCell>{l.type}</TableCell>
                    <TableCell>{new Date(l.startDate).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(l.endDate).toLocaleDateString()}</TableCell>
                    <TableCell>{l.days}</TableCell>
                    <TableCell>{l.cost.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{l.status}</TableCell>
                    <TableCell>
                      {l.status === 'pending' && (
                        <>
                          <Button size="small" variant="outlined" color="success" onClick={() => handleApprove(l._id)} sx={{ mr: 1 }}>
                            Approve
                          </Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleReject(l._id)}>
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
        <DialogTitle>Add Leave</DialogTitle>
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
            <TextField label="Type" name="type" value={form.type} onChange={handleFormChange} required fullWidth />
            <TextField label="Start Date" name="startDate" value={form.startDate} onChange={handleFormChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" name="endDate" value={form.endDate} onChange={handleFormChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            <TextField label="Days" name="days" value={form.days} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Cost" name="cost" value={form.cost} onChange={handleFormChange} required fullWidth type="number" />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting || periodLocked}>Create Leave</Button>
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

export default LeavePage; 