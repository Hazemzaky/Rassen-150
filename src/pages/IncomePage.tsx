import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Card, CardContent, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from 'axios';

interface Income {
  _id: string;
  description: string;
  amount: number;
  date: string;
  currency?: string;
  managementDepartment?: string;
}

interface Period {
  _id: string;
  period: string;
  closed: boolean;
}

type SortKey = 'amount' | 'date' | '';
type SortOrder = 'asc' | 'desc';

const IncomePage: React.FC = () => {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: '',
    currency: 'KWD',
    managementDepartment: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodLocked, setPeriodLocked] = useState(false);

  useEffect(() => {
    fetchIncome();
    // Fetch periods
    const fetchPeriods = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get<Period[]>('/api/periods', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPeriods(res.data);
      } catch {}
    };
    fetchPeriods();
  }, []);

  useEffect(() => {
    // Check if form.date's period is locked
    if (form.date) {
      const period = new Date(form.date).toISOString().slice(0, 7);
      const found = periods.find(p => p.period === period);
      setPeriodLocked(!!(found && found.closed));
    } else {
      setPeriodLocked(false);
    }
  }, [form.date, periods]);

  const fetchIncome = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Income[]>('/api/expenses/income', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncome(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch income records');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      description: '',
      amount: '',
      date: '',
      currency: 'KWD',
      managementDepartment: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/expenses/income', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Income record added successfully!');
      fetchIncome();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add income');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total income
  const totalIncome = income.reduce((sum, i) => sum + Number(i.amount), 0);

  // Filtered and sorted income
  const filteredIncome = useMemo(() => {
    let data = income;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(i =>
        i.description.toLowerCase().includes(s) ||
        (i.managementDepartment || '').toLowerCase().includes(s)
      );
    }
    if (sortKey) {
      data = [...data].sort((a, b) => {
        let aVal: any = a[sortKey];
        let bVal: any = b[sortKey];
        if (sortKey === 'date') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [income, search, sortKey, sortOrder]);

  // Income trend chart data (by month)
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    income.forEach(i => {
      const d = new Date(i.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + Number(i.amount));
    });
    return Array.from(map.entries()).map(([month, total]) => ({ month, total }));
  }, [income]);

  // Currency formatter
  const formatCurrency = (amount: number, currency = 'KWD') =>
    amount.toLocaleString(undefined, { style: 'currency', currency });

  // Sorting handlers
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3} mb={3}>
        <Box flex={1} mb={{ xs: 2, md: 0 }}>
          <Card sx={{ background: '#388e3c', color: '#fff' }}>
            <CardContent>
              <Typography variant="h6">Total Income</Typography>
              <Typography variant="h4">{formatCurrency(totalIncome, 'KWD')}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={2} display="flex" flexDirection="column" gap={2}>
          <Paper sx={{ p: 2, mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={1}>Income Trend</Typography>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#1976d2" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          <Box display="flex" alignItems="center" justifyContent="flex-end">
            <TextField
              size="small"
              placeholder="Search by description or department"
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
            <Button variant="contained" color="primary" onClick={handleOpen} sx={{ minWidth: 180, fontWeight: 600, fontSize: 16, ml: 2 }} disabled={periodLocked}>
              Add Income
            </Button>
          </Box>
        </Box>
      </Box>
      <Paper sx={{ mt: 2, p: 2, overflowX: 'auto' }}>
        <Typography variant="h5" gutterBottom>Income Records</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell>Description</TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => handleSort('amount')}
                  >
                    Amount {sortKey === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </TableCell>
                  <TableCell>Currency</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => handleSort('date')}
                  >
                    Date {sortKey === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredIncome.map((row, idx) => (
                  <TableRow key={row._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{formatCurrency(Number(row.amount), row.currency)}</TableCell>
                    <TableCell>{row.currency || '-'}</TableCell>
                    <TableCell>{row.managementDepartment || '-'}</TableCell>
                    <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {periodLocked && <Alert severity="warning" sx={{ mb: 2 }}>This period is locked and cannot be edited.</Alert>}
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Income</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Description" name="description" value={form.description} onChange={handleChange} required fullWidth />
            <TextField label="Amount" name="amount" value={form.amount} onChange={handleChange} required fullWidth type="number" />
            <TextField label="Date" name="date" value={form.date} onChange={handleChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            <TextField label="Currency" name="currency" value={form.currency} onChange={handleChange} required fullWidth />
            <TextField label="Management Department" name="managementDepartment" value={form.managementDepartment} onChange={handleChange} fullWidth />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>Add</Button>
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

export default IncomePage; 