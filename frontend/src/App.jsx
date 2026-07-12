import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Reports from './pages/Reports';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('transitops_token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('transitops_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = (title, message, type = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auth actions
  const onLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('transitops_token', newToken);
    localStorage.setItem('transitops_user', JSON.stringify(newUser));
    setCurrentPage('dashboard');
  };

  const onLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
    setCurrentPage('dashboard');
    showToast('Signed Out', 'You have been successfully logged out', 'info');
  };

  // Auto session verification on boot
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) {
            onLogout();
          }
        })
        .catch(() => {
          showToast('Offline Mode', 'Connection to database server failed. Running in cached session.', 'info');
        });
    }
  }, [token]);

  // Page renderer mapping
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard token={token} setCurrentPage={setCurrentPage} showToast={showToast} />;
      case 'vehicles':
        return <Vehicles token={token} user={user} showToast={showToast} />;
      case 'drivers':
        return <Drivers token={token} user={user} showToast={showToast} />;
      case 'trips':
        return <Trips token={token} user={user} showToast={showToast} />;
      case 'maintenance':
        return <Maintenance token={token} user={user} showToast={showToast} />;
      case 'fuel-expenses':
        return <FuelExpenses token={token} user={user} showToast={showToast} />;
      case 'reports':
        return <Reports token={token} user={user} showToast={showToast} />;
      default:
        return <Dashboard token={token} setCurrentPage={setCurrentPage} showToast={showToast} />;
    }
  };

  // Render Login overlay if not authenticated
  if (!token) {
    return (
      <>
        <Login onLoginSuccess={onLoginSuccess} showToast={showToast} />
        {/* Render Toasts on Login */}
        <div className="toast-container">
          {toasts.map((t) => (
            <Toast key={t.id} {...t} onClose={dismissToast} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Layout */}
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        user={user}
        onLogout={onLogout}
      />

      {/* Main Panel */}
      <main className="main-content">
        <Topbar currentPage={currentPage} user={user} />
        {renderPage()}
      </main>

      {/* Floating Notifications List */}
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={dismissToast} />
        ))}
      </div>
    </div>
  );
};

export default App;
