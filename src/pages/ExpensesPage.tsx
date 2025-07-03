import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton, InputAdornment
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DialogContentText from '@mui/material/DialogContentText';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  currency?: string;
  depreciationStart?: string;
  depreciationEnd?: string;
  managementDepartment?: string;
  proofUrl?: string;
  customType?: string;
}

interface Period {
  _id: string;
  period: string;
  closed: boolean;
}

const typeOptions = [
  { value: 'expenses', label: 'Expenses' },
  { value: 'income', label: 'Income' },
  { value: 'penalty', label: 'Penalty' },
  { value: 'profit', label: 'Profit' },
  { value: 'depreciation', label: 'Depreciation' },
  { value: 'debit service fee', label: 'Debit Service Fee' },
  { value: 'other', label: 'Other' },
];

const currencyOptions = [
  { value: 'KWD', label: 'Kuwaiti Dinar' },
  { value: 'USD', label: 'USD' },
];

const getFinancialYears = () => {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear + 1; y >= 2000; y--) {
    years.push({
      label: `${y - 1} - ${y}`,
      start: new Date(`${y - 1}-04-01T00:00:00.000Z`),
      end: new Date(`${y}-03-31T23:59:59.999Z`),
    });
  }
  return years;
};

const quarterOptions = [
  { value: 'Q1', label: 'Q1 (Apr-Jun)', startMonth: 3, endMonth: 5 },
  { value: 'Q2', label: 'Q2 (Jul-Sep)', startMonth: 6, endMonth: 8 },
  { value: 'Q3', label: 'Q3 (Oct-Dec)', startMonth: 9, endMonth: 11 },
  { value: 'Q4', label: 'Q4 (Jan-Mar)', startMonth: 0, endMonth: 2 },
];
const halfYearOptions = [
  { value: 'H1', label: 'First Half (Apr-Sep)', startMonth: 3, endMonth: 8 },
  { value: 'H2', label: 'Second Half (Oct-Mar)', startMonth: 9, endMonth: 2 },
];

