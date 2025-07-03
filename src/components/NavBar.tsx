import React, { useState, useContext, createContext } from 'react';
import { AppBar, Toolbar, Button, Box, Menu, MenuItem, Avatar, Tooltip, IconButton, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// Theme context for dark mode toggle
export const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' });

const NavBar: React.FC = () => {
  const [accountingAnchorEl, setAccountingAnchorEl] = useState<null | HTMLElement>(null);
  const [hrAnchorEl, setHrAnchorEl] = useState<null | HTMLElement>(null);
  const [assetsAnchorEl, setAssetsAnchorEl] = useState<null | HTMLElement>(null);
  const [inventoryAnchorEl, setInventoryAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const colorMode = useContext(ColorModeContext);
  const isAuthenticated = !!localStorage.getItem('token');

  // Menu handlers
  const handleAccountingMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setAccountingAnchorEl(event.currentTarget);
  const handleAccountingMenuClose = () => setAccountingAnchorEl(null);
  const handleHrMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setHrAnchorEl(event.currentTarget);
  const handleHrMenuClose = () => setHrAnchorEl(null);
  const handleAssetsMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setAssetsAnchorEl(event.currentTarget);
  const handleAssetsMenuClose = () => setAssetsAnchorEl(null);
  const handleInventoryMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setInventoryAnchorEl(event.currentTarget);
  const handleInventoryMenuClose = () => setInventoryAnchorEl(null);
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setProfileAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setProfileAnchorEl(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ minHeight: 64 }}>
        {/* Left: Logo/Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }} component={RouterLink} to="/dashboard" style={{ textDecoration: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
            {/* Dollar SVG Logo */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6 }}>
              <circle cx="16" cy="16" r="16" fill="#e8f5e9" />
              <path d="M16 8v16M20.5 11.5c0-2-1.79-3.5-4.5-3.5s-4.5 1.5-4.5 3.5c0 2.5 2.5 3.5 4.5 3.5s4.5 1 4.5 3.5c0 2-1.79 3.5-4.5 3.5s-4.5-1.5-4.5-3.5" stroke="#43a047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="16" r="15" stroke="#43a047" strokeWidth="1.5" fill="none" />
            </svg>
            <Typography
              variant="h6"
              sx={{
                color: 'transparent',
                textDecoration: 'none',
                fontWeight: 700,
                letterSpacing: 1,
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                background: 'linear-gradient(90deg, #FFD700 0%, #FFB300 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
              }}
            >
              Rassen
            </Typography>
          </Box>
        </Box>
        {/* Center: Main navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 1 }}>
          <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
          <Button color="inherit" component={RouterLink} to="/budgets">Budgets</Button>
          <Button color="inherit" component={RouterLink} to="/projects">Projects</Button>
          <Button color="inherit" onClick={handleAccountingMenuOpen} aria-controls="accounting-menu" aria-haspopup="true">Accounting</Button>
          <Menu
            id="accounting-menu"
            anchorEl={accountingAnchorEl}
            open={Boolean(accountingAnchorEl)}
            onClose={handleAccountingMenuClose}
            MenuListProps={{ onMouseLeave: handleAccountingMenuClose }}
          >
            <MenuItem component={RouterLink} to="/accounts" onClick={handleAccountingMenuClose}>Chart of Accounts</MenuItem>
            <MenuItem component={RouterLink} to="/journal-entries" onClick={handleAccountingMenuClose}>Journal Entries</MenuItem>
            <MenuItem component={RouterLink} to="/trial-balance" onClick={handleAccountingMenuClose}>Trial Balance</MenuItem>
            <MenuItem component={RouterLink} to="/general-ledger" onClick={handleAccountingMenuClose}>General Ledger</MenuItem>
            <MenuItem component={RouterLink} to="/periods" onClick={handleAccountingMenuClose}>Period Closing</MenuItem>
          </Menu>
          <Button color="inherit" onClick={handleHrMenuOpen} aria-controls="hr-menu" aria-haspopup="true">HR</Button>
          <Menu
            id="hr-menu"
            anchorEl={hrAnchorEl}
            open={Boolean(hrAnchorEl)}
            onClose={handleHrMenuClose}
            MenuListProps={{ onMouseLeave: handleHrMenuClose }}
          >
            <MenuItem component={RouterLink} to="/employees" onClick={handleHrMenuClose}>Employees</MenuItem>
            <MenuItem component={RouterLink} to="/payroll" onClick={handleHrMenuClose}>Payroll</MenuItem>
            <MenuItem component={RouterLink} to="/reimbursements" onClick={handleHrMenuClose}>Reimbursements</MenuItem>
            <MenuItem component={RouterLink} to="/leave" onClick={handleHrMenuClose}>Leave</MenuItem>
          </Menu>
          <Button color="inherit" onClick={handleAssetsMenuOpen} aria-controls="assets-menu" aria-haspopup="true">Assets</Button>
          <Menu
            id="assets-menu"
            anchorEl={assetsAnchorEl}
            open={Boolean(assetsAnchorEl)}
            onClose={handleAssetsMenuClose}
            MenuListProps={{ onMouseLeave: handleAssetsMenuClose }}
          >
            <MenuItem component={RouterLink} to="/assets" onClick={handleAssetsMenuClose}>Asset Register</MenuItem>
            <MenuItem component={RouterLink} to="/maintenance" onClick={handleAssetsMenuClose}>Maintenance</MenuItem>
            <MenuItem component={RouterLink} to="/depreciation" onClick={handleAssetsMenuClose}>Depreciation</MenuItem>
          </Menu>
          <Button color="inherit" onClick={handleInventoryMenuOpen} aria-controls="inventory-menu" aria-haspopup="true">Inventory</Button>
          <Menu
            id="inventory-menu"
            anchorEl={inventoryAnchorEl}
            open={Boolean(inventoryAnchorEl)}
            onClose={handleInventoryMenuClose}
            MenuListProps={{ onMouseLeave: handleInventoryMenuClose }}
          >
            <MenuItem component={RouterLink} to="/inventory" onClick={handleInventoryMenuClose}>Inventory Register</MenuItem>
            <MenuItem component={RouterLink} to="/inventory/transactions" onClick={handleInventoryMenuClose}>Transactions Log</MenuItem>
          </Menu>
          <Button color="inherit" component={RouterLink} to="/expenses">Expenses</Button>
          <Button color="inherit" component={RouterLink} to="/invoices">Invoices</Button>
          <Button color="inherit" component={RouterLink} to="/income">Income</Button>
        </Box>
        {/* Right: Auth, Debug, Dark mode, Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isAuthenticated && (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Register</Button>
            </>
          )}
          {isAuthenticated && (
            <>
              <Button color="inherit" component={RouterLink} to="/debug-auth">IT</Button>
              {/* Dark mode toggle icon */}
              <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
                {colorMode.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              <Box>
                <Tooltip title="Profile">
                  <React.Fragment>
                    <Avatar
                      sx={{ bgcolor: '#1976d2', cursor: 'pointer', width: 36, height: 36 }}
                      onClick={handleProfileMenuOpen}
                    >
                      U
                    </Avatar>
                  </React.Fragment>
                </Tooltip>
                <Menu
                  anchorEl={profileAnchorEl}
                  open={Boolean(profileAnchorEl)}
                  onClose={handleProfileMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem component={RouterLink} to="/profile" onClick={handleProfileMenuClose}>Profile</MenuItem>
                  <MenuItem onClick={handleLogout}>Logout</MenuItem>
                </Menu>
              </Box>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar; 