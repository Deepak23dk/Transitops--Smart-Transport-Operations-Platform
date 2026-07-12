import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

const Drivers = ({ token, user, showToast }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    license_category: 'Class A CDL',
    license_expiry_date: '',
    contact_number: '',
    safety_score: '',
    status: 'Available'
  });
  const [formErrors, setFormErrors] = useState({});

  const hasWriteAccess = user?.role === 'FleetManager' || user?.role === 'SafetyOfficer';

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/drivers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch drivers');
      setDrivers(data);
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
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
      name: '',
      license_number: '',
      license_category: 'Class A CDL',
      license_expiry_date: '',
      contact_number: '',
      safety_score: '100',
      status: 'Available'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (driver) => {
    setEditId(driver.id);
    setFormData({
      name: driver.name,
      license_number: driver.license_number,
      license_category: driver.license_category,
      license_expiry_date: driver.license_expiry_date,
      contact_number: driver.contact_number,
      safety_score: driver.safety_score.toString(),
      status: driver.status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Driver name is required';
    if (!formData.license_number.trim()) errors.license_number = 'License number is required';
    if (!formData.license_category.trim()) errors.license_category = 'License category is required';
    
    if (!formData.license_expiry_date) {
      errors.license_expiry_date = 'License expiry date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.license_expiry_date)) {
      errors.license_expiry_date = 'Use YYYY-MM-DD date format';
    }

    if (!formData.contact_number.trim()) errors.contact_number = 'Contact number is required';

    const score = Number(formData.safety_score);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.safety_score = 'Safety score must be between 0 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const url = editId ? `/api/drivers/${editId}` : '/api/drivers';
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
      if (!response.ok) throw new Error(data.error || 'Failed to save driver');

      showToast(
        'Success',
        `Driver ${formData.name} ${editId ? 'updated' : 'registered'} successfully`,
        'success'
      );
      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete driver ${name}?`)) return;

    try {
      const response = await fetch(`/api/drivers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete driver');

      showToast('Deleted', `Driver ${name} deleted successfully`, 'success');
      fetchDrivers();
    } catch (err) {
      showToast('Deletion Failed', err.message, 'error');
    }
  };

  const getSafetyBadgeStyle = (score) => {
    if (score >= 85) return 'badge-safety-green';
    if (score >= 70) return 'badge-safety-yellow';
    return 'badge-safety-red';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return 'pill-driver-available';
      case 'On Trip': return 'pill-driver-ontrip';
      case 'Off Duty': return 'pill-driver-offduty';
      case 'Suspended': return 'pill-driver-suspended';
      default: return '';
    }
  };

  const isLicenseExpired = (expiryStr) => {
    const today = new Date().toISOString().split('T')[0];
    return expiryStr < today;
  };

  // Filter and Sort computation
  const filteredDrivers = drivers
    .filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.license_number.toLowerCase().includes(search.toLowerCase()) ||
      d.contact_number.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search by name, DL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {hasWriteAccess && (
          <button onClick={openAddModal} className="btn btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Driver
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            Loading driver roster...
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')}>ID {sortBy === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('name')}>Driver Name {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('license_number')}>License No. {sortBy === 'license_number' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('license_category')}>Class {sortBy === 'license_category' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('license_expiry_date')}>Expiry Date {sortBy === 'license_expiry_date' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th>Contact</th>
                <th onClick={() => handleSort('safety_score')}>Safety Score {sortBy === 'safety_score' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => handleSort('status')}>Status {sortBy === 'status' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                {hasWriteAccess && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map((d) => {
                  const expired = isLicenseExpired(d.license_expiry_date);
                  return (
                    <tr key={d.id}>
                      <td>{d.id}</td>
                      <td style={{ fontWeight: '700' }}>{d.name}</td>
                      <td>{d.license_number}</td>
                      <td>{d.license_category}</td>
                      <td style={{ color: expired ? '#EF4444' : 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {d.license_expiry_date}
                          {expired && (
                            <span
                              className="pill-badge"
                              style={{ padding: '2px 6px', fontSize: '9px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                            >
                              Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{d.contact_number}</td>
                      <td>
                        <span className={`pill-badge ${getSafetyBadgeStyle(d.safety_score)}`}>
                          {d.safety_score}%
                        </span>
                      </td>
                      <td>
                        <span className={`pill-badge ${getStatusBadge(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      {hasWriteAccess && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => openEditModal(d)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(d.id, d.name)}
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={hasWriteAccess ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                    No drivers found matching search.
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
        title={editId ? `Edit Driver Profile: ${formData.name}` : 'Register New Fleet Driver'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className={`form-input ${formErrors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. John Doe"
            />
            {formErrors.name && <span className="form-error-msg">{formErrors.name}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">License Number</label>
              <input
                type="text"
                className={`form-input ${formErrors.license_number ? 'error' : ''}`}
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value.toUpperCase() })}
                placeholder="e.g. DL-12345678"
              />
              {formErrors.license_number && <span className="form-error-msg">{formErrors.license_number}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">License Category</label>
              <select
                className="form-select"
                value={formData.license_category}
                onChange={(e) => setFormData({ ...formData, license_category: e.target.value })}
              >
                <option value="Class A CDL">Class A CDL (Commercial Semi)</option>
                <option value="Class B CDL">Class B CDL (Commercial Box)</option>
                <option value="Class C CDL">Class C CDL (Van/Light Vehicle)</option>
                <option value="Standard Driver License">Standard Driver License</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">License Expiry Date</label>
              <input
                type="date"
                className={`form-input ${formErrors.license_expiry_date ? 'error' : ''}`}
                value={formData.license_expiry_date}
                onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })}
              />
              {formErrors.license_expiry_date && <span className="form-error-msg">{formErrors.license_expiry_date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone Number</label>
              <input
                type="text"
                className={`form-input ${formErrors.contact_number ? 'error' : ''}`}
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="e.g. +1-555-0199"
              />
              {formErrors.contact_number && <span className="form-error-msg">{formErrors.contact_number}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Safety Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className={`form-input ${formErrors.safety_score ? 'error' : ''}`}
                value={formData.safety_score}
                onChange={(e) => setFormData({ ...formData, safety_score: e.target.value })}
                placeholder="100"
              />
              {formErrors.safety_score && <span className="form-error-msg">{formErrors.safety_score}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Duty Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="Off Duty">Off Duty</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Profile
            </button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
