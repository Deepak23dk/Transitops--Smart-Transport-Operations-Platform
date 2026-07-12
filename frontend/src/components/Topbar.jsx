import React from 'react';

const Topbar = ({ currentPage, user }) => {
  if (!user) return null;

  const pageTitles = {
    dashboard: 'Operations Dashboard',
    vehicles: 'Vehicle Registry',
    drivers: 'Driver Management',
    trips: 'Trip Schedule & Dispatch',
    maintenance: 'Maintenance Logbook',
    'fuel-expenses': 'Fuel & Operational Expenses',
    reports: 'System Analytics & Reports'
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'FleetManager':
        return {
          backgroundColor: '#F59E0B',
          color: '#0F172A',
          border: 'none'
        };
      case 'Driver':
        return {
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        };
      case 'SafetyOfficer':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          color: '#3B82F6',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        };
      case 'FinancialAnalyst':
        return {
          backgroundColor: 'rgba(168, 85, 247, 0.15)',
          color: '#A855F7',
          border: '1px solid rgba(168, 85, 247, 0.3)'
        };
      default:
        return {
          backgroundColor: 'rgba(148, 163, 184, 0.15)',
          color: '#94A3B8',
          border: '1px solid rgba(148, 163, 184, 0.3)'
        };
    }
  };

  const formatRole = (role) => {
    if (!role) return '';
    // Format camelCase to spaced words, e.g. FleetManager -> Fleet Manager
    return role.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 90,
        marginBottom: '24px',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
          {pageTitles[currentPage] || 'TransitOps'}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user.email}</div>
        </div>

        <div
          className="pill-badge"
          style={{
            ...getRoleStyle(user.role),
            padding: '6px 12px',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {formatRole(user.role)}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
