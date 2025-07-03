import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Card, CardContent, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import axios from 'axios';

interface Budget {
  _id: string;
  department: string;
  project?: string;
  period: string;
  amount: number;
  forecast: number;
  scenarios: { best: number; worst: number; expected: number };
  actual: number;
  variance: number;
  notes?: string;
  history?: any[];
}

type SortKey = 'department' | 'project' | 'period' | 'amount' | 'actual' | 'variance' | 'forecast' | '';
type SortOrder = 'asc' | 'desc';

const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    department: '',
    project: '',
    period: '',
    amount: '',
    forecast: '',
    scenarios: { best: '', worst: '', expected: '' },
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Budget[]>('/api/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgets(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  // Sorting and filtering
  const filteredBudgets = useMemo(() => {
    let data = budgets;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(b =>
        b.department.toLowerCase().includes(s) ||
        (b.project || '').toLowerCase().includes(s) ||
        b.period.toLowerCase().includes(s)
      );
    }
    if (sortKey) {
      data = [...data].sort((a, b) => {
        let aVal: any = a[sortKey as keyof Budget];
        let bVal: any = b[sortKey as keyof Budget];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [budgets, search, sortKey, sortOrder]);

  // Color for variance
  const getVarianceColor = (variance: number) => {
    if (variance < 0) return 'green';
    if (variance > 0) return 'red';
    return 'inherit';
  };

  // Add Budget handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      department: '',
      project: '',
      period: '',
      amount: '',
      forecast: '',
      scenarios: { best: '', worst: '', expected: '' },
      notes: '',
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleScenarioChange = (field: string, value: string) => {
    setForm({ ...form, scenarios: { ...form.scenarios, [field]: value } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/budgets', {
        department: form.department,
        project: form.project,
        period: form.period,
        amount: Number(form.amount),
        forecast: Number(form.forecast),
        scenarios: {
          best: Number(form.scenarios.best),
          worst: Number(form.scenarios.worst),
          expected: Number(form.scenarios.expected),
        },
        notes: form.notes,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Budget created successfully!');
      fetchBudgets();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create budget');
    } finally {
      setSubmitting(false);
    }
  };

  // Chart data for scenario modeling
  const scenarioChartData = useMemo(() =>
    filteredBudgets.map(b => ({
      name: `${b.department} ${b.period}`,
      Budget: b.amount,
      Actual: b.actual,
      Forecast: b.forecast,
      Best: b.scenarios.best,
      Worst: b.scenarios.worst,
      Expected: b.scenarios.expected,
    })),
    [filteredBudgets]
  );

  return (
    <Box p={3}>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3} mb={3}>
        <Box flex={1} mb={{ xs: 2, md: 0 }}>
          <Card sx={{ background: '#6d4c41', color: '#fff' }}>
            <CardContent>
              <Typography variant="h6">Total Budgets</Typography>
              <Typography variant="h4">{budgets.length}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={2} display="flex" alignItems="center" justifyContent="flex-end" gap={2}>
          <TextField
            size="small"
            placeholder="Search by department, project, or period"
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
          <Button variant="contained" color="primary" onClick={handleOpen} sx={{ minWidth: 180, fontWeight: 600, fontSize: 16 }}>
            Add Budget
          </Button>
        </Box>
      </Box>
      <Paper sx={{ mt: 2, p: 2, overflowX: 'auto' }}>
        <Typography variant="h5" gutterBottom>Budgets</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell>Department</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setSortKey('amount')}
                  >
                    Budgeted
                  </TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setSortKey('actual')}
                  >
                    Actual
                  </TableCell>
                  <TableCell
                    sx={{ cursor: 'pointer', fontWeight: 700 }}
                    onClick={() => setSortKey('variance')}
                  >
                    Variance
                  </TableCell>
                  <TableCell>Forecast</TableCell>
                  <TableCell>Best</TableCell>
                  <TableCell>Worst</TableCell>
                  <TableCell>Expected</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBudgets.map((b, idx) => (
                  <TableRow key={b._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{b.department}</TableCell>
                    <TableCell>{b.project || '-'}</TableCell>
                    <TableCell>{b.period}</TableCell>
                    <TableCell>{b.amount.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{b.actual.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell sx={{ color: getVarianceColor(b.variance), fontWeight: 700 }}>{b.variance.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{b.forecast.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{b.scenarios.best.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{b.scenarios.worst.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{b.scenarios.expected.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>{b.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Paper sx={{ mt: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>Scenario Modeling & Variance Analysis</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={scenarioChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Budget" fill="#1976d2" />
            <Bar dataKey="Actual" fill="#d32f2f" />
            <Bar dataKey="Forecast" fill="#388e3c" />
            <Bar dataKey="Best" fill="#fbc02d" />
            <Bar dataKey="Worst" fill="#6d4c41" />
            <Bar dataKey="Expected" fill="#0288d1" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Budget</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box display="flex" gap={2}>
              <TextField label="Department" name="department" value={form.department} onChange={handleFormChange} required fullWidth />
              <TextField label="Project" name="project" value={form.project} onChange={handleFormChange} fullWidth />
              <TextField label="Period" name="period" value={form.period} onChange={handleFormChange} required fullWidth placeholder="e.g. 2024-Q2 or 2024-05" />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Budgeted Amount" name="amount" value={form.amount} onChange={handleFormChange} required fullWidth type="number" />
              <TextField label="Forecast" name="forecast" value={form.forecast} onChange={handleFormChange} required fullWidth type="number" />
            </Box>
            <Typography variant="subtitle1" fontWeight={600} mt={2}>Scenarios</Typography>
            <Box display="flex" gap={2}>
              <TextField label="Best Case" value={form.scenarios.best} onChange={e => handleScenarioChange('best', e.target.value)} required fullWidth type="number" />
              <TextField label="Worst Case" value={form.scenarios.worst} onChange={e => handleScenarioChange('worst', e.target.value)} required fullWidth type="number" />
              <TextField label="Expected Case" value={form.scenarios.expected} onChange={e => handleScenarioChange('expected', e.target.value)} required fullWidth type="number" />
            </Box>
            <TextField label="Notes" name="notes" value={form.notes} onChange={handleFormChange} fullWidth multiline minRows={2} />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>Create Budget</Button>
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

export default BudgetsPage; 