import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, IconButton, Paper, Snackbar, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from '@tanstack/react-table';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface Project {
  _id: string;
  name: string;
  customer?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  description?: string;
  revenue?: number;
  notes?: string;
}

const defaultForm = {
  name: '',
  customer: '',
  startDate: '',
  endDate: '',
  status: 'active',
  description: '',
  revenue: '',
  notes: '',
};

const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<Project[]>('/api/projects');
      setProjects(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (project?: Project) => {
    if (project) {
      setEditingId(project._id);
      setForm({
        name: project.name,
        customer: project.customer || '',
        startDate: project.startDate ? project.startDate.slice(0, 10) : '',
        endDate: project.endDate ? project.endDate.slice(0, 10) : '',
        status: project.status || 'active',
        description: project.description || '',
        revenue: project.revenue?.toString() || '',
        notes: project.notes || '',
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
        await axios.put(`/api/projects/${editingId}`, {
          ...form,
          revenue: form.revenue ? Number(form.revenue) : undefined,
        });
        setSuccess('Project updated!');
      } else {
        await axios.post('/api/projects', {
          ...form,
          revenue: form.revenue ? Number(form.revenue) : undefined,
        });
        setSuccess('Project created!');
      }
      fetchProjects();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save project');
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/projects/${deleteId}`);
      setSuccess('Project deleted!');
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleteId(null);
    }
  };
  const handleShowDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetails(null);
    try {
      const res = await axios.get(`/api/projects/${id}/profitability`);
      setDetails(res.data);
    } catch (err: any) {
      setDetails({ error: err.response?.data?.message || 'Failed to fetch details' });
    }
  };

  // TanStack Table setup
  const columns = useMemo<ColumnDef<Project>[]>(() => [
    { header: 'Name', accessorKey: 'name' },
    { header: 'Customer', accessorKey: 'customer' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Start Date', accessorKey: 'startDate', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '-' },
    { header: 'End Date', accessorKey: 'endDate', cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '-' },
    { header: 'Revenue', accessorKey: 'revenue', cell: info => info.getValue() ? Number(info.getValue()).toLocaleString(undefined, { style: 'currency', currency: 'KWD' }) : '-' },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Box display="flex" gap={1}>
          <IconButton color="primary" onClick={() => handleOpen(row.original)}><EditIcon /></IconButton>
          <IconButton color="error" onClick={() => setDeleteId(row.original._id)}><DeleteIcon /></IconButton>
          <Button size="small" variant="outlined" onClick={() => handleShowDetails(row.original._id)}>Details</Button>
        </Box>
      ),
    },
  ], []);

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Projects / Contracts</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Add Project
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
            {table.getRowModel().rows.map(row => (
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
        <DialogTitle>{editingId ? 'Edit Project' : 'Add Project'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
            <TextField label="Customer" name="customer" value={form.customer} onChange={handleFormChange} fullWidth />
            <TextField label="Start Date" name="startDate" value={form.startDate} onChange={handleFormChange} type="date" InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="End Date" name="endDate" value={form.endDate} onChange={handleFormChange} type="date" InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Status" name="status" value={form.status} onChange={handleFormChange} fullWidth select>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </TextField>
            <TextField label="Revenue" name="revenue" value={form.revenue} onChange={handleFormChange} type="number" fullWidth />
            <TextField label="Description" name="description" value={form.description} onChange={handleFormChange} fullWidth multiline minRows={2} />
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
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this project?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Project Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Project Profitability</DialogTitle>
        <DialogContent>
          {details ? details.error ? (
            <Alert severity="error">{details.error}</Alert>
          ) : (
            <Box>
              <Typography>Revenue: {details.revenue?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
              <Typography>Expenses: {details.expenses?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
              <Typography>Payroll: {details.payroll?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
              <Typography>Fuel: {details.fuel?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
              <Typography>Driver Hours: {details.driverHours?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
              <Typography>Total Cost: {details.totalCost?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
              <Typography fontWeight={700} color={details.profit >= 0 ? 'success.main' : 'error.main'}>
                Profit: {details.profit?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}
              </Typography>
              <Box mt={3}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={[
                    { name: 'Revenue', value: details.revenue },
                    { name: 'Expenses', value: details.expenses },
                    { name: 'Payroll', value: details.payroll },
                    { name: 'Fuel', value: details.fuel },
                    { name: 'Driver Hours', value: details.driverHours },
                    { name: 'Profit', value: details.profit },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
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

export default ProjectsPage; 