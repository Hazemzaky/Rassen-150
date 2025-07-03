import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Paper, Snackbar, Alert, Card, CardContent, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PrintIcon from '@mui/icons-material/Print';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';

interface Depreciation {
  _id: string;
  asset: { _id: string; name: string } | string;
  date: string;
  amount: number;
  method: string;
  notes?: string;
}

const defaultForm = {
  asset: '',
  date: '',
  amount: '',
  method: '',
  notes: '',
};

const DepreciationPage: React.FC = () => {
  const [depreciation, setDepreciation] = useState<Depreciation[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterAsset, setFilterAsset] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    fetchDepreciation();
    fetchAssets();
  }, []);

  const fetchDepreciation = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<Depreciation[]>('/api/depreciation');
      setDepreciation(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch depreciation records');
    } finally {
      setLoading(false);
    }
  };
  const fetchAssets = async () => {
    try {
      const res = await axios.get('/api/assets');
      setAssets(res.data as any[]);
    } catch {}
  };

  const handleOpen = (d?: Depreciation) => {
    if (d) {
      setEditingId(d._id);
      setForm({
        asset: typeof d.asset === 'object' ? d.asset._id : d.asset || '',
        date: d.date ? d.date.slice(0, 10) : '',
        amount: d.amount.toString(),
        method: d.method,
        notes: d.notes || '',
      });
    } else {
      setEditingId(null);
      setForm(defaultForm);
    }
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setForm(defaultForm);
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await axios.put(`/api/depreciation/${editingId}`, {
          ...form,
          amount: Number(form.amount),
        });
        setSuccess('Depreciation updated!');
      } else {
        await axios.post('/api/depreciation', {
          ...form,
          amount: Number(form.amount),
        });
        setSuccess('Depreciation created!');
      }
      fetchDepreciation();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save depreciation record');
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/depreciation/${deleteId}`);
      setSuccess('Depreciation deleted!');
      fetchDepreciation();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete depreciation record');
    } finally {
      setDeleteId(null);
    }
  };

  const columns = useMemo<ColumnDef<Depreciation>[]>(() => [
    { header: 'Asset', accessorKey: 'asset', cell: info => typeof info.getValue() === 'object' ? (info.getValue() as any)?.name : info.getValue() },
    { header: 'Date', accessorKey: 'date', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '-' },
    { header: 'Amount', accessorKey: 'amount', cell: info => Number(info.getValue()).toLocaleString(undefined, { style: 'currency', currency: 'KWD' }) },
    { header: 'Method', accessorKey: 'method' },
    { header: 'Notes', accessorKey: 'notes' },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Box display="flex" gap={1}>
          <IconButton color="primary" onClick={() => handleOpen(row.original)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => setDeleteId(row.original._id)}><DeleteIcon /></IconButton>
        </Box>
      ),
    },
  ], [assets]);

  const table = useReactTable({
    data: depreciation,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Filtered depreciation
  const filteredDepreciation = useMemo(() => {
    return depreciation.filter(d => {
      if (filterAsset && (typeof d.asset === 'object' ? d.asset._id : d.asset) !== filterAsset) return false;
      if (filterMethod && d.method !== filterMethod) return false;
      if (filterFrom && new Date(d.date) < new Date(filterFrom)) return false;
      if (filterTo && new Date(d.date) > new Date(filterTo)) return false;
      return true;
    });
  }, [depreciation, filterAsset, filterMethod, filterFrom, filterTo]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Asset', 'Date', 'Amount', 'Method', 'Notes'];
    const rows = filteredDepreciation.map(d => [
      typeof d.asset === 'object' ? d.asset.name : d.asset,
      d.date ? new Date(d.date).toLocaleDateString() : '',
      d.amount,
      d.method,
      d.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'depreciation.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // Print
  const handlePrint = () => {
    window.print();
  };

  // Chart data
  const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#6d4c41', '#0288d1'];
  const deprByAsset = useMemo(() => {
    const map: Record<string, number> = {};
    filteredDepreciation.forEach(d => {
      const name = typeof d.asset === 'object' ? d.asset.name : d.asset;
      if (!map[name]) map[name] = 0;
      map[name] += d.amount ? Number(d.amount) : 0;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredDepreciation]);
  const deprOverTime = useMemo(() => {
    // Group by year
    const map: Record<string, number> = {};
    filteredDepreciation.forEach(d => {
      const year = d.date ? new Date(d.date).getFullYear() : '';
      if (!map[year]) map[year] = 0;
      map[year] += d.amount ? Number(d.amount) : 0;
    });
    return Object.entries(map).map(([year, value]) => ({ year, value }));
  }, [filteredDepreciation]);

  // Summary calculations
  const totalDepreciation = depreciation.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <Box p={3}>
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Depreciation Records</Typography>
            <Typography variant="h5">{depreciation.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Depreciation</Typography>
            <Typography variant="h5">{totalDepreciation.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
          </CardContent>
        </Card>
      </Box>
      {/* Filters and export/print */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField select label="Asset" value={filterAsset} onChange={e => setFilterAsset(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All Assets</MenuItem>
          {assets.map(a => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}
        </TextField>
        <TextField select label="Method" value={filterMethod} onChange={e => setFilterMethod(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Methods</MenuItem>
          <MenuItem value="straight-line">Straight-Line</MenuItem>
          <MenuItem value="declining-balance">Declining-Balance</MenuItem>
        </TextField>
        <TextField label="From" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} sx={{ minWidth: 140 }} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} sx={{ minWidth: 140 }} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={handleExportCSV}>Export CSV</Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
      </Box>
      {/* Charts */}
      <Box display="flex" gap={4} mb={3} flexWrap="wrap">
        <Paper sx={{ p: 2, minWidth: 320, flex: 1 }}>
          <Typography variant="subtitle1">Depreciation by Asset</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={deprByAsset} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                {deprByAsset.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 320, flex: 1 }}>
          <Typography variant="subtitle1">Depreciation Over Time</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={deprOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#1976d2" name="Depreciation" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Depreciation</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Depreciation
        </Button>
      </Box>
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows
              .filter(row => filteredDepreciation.includes(row.original))
              .map(row => (
                <tr key={row.id} style={{ background: row.index % 2 === 0 ? '#fafafa' : '#fff' }}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {loading && <Typography align="center" sx={{ mt: 2 }}>Loading...</Typography>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {/* Add/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Depreciation' : 'Add Depreciation'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField select label="Asset" name="asset" value={form.asset} onChange={handleFormChange} required fullWidth>
              <MenuItem value="">Select Asset</MenuItem>
              {assets.map((a: any) => (
                <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Date" name="date" value={form.date} onChange={handleFormChange} type="date" InputLabelProps={{ shrink: true }} required fullWidth />
            <TextField label="Amount" name="amount" value={form.amount} onChange={handleFormChange} type="number" required fullWidth />
            <TextField label="Method" name="method" value={form.method} onChange={handleFormChange} required fullWidth />
            <TextField label="Notes" name="notes" value={form.notes} onChange={handleFormChange} fullWidth multiline minRows={2} />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">{editingId ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Depreciation</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this depreciation record?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
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

export default DepreciationPage; 
