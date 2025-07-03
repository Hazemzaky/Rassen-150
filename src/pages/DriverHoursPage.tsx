import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Paper, Snackbar, Alert, MenuItem, Card, CardContent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { SaveAlt, Print } from '@mui/icons-material';

interface DriverHour {
  _id: string;
  employee: { _id: string; name: string } | string;
  project: { _id: string; name: string } | string;
  date: string;
  hours: number;
  cost: number;
}

const defaultForm = {
  employee: '',
  project: '',
  date: '',
  hours: '',
  cost: '',
};

const DriverHoursPage: React.FC = () => {
  const [driverHours, setDriverHours] = useState<DriverHour[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
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
    fetchDriverHours();
    fetchProjects();
    fetchEmployees();
  }, [filterProject]);

  const fetchDriverHours = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<DriverHour[]>('/api/driver-hours', { params: filterProject ? { project: filterProject } : {} });
      setDriverHours(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch driver hours');
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
  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data as any[]);
    } catch {}
  };

  const handleOpen = (entry?: DriverHour) => {
    if (entry) {
      setEditingId(entry._id);
      setForm({
        employee: typeof entry.employee === 'object' ? entry.employee._id : entry.employee || '',
        project: typeof entry.project === 'object' ? entry.project._id : entry.project || '',
        date: entry.date ? entry.date.slice(0, 10) : '',
        hours: entry.hours.toString(),
        cost: entry.cost.toString(),
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
        await axios.put(`/api/driver-hours/${editingId}`, {
          ...form,
          hours: Number(form.hours),
          cost: Number(form.cost),
        });
        setSuccess('Driver hour updated!');
      } else {
        await axios.post('/api/driver-hours', {
          ...form,
          hours: Number(form.hours),
          cost: Number(form.cost),
        });
        setSuccess('Driver hour created!');
      }
      fetchDriverHours();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save driver hour');
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/driver-hours/${deleteId}`);
      setSuccess('Driver hour deleted!');
      fetchDriverHours();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete driver hour');
    } finally {
      setDeleteId(null);
    }
  };

  const columns = useMemo<ColumnDef<DriverHour>[]>(() => [
    { header: 'Employee', accessorKey: 'employee', cell: info => typeof info.getValue() === 'object' ? (info.getValue() as any)?.name : info.getValue() },
    { header: 'Project', accessorKey: 'project', cell: info => typeof info.getValue() === 'object' ? (info.getValue() as any)?.name : info.getValue() },
    { header: 'Date', accessorKey: 'date', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '-' },
    { header: 'Hours', accessorKey: 'hours' },
    { header: 'Cost', accessorKey: 'cost', cell: info => Number(info.getValue()).toLocaleString(undefined, { style: 'currency', currency: 'KWD' }) },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Box display="flex" gap={1}>
          <IconButton color="primary" onClick={() => handleOpen(row.original)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => setDeleteId(row.original._id)}><DeleteIcon /></IconButton>
        </Box>
      ),
    },
  ], [projects, employees]);

  const table = useReactTable({
    data: driverHours,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Summary calculations
  const totalHours = driverHours.reduce((sum, entry) => sum + Number(entry.hours), 0);
  const totalCost = driverHours.reduce((sum, entry) => sum + Number(entry.cost), 0);
  const avgCostPerHour = totalHours ? totalCost / totalHours : 0;

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (!search.trim()) return driverHours;
    const s = search.trim().toLowerCase();
    return driverHours.filter(entry =>
      (typeof entry.employee === 'object' ? entry.employee.name : entry.employee || '').toLowerCase().includes(s) ||
      (typeof entry.project === 'object' ? entry.project.name : entry.project || '').toLowerCase().includes(s) ||
      (entry.date ? new Date(entry.date).toLocaleDateString().toLowerCase() : '').includes(s)
    );
  }, [driverHours, search]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Employee', 'Project', 'Date', 'Hours', 'Cost'];
    const rows = filteredEntries.map(entry => [
      typeof entry.employee === 'object' ? entry.employee.name : entry.employee || '',
      typeof entry.project === 'object' ? entry.project.name : entry.project || '',
      entry.date ? new Date(entry.date).toLocaleDateString() : '',
      entry.hours,
      entry.cost,
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'driver_hours.csv';
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
            <Typography variant="subtitle1">Total Hours</Typography>
            <Typography variant="h5">{totalHours.toLocaleString()}</Typography>
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
            <Typography variant="subtitle1">Avg. Cost per Hour</Typography>
            <Typography variant="h5">{avgCostPerHour.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
          </CardContent>
        </Card>
      </Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Driver Hours</Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<SaveAlt />} onClick={handleExportCSV}>Export CSV</Button>
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>Print</Button>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Add Driver Hour
          </Button>
        </Box>
      </Box>
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          label="Search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search employee, project, or date"
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
              .filter(row => filteredEntries.includes(row.original))
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
        <DialogTitle>{editingId ? 'Edit Driver Hour' : 'Add Driver Hour'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField select label="Employee" name="employee" value={form.employee} onChange={handleFormChange} required fullWidth>
              <MenuItem value="">Select Employee</MenuItem>
              {employees.map((e: any) => (
                <MenuItem key={e._id} value={e._id}>{e.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Project" name="project" value={form.project} onChange={handleFormChange} required fullWidth>
              <MenuItem value="">Select Project</MenuItem>
              {projects.map((p: any) => (
                <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
              ))}
            </TextField>
            <TextField label="Date" name="date" value={form.date} onChange={handleFormChange} type="date" InputLabelProps={{ shrink: true }} required fullWidth />
            <TextField label="Hours" name="hours" value={form.hours} onChange={handleFormChange} type="number" required fullWidth />
            <TextField label="Cost" name="cost" value={form.cost} onChange={handleFormChange} type="number" required fullWidth />
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
        <DialogTitle>Delete Driver Hour</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this driver hour entry?</Typography>
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

export default DriverHoursPage; 