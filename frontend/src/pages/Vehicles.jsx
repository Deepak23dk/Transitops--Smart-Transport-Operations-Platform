import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

const Vehicles = ({ token, user, showToast }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    registration_number: '',
    name_model: '',
    type: 'Semi-Truck',
    max_load_capacity: '',
    odometer: '',
    acquisition_cost: '',
    status: 'Available'
  });
  const [formErrors, setFormErrors] = useState({});

  const isManager = user?.role === 'FleetManager';

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch vehicles');
      setVehicles(data);
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
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
    setFormData({
      registration_number: '',
      name_model: '',
      type: 'Semi-Truck',
      max_load_capacity: '',
      odometer: '0',
      acquisition_cost: '',
      status: 'Available'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditId(vehicle.id);
    setFormData({
      registration_number: vehicle.registration_number,
      name_model: vehicle.name_model,
      type: vehicle.type,
      max_load_capacity: vehicle.max_load_capacity.toString(),
      odometer: vehicle.odometer.toString(),
      acquisition_cost: vehicle.acquisition_cost.toString(),
      status: vehicle.status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.registration_number.trim()) errors.registration_number = 'Registration number is required';
    if (!formData.name_model.trim()) errors.name_model = 'Model/Name is required';
    if (!formData.type) errors.type = 'Vehicle type is required';
    
    const cap = Number(formData.max_load_capacity);
    if (isNaN(cap) || cap <= 0) errors.max_load_capacity = 'Max load capacity must be a positive number';
    
    const odo = Number(formData.odometer);
    if (isNaN(odo) || odo < 0) errors.odometer = 'Odometer reading cannot be negative';
    
    const cost = Number(formData.acquisition_cost);
    if (isNaN(cost) || cost < 0) errors.acquisition_cost = 'Acquisition cost cannot be negative';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const url = editId ? `/api/vehicles/${editId}` : '/api/vehicles';
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
      if (!response.ok) throw new Error(data.error || 'Failed to save vehicle');

      showToast(
        'Success',
        `Vehicle ${formData.registration_number} ${editId ? 'updated' : 'registered'} successfully`,
        'success'
      );
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id, regNum) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${regNum}?`)) return;

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete vehicle');

      showToast('Deleted', `Vehicle ${regNum} deleted successfully`, 'success');
      fetchVehicles();
    } catch (err) {
      showToast('Deletion Failed', err.message, 'error');
    }
  };

  // Filter and sort computation
  const filteredVehicles = vehicles
    .filter(v => 
      v.registration_number.toLowerCase().includes(search.toLowerCase()) ||
      v.name_model.toLowerCase().includes(search.toLowerCase()) ||
      v.type.toLowerCase().includes(search.toLowerCase())
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
      case 'Available': return 'pill-vehicle-available';
      case 'On Trip': return 'pill-vehicle-ontrip';
      case 'In Shop': return 'pill-vehicle-inshop';
      case 'Retired': return 'pill-vehicle-retired';
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
            placeholder="Search by model, plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isManager && (
          <button onClick={openAddModal} className="btn btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Register Vehicle
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            Loading vehicles catalog...
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>ID {sortBy === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('registration_number')}>Plate {sortBy === 'registration_number' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('name_model')}>Make / Model {sortBy === 'name_model' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('type')}>Type {sortBy === 'type' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('max_load_capacity')}>Max Load (kg) {sortBy === 'max_load_capacity' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('odometer')}>Odometer (km) {sortBy === 'odometer' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('acquisition_cost')}>Acquisition Cost {sortBy === 'acquisition_cost' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length > 0 ? (
                filteredVehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td style={{ fontWeight: '700' }}>{v.registration_number}</td>
                    <td>{v.name_model}</td>
                    <td>{v.type}</td>
                    <td>{v.max_load_capacity.toLocaleString()}</td>
                    <td>{v.odometer.toLocaleString()}</td>
                    <td>${v.acquisition_cost.toLocaleString()}</td>
                    <td>
                      <span className={`pill-badge ${getStatusBadge(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    {isManager && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(v)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(v.id, v.registration_number)}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isManager ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No vehicles found matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Register/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? `Edit Vehicle: ${formData.registration_number}` : 'Register New Fleet Vehicle'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Registration Number (Plate)</label>
              <input
                type="text"
                className={`form-input ${formErrors.registration_number ? 'error' : ''}`}
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.toUpperCase() })}
                placeholder="e.g. CA-1234-A"
              />
              {formErrors.registration_number && <span className="form-error-msg">{formErrors.registration_number}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Make / Model</label>
              <input
                type="text"
                className={`form-input ${formErrors.name_model ? 'error' : ''}`}
                value={formData.name_model}
                onChange={(e) => setFormData({ ...formData, name_model: e.target.value })}
                placeholder="e.g. Volvo FH16"
              />
              {formErrors.name_model && <span className="form-error-msg">{formErrors.name_model}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Vehicle Body Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Semi-Truck">Semi-Truck</option>
                <option value="Cargo Van">Cargo Van</option>
                <option value="Box Truck">Box Truck</option>
                <option value="Heavy Hauler">Heavy Hauler</option>
                <option value="Flatbed">Flatbed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Load Capacity (kg)</label>
              <input
                type="number"
                className={`form-input ${formErrors.max_load_capacity ? 'error' : ''}`}
                value={formData.max_load_capacity}
                onChange={(e) => setFormData({ ...formData, max_load_capacity: e.target.value })}
                placeholder="e.g. 25000"
              />
              {formErrors.max_load_capacity && <span className="form-error-msg">{formErrors.max_load_capacity}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Current Odometer (km)</label>
              <input
                type="number"
                className={`form-input ${formErrors.odometer ? 'error' : ''}`}
                value={formData.odometer}
                onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                placeholder="0"
              />
              {formErrors.odometer && <span className="form-error-msg">{formErrors.odometer}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Acquisition Cost ($)</label>
              <input
                type="number"
                className={`form-input ${formErrors.acquisition_cost ? 'error' : ''}`}
                value={formData.acquisition_cost}
                onChange={(e) => setFormData({ ...formData, acquisition_cost: e.target.value })}
                placeholder="e.g. 85000"
              />
              {formErrors.acquisition_cost && <span className="form-error-msg">{formErrors.acquisition_cost}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Operational Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Vehicle
            </button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
