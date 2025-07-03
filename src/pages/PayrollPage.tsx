import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface Payroll {
  _id: string;
  employee: { _id: string; name: string };
  period: string;
  baseSalary: number;
  benefits: number;
  leaveCost: number;
  reimbursements: number;
  deductions: number;
  netPay: number;
  status: string;
  runDate: string;
}

interface Period {
  _id: string;
  period: string;
  closed: boolean;
}

const PayrollPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<{ _id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    employee: '',
    period: '',
    baseSalary: '',
    benefits: '',
    leaveCost: '',
    reimbursements: '',
    deductions: '',
    netPay: '',
    status: 'pending',
  });
  const [submitting, setSubmitting] = useState(false);

  // Period lock state
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodLocked, setPeriodLocked] = useState(false);

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
    fetchPeriods();
  }, []);

  useEffect(() => {
    // Check if form.period is locked
    if (form.period) {
      const found = periods.find(p => p.period === form.period);
      setPeriodLocked(!!(found && found.closed));
    } else {
      setPeriodLocked(false);
    }
  }, [form.period, periods]);

  const fetchPayrolls = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Payroll[]>('/api/payroll', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayrolls(res.data as Payroll[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch payrolls');
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

  const filteredPayrolls = useMemo(() => {
    let data = payrolls;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(p =>
        p.employee?.name?.toLowerCase().includes(s) ||
        p.period.toLowerCase().includes(s) ||
        p.status.toLowerCase().includes(s)
      );
    }
    return data;
  }, [payrolls, search]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      employee: '',
      period: '',
      baseSalary: '',
      benefits: '',
      leaveCost: '',
      reimbursements: '',
      deductions: '',
      netPay: '',
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
      await axios.post('/api/payroll', {
        ...form,
        baseSalary: Number(form.baseSalary),
        benefits: Number(form.benefits),
        leaveCost: Number(form.leaveCost),
        reimbursements: Number(form.reimbursements),
        deductions: Number(form.deductions),
        netPay: Number(form.netPay),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Payroll created successfully!');
      fetchPayrolls();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create payroll');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Payroll</Typography>
        <Button variant="contained" color="primary" onClick={handleOpen} disabled={periodLocked}>
          Add Payroll
        </Button>
      </Box>
      {periodLocked && <Alert severity="warning" sx={{ mb: 2 }}>This period is locked and cannot be edited.</Alert>}
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by employee, period, or status"
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
                  <TableCell>Period</TableCell>
                  <TableCell>Base Salary</TableCell>
                  <TableCell>Benefits</TableCell>
                  <TableCell>Leave Cost</TableCell>
                  <TableCell>Reimbursements</TableCell>
                  <TableCell>Deductions</TableCell>
                  <TableCell>Net Pay</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Run Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPayrolls.map((p, idx) => (
                  <TableRow key={p._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{p.employee?.name || '-'}</TableCell>
                    <TableCell>{p.period}</TableCell>
                    <TableCell>{p.baseSalary.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{p.benefits.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{p.leaveCost.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{p.reimbursements.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{p.deductions.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{p.netPay.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell>{new Date(p.runDate).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payroll</DialogTitle>
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
            <TextField label="Period" name="period" value={form.period} onChange={handleFormChange} required fullWidth placeholder="e.g. 2024-Q2 or 2024-05" />
            <TextField label="Base Salary" name="baseSalary" value={form.baseSalary} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Benefits" name="benefits" value={form.benefits} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Leave Cost" name="leaveCost" value={form.leaveCost} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Reimbursements" name="reimbursements" value={form.reimbursements} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Deductions" name="deductions" value={form.deductions} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Net Pay" name="netPay" value={form.netPay} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Status" name="status" value={form.status} onChange={handleFormChange} required fullWidth select>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="processed">Processed</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </TextField>
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting || periodLocked}>Create Payroll</Button>
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

export default PayrollPage;