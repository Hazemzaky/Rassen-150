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
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';

interface Maintenance {
  _id: string;
  asset: { _id: string; name: string } | string;
  type: string;
  description: string;
  scheduledDate: string;
  completedDate?: string;
  cost?: number;
  status: string;
  downtimeHours?: number;
  notes?: string;
}

const defaultForm = {
  asset: '',
  type: 'preventive',
  description: '',
  scheduledDate: '',
  completedDate: '',
  cost: '',
  status: 'scheduled',
  downtimeHours: '',
  notes: '',
};

const MaintenancePage: React.FC = () => {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterAsset, setFilterAsset] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    fetchMaintenance();
    fetchAssets();
  }, []);

  const fetchMaintenance = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<Maintenance[]>('/api/maintenance');
      setMaintenance(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch maintenance records');
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

  const handleOpen = (m?: Maintenance) => {
    if (m) {
      setEditingId(m._id);
      setForm({
        asset: typeof m.asset === 'object' ? m.asset._id : m.asset || '',
        type: m.type,
        description: m.description,
        scheduledDate: m.scheduledDate ? m.scheduledDate.slice(0, 10) : '',
        completedDate: m.completedDate ? m.completedDate.slice(0, 10) : '',
        cost: m.cost?.toString() || '',
        status: m.status,
        downtimeHours: m.downtimeHours?.toString() || '',
        notes: m.notes || '',
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
        await axios.put(`/api/maintenance/${editingId}`, {
          ...form,
          cost: form.cost ? Number(form.cost) : undefined,
          downtimeHours: form.downtimeHours ? Number(form.downtimeHours) : undefined,
        });
        setSuccess('Maintenance updated!');
      } else {
        await axios.post('/api/maintenance', {
          ...form,
          cost: form.cost ? Number(form.cost) : undefined,
          downtimeHours: form.downtimeHours ? Number(form.downtimeHours) : undefined,
        });
        setSuccess('Maintenance created!');
      }
      fetchMaintenance();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save maintenance record');
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/maintenance/${deleteId}`);
      setSuccess('Maintenance deleted!');
      fetchMaintenance();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete maintenance record');
    } finally {
      setDeleteId(null);
    }
  };

  const columns = useMemo<ColumnDef<Maintenance>[]>(() => [
    { header: 'Asset', accessorKey: 'asset', cell: info => typeof info.getValue() === 'object' ? (info.getValue() as any)?.name : info.getValue() },
    { header: 'Type', accessorKey: 'type' },
    { header: 'Description', accessorKey: 'description' },
    { header: 'Scheduled Date', accessorKey: 'scheduledDate', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '-' },
    { header: 'Completed Date', accessorKey: 'completedDate', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '-' },
    { header: 'Cost', accessorKey: 'cost', cell: info => info.getValue() ? Number(info.getValue()).toLocaleString(undefined, { style: 'currency', currency: 'KWD' }) : '-' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Downtime (hrs)', accessorKey: 'downtimeHours' },
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
    data: maintenance,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Filtered maintenance
  const filteredMaintenance = useMemo(() => {
    return maintenance.filter(m => {
      if (filterAsset && (typeof m.asset === 'object' ? m.asset._id : m.asset) !== filterAsset) return false;
      if (filterType && m.type !== filterType) return false;
      if (filterStatus && m.status !== filterStatus) return false;
      if (filterFrom && new Date(m.scheduledDate) < new Date(filterFrom)) return false;
      if (filterTo && new Date(m.scheduledDate) > new Date(filterTo)) return false;
      return true;
    });
  }, [maintenance, filterAsset, filterType, filterStatus, filterFrom, filterTo]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Asset', 'Type', 'Description', 'Scheduled Date', 'Completed Date', 'Cost', 'Status', 'Downtime (hrs)'];
    const rows = filteredMaintenance.map(m => [
      typeof m.asset === 'object' ? m.asset.name : m.asset,
      m.type,
      m.description,
      m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : '',
      m.completedDate ? new Date(m.completedDate).toLocaleDateString() : '',
      m.cost,
      m.status,
      m.downtimeHours,
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maintenance.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // Print
  const handlePrint = () => {
    window.print();
  };

  // Chart data
  const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#6d4c41', '#0288d1'];
  const costDowntimeData = useMemo(() => {
    // Group by month
    const map: Record<string, { cost: number; downtime: number }> = {};
    filteredMaintenance.forEach(m => {
      const d = m.completedDate || m.scheduledDate;
      if (!d) return;
      const key = new Date(d).toISOString().slice(0, 7);
      if (!map[key]) map[key] = { cost: 0, downtime: 0 };
      map[key].cost += m.cost ? Number(m.cost) : 0;
      map[key].downtime += m.downtimeHours ? Number(m.downtimeHours) : 0;
    });
    return Object.entries(map).map(([month, v]) => ({ month, ...v }));
  }, [filteredMaintenance]);
  const typeData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMaintenance.forEach(m => { map[m.type] = (map[m.type] || 0) + 1; });
    return Object.entries(map).map(([type, count]) => ({ name: type, value: count }));
  }, [filteredMaintenance]);
  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredMaintenance.forEach(m => { map[m.status] = (map[m.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({ name: status, value: count }));
  }, [filteredMaintenance]);

  // Summary calculations
  const totalCost = maintenance.reduce((sum, m) => sum + (m.cost ? Number(m.cost) : 0), 0);
  const totalDowntime = maintenance.reduce((sum, m) => sum + (m.downtimeHours ? Number(m.downtimeHours) : 0), 0);

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Maintenance</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add Maintenance
        </Button>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Maintenance Events</Typography>
            <Typography variant="h5">{maintenance.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Cost</Typography>
            <Typography variant="h5">{totalCost.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Downtime (hrs)</Typography>
            <Typography variant="h5">{totalDowntime}</Typography>
          </CardContent>
        </Card>
      </Box>
      {/* Filters and export/print */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField select label="Asset" value={filterAsset} onChange={e => setFilterAsset(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All Assets</MenuItem>
          {assets.map(a => <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>)}
        </TextField>
        <TextField select label="Type" value={filterType} onChange={e => setFilterType(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="preventive">Preventive</MenuItem>
          <MenuItem value="corrective">Corrective</MenuItem>
        </TextField>
        <TextField select label="Status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="scheduled">Scheduled</MenuItem>
          <MenuItem value="in_progress">In Progress</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>
        <TextField label="From" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} sx={{ minWidth: 140 }} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} sx={{ minWidth: 140 }} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={handleExportCSV}>Export CSV</Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
      </Box>
      {/* Charts */}
      <Box display="flex" gap={4} mb={3} flexWrap="wrap">
        <Paper sx={{ p: 2, minWidth: 320, flex: 1 }}>
          <Typography variant="subtitle1">Cost & Downtime Over Time</Typography>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={costDowntimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cost" fill="#1976d2" name="Cost" />
              <Bar dataKey="downtime" fill="#d32f2f" name="Downtime (hrs)" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 320, flex: 1 }}>
          <Typography variant="subtitle1">Maintenance by Type</Typography>
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
          <Typography variant="subtitle1">Maintenance by Status</Typography>
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
      {/* Table */}
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
              .filter(row => filteredMaintenance.includes(row.original))
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
        <DialogTitle>{editingId ? 'Edit Maintenance' : 'Add Maintenance'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField select label="Asset" name="asset" value={form.asset} onChange={handleFormChange} required fullWidth>
              <MenuItem value="">Select Asset</MenuItem>
              {assets.map((a: any) => (
                <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Type" name="type" value={form.type} onChange={handleFormChange} required fullWidth select>
              <MenuItem value="preventive">Preventive</MenuItem>
              <MenuItem value="corrective">Corrective</MenuItem>
            </TextField>
            <TextField label="Description" name="description" value={form.description} onChange={handleFormChange} required fullWidth />
            <TextField label="Scheduled Date" name="scheduledDate" value={form.scheduledDate} onChange={handleFormChange} type="date" InputLabelProps={{ shrink: true }} required fullWidth />
            <TextField label="Completed Date" name="completedDate" value={form.completedDate} onChange={handleFormChange} type="date" InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Cost" name="cost" value={form.cost} onChange={handleFormChange} type="number" fullWidth />
            <TextField label="Status" name="status" value={form.status} onChange={handleFormChange} required fullWidth select>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
            <TextField label="Downtime (hrs)" name="downtimeHours" value={form.downtimeHours} onChange={handleFormChange} type="number" fullWidth />
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
        <DialogTitle>Delete Maintenance</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this maintenance record?</Typography>
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

export default MaintenancePage; 
