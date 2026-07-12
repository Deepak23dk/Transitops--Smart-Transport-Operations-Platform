import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

const Trips = ({ token, user, showToast }) => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight: '',
    planned_distance: '',
    status: 'Draft'
  });
  const [formErrors, setFormErrors] = useState({});

  const isManager = user?.role === 'FleetManager';

  const fetchData = async () => {
    try {
      // Fetch trips
      const tripsRes = await fetch('/api/trips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tripsData = await tripsRes.json();
      if (!tripsRes.ok) throw new Error(tripsData.error || 'Failed to fetch trips');
      setTrips(tripsData);

      // Fetch vehicles (for drop-down selection)
      const vehiclesRes = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vehiclesData = await vehiclesRes.json();
      if (vehiclesRes.ok) setVehicles(vehiclesData);

      // Fetch drivers (for drop-down selection)
      const driversRes = await fetch('/api/drivers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const driversData = await driversRes.json();
      if (driversRes.ok) setDrivers(driversData);

    } catch (err) {
      showToast('Error loading data', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const openAddModal = () => {
    setEditId(null);
    // Auto-select first available vehicle and driver if any
    const firstAvailVeh = vehicles.find(v => v.status === 'Available') || vehicles[0];
    const firstAvailDriver = drivers.find(d => d.status === 'Available') || drivers[0];

    setFormData({
      source: '',
      destination: '',
      vehicle_id: firstAvailVeh ? firstAvailVeh.id.toString() : '',
      driver_id: firstAvailDriver ? firstAvailDriver.id.toString() : '',
      cargo_weight: '',
      planned_distance: '',
      status: 'Draft'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (trip) => {
    setEditId(trip.id);
    setFormData({
      source: trip.source,
      destination: trip.destination,
      vehicle_id: trip.vehicle_id.toString(),
      driver_id: trip.driver_id.toString(),
      cargo_weight: trip.cargo_weight.toString(),
      planned_distance: trip.planned_distance.toString(),
      status: trip.status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.source.trim()) errors.source = 'Source location is required';
    if (!formData.destination.trim()) errors.destination = 'Destination location is required';
    if (!formData.vehicle_id) errors.vehicle_id = 'Vehicle must be selected';
    if (!formData.driver_id) errors.driver_id = 'Driver must be selected';

    const weight = Number(formData.cargo_weight);
    if (isNaN(weight) || weight <= 0) errors.cargo_weight = 'Cargo weight must be positive';

    const dist = Number(formData.planned_distance);
    if (isNaN(dist) || dist <= 0) errors.planned_distance = 'Planned distance must be positive';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const url = editId ? `/api/trips/${editId}` : '/api/trips';
      const method = editId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save trip');

      showToast(
        'Success',
        `Trip from ${formData.source} to ${formData.destination} ${editId ? 'updated' : 'drafted'} successfully`,
        'success'
      );
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Error saving trip', err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip schedule?')) return;

    try {
      const response = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete trip');

      showToast('Deleted', 'Trip schedule deleted successfully', 'success');
      fetchData();
    } catch (err) {
      showToast('Deletion Failed', err.message, 'error');
    }
  };

  // Dispatch Trip Action
  const handleDispatch = async (id) => {
    try {
      const response = await fetch(`/api/trips/${id}/dispatch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Dispatch check failed');

      showToast('Trip Dispatched', data.message, 'success');
      fetchData();
    } catch (err) {
      showToast('Dispatch Cancelled', err.message, 'error');
    }
  };

  // Complete Trip Action
  const handleComplete = async (id) => {
    try {
      const response = await fetch(`/api/trips/${id}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Completion failed');

      showToast('Trip Completed', data.message, 'success');
      fetchData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Cancel Trip Action
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;

    try {
      const response = await fetch(`/api/trips/${id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cancellation failed');

      showToast('Trip Cancelled', data.message, 'info');
      fetchData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Filter and sort computation
  const filteredTrips = trips
    .filter(t => 
      t.source.toLowerCase().includes(search.toLowerCase()) ||
      t.destination.toLowerCase().includes(search.toLowerCase()) ||
      t.driver_name.toLowerCase().includes(search.toLowerCase()) ||
      t.vehicle_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let fieldA = a[sortBy];
      let fieldB = b[sortBy];

      if (typeof fieldA === 'string') {
        fieldA = fieldA.toLowerCase();
        fieldB = fieldB.toLowerCase();
      }

      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft': return 'pill-trip-draft';
      case 'Dispatched': return 'pill-trip-dispatched';
      case 'Completed': return 'pill-trip-completed';
      case 'Cancelled': return 'pill-trip-cancelled';
      default: return '';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      
      {/* Search & Actions Panel */}
      <div className="search-controls">
        <div className="search-input-wrapper">
          <svg className="search-icon-svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by route, driver, truck..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isManager && (
          <button onClick={openAddModal} className="btn btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Plan Route / Create Trip
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            Loading planned operations...
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>ID {sortBy === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('source')}>Route {sortBy === 'source' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th>Assigned Vehicle</th>
                <th>Assigned Driver</th>
                <th onClick={() => handleSort('cargo_weight')}>Cargo (kg) {sortBy === 'cargo_weight' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('planned_distance')}>Distance (km) {sortBy === 'planned_distance' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTrips.length > 0 ? (
                filteredTrips.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td style={{ fontWeight: '700' }}>
                      {t.source} → {t.destination}
                    </td>
                    <td>
                      <div>{t.vehicle_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Plate: {t.vehicle_registration}</div>
                    </td>
                    <td>
                      <div>{t.driver_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>DL: {t.driver_license}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{t.cargo_weight.toLocaleString()} kg</span>
                        {t.cargo_weight > t.vehicle_capacity && (
                          <span style={{ fontSize: '10px', color: '#EF4444', fontWeight: '600' }}>
                            ⚠️ OVER CAPACITY ({t.vehicle_capacity} kg max)
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{t.planned_distance} km</td>
                    <td>
                      <span className={`pill-badge ${getStatusBadge(t.status)}`}>
                        {t.status}
                      </span>
                    </td>
                    {isManager && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          
                          {/* Status specific actions */}
                          {t.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => handleDispatch(t.id)}
                                className="btn btn-success"
                                style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'transparent' }}
                                title="Dispatch Trip (Validates weight, license, availability)"
                              >
                                Dispatch
                              </button>
                              <button
                                onClick={() => openEditModal(t)}
                                className="btn btn-secondary"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                              >
                                Edit
                              </button>
                            </>
                          )}

                          {t.status === 'Dispatched' && (
                            <>
                              <button
                                onClick={() => handleComplete(t.id)}
                                className="btn btn-primary"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => handleCancel(t.id)}
                                className="btn btn-danger"
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {t.status === 'Cancelled' && (
                            <button
                              onClick={() => handleDispatch(t.id)}
                              className="btn btn-success"
                              style={{ padding: '6px 10px', fontSize: '12px', borderColor: 'transparent' }}
                            >
                              Re-Dispatch
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(t.id)}
                            className="btn btn-danger"
                            style={{ padding: '6px 10px', fontSize: '12px', color: '#EF4444', backgroundColor: 'transparent', border: 'none' }}
                            disabled={t.status === 'Dispatched'}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>

                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isManager ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No operations planned.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Modify Trip Plan' : 'Plan Logistical Dispatch'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Source Terminal</label>
              <input
                type="text"
                className={`form-input ${formErrors.source ? 'error' : ''}`}
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g. Los Angeles"
              />
              {formErrors.source && <span className="form-error-msg">{formErrors.source}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Destination Hub</label>
              <input
                type="text"
                className={`form-input ${formErrors.destination ? 'error' : ''}`}
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="e.g. San Francisco"
              />
              {formErrors.destination && <span className="form-error-msg">{formErrors.destination}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Assign Vehicle</label>
            <select
              className="form-select"
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
            >
              <option value="">-- Choose Fleet Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name_model} ({v.registration_number}) - Capacity: {v.max_load_capacity}kg [{v.status}]
                </option>
              ))}
            </select>
            {formErrors.vehicle_id && <span className="form-error-msg">{formErrors.vehicle_id}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Assign Operator (Driver)</label>
            <select
              className="form-select"
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
            >
              <option value="">-- Choose Operator --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.license_category}) - Score: {d.safety_score}% [{d.status}]
                </option>
              ))}
            </select>
            {formErrors.driver_id && <span className="form-error-msg">{formErrors.driver_id}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Cargo Weight (kg)</label>
              <input
                type="number"
                className={`form-input ${formErrors.cargo_weight ? 'error' : ''}`}
                value={formData.cargo_weight}
                onChange={(e) => setFormData({ ...formData, cargo_weight: e.target.value })}
                placeholder="e.g. 15000"
              />
              {formErrors.cargo_weight && <span className="form-error-msg">{formErrors.cargo_weight}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Planned Distance (km)</label>
              <input
                type="number"
                className={`form-input ${formErrors.planned_distance ? 'error' : ''}`}
                value={formData.planned_distance}
                onChange={(e) => setFormData({ ...formData, planned_distance: e.target.value })}
                placeholder="e.g. 380"
              />
              {formErrors.planned_distance && <span className="form-error-msg">{formErrors.planned_distance}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={editId && (formData.status === 'Dispatched' || formData.status === 'Completed')}
            >
              <option value="Draft">Draft</option>
              <option value="Dispatched" disabled={!editId}>Dispatched (Trigger via Dispatch button)</option>
              <option value="Completed" disabled>Completed (Trigger via Complete button)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Trip Plan
            </button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default Trips;