const monthOptions = [
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
];

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    description: '',
    amount: '',
    date: '',
    currency: 'KWD',
    type: 'expenses',
    depreciationStart: '',
    depreciationEnd: '',
    managementDepartment: '',
    customType: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputId = 'proof-upload';
  const [selectedYear, setSelectedYear] = useState(getFinancialYears()[0]);
  const [periodType, setPeriodType] = useState('quarter');
  const [quarter, setQuarter] = useState('Q1');
  const [half, setHalf] = useState('H1');
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [month, setMonth] = useState(3); // Default to April
  const [sortBy, setSortBy] = useState<'description' | 'amount' | 'currency' | 'managementDepartment' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodLocked, setPeriodLocked] = useState(false);

  // Helper to filter expenses by date range
  const filterExpensesByRange = (start: Date, end: Date) => {
    return expenses.filter(exp => {
      const d = new Date(exp.date);
      return d >= start && d <= end;
    });
  };

  // Monthly breakdown for selected year
  const months = [
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December', 'January', 'February', 'March'
  ];
  const monthNumbers = [3,4,5,6,7,8,9,10,11,0,1,2];
  const monthlyTotals = monthNumbers.map((m, idx) => {
    const start = new Date(selectedYear.start);
    start.setMonth(m, 1);
    const end = new Date(selectedYear.start);
    end.setMonth(m + 1, 0);
    const total = filterExpensesByRange(start, end).reduce((sum, e) => sum + Number(e.amount), 0);
    return { month: months[idx], total };
  });

  useEffect(() => {
    console.log('ExpensesPage useEffect running');
    const fetchExpenses = async () => {
      console.log('fetchExpenses function called');
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token ? 'Present' : 'Missing');
        const res = await axios.get<Expense[]>('/api/expenses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('API response:', res.data);
        setExpenses(res.data);
      } catch (err: any) {
        console.error('API error:', err);
        setError(err.response?.data?.message || 'Failed to fetch expenses');
      } finally {
        setLoading(false);
      }
    };
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
    fetchExpenses();
    fetchPeriods();
  }, []);

  useEffect(() => {
    // Check if selectedYear is locked
    const periodLabel = selectedYear.label.replace(' - ', '-'); // e.g. 2023-2024 -> 2023-2024
    const found = periods.find(p => p.period === periodLabel);
    setPeriodLocked(!!(found && found.closed));
  }, [selectedYear, periods]);

  console.log('ExpensesPage render - loading:', loading, 'error:', error, 'expenses count:', expenses.length);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      description: '',
      amount: '',
      date: '',
      currency: 'KWD',
      type: 'expenses',
      depreciationStart: '',
      depreciationEnd: '',
      managementDepartment: '',
      customType: '',
    });
    setFile(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, type: e.target.value, customType: '', depreciationStart: '', depreciationEnd: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId') || localStorage.getItem('id');
      const formData = new FormData();
      formData.append('description', form.description);
      formData.append('amount', form.amount);
      formData.append('date', form.date);
      formData.append('currency', form.currency);
      formData.append('category', form.type);
      formData.append('managementDepartment', form.managementDepartment);
      if (form.type === 'depreciation') {
        formData.append('depreciationStart', form.depreciationStart);
        formData.append('depreciationEnd', form.depreciationEnd);
      }
      if (form.type === 'other') {
        formData.append('customType', form.customType);
      }
      if (file) {
        formData.append('proof', file);
      }
      if (userId) {
        formData.append('user', userId);
      }
      await axios.post('/api/expenses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      // Refresh expenses
      setLoading(true);
      const res = await axios.get<Expense[]>('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  // Calculate totals
  let periodTotal = 0;
  if (periodType === 'month') {
    const start = new Date(selectedYear.start);
    start.setMonth(month, 1);
    const end = new Date(selectedYear.start);
    end.setMonth(month + 1, 0);
    periodTotal = filterExpensesByRange(start, end).reduce((sum, e) => sum + Number(e.amount), 0);
  } else if (periodType === 'quarter') {
    const q = quarterOptions.find(q => q.value === quarter);
    if (q) {
      let start = new Date(selectedYear.start);
      start.setMonth(q.startMonth, 1);
      let end = new Date(selectedYear.start);
      if (q.endMonth < q.startMonth) {
        end = new Date(selectedYear.end);
        end.setMonth(q.endMonth, 31);
      } else {
        end.setMonth(q.endMonth + 1, 0);
      }
      periodTotal = filterExpensesByRange(start, end).reduce((sum, e) => sum + Number(e.amount), 0);
    }
  } else if (periodType === 'half') {
    const h = halfYearOptions.find(h => h.value === half);
    if (h) {
      let start = new Date(selectedYear.start);
      start.setMonth(h.startMonth, 1);
      let end = new Date(selectedYear.start);
      if (h.endMonth < h.startMonth) {
        end = new Date(selectedYear.end);
        end.setMonth(h.endMonth, 31);
      } else {
        end.setMonth(h.endMonth + 1, 0);
      }
      periodTotal = filterExpensesByRange(start, end).reduce((sum, e) => sum + Number(e.amount), 0);
    }
  } else if (periodType === 'year') {
    periodTotal = filterExpensesByRange(selectedYear.start, selectedYear.end).reduce((sum, e) => sum + Number(e.amount), 0);
  }

  // Sort expenses
  const sortedExpenses = [...expenses].sort((a, b) => {
    let aVal: any, bVal: any;
    switch (sortBy) {
      case 'amount':
        aVal = Number(a.amount); bVal = Number(b.amount); break;
      case 'currency':
        aVal = a.currency || ''; bVal = b.currency || ''; break;
      case 'managementDepartment':
        aVal = a.managementDepartment || ''; bVal = b.managementDepartment || ''; break;
      case 'date':
        aVal = new Date(a.date).getTime(); bVal = new Date(b.date).getTime(); break;
      default:
        aVal = a[sortBy]; bVal = b[sortBy];
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Box p={3}>
      {/* Monthly Breakdown Table */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Monthly Breakdown ({selectedYear.label})</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {months.map(m => <TableCell key={m}>{m}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {monthlyTotals.map(m => <TableCell key={m.month}>{m.total}</TableCell>)}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {/* Bar Chart */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Monthly Totals Chart</Typography>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyTotals} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#1976d2" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
      <Box display="flex" gap={2} mb={3}>
        <Paper sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle1">Financial Year</Typography>
          <TextField
            select
            value={selectedYear.label}
            onChange={e => {
              const y = getFinancialYears().find(y => y.label === e.target.value);
              if (y) setSelectedYear(y);
            }}
            fullWidth
          >
            {getFinancialYears().map(y => (
              <MenuItem key={y.label} value={y.label}>{y.label}</MenuItem>
            ))}
          </TextField>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 200 }}>
          <Typography variant="subtitle1">Period</Typography>
          <TextField
            select
            value={periodType}
            onChange={e => setPeriodType(e.target.value)}
            fullWidth
          >
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="quarter">Quarter</MenuItem>
            <MenuItem value="half">Half Year</MenuItem>
            <MenuItem value="year">Yearly</MenuItem>
          </TextField>
          {periodType === 'month' && (
            <TextField
              select
              label="Month"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              fullWidth
              sx={{ mt: 2 }}
            >
              {monthOptions.map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
          )}
          {periodType === 'quarter' && (
            <TextField
              select
              label="Quarter"
              value={quarter}
              onChange={e => setQuarter(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            >
              {quarterOptions.map(q => (
                <MenuItem key={q.value} value={q.value}>{q.label}</MenuItem>
              ))}
            </TextField>
          )}
          {periodType === 'half' && (
            <TextField
              select
              label="Half Year"
              value={half}
              onChange={e => setHalf(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
            >
              {halfYearOptions.map(h => (
                <MenuItem key={h.value} value={h.value}>{h.label}</MenuItem>
              ))}
            </TextField>
          )}
          {periodType === 'year' && (
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setYearDialogOpen(true)}>
              Show Yearly Total
            </Button>
          )}
        </Paper>
      </Box>
      {periodType === 'month' && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Total for Selected Month: {periodTotal}</Typography>
        </Paper>
      )}
      {(periodType === 'quarter' || periodType === 'half') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Total for Selected Period: {periodTotal}</Typography>
        </Paper>
      )}
      <Dialog open={yearDialogOpen} onClose={() => setYearDialogOpen(false)}>
        <DialogTitle>Yearly Total</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Total for {selectedYear.label}: {periodTotal}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYearDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Typography variant="h4" gutterBottom>Expenses</Typography>
      <Button variant="contained" color="primary" onClick={handleOpen} sx={{ mb: 2 }} disabled={periodLocked}>
        Add Expense
      </Button>
      {periodLocked && <Alert severity="warning" sx={{ mb: 2 }}>This period is locked and cannot be edited.</Alert>}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Expense</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Description" name="description" value={form.description} onChange={handleChange} required fullWidth />
            <TextField label="Amount" name="amount" value={form.amount} onChange={handleChange} required fullWidth type="number"
              InputProps={{ endAdornment: <InputAdornment position="end">{form.currency}</InputAdornment> }}
            />
            <TextField label="Date" name="date" value={form.date} onChange={handleChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            <TextField select label="Currency" name="currency" value={form.currency} onChange={handleChange} required fullWidth>
              {currencyOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </TextField>
            <TextField select label="Type" name="type" value={form.type} onChange={handleTypeChange} required fullWidth>
              {typeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </TextField>
            {form.type === 'depreciation' && (
              <>
                <TextField label="Depreciation Start Date" name="depreciationStart" value={form.depreciationStart} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} fullWidth required />
                <TextField label="Depreciation End Date" name="depreciationEnd" value={form.depreciationEnd} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} fullWidth required />
              </>
            )}
            {form.type === 'other' && (
              <TextField label="Custom Type" name="customType" value={form.customType} onChange={handleChange} required fullWidth />
            )}
            <TextField label="Management Department" name="managementDepartment" value={form.managementDepartment} onChange={handleChange} required fullWidth />
            <Box display="flex" alignItems="center" gap={2}>
              <input
                accept="application/pdf,image/*"
                style={{ display: 'none' }}
                id={fileInputId}
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor={fileInputId}>
                <IconButton color="primary" component="span" sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
                  <UploadFileIcon />
                </IconButton>
              </label>
              <Typography variant="body2">{file ? file.name : 'Upload Proof Document'}</Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>Add</Button>
        </DialogActions>
      </Dialog>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => { setSortBy('description'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Description</TableCell>
                <TableCell onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Amount {sortBy === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</TableCell>
                <TableCell onClick={() => { setSortBy('currency'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Currency {sortBy === 'currency' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</TableCell>
                <TableCell>Category</TableCell>
                <TableCell onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Date {sortBy === 'date' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</TableCell>
                <TableCell>Depreciation Start</TableCell>
                <TableCell>Depreciation End</TableCell>
                <TableCell onClick={() => { setSortBy('managementDepartment'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} style={{ cursor: 'pointer' }}>Management Dept. {sortBy === 'managementDepartment' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</TableCell>
                <TableCell>Custom Type</TableCell>
                <TableCell>Proof</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedExpenses.map(expense => (
                <TableRow key={expense._id}>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.amount}</TableCell>
                  <TableCell>{expense.currency || '-'}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>{expense.depreciationStart ? new Date(expense.depreciationStart).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{expense.depreciationEnd ? new Date(expense.depreciationEnd).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{expense.managementDepartment || '-'}</TableCell>
                  <TableCell>{expense.customType || '-'}</TableCell>
                  <TableCell>
                    {expense.proofUrl ? (
                      <a href={expense.proofUrl} target="_blank" rel="noopener noreferrer">View</a>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ExpensesPage; 