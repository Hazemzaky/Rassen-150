import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, IconButton, Collapse, TextField, MenuItem
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

interface EntryLine {
  account: string | { _id: string; [key: string]: any };
  debit: number;
  credit: number;
  description?: string;
}
interface Entry {
  _id: string;
  date: string;
  description: string;
  period: string;
  status: string;
  reference?: string;
  lines: EntryLine[];
}

interface Period {
  _id: string;
  period: string;
  closed: boolean;
}

const JournalEntriesPage: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<{ _id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    date: '',
    description: '',
    period: '',
    reference: '',
    lines: [{ account: '', debit: 0, credit: 0, description: '' }],
  });
  const [submitting, setSubmitting] = useState(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [periodLocked, setPeriodLocked] = useState(false);

  useEffect(() => {
    fetchEntries();
    fetchAccounts();
    fetchPeriods();
  }, []);

  useEffect(() => {
    if (form.period) {
      const found = periods.find(p => p.period === form.period);
      setPeriodLocked(!!(found && found.closed));
    } else {
      setPeriodLocked(false);
    }
  }, [form.period, periods]);

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Entry[]>('/api/journal-entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<{ _id: string; name: string }[]>('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(res.data as { _id: string; name: string }[]);
    } catch {}
  };

  const fetchPeriods = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Period[]>('/api/periods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPeriods(res.data);
    } catch {}
  };

  const handleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };
  const handleOpen = () => {
    setForm({
      date: '',
      description: '',
      period: '',
      reference: '',
      lines: [{ account: '', debit: 0, credit: 0, description: '' }],
    });
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setError('');
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleLineChange = (idx: number, field: string, value: any) => {
    const newLines = [...form.lines];
    newLines[idx] = { ...newLines[idx], [field]: value };
    setForm({ ...form, lines: newLines });
  };
  const handleAddLine = () => {
    setForm({ ...form, lines: [...form.lines, { account: '', debit: 0, credit: 0, description: '' }] });
  };
  const handleRemoveLine = (idx: number) => {
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) });
  };
  const totalDebit = form.lines.reduce((sum, l) => sum + Number(l.debit), 0);
  const totalCredit = form.lines.reduce((sum, l) => sum + Number(l.credit), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      setError('Debits and credits must be equal and non-zero.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/journal-entries', {
        ...form,
        createdBy: 'system',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Journal entry created!');
      fetchEntries();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Journal Entries</Typography>
        <Button variant="contained" color="primary" onClick={handleOpen} startIcon={<AddIcon />} disabled={periodLocked}>
          Add Entry
        </Button>
      </Box>
      {periodLocked && <Alert severity="warning" sx={{ mb: 2 }}>This period is locked and cannot be edited.</Alert>}
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
                  <TableCell />
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((e, idx) => (
                  <React.Fragment key={e._id}>
                    <TableRow sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleExpand(e._id)}>
                          {expanded === e._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{new Date(e.date).toLocaleDateString()}</TableCell>
                      <TableCell>{e.description}</TableCell>
                      <TableCell>{e.period}</TableCell>
                      <TableCell>{e.status}</TableCell>
                      <TableCell>{e.reference || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                        <Collapse in={expanded === e._id} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 2 }}>
                            <Typography variant="subtitle1" fontWeight={600}>Lines</Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Account</TableCell>
                                  <TableCell>Debit</TableCell>
                                  <TableCell>Credit</TableCell>
                                  <TableCell>Description</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {e.lines.map((l, i) => (
                                  <TableRow key={i}>
                                    <TableCell>
                                      {accounts.find(a => a._id === (typeof l.account === 'object' && l.account !== null ? l.account._id : l.account))?.name ||
                                       (typeof l.account === 'object' && l.account !== null ? l.account._id : l.account)}
                                    </TableCell>
                                    <TableCell>{l.debit}</TableCell>
                                    <TableCell>{l.credit}</TableCell>
                                    <TableCell>{l.description || '-'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Journal Entry</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Date" name="date" value={form.date} onChange={handleFormChange} required fullWidth type="date" InputLabelProps={{ shrink: true }} />
            <TextField label="Description" name="description" value={form.description} onChange={handleFormChange} required fullWidth />
            <TextField label="Period" name="period" value={form.period} onChange={handleFormChange} required fullWidth placeholder="e.g. 2024-Q2 or 2024-05" />
            <TextField label="Reference" name="reference" value={form.reference} onChange={handleFormChange} fullWidth />
            <Typography variant="subtitle1" fontWeight={600} mt={2}>Lines</Typography>
            {form.lines.map((line, idx) => (
              <Box key={idx} display="flex" gap={2} alignItems="center" mb={1}>
                <TextField
                  label="Account"
                  value={line.account}
                  onChange={e => handleLineChange(idx, 'account', e.target.value)}
                  required
                  select
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">Select Account</MenuItem>
                  {accounts.map(a => (
                    <MenuItem key={a._id} value={a._id}>{a.name}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Debit" type="number" value={line.debit} onChange={e => handleLineChange(idx, 'debit', Number(e.target.value))} required sx={{ maxWidth: 120 }} />
                <TextField label="Credit" type="number" value={line.credit} onChange={e => handleLineChange(idx, 'credit', Number(e.target.value))} required sx={{ maxWidth: 120 }} />
                <TextField label="Line Description" value={line.description} onChange={e => handleLineChange(idx, 'description', e.target.value)} sx={{ minWidth: 200 }} />
                <Button onClick={() => handleRemoveLine(idx)} color="error" disabled={form.lines.length === 1}>Remove</Button>
              </Box>
            ))}
            <Button onClick={handleAddLine} variant="outlined" color="primary" sx={{ width: 180, mb: 2 }}>Add Line</Button>
            <Typography variant="body2" color={isBalanced ? 'success.main' : 'error.main'}>
              Total Debit: {totalDebit} | Total Credit: {totalCredit} {isBalanced ? '(Balanced)' : '(Not Balanced)'}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting || !isBalanced}>Create Entry</Button>
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

export default JournalEntriesPage; 