import React, { useState, useEffect } from 'react';

const Reports = ({ token, user, showToast }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/reports/summary', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch reports');
        setReportData(data);
      } catch (err) {
        showToast('Error', err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', flex: 1 }}>
        <div style={{ color: 'var(--text-secondary)' }}>Compiling fleet reports...</div>
      </div>
    );
  }

  if (!reportData) return <div style={{ color: 'red' }}>Error loading report data.</div>;

  const { fleetStatus, dailyExpenses, categoryExpenses, driverSafety, tripMetrics } = reportData;

  // 1. Calculate overall financial spent
  const totalSpend = categoryExpenses.reduce((acc, curr) => acc + curr.total, 0);

  // 2. Daily expense trend helpers
  const maxDailyExpense = dailyExpenses.length > 0 
    ? Math.max(...dailyExpenses.map(e => e.total)) 
    : 1;

  // 3. Operational trip metrics helpers
  const completedMetrics = tripMetrics.find(m => m.status === 'Completed') || { total_trips: 0, avg_distance: 0, avg_weight: 0 };
  const dispatchedMetrics = tripMetrics.find(m => m.status === 'Dispatched') || { total_trips: 0, avg_distance: 0, avg_weight: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
      
      {/* Top Aggregated Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Operating Cost</span>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-amber)' }}>
            ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Sum of all expense logs</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Completed Deliveries</span>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{completedMetrics.total_trips}</div>
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: '600' }}>
            Avg Route: {completedMetrics.avg_distance ? Math.round(completedMetrics.avg_distance) : 0} km
          </span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Average Cargo Weight</span>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>
            {completedMetrics.avg_weight ? Math.round(completedMetrics.avg_weight).toLocaleString() : 0} kg
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Per completed dispatch</span>
        </div>
      </div>

      {/* Graphs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {/* Daily Expense Trend Chart */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
          <h3 className="card-title">Daily Expense Trends (Last 30 Days)</h3>
          
          {dailyExpenses.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {/* Responsive SVG bar chart */}
              <div style={{ height: '180px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                {dailyExpenses.map((day, idx) => {
                  const heightPercentage = (day.total / maxDailyExpense) * 100;
                  return (
                    <div
                      key={day.date}
                      style={{
                        flex: 1,
                        height: `${heightPercentage}%`,
                        backgroundColor: 'var(--accent-amber)',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        minWidth: '12px',
                        cursor: 'pointer'
                      }}
                      title={`${day.date}: $${day.total}`}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#1E293B',
                          color: '#FFF',
                          fontSize: '9px',
                          padding: '4px',
                          borderRadius: '4px',
                          opacity: 0,
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                          transition: 'opacity 0.15s ease',
                          marginBottom: '4px',
                          border: '1px solid var(--border-color)',
                          zIndex: 10
                        }}
                        className="chart-tooltip"
                      >
                        ${day.total}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>{dailyExpenses[0]?.date}</span>
                <span>{dailyExpenses[Math.floor(dailyExpenses.length / 2)]?.date}</span>
                <span>{dailyExpenses[dailyExpenses.length - 1]?.date}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
              No recent daily expense records found.
            </div>
          )}
        </div>

        {/* Fleet Utilization Progress */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
          <h3 className="card-title">Fleet Allocation Ratios</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            {fleetStatus.length > 0 ? (
              fleetStatus.map((item) => {
                const statusColors = {
                  Available: '#10B981',
                  'On Trip': '#3B82F6',
                  'In Shop': '#F59E0B',
                  Retired: '#EF4444'
                };
                return (
                  <div key={item.status} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: statusColors[item.status] }} />
                        {item.status}
                      </span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {item.count} Vehicles ({item.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-main)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${item.percentage}%`,
                          height: '100%',
                          backgroundColor: statusColors[item.status],
                          borderRadius: '5px',
                          transition: 'width 0.5s ease-in-out'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>
                No vehicles registered.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Two Column Layout for Drivers & Financial Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {/* Financial Category Breakdown */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
          <h3 className="card-title">Expense Allocation Table</h3>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Share (%)</th>
                </tr>
              </thead>
              <tbody>
                {categoryExpenses.map((cat) => {
                  const share = totalSpend > 0 ? (cat.total / totalSpend) * 100 : 0;
                  return (
                    <tr key={cat.category}>
                      <td style={{ fontWeight: '600' }}>{cat.category}</td>
                      <td style={{ color: '#F59E0B', fontWeight: '600' }}>${cat.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td>{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Safety Officer Driver Roster */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: 0 }}>
          <h3 className="card-title">Driver Safety & Readiness Roster</h3>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Safety Score</th>
                  <th>License Status</th>
                </tr>
              </thead>
              <tbody>
                {driverSafety.map((driver) => {
                  const getScoreClass = (score) => {
                    if (score >= 85) return 'badge-safety-green';
                    if (score >= 70) return 'badge-safety-yellow';
                    return 'badge-safety-red';
                  };

                  const today = new Date().toISOString().split('T')[0];
                  const expired = driver.license_expiry_date < today;

                  return (
                    <tr key={driver.id}>
                      <td style={{ fontWeight: '600' }}>{driver.name}</td>
                      <td>
                        <span className={`pill-badge ${getScoreClass(driver.safety_score)}`}>
                          {driver.safety_score}%
                        </span>
                      </td>
                      <td>
                        {expired ? (
                          <span className="pill-badge pill-vehicle-retired" style={{ fontSize: '10px' }}>License Expired</span>
                        ) : (
                          <span className="pill-badge pill-vehicle-available" style={{ fontSize: '10px' }}>Active License</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style>{`
        div[title]:hover .chart-tooltip {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default Reports;
