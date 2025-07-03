import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import axios from 'axios';

interface Period {
  _id: string;
  period: string;
  closed: boolean;
  closedAt?: string;
  closedBy?: string;
}

const PeriodsPage: React.FC = () => {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get<Period[]>('/api/periods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPeriods(res.data as Period[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch periods');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (period: Period) => {
    setSelectedPeriod(period);
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
    setSelectedPeriod(null);
  };
  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/periods/close', {
        period: selectedPeriod.period,
        closedBy: 'system',
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Period closed successfully!');
      fetchPeriods();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to close period');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>Period Closing</Typography>
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
                  <TableCell>Period</TableCell>
                  <TableCell>Closed</TableCell>
                  <TableCell>Closed At</TableCell>
                  <TableCell>Closed By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.map((p, idx) => (
                  <TableRow key={p._id} sx={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <TableCell>{p.period}</TableCell>
                    <TableCell>{p.closed ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{p.closedAt ? new Date(p.closedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{p.closedBy || '-'}</TableCell>
                    <TableCell>
                      {!p.closed && (
                        <Button variant="outlined" color="primary" onClick={() => handleOpen(p)}>
                          Close Period
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
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Close Period</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to close period <b>{selectedPeriod?.period}</b>?</Typography>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleClosePeriod} variant="contained" color="primary" disabled={submitting}>Close Period</Button>
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

export default PeriodsPage; 