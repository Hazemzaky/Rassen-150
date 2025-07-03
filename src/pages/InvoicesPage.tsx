import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Card, CardContent, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, TextField, InputAdornment, IconButton, Chip, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

interface Invoice {
  _id: string;
  recipient: { name: string; email: string };
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  totalAmount: number;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  uploadedBy?: any;
  fileUrl?: string;
}

type SortKey = 'dueDate' | 'totalAmount' | 'status' | '';
type SortOrder = 'asc' | 'desc';

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  sent: 'primary',
  paid: 'success',
  overdue: 'error',
};

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    recipientName: '',
    recipientEmail: '',
    dueDate: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Invoice[]>('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  // Sorting and filtering
  const filteredInvoices = useMemo(() => {
    let data = invoices;
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      data = data.filter(inv =>
        (inv.recipient?.name?.toLowerCase().includes(s) || '') ||
        (inv.recipient?.email?.toLowerCase().includes(s) || '') ||
        inv.status.toLowerCase().includes(s)
      );
    }
    if (sortKey) {
      data = [...data].sort((a, b) => {
        let aVal: any = a[sortKey];
        let bVal: any = b[sortKey];
        if (sortKey === 'dueDate') {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [invoices, search, sortKey, sortOrder]);

  // Currency formatter
  const formatCurrency = (amount: number) =>
    amount.toLocaleString(undefined, { style: 'currency', currency: 'KWD' });

  // Sorting handlers
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Mark as paid
  const handleMarkPaid = async (id: string) => {
    setMarkingPaid(id);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/invoices/${id}/status`, { status: 'paid' }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Invoice marked as paid!');
      fetchInvoices();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update invoice');
    } finally {
      setMarkingPaid(null);
    }
  };

  // Add Invoice handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      recipientName: '',
      recipientEmail: '',
      dueDate: '',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLineItemChange = (idx: number, field: string, value: any) => {
    const newLineItems = [...form.lineItems];
    newLineItems[idx] = { ...newLineItems[idx], [field]: value };
    // Update total for this line
    newLineItems[idx].total = Number(newLineItems[idx].quantity) * Number(newLineItems[idx].unitPrice);
    setForm({ ...form, lineItems: newLineItems });
  };

  const handleAddLineItem = () => {
    setForm({ ...form, lineItems: [...form.lineItems, { description: '', quantity: 1, unitPrice: 0, total: 0 }] });
  };

  const handleRemoveLineItem = (idx: number) => {
    const newLineItems = form.lineItems.filter((_, i) => i !== idx);
    setForm({ ...form, lineItems: newLineItems });
  };

  const totalAmount = form.lineItems.reduce((sum, item) => sum + Number(item.total), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/invoices', {
        recipient: { name: form.recipientName, email: form.recipientEmail },
        dueDate: form.dueDate,
        lineItems: form.lineItems,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Invoice created successfully!');
      fetchInvoices();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3} mb={3}>
        <Box flex={1} mb={{ xs: 2, md: 0 }}>
          <Card sx={{ background: '#1976d2', color: '#fff' }}>
            <CardContent>
              <Typography variant="h6">Total Invoices</Typography>
              <Typography variant="h4">{invoices.length}</Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={2} display="flex" alignItems="center" justifyContent="flex-end" gap={2}>
          <TextField
            size="small"
            placeholder="Search by recipient or status"
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
            Add Invoice
          </Button>
        </Box>
      </Box>
      <Paper sx={{ mt: 2, p: 2, overflowX: 'auto' }}>
        <Typography variant="h5" gutterBottom>Invoices</Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 500 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Recipient</TableCell>
                  <TableCell>
                    <span style={{ cursor: 'pointer', fontWeight: 700 }} onClick={() => handleSort('dueDate')}>
                      Due Date {sortKey === 'dueDate' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ cursor: 'pointer', fontWeight: 700 }} onClick={() => handleSort('totalAmount')}>
                      Total {sortKey === 'totalAmount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </span>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((inv, idx) => (
                  <TableRow key={inv._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{inv._id.slice(-6).toUpperCase()}</TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{inv.recipient?.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{inv.recipient?.email}</Typography>
                    </TableCell>
                    <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{formatCurrency(Number(inv.totalAmount))}</TableCell>
                    <TableCell>
                      <Chip label={inv.status} color={statusColors[inv.status]} size="small" sx={{ textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        color="success"
                        size="small"
                        disabled={inv.status === 'paid' || markingPaid === inv._id}
                        onClick={() => handleMarkPaid(inv._id)}
                        sx={{ mr: 1 }}
                      >
                        {markingPaid === inv._id ? 'Marking...' : 'Mark as Paid'}
                      </Button>
                      {/* View details button could open a modal in the future */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Invoice</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box display="flex" gap={2}>
              <TextField label="Recipient Name" name="recipientName" value={form.recipientName} onChange={handleFormChange} required fullWidth />
              <TextField label="Recipient Email" name="recipientEmail" value={form.recipientEmail} onChange={handleFormChange} required fullWidth type="email" />
              <TextField label="Due Date" name="dueDate" value={form.dueDate} onChange={handleFormChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={600} mt={2}>Line Items</Typography>
            {form.lineItems.map((item, idx) => (
              <Box key={idx} display="flex" gap={2} alignItems="center" mb={1}>
                <TextField label="Description" value={item.description} onChange={e => handleLineItemChange(idx, 'description', e.target.value)} required fullWidth />
                <TextField label="Quantity" type="number" value={item.quantity} onChange={e => handleLineItemChange(idx, 'quantity', Number(e.target.value))} required sx={{ maxWidth: 120 }} />
                <TextField label="Unit Price" type="number" value={item.unitPrice} onChange={e => handleLineItemChange(idx, 'unitPrice', Number(e.target.value))} required sx={{ maxWidth: 140 }} />
                <TextField label="Total" value={item.total} InputProps={{ readOnly: true }} sx={{ maxWidth: 140 }} />
                <IconButton color="error" onClick={() => handleRemoveLineItem(idx)} disabled={form.lineItems.length === 1}>
                  <CloseIcon />
                </IconButton>
              </Box>
            ))}
            <Button onClick={handleAddLineItem} variant="outlined" color="primary" sx={{ width: 180, mb: 2 }}>Add Line Item</Button>
            <Typography variant="h6" align="right">Total: {totalAmount.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>Create Invoice</Button>
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

export default InvoicesPage;
