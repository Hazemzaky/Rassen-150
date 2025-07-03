import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Paper, Snackbar, Alert, MenuItem, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PrintIcon from '@mui/icons-material/Print';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';

interface FuelLog {
  _id: string;
  date: string;
  vehicle?: string;
  driver?: { _id: string; name: string } | string;
  liters: number;
  cost: number;
  project?: { _id: string; name: string } | string;
}

const defaultForm = {
  date: '',
  vehicle: '',
  driver: '',
  liters: '',
  cost: '',
  project: '',
};

const FuelLogsPage: React.FC = () => {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFuelLogs();
    fetchProjects();
    fetchDrivers();
  }, [filterProject]);

  const fetchFuelLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<FuelLog[]>('/api/fuel-logs', { params: filterProject ? { project: filterProject } : {} });
      setFuelLogs(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch fuel logs');
    } finally {
      setLoading(false);
    }
  };
  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      setProjects(res.data as any[]);
    } catch {}
  };
  const fetchDrivers = async () => {
    try {
      const res = await axios.get('/api/employees');
      setDrivers(res.data as any[]);
    } catch {}
  };

  const handleOpen = (log?: FuelLog) => {
    if (log) {
      setEditingId(log._id);
      setForm({
        date: log.date ? log.date.slice(0, 10) : '',
        vehicle: log.vehicle || '',
        driver: typeof log.driver === 'object' ? log.driver._id : log.driver || '',
        liters: log.liters.toString(),
        cost: log.cost.toString(),
        project: typeof log.project === 'object' ? log.project._id : log.project || '',
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
        await axios.put(`/api/fuel-logs/${editingId}`, {
          ...form,
          liters: Number(form.liters),
          cost: Number(form.cost),
        });
        setSuccess('Fuel log updated!');
      } else {
        await axios.post('/api/fuel-logs', {
          ...form,
          liters: Number(form.liters),
          cost: Number(form.cost),
        });
        setSuccess('Fuel log created!');
      }
      fetchFuelLogs();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save fuel log');
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/fuel-logs/${deleteId}`);
      setSuccess('Fuel log deleted!');
      fetchFuelLogs();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete fuel log');
    } finally {
      setDeleteId(null);
    }
  };

  const columns = useMemo<ColumnDef<FuelLog>[]>(() => [
    { header: 'Date', accessorKey: 'date', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '-' },
    { header: 'Vehicle', accessorKey: 'vehicle' },
    { header: 'Driver', accessorKey: 'driver', cell: info => typeof info.getValue() === 'object' ? (info.getValue() as any)?.name : info.getValue() },
    { header: 'Liters', accessorKey: 'liters' },
    { header: 'Cost', accessorKey: 'cost', cell: info => Number(info.getValue()).toLocaleString(undefined, { style: 'currency', currency: 'KWD' }) },
    { header: 'Project', accessorKey: 'project', cell: info => typeof info.getValue() === 'object' ? (info.getValue() as any)?.name : info.getValue() },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Box display="flex" gap={1}>
          <IconButton color="primary" onClick={() => handleOpen(row.original)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => setDeleteId(row.original._id)}><DeleteIcon /></IconButton>
        </Box>
      ),
    },
  ], [projects, drivers]);

  const table = useReactTable({
    data: fuelLogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Summary calculations
  const totalLiters = fuelLogs.reduce((sum, log) => sum + Number(log.liters), 0);
  const totalCost = fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);
  const avgCostPerLiter = totalLiters ? totalCost / totalLiters : 0;

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (!search.trim()) return fuelLogs;
    const s = search.trim().toLowerCase();
    return fuelLogs.filter(log =>
      (log.vehicle || '').toLowerCase().includes(s) ||
      (typeof log.driver === 'object' ? log.driver.name : log.driver || '').toLowerCase().includes(s) ||
      (log.date ? new Date(log.date).toLocaleDateString().toLowerCase() : '').includes(s)
    );
  }, [fuelLogs, search]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Vehicle', 'Driver', 'Liters', 'Cost', 'Project'];
    const rows = filteredLogs.map(log => [
      log.date ? new Date(log.date).toLocaleDateString() : '',
      log.vehicle || '',
      typeof log.driver === 'object' ? log.driver.name : log.driver || '',
      log.liters,
      log.cost,
      typeof log.project === 'object' ? log.project.name : log.project || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fuel_logs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <Box p={3}>
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Liters</Typography>
            <Typography variant="h5">{totalLiters.toLocaleString()}</Typography>
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
            <Typography variant="subtitle1">Avg. Cost per Liter</Typography>
            <Typography variant="h5">{avgCostPerLiter.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
          </CardContent>
        </Card>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Fuel Logs</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={handleExportCSV}>Export CSV</Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Add Fuel Log
          </Button>
        </Box>
      </Box>
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vehicle, driver, or date"
          size="small"
          sx={{ minWidth: 220 }}
        />
        <TextField
          select
          label="Filter by Project"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All Projects</MenuItem>
          {projects.map(p => (
            <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
          ))}
        </TextField>
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
              .filter(row => filteredLogs.includes(row.original))
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
        <DialogTitle>{editingId ? 'Edit Fuel Log' : 'Add Fuel Log'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Date" name="date" value={form.date} onChange={handleFormChange} type="date" InputLabelProps={{ shrink: true }} required fullWidth />
            <TextField label="Vehicle" name="vehicle" value={form.vehicle} onChange={handleFormChange} fullWidth />
            <TextField select label="Driver" name="driver" value={form.driver} onChange={handleFormChange} required fullWidth>
              <MenuItem value="">Select Driver</MenuItem>
              {drivers.map((d: any) => (
                <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Liters" name="liters" value={form.liters} onChange={handleFormChange} type="number" required fullWidth />
            <TextField label="Cost" name="cost" value={form.cost} onChange={handleFormChange} type="number" required fullWidth />
            <TextField select label="Project" name="project" value={form.project} onChange={handleFormChange} required fullWidth>
              <MenuItem value="">Select Project</MenuItem>
              {projects.map((p: any) => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
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
        <DialogTitle>Delete Fuel Log</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this fuel log?</Typography>
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

export default FuelLogsPage; 