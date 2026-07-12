import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

const Maintenance = ({ token, user, showToast }) => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    date: '',
    description: '',
    cost: '',
    performed_by: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const canLog = user?.role === 'FleetManager' || user?.role === 'SafetyOfficer';
  const isManager = user?.role === 'FleetManager';

  const fetchData = async () => {
    try {
      // Fetch maintenance logs
      const logsRes = await fetch('/api/maintenance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const logsData = await logsRes.json();
      if (!logsRes.ok) throw new Error(logsData.error || 'Failed to fetch logs');
      setLogs(logsData);

      // Fetch vehicles for selection
      const vehiclesRes = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vehiclesData = await vehiclesRes.json();
      if (vehiclesRes.ok) setVehicles(vehiclesData);
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const openLogModal = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setFormData({
      vehicle_id: vehicles[0]?.id.toString() || '',
      date: todayStr,
      description: '',
      cost: '',
      performed_by: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.vehicle_id) errors.vehicle_id = 'Vehicle must be selected';
    if (!formData.date) {
      errors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      errors.date = 'Use YYYY-MM-DD date format';
    }
    if (!formData.description.trim()) errors.description = 'Description is required';
    
    const cost = Number(formData.cost);
    if (isNaN(cost) || cost < 0) errors.cost = 'Cost cannot be negative';

    if (!formData.performed_by.trim()) errors.performed_by = 'Provider name is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to log maintenance');

      showToast('Logged', 'Maintenance activity registered and expensed successfully', 'success');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this maintenance entry?')) return;

    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete entry');

      showToast('Deleted', 'Maintenance log deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const filteredLogs = logs.filter(l => 
    l.vehicle_registration.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase()) ||
    l.performed_by.toLowerCase().includes(search.toLowerCase())
  );

  const totalMaintenanceCost = logs.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      
      {/* Metrics Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Maintenance Events</span>
          <div style={{ fontSize: '28px', fontWeight: '700' }}>{logs.length}</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cumulative Fleet Spend</span>
          <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-amber)' }}>
            ${totalMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Search & Actions Panel */}
      <div className="search-controls">
        <div className="search-input-wrapper">
          <svg className="search-icon-svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by plate, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {canLog && (
          <button onClick={openLogModal} className="btn btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Log Maintenance Activity
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            Loading maintenance books...
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Date</th>
                <th>Description</th>
                <th>Cost</th>
                <th>Performed By</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>
                      <div style={{ fontWeight: '700' }}>{log.vehicle_registration}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{log.vehicle_name}</div>
                    </td>
                    <td>{log.date}</td>
                    <td>{log.description}</td>
                    <td style={{ fontWeight: '600', color: '#F59E0B' }}>${log.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>{log.performed_by}</td>
                    {isManager && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isManager ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No maintenance logs found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Maintenance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Maintenance Event"
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Select Vehicle</label>
            <select
              className="form-select"
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
            >
              <option value="">-- Choose Fleet Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name_model} ({v.registration_number}) - [{v.status}]
                </option>
              ))}
            </select>
            {formErrors.vehicle_id && <span className="form-error-msg">{formErrors.vehicle_id}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Service Date</label>
              <input
                type="date"
                className={`form-input ${formErrors.date ? 'error' : ''}`}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              {formErrors.date && <span className="form-error-msg">{formErrors.date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Service Cost ($)</label>
              <input
                type="number"
                className={`form-input ${formErrors.cost ? 'error' : ''}`}
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
              />
              {formErrors.cost && <span className="form-error-msg">{formErrors.cost}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Service Description</label>
            <textarea
              rows="3"
              className={`form-input ${formErrors.description ? 'error' : ''}`}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail parts replaced or diagnostics performed..."
            />
            {formErrors.description && <span className="form-error-msg">{formErrors.description}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Service Center / Performed By</label>
            <input
              type="text"
              className={`form-input ${formErrors.performed_by ? 'error' : ''}`}
              value={formData.performed_by}
              onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
              placeholder="e.g. Cummins Service Hub"
            />
            {formErrors.performed_by && <span className="form-error-msg">{formErrors.performed_by}</span>}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log Event
            </button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default Maintenance;
