import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Card, CardContent, Snackbar, Alert, TextField, MenuItem, Button
} from '@mui/material';
import axios from 'axios';

interface LedgerEntry {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  entryId: string;
  reference?: string;
}
interface Account {
  _id: string;
  name: string;
  code: string;
}

const GeneralLedgerPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [period, setPeriod] = useState('');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Account[]>('/api/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Explicitly type the response as Account[]
      setAccounts(res.data as Account[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch accounts');
    }
  };

  const fetchLedger = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params: any = { accountId: selectedAccount };
      if (period) params.period = period;
      const res = await axios.get<LedgerEntry[]>('/api/accounts/general-ledger', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      // Explicitly type the response as LedgerEntry[]
      setLedger(res.data as LedgerEntry[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>General Ledger</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <TextField
              select
              label="Account"
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              sx={{ minWidth: 250 }}
            >
              <MenuItem value="">Select Account</MenuItem>
              {accounts.map(a => (
                <MenuItem key={a._id} value={a._id}>{a.name} ({a.code})</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Period"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              placeholder="e.g. 2024-Q2 or 2024-05"
              sx={{ minWidth: 180 }}
            />
            <Button variant="contained" color="primary" onClick={fetchLedger} disabled={!selectedAccount}>
              Load Ledger
            </Button>
          </Box>
        </CardContent>
      </Card>
      <Paper sx={{ p: 2, overflowX: 'auto' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : ledger.length > 0 ? (
          <TableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Debit</TableCell>
                  <TableCell>Credit</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Reference</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledger.map((l, idx) => (
                  <TableRow key={l.entryId + idx} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{new Date(l.date).toLocaleDateString()}</TableCell>
                    <TableCell>{l.description}</TableCell>
                    <TableCell>{l.debit}</TableCell>
                    <TableCell>{l.credit}</TableCell>
                    <TableCell>{l.balance}</TableCell>
                    <TableCell>{l.reference || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary" align="center">No data to display</Typography>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError('')}
        message={error}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </Box>
  );
};

export default GeneralLedgerPage;
