import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Paper, TextField, MenuItem, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PrintIcon from '@mui/icons-material/Print';

interface InventoryTransaction {
  _id: string;
  item: { _id: string; name: string; type: string } | string;
  type: 'inbound' | 'outbound' | 'adjustment';
  quantity: number;
  date: string;
  relatedAsset?: { _id: string; name: string } | string;
  relatedMaintenance?: { _id: string; description: string } | string;
  user?: { _id: string; email: string } | string;
  notes?: string;
}

const typeOptions = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
  { value: 'adjustment', label: 'Adjustment' },
];

const InventoryTransactionsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterItem, setFilterItem] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    item: '',
    type: '',
    quantity: '',
    date: '',
    relatedAsset: '',
    relatedMaintenance: '',
    user: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchItems();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<InventoryTransaction[]>('/api/inventory/transactions');
      setTransactions(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };
  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/inventory/items');
      setItems(res.data as any[]);
    } catch {}
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (filterItem && (typeof t.item === 'object' ? t.item._id : t.item) !== filterItem) return false;
      if (filterType && t.type !== filterType) return false;
      if (filterFrom && new Date(t.date) < new Date(filterFrom)) return false;
      if (filterTo && new Date(t.date) > new Date(filterTo)) return false;
      return true;
    });
  }, [transactions, filterItem, filterType, filterFrom, filterTo]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Item', 'Type', 'Quantity', 'Date', 'Related Asset', 'Related Maintenance', 'User', 'Notes'];
    const rows = filteredTransactions.map(t => [
      typeof t.item === 'object' ? t.item.name : t.item,
      t.type,
      t.quantity,
      t.date ? new Date(t.date).toLocaleDateString() : '',
      typeof t.relatedAsset === 'object' ? t.relatedAsset.name : t.relatedAsset,
      typeof t.relatedMaintenance === 'object' ? t.relatedMaintenance.description : t.relatedMaintenance,
      typeof t.user === 'object' ? t.user.email : t.user,
      t.notes,
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory_transactions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // Print
  const handlePrint = () => {
    window.print();
  };

  // Add Transaction handlers
  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({
      item: '',
      type: '',
      quantity: '',
      date: '',
      relatedAsset: '',
      relatedMaintenance: '',
      user: '',
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
      await axios.post('/api/inventory/transactions', {
        ...form,
        quantity: Number(form.quantity),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Transaction added successfully!');
      fetchTransactions();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Inventory Transactions</Typography>
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add Transaction
        </Button>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Transactions</Typography>
            <Typography variant="h5">{transactions.length}</Typography>
          </CardContent>
        </Card>
      </Box>
      <Box display="flex" gap={2} mb={2}>
        <TextField select label="Item" value={filterItem} onChange={e => setFilterItem(e.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All Items</MenuItem>
          {items.map(i => <MenuItem key={i._id} value={i._id}>{i.name}</MenuItem>)}
        </TextField>
        <TextField select label="Type" value={filterType} onChange={e => setFilterType(e.target.value)} sx={{ minWidth: 140 }}>
          <MenuItem value="">All Types</MenuItem>
          {typeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
        </TextField>
        <TextField label="From" type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} sx={{ minWidth: 140 }} InputLabelProps={{ shrink: true }} />
        <TextField label="To" type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} sx={{ minWidth: 140 }} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={handleExportCSV}>Export CSV</Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
      </Box>
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Item</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Type</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Quantity</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Date</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Related Asset</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Related Maintenance</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>User</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t, idx) => (
              <tr key={t._id} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{typeof t.item === 'object' ? t.item.name : t.item}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{t.type}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{t.quantity}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{t.date ? new Date(t.date).toLocaleDateString() : ''}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{typeof t.relatedAsset === 'object' ? t.relatedAsset.name : t.relatedAsset || '-'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{typeof t.relatedMaintenance === 'object' ? t.relatedMaintenance.description : t.relatedMaintenance || '-'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{typeof t.user === 'object' ? t.user.email : t.user || '-'}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{t.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <Typography align="center" sx={{ mt: 2 }}>Loading...</Typography>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      {/* Add Transaction Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Add Transaction</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Item" name="item" value={form.item} onChange={handleFormChange} required fullWidth select>
              <MenuItem value="">Select Item</MenuItem>
              {items.map(i => <MenuItem key={i._id} value={i._id}>{i.name}</MenuItem>)}
            </TextField>
            <TextField label="Type" name="type" value={form.type} onChange={handleFormChange} required fullWidth select>
              <MenuItem value="">Select Type</MenuItem>
              {typeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </TextField>
            <TextField label="Quantity" name="quantity" value={form.quantity} onChange={handleFormChange} required fullWidth type="number" />
            <TextField label="Date" name="date" value={form.date} onChange={handleFormChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            <TextField label="Related Asset" name="relatedAsset" value={form.relatedAsset} onChange={handleFormChange} fullWidth />
            <TextField label="Related Maintenance" name="relatedMaintenance" value={form.relatedMaintenance} onChange={handleFormChange} fullWidth />
            <TextField label="User" name="user" value={form.user} onChange={handleFormChange} fullWidth />
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

export default InventoryTransactionsPage;