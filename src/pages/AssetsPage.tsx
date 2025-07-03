import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Paper, TextField, MenuItem, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PrintIcon from '@mui/icons-material/Print';

const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#6d4c41', '#0288d1'];

const AssetTypes = [
  'vehicle', 'equipment', 'building', 'furniture', 'it', 'other'
];
const AssetStatuses = [
  'active', 'in_maintenance', 'retired', 'disposed'
];
const DepreciationMethods = [
  'straight-line', 'declining-balance'
];

const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: '',
    purchaseDate: '',
    purchaseValue: '',
    depreciationMethod: 'straight-line',
    usefulLife: '',
    salvageValue: '',
    currentValue: '',
    status: 'active',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<any[]>('/api/assets');
      setAssets(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (typeFilter && a.type !== typeFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (dateFrom && new Date(a.purchaseDate) < new Date(dateFrom)) return false;
      if (dateTo && new Date(a.purchaseDate) > new Date(dateTo)) return false;
      return true;
    });
  }, [assets, typeFilter, statusFilter, dateFrom, dateTo]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Type', 'Purchase Date', 'Purchase Value', 'Current Value', 'Status'];
    const rows = filteredAssets.map(a => [
      a.name, a.type, a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : '', a.purchaseValue, a.currentValue, a.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assets.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // Print
  const handlePrint = () => {
    window.print();
  };

  // Chart data
  const typeData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAssets.forEach(a => { map[a.type] = (map[a.type] || 0) + 1; });
    return Object.entries(map).map(([type, count]) => ({ name: type, value: count }));
  }, [filteredAssets]);
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAssets.forEach(a => { map[a.status] = (map[a.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ name: status, value: count }));
  }, [filteredAssets]);

  // Asset lifecycle progress (simple: years used / usefulLife)
  const getLifecyclePercent = (a: any) => {
    if (!a.purchaseDate || !a.usefulLife) return 0;
    const yearsUsed = (new Date().getTime() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.min(100, Math.round((yearsUsed / a.usefulLife) * 100));
  };

  // Add Asset handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      name: '',
      type: '',
      purchaseDate: '',
      purchaseValue: '',
      depreciationMethod: 'straight-line',
      usefulLife: '',
      salvageValue: '',
      currentValue: '',
      status: 'active',
      notes: '',
    });
    setError('');
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
      await axios.post('/api/assets', {
        ...form,
        purchaseValue: Number(form.purchaseValue),
        usefulLife: Number(form.usefulLife),
        salvageValue: Number(form.salvageValue),
        currentValue: Number(form.currentValue),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Asset added successfully!');
      fetchAssets();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add asset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Assets</Typography>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add Asset
        </Button>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Assets</Typography>
            <Typography variant="h5">{assets.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Active Assets</Typography>
            <Typography variant="h5">{assets.filter(a => a.status === 'active').length}</Typography>
          </CardContent>
        </Card>
      </Box>
      <Box display="flex" gap={2} mb={2}>
        <TextField select label="Type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All Types</MenuItem>
          {AssetTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {AssetStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField label="From" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} sx={{ minWidth: 160 }} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} sx={{ minWidth: 160 }} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={handleExportCSV}>Export CSV</Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
      </Box>
      <Box display="flex" gap={4} mb={3} flexWrap="wrap">
        <Paper sx={{ p: 2, minWidth: 320, flex: 1 }}>
          <Typography variant="subtitle1">Asset Distribution by Type</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {typeData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 320, flex: 1 }}>
          <Typography variant="subtitle1">Asset Distribution by Status</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {statusData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Name</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Type</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Purchase Date</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Purchase Value</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Current Value</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Status</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Lifecycle</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((a, idx) => (
              <tr key={a._id} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: 8, borderBottom: '1px solid #eee', color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate(`/assets/${a._id}`)}>{a.name}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{a.type}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString() : '-'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{a.purchaseValue?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{a.currentValue?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{a.status}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee', minWidth: 120 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 80, height: 8, bgcolor: '#eee', borderRadius: 2, overflow: 'hidden' }}>
                      <Box sx={{ width: `${getLifecyclePercent(a)}%`, height: 8, bgcolor: getLifecyclePercent(a) > 90 ? '#d32f2f' : '#1976d2' }} />
                    </Box>
                    <Typography variant="caption">{getLifecyclePercent(a)}%</Typography>
                  </Box>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <Typography align="center" sx={{ mt: 2 }}>Loading...</Typography>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {/* Add Asset Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Asset</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
            <TextField label="Type" name="type" value={form.type} onChange={handleFormChange} required fullWidth select>
              <MenuItem value="">Select Type</MenuItem>
              {AssetTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField label="Purchase Date" name="purchaseDate" value={form.purchaseDate} onChange={handleFormChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            <TextField label="Purchase Value" name="purchaseValue" value={form.purchaseValue} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Depreciation Method" name="depreciationMethod" value={form.depreciationMethod} onChange={handleFormChange} required fullWidth select>
              {DepreciationMethods.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            <TextField label="Useful Life (years)" name="usefulLife" value={form.usefulLife} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Salvage Value" name="salvageValue" value={form.salvageValue} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Current Value" name="currentValue" value={form.currentValue} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Status" name="status" value={form.status} onChange={handleFormChange} required fullWidth select>
              {AssetStatuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <TextField label="Notes" name="notes" value={form.notes} onChange={handleFormChange} fullWidth multiline minRows={2} />
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

export default AssetsPage; 