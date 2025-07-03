import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis } from 'recharts';
import axios from 'axios';

const COLORS = ['#1976d2', '#388e3c', '#fbc02d', '#d32f2f'];

interface CategoryData {
  _id: string;
  total: number;
}

interface SummaryData {
  total: number;
  byCategory: CategoryData[];
  invoiceCount: number;
  userCount: number;
  recentActivity: string[];
}

interface KPIData {
  revenue: number;
  expenses: number;
  penalties: number;
  depreciation: number;
  cashFlow: number;
  grossProfit: number;
  netProfit: number;
}

const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [kpis, setKPIs] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const [summaryRes, kpiRes] = await Promise.all([
          axios.get<SummaryData>('/api/dashboard/summary', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<KPIData>('/api/dashboard/kpis', {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);
        setSummary(summaryRes.data);
        setKPIs(kpiRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Chart data for revenue vs expenses
  const chartData = kpis ? [
    { name: 'Revenue', value: kpis.revenue },
    { name: 'Expenses', value: kpis.expenses },
    { name: 'Gross Profit', value: kpis.grossProfit },
    { name: 'Net Profit', value: kpis.netProfit },
  ] : [];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* KPI Cards */}
          <Box display="flex" flexWrap="wrap" gap={3} mb={2}>
            <Box flex="1 1 250px" minWidth={250} mb={2}>
              <Card sx={{ background: '#1976d2', color: '#fff' }}>
                <CardContent>
                  <Typography variant="h6">Revenue</Typography>
                  <Typography variant="h4">{kpis?.revenue ?? '-'}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box flex="1 1 250px" minWidth={250} mb={2}>
              <Card sx={{ background: '#d32f2f', color: '#fff' }}>
                <CardContent>
                  <Typography variant="h6">Expenses</Typography>
                  <Typography variant="h4">{kpis?.expenses ?? '-'}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box flex="1 1 250px" minWidth={250} mb={2}>
              <Card sx={{ background: '#388e3c', color: '#fff' }}>
                <CardContent>
                  <Typography variant="h6">Cash Flow</Typography>
                  <Typography variant="h4">{kpis?.cashFlow ?? '-'}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box flex="1 1 250px" minWidth={250} mb={2}>
              <Card sx={{ background: '#fbc02d', color: '#fff' }}>
                <CardContent>
                  <Typography variant="h6">Gross Profit</Typography>
                  <Typography variant="h4">{kpis?.grossProfit ?? '-'}</Typography>
                </CardContent>
              </Card>
            </Box>
            <Box flex="1 1 250px" minWidth={250} mb={2}>
              <Card sx={{ background: '#6d4c41', color: '#fff' }}>
                <CardContent>
                  <Typography variant="h6">Net Profit</Typography>
                  <Typography variant="h4">{kpis?.netProfit ?? '-'}</Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
          {/* Revenue vs Expenses Bar Chart */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Revenue vs Expenses</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#1976d2" name="Value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
          {/* Pie Chart and Recent Activity (existing) */}
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex="1 1 350px" minWidth={350} mb={2}>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
                <ResponsiveContainer width="100%" height="90%">
                  <PieChart>
                    <Pie
                      data={summary?.byCategory || []}
                      dataKey="total"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {(summary?.byCategory || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Box>
            <Box flex="1 1 350px" minWidth={350} mb={2}>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="h6" gutterBottom>Recent Activity</Typography>
                <List>
                  {summary?.recentActivity && summary.recentActivity.length > 0 ? (
                    summary.recentActivity.map((activity, idx) => (
                      <ListItem key={idx} divider>
                        <ListItemText primary={activity} />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No recent activity" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DashboardPage;     