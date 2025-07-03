import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Button, Card, CardContent, Typography, Paper, TextField, MenuItem, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import PrintIcon from '@mui/icons-material/Print';

interface InventoryItem {
  _id: string;
  name: string;
  type: 'spare' | 'tool' | 'consumable';
  sku?: string;
  quantity: number;
  unit: string;
  location?: string;
  rack?: string;
  aisle?: string;
  bin?: string;
  minStock?: number;
  maxStock?: number;
  cost?: number;
  supplier?: string;
  status: 'active' | 'inactive';
  notes?: string;
}

const typeOptions = [
  { value: 'spare', label: 'Spare Part' },
  { value: 'tool', label: 'Tool' },
  { value: 'consumable', label: 'Consumable' },
];

const InventoryRegisterPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<any>({
    name: '',
    type: '',
    sku: '',
    quantity: '',
    unit: '',
    location: '',
    rack: '',
    aisle: '',
    bin: '',
    minStock: '',
    maxStock: '',
    cost: '',
    supplier: '',
    status: 'active',
    notes: '',
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<InventoryItem[]>('/api/inventory/items');
      setItems(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: InventoryItem) => {
    if (item) {
      setEditing(item);
      setForm({ ...item });
    } else {
      setEditing(null);
      setForm({
        name: '', type: '', sku: '', quantity: '', unit: '', location: '', rack: '', aisle: '', bin: '', minStock: '', maxStock: '', cost: '', supplier: '', status: 'active', notes: '',
      });
    }
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setForm({
      name: '', type: '', sku: '', quantity: '', unit: '', location: '', rack: '', aisle: '', bin: '', minStock: '', maxStock: '', cost: '', supplier: '', status: 'active', notes: '',
    });
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await axios.put(`/api/inventory/items/${editing._id}`, { ...form, quantity: Number(form.quantity), minStock: Number(form.minStock), maxStock: Number(form.maxStock), cost: Number(form.cost) });
        setSuccess('Item updated!');
      } else {
        await axios.post('/api/inventory/items', { ...form, quantity: Number(form.quantity), minStock: Number(form.minStock), maxStock: Number(form.maxStock), cost: Number(form.cost) });
        setSuccess('Item added!');
      }
      fetchItems();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save item');
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/inventory/items/${id}`);
      setSuccess('Item deleted!');
      fetchItems();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const s = search.trim().toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(s) ||
      i.sku?.toLowerCase().includes(s) ||
      i.type.toLowerCase().includes(s) ||
      i.location?.toLowerCase().includes(s) ||
      i.rack?.toLowerCase().includes(s) ||
      i.aisle?.toLowerCase().includes(s) ||
      i.bin?.toLowerCase().includes(s) ||
      i.supplier?.toLowerCase().includes(s)
    );
  }, [items, search]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Type', 'SKU', 'Quantity', 'Unit', 'Location', 'Rack', 'Aisle', 'Bin', 'Min Stock', 'Max Stock', 'Cost', 'Supplier', 'Status', 'Notes'];
    const rows = filteredItems.map(i => [
      i.name, i.type, i.sku, i.quantity, i.unit, i.location, i.rack, i.aisle, i.bin, i.minStock, i.maxStock, i.cost, i.supplier, i.status, i.notes
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => `"${x ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  // Print
  const handlePrint = () => {
    window.print();
  };

  // Low stock alerts
  const lowStockItems = items.filter(i => i.minStock && i.quantity <= i.minStock);

  return (
    <Box p={3}>
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Total Items</Typography>
            <Typography variant="h5">{items.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 250px', minWidth: 250 }}>
          <CardContent>
            <Typography variant="subtitle1">Low Stock</Typography>
            <Typography variant="h5" color={lowStockItems.length > 0 ? 'error' : 'inherit'}>{lowStockItems.length}</Typography>
          </CardContent>
        </Card>
      </Box>
      <Box display="flex" gap={2} mb={2}>
        <TextField label="Search" value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 220 }} />
        <Button variant="outlined" startIcon={<SaveAltIcon />} onClick={handleExportCSV}>Export CSV</Button>
        <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen()}>Add Item</Button>
      </Box>
      {lowStockItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>Low stock: {lowStockItems.map(i => i.name).join(', ')}</Alert>
      )}
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Name</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Type</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>SKU</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Quantity</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Unit</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Location</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Rack</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Aisle</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Bin</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Min Stock</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Max Stock</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Cost</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Supplier</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Status</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Notes</th>
              <th style={{ padding: 8, borderBottom: '2px solid #eee', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((i, idx) => (
              <tr key={i._id} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.name}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.type}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.sku}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.quantity}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.unit}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.location}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.rack}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.aisle}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.bin}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.minStock}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.maxStock}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.cost}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.supplier}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.status}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{i.notes}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                  <IconButton color="primary" onClick={() => handleOpen(i)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(i._id)}><DeleteIcon /></IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <Typography align="center" sx={{ mt: 2 }}>Loading...</Typography>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editing ? 'Edit Item' : 'Add Item'}</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box display="flex" gap={2}>
              <TextField label="Name" name="name" value={form.name} onChange={handleFormChange} required fullWidth />
              <TextField select label="Type" name="type" value={form.type} onChange={handleFormChange} required fullWidth>
                <MenuItem value="">Select Type</MenuItem>
                {typeOptions.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
              </TextField>
              <TextField label="SKU" name="sku" value={form.sku} onChange={handleFormChange} fullWidth />
              <TextField label="Quantity" name="quantity" value={form.quantity} onChange={handleFormChange} type="number" required fullWidth />
              <TextField label="Unit" name="unit" value={form.unit} onChange={handleFormChange} required fullWidth />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Location (Room/Area)" name="location" value={form.location} onChange={handleFormChange} fullWidth />
              <TextField label="Rack" name="rack" value={form.rack} onChange={handleFormChange} fullWidth />
              <TextField label="Aisle" name="aisle" value={form.aisle} onChange={handleFormChange} fullWidth />
              <TextField label="Bin" name="bin" value={form.bin} onChange={handleFormChange} fullWidth />
            </Box>
            <Box display="flex" gap={2}>
              <TextField label="Min Stock" name="minStock" value={form.minStock} onChange={handleFormChange} type="number" fullWidth />
              <TextField label="Max Stock" name="maxStock" value={form.maxStock} onChange={handleFormChange} type="number" fullWidth />
              <TextField label="Cost" name="cost" value={form.cost} onChange={handleFormChange} type="number" fullWidth />
              <TextField label="Supplier" name="supplier" value={form.supplier} onChange={handleFormChange} fullWidth />
            </Box>
            <TextField label="Notes" name="notes" value={form.notes} onChange={handleFormChange} fullWidth multiline minRows={2} />
            <TextField select label="Status" name="status" value={form.status} onChange={handleFormChange} required fullWidth>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">{editing ? 'Update' : 'Add'}</Button>
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

export default InventoryRegisterPage; 