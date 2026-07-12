import React, { useEffect, useState } from 'react';

const Dashboard = ({ token, setCurrentPage, showToast }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch dashboard stats');
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        showToast('Error', err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flex: 1 }}>
        <div style={{ color: 'var(--text-secondary)' }}>Loading dashboard analytics...</div>
      </div>
    );
  }

  if (!stats) return <div style={{ color: 'red' }}>Error loading data.</div>;

  // Simple helper to get status pill class
  const getTripStatusClass = (status) => {
    switch (status) {
      case 'Draft': return 'pill-trip-draft';
      case 'Dispatched': return 'pill-trip-dispatched';
      case 'Completed': return 'pill-trip-completed';
      case 'Cancelled': return 'pill-trip-cancelled';
      default: return '';
    }
  };

  // Find max category value for scaling charts
  const maxExpense = stats.expenseBreakdown && stats.expenseBreakdown.length > 0
    ? Math.max(...stats.expenseBreakdown.map(e => e.total))
    : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
      {/* 5 Stats Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Total Fleet */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Total Fleet Size</span>
            <div style={{ color: 'var(--text-secondary)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M13 16h2m-2 0H5m14 0h2m-2 0v-5a1 1 0 00-.3-.7l-3.5-3.5A1 1 0 0014.5 6.5h-1.5" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.totalVehicles}</div>
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Active Vehicles</span>
        </div>

        {/* Card 2: Active Trips */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Active Dispatches</span>
            <div style={{ color: 'var(--text-secondary)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.activeTrips}</div>
          <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: '600' }}>On-route live trips</span>
        </div>

        {/* Card 3: Available Drivers */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Available Drivers</span>
            <div style={{ color: 'var(--text-secondary)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.availableDrivers}</div>
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>Ready for assignment</span>
        </div>

        {/* Card 4: Monthly Expense */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Expenses (MTD)</span>
            <div style={{ color: 'var(--text-secondary)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
            ${stats.mtdExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '11px', color: '#EF4444', fontWeight: '600' }}>MTD Fuel & Maintenance</span>
        </div>

        {/* Card 5: Fleet Safety Score */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Avg Safety Score</span>
            <div style={{ color: 'var(--text-secondary)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>{stats.avgSafetyScore} / 100</div>
          <span style={{ fontSize: '11px', color: stats.avgSafetyScore >= 85 ? '#10B981' : stats.avgSafetyScore >= 70 ? '#F59E0B' : '#EF4444', fontWeight: '600' }}>
            {stats.avgSafetyScore >= 85 ? 'Excellent Class' : stats.avgSafetyScore >= 70 ? 'Satisfactory' : 'Critical Warning'}
          </span>
        </div>

      </div>

      {/* Two Column Layout for Graphs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Expenses by Category */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
          <h3 className="card-title">Operating Expenses Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            {stats.expenseBreakdown && stats.expenseBreakdown.length > 0 ? (
              stats.expenseBreakdown.map((item) => (
                <div key={item.category} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.category}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
                      ${item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Custom progress bar */}
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(item.total / maxExpense) * 100}%`,
                        height: '100%',
                        backgroundColor: item.category === 'Fuel' ? '#3B82F6' : item.category === 'Maintenance' ? '#F59E0B' : '#10B981',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
                No expenses logged.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fleet Status Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
          <h3 className="card-title">Fleet Availability Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            {stats.vehicleStatusSummary && stats.vehicleStatusSummary.length > 0 ? (
              stats.vehicleStatusSummary.map((item) => {
                const colors = {
                  Available: '#10B981',
                  'On Trip': '#3B82F6',
                  'In Shop': '#F59E0B',
                  Retired: '#EF4444'
                };
                const percentage = stats.totalVehicles > 0 ? (item.count / stats.totalVehicles) * 100 : 0;
                return (
                  <div key={item.status} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors[item.status] || '#FFF' }} />
                        {item.status}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: colors[item.status] || '#FFF',
                          borderRadius: '4px',
                          transition: 'width 0.5s ease-in-out'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
                No vehicles registered.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Recent Dispatches Section */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">Recent Trips & Logistical Operations</h3>
          <button
            onClick={() => setCurrentPage('trips')}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
          >
            Manage Trips
          </button>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo Weight</th>
                <th>Planned Distance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentDispatches && stats.recentDispatches.length > 0 ? (
                stats.recentDispatches.map((trip) => (
                  <tr key={trip.id}>
                    <td style={{ fontWeight: '600' }}>
                      {trip.source} → {trip.destination}
                    </td>
                    <td>
                      <div>{trip.vehicle_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{trip.registration_number}</div>
                    </td>
                    <td>{trip.driver_name}</td>
                    <td>{trip.cargo_weight.toLocaleString()} kg</td>
                    <td>{trip.planned_distance} km</td>
                    <td>
                      <span className={`pill-badge ${getTripStatusClass(trip.status)}`}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No trips loaded in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
