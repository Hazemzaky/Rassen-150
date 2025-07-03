import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Chip, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

interface Employee {
  _id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  benefits: { type: string; value: number }[];
  leaveBalance: number;
  active: boolean;
  hireDate: string;
  terminationDate?: string;
}

const benefitOptions = [
  'Health Insurance',
  'Housing Allowance',
  'Transport Allowance',
  'Bonus',
  'Retirement Plan',
  'Meal Allowance',
  'Education Allowance',
  'Other',
];

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    salary: '',
    benefits: [] as { type: string; value: number }[],
    leaveBalance: '',
    hireDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Employee[]>('/api/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data as Employee[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    let data = employees;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(e =>
        e.name.toLowerCase().includes(s) ||
        e.email.toLowerCase().includes(s) ||
        e.position.toLowerCase().includes(s) ||
        e.department.toLowerCase().includes(s)
      );
    }
    return data;
  }, [employees, search]);

  const handleOpen = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee._id);
      setForm({
        name: employee.name,
        email: employee.email,
        position: employee.position,
        department: employee.department,
        salary: String(employee.salary),
        benefits: employee.benefits || [],
        leaveBalance: String(employee.leaveBalance),
        hireDate: employee.hireDate.slice(0, 10),
      });
    } else {
      setEditingId(null);
      setForm({ name: '', email: '', position: '', department: '', salary: '', benefits: [], leaveBalance: '', hireDate: '' });
    }
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    setForm({ name: '', email: '', position: '', department: '', salary: '', benefits: [], leaveBalance: '', hireDate: '' });
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  const handleBenefitsChange = (event: any) => {
    const { value } = event.target;
    setForm((prev) => {
      const newBenefits = (typeof value === 'string' ? value.split(',') : value).map((type: string) => {
        const existing = prev.benefits.find((b) => b.type === type);
        return existing ? existing : { type, value: 0 };
      });
      return { ...prev, benefits: newBenefits };
    });
  };
  const handleBenefitValueChange = (type: string, newValue: number) => {
    setForm((prev) => ({
      ...prev,
      benefits: prev.benefits.map((b) => b.type === type ? { ...b, value: newValue } : b),
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`/api/employees/${editingId}`, {
          ...form,
          salary: Number(form.salary),
          leaveBalance: Number(form.leaveBalance),
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Employee updated successfully!');
      } else {
        await axios.post('/api/employees', {
          ...form,
          salary: Number(form.salary),
          leaveBalance: Number(form.leaveBalance),
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Employee created successfully!');
      }
      fetchEmployees();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeactivate = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/employees/${id}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Employee deactivated!');
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate employee');
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Employees</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add Employee
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name, email, position, or department"
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
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Salary</TableCell>
                  <TableCell>Benefits</TableCell>
                  <TableCell>Leave Balance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Hire Date</TableCell>
                  <TableCell>Termination Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEmployees.map((e, idx) => (
                  <TableRow key={e._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>{e.email}</TableCell>
                    <TableCell>{e.position}</TableCell>
                    <TableCell>{e.department}</TableCell>
                    <TableCell>{e.salary.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                    <TableCell>
                      {Array.isArray(e.benefits) && e.benefits.length > 0
                        ? e.benefits.map((b, i) => <Chip key={b.type + i} label={`${b.type}: ${b.value}`} size="small" sx={{ mr: 0.5 }} />)
                        : '-'}
                    </TableCell>
                    <TableCell>{e.leaveBalance}</TableCell>
                    <TableCell>
                      {e.active ? <Chip label="Active" color="success" size="small" /> : <Chip label="Inactive" color="default" size="small" />}
                    </TableCell>
                    <TableCell>{new Date(e.hireDate).toLocaleDateString()}</TableCell>
                    <TableCell>{e.terminationDate ? new Date(e.terminationDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => handleOpen(e)} sx={{ mr: 1 }}>Edit</Button>
                      {e.active && (
                        <Button size="small" variant="outlined" color="error" onClick={() => handleDeactivate(e._id)}>
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
            <TextField label="Email" name="email" value={form.email} onChange={handleFormChange} required fullWidth type="email" />
            <TextField label="Position" name="position" value={form.position} onChange={handleFormChange} required fullWidth />
            <TextField label="Department" name="department" value={form.department} onChange={handleFormChange} required fullWidth />
            <TextField label="Salary" name="salary" value={form.salary} onChange={handleFormChange} required fullWidth type="number" />
            <TextField
              select
              label="Benefits"
              name="benefits"
              value={form.benefits.map((b) => b.type)}
              onChange={handleBenefitsChange}
              SelectProps={{
                multiple: true,
                renderValue: (selected) => (selected as string[]).join(', '),
              }}
              fullWidth
              sx={{ mt: 2 }}
            >
              {benefitOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            {form.benefits.map((b) => (
              <TextField
                key={b.type}
                label={`Value for ${b.type}`}
                type="number"
                value={b.value}
                onChange={e => handleBenefitValueChange(b.type, Number(e.target.value))}
                fullWidth
                sx={{ mt: 1 }}
                required
              />
            ))}
            <TextField label="Leave Balance" name="leaveBalance" value={form.leaveBalance} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Hire Date" name="hireDate" value={form.hireDate} onChange={handleFormChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>{editingId ? 'Update' : 'Create'}</Button>
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

export default EmployeesPage; 