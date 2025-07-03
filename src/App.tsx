import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import InvoicesPage from './pages/InvoicesPage';
import RegisterPage from './pages/RegisterPage';
import IncomePage from './pages/IncomePage';
import BudgetsPage from './pages/BudgetsPage';
import NavBar from './components/NavBar';
import ChartOfAccountsPage from './pages/ChartOfAccountsPage';
import JournalEntriesPage from './pages/JournalEntriesPage';
import TrialBalancePage from './pages/TrialBalancePage';
import GeneralLedgerPage from './pages/GeneralLedgerPage';
import PeriodsPage from './pages/PeriodsPage';
import EmployeesPage from './pages/EmployeesPage';
import PayrollPage from './pages/PayrollPage';
import ReimbursementsPage from './pages/ReimbursementsPage';
import LeavePage from './pages/LeavePage';
import FuelLogsPage from './pages/FuelLogsPage';
import DriverHoursPage from './pages/DriverHoursPage';
import ProjectsPage from './pages/ProjectsPage';
import AssetsPage from './pages/AssetsPage';
import MaintenancePage from './pages/MaintenancePage';
import DepreciationPage from './pages/DepreciationPage';
import AssetDetailPage from './pages/AssetDetailPage';
import InventoryRegisterPage from './pages/InventoryRegisterPage';
import InventoryTransactionsPage from './pages/InventoryTransactionsPage';
import ProfilePage from './pages/ProfilePage';
import DebugAuthPage from './pages/DebugAuthPage';
import './custom.css';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  // If not authenticated, only allow /login and /register
  if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
    return <Navigate to="/login" replace />;
  }
  // If authenticated, redirect away from /login and /register
  if (isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {isAuthenticated && <NavBar />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/accounts" element={<ChartOfAccountsPage />} />
        <Route path="/journal-entries" element={<JournalEntriesPage />} />
        <Route path="/trial-balance" element={<TrialBalancePage />} />
        <Route path="/general-ledger" element={<GeneralLedgerPage />} />
        <Route path="/periods" element={<PeriodsPage />} />
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/reimbursements" element={<ReimbursementsPage />} />
        <Route path="/leave" element={<LeavePage />} />
        <Route path="/fuel-logs" element={<FuelLogsPage />} />
        <Route path="/driver-hours" element={<DriverHoursPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/depreciation" element={<DepreciationPage />} />
        <Route path="/assets/:id" element={<AssetDetailPage />} />
        <Route path="/inventory" element={<InventoryRegisterPage />} />
        <Route path="/inventory/transactions" element={<InventoryTransactionsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/debug-auth" element={<DebugAuthPage />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </>
  );
};

export default App;
