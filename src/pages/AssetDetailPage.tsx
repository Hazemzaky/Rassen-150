import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Tabs, Tab, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, LinearProgress, Card, CardContent } from '@mui/material';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const tabLabels = ['Lifecycle', 'Maintenance', 'Depreciation', 'Downtime'];

const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#6d4c41', '#0288d1'];

const AssetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState(0);
  const [asset, setAsset] = useState<any>(null);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [depreciation, setDepreciation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [assetRes, maintRes, deprRes] = await Promise.all([
        axios.get<any>(`/api/assets/${id}`),
        axios.get<any[]>(`/api/maintenance`, { params: { asset: id } }),
        axios.get<any[]>(`/api/depreciation`, { params: { asset: id } }),
      ]);
      setAsset(assetRes.data);
      setMaintenance(maintRes.data.filter((m: any) => m.asset?._id === id || m.asset === id));
      setDepreciation(deprRes.data.filter((d: any) => d.asset?._id === id || d.asset === id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch asset details');
    } finally {
      setLoading(false);
    }
  };

  // Lifecycle progress
  const getLifecyclePercent = (a: any) => {
    if (!a.purchaseDate || !a.usefulLife) return 0;
    const yearsUsed = (new Date().getTime() - new Date(a.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.min(100, Math.round((yearsUsed / a.usefulLife) * 100));
  };

  // Maintenance calendar: group by date
  const maintenanceByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    maintenance.forEach(m => {
      const date = m.scheduledDate ? new Date(m.scheduledDate).toISOString().slice(0, 10) : '';
      if (!map[date]) map[date] = [];
      map[date].push(m);
    });
    return map;
  }, [maintenance]);

  // Maintenance cost/downtime chart
  const maintChartData = useMemo(() => {
    // Group by month
    const map: Record<string, { cost: number; downtime: number }> = {};
    maintenance.forEach(m => {
      const d = m.completedDate || m.scheduledDate;
      if (!d) return;
      const key = new Date(d).toISOString().slice(0, 7);
      if (!map[key]) map[key] = { cost: 0, downtime: 0 };
      map[key].cost += m.cost ? Number(m.cost) : 0;
      map[key].downtime += m.downtimeHours ? Number(m.downtimeHours) : 0;
    });
    return Object.entries(map).map(([month, v]) => ({ month, ...v }));
  }, [maintenance]);

  // Depreciation chart
  const deprChartData = useMemo(() => {
    // Group by year
    const map: Record<string, number> = {};
    depreciation.forEach(d => {
      const year = d.date ? new Date(d.date).getFullYear() : '';
      if (!map[year]) map[year] = 0;
      map[year] += d.amount ? Number(d.amount) : 0;
    });
    return Object.entries(map).map(([year, amount]) => ({ year, amount }));
  }, [depreciation]);

  // Downtime events (from maintenance with downtimeHours)
  const downtimeEvents = maintenance.filter(m => m.downtimeHours && Number(m.downtimeHours) > 0);
  const downtimeChartData = useMemo(() => {
    // Group by month
    const map: Record<string, number> = {};
    downtimeEvents.forEach(m => {
      const d = m.completedDate || m.scheduledDate;
      if (!d) return;
      const key = new Date(d).toISOString().slice(0, 7);
      if (!map[key]) map[key] = 0;
      map[key] += Number(m.downtimeHours);
    });
    return Object.entries(map).map(([month, downtime]) => ({ month, downtime }));
  }, [downtimeEvents]);
  const totalDowntime = downtimeEvents.reduce((sum, m) => sum + Number(m.downtimeHours), 0);

  return (
    <Box p={3}>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : asset ? (
        <>
          <Typography variant="h4" mb={2}>{asset.name}</Typography>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v)}>
              {tabLabels.map((label, idx) => <Tab key={label} label={label} />)}
            </Tabs>
          </Paper>
          {tab === 0 && (
            <Box>
              <Typography variant="h6" mb={2}>Lifecycle</Typography>
              <Card sx={{ mb: 2, maxWidth: 500 }}>
                <CardContent>
                  <Typography>Type: {asset.type}</Typography>
                  <Typography>Status: {asset.status}</Typography>
                  <Typography>Purchase Date: {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</Typography>
                  <Typography>Useful Life: {asset.usefulLife} years</Typography>
                  <Typography>Notes: {asset.notes || '-'}</Typography>
                  <Box mt={2}>
                    <Typography variant="subtitle2">Lifecycle Progress</Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ width: 200 }}>
                        <LinearProgress variant="determinate" value={getLifecyclePercent(asset)} sx={{ height: 10, borderRadius: 5 }} color={getLifecyclePercent(asset) > 90 ? 'error' : 'primary'} />
                      </Box>
                      <Typography variant="body2">{getLifecyclePercent(asset)}%</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
              {/* Status history placeholder */}
              <Typography variant="subtitle2" mt={2}>Status History</Typography>
              <Alert severity="info" sx={{ maxWidth: 500 }}>Status history tracking not implemented yet.</Alert>
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Typography variant="h6" mb={2}>Maintenance</Typography>
              {/* Calendar view: show a simple month grid with dots for scheduled maintenance */}
              <Typography variant="subtitle2" mb={1}>Maintenance Calendar (Current Month)</Typography>
              <Box mb={2}>
                <MaintenanceCalendar maintenanceByDate={maintenanceByDate} />
              </Box>
              <Typography variant="subtitle2" mb={1}>Maintenance Events</Typography>
              <TableContainer component={Paper} sx={{ maxWidth: 900, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Cost</TableCell>
                      <TableCell>Downtime (hrs)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenance.map((m, idx) => (
                      <TableRow key={m._id || idx}>
                        <TableCell>{m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{m.type}</TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell>{m.status}</TableCell>
                        <TableCell>{m.cost?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' }) || '-'}</TableCell>
                        <TableCell>{m.downtimeHours || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="subtitle2" mb={1}>Maintenance Cost & Downtime Over Time</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={maintChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cost" fill="#1976d2" name="Cost" />
                  <Bar dataKey="downtime" fill="#d32f2f" name="Downtime (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
          {tab === 2 && (
            <Box>
              <Typography variant="h6" mb={2}>Depreciation</Typography>
              <TableContainer component={Paper} sx={{ maxWidth: 700, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {depreciation.map((d, idx) => (
                      <TableRow key={d._id || idx}>
                        <TableCell>{d.date ? new Date(d.date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{d.amount?.toLocaleString(undefined, { style: 'currency', currency: 'KWD' })}</TableCell>
                        <TableCell>{d.method}</TableCell>
                        <TableCell>{d.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="subtitle2" mb={1}>Depreciation Over Time</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={deprChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#1976d2" name="Depreciation" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
          {tab === 3 && (
            <Box>
              <Typography variant="h6" mb={2}>Downtime</Typography>
              <Typography>Total Downtime: {totalDowntime} hours</Typography>
              <TableContainer component={Paper} sx={{ maxWidth: 700, mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Downtime (hrs)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {downtimeEvents.map((m, idx) => (
                      <TableRow key={m._id || idx}>
                        <TableCell>{m.scheduledDate ? new Date(m.scheduledDate).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell>{m.status}</TableCell>
                        <TableCell>{m.downtimeHours}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography variant="subtitle2" mb={1}>Downtime Over Time</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={downtimeChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="downtime" fill="#d32f2f" name="Downtime (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </>
      ) : null}
    </Box>
  );
};

// Simple calendar for current month with maintenance dots
const MaintenanceCalendar: React.FC<{ maintenanceByDate: Record<string, any[]> }> = ({ maintenanceByDate }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay(); // 0=Sun
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(startDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push([...week, ...Array(7 - week.length).fill(null)]);
  return (
    <Paper sx={{ p: 2, maxWidth: 350, mb: 2 }}>
      <Typography variant="subtitle2" align="center">{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</Typography>
      <Box display="flex" justifyContent="space-between" mb={1}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <Box key={d} width={32} textAlign="center" fontWeight={600}>{d}</Box>)}
      </Box>
      {weeks.map((w, i) => (
        <Box key={i} display="flex" justifyContent="space-between">
          {w.map((d, j) => (
            <Box key={j} width={32} height={32} textAlign="center" lineHeight="32px" borderRadius={2} bgcolor={d && maintenanceByDate[`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`] ? '#e3f2fd' : undefined}>
              {d}
              {d && maintenanceByDate[`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`] && (
                <Box component="span" display="inline-block" width={8} height={8} bgcolor="#1976d2" borderRadius={8} ml={0.5} />
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Paper>
  );
};

export default AssetDetailPage; 
