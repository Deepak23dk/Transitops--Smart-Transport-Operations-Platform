import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

const FuelExpenses = ({ token, user, showToast }) => {
  const [activeTab, setActiveTab] = useState('fuel'); // 'fuel' or 'expenses'
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Fuel modal states
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [fuelData, setFuelData] = useState({
    vehicle_id: '',
    date: '',
    fuel_quantity: '',
    cost: '',
    odometer_reading: ''
  });
  const [fuelErrors, setFuelErrors] = useState({});

  // Expense modal states
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseData, setExpenseData] = useState({
    trip_id: '',
    category: 'Other',
    amount: '',
    date: '',
    description: ''
  });
  const [expenseErrors, setExpenseErrors] = useState({});

  const canLogFuel = user?.role === 'FleetManager' || user?.role === 'Driver';
  const canLogExpense = user?.role === 'FleetManager' || user?.role === 'FinancialAnalyst';
  const isManager = user?.role === 'FleetManager';

  const fetchData = async () => {
    try {
      // Fetch fuel logs
      const fuelRes = await fetch('/api/fuel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const fuelDataRes = await fuelRes.json();
      if (fuelRes.ok) setFuelLogs(fuelDataRes);

      // Fetch expenses
      const expRes = await fetch('/api/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const expDataRes = await expRes.json();
      if (expRes.ok) setExpenses(expDataRes);

      // Fetch vehicles for drops
      const vehiclesRes = await fetch('/api/vehicles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const vehiclesData = await vehiclesRes.json();
      if (vehiclesRes.ok) setVehicles(vehiclesData);

      // Fetch trips for drops
      const tripsRes = await fetch('/api/trips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const tripsData = await tripsRes.json();
      if (tripsRes.ok) setTrips(tripsData);

    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Fuel modal actions
  const openFuelModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setFuelData({
      vehicle_id: vehicles[0]?.id.toString() || '',
      date: today,
      fuel_quantity: '',
      cost: '',
      odometer_reading: ''
    });
    setFuelErrors({});
    setIsFuelModalOpen(true);
  };

  const validateFuelForm = () => {
    const errors = {};
    if (!fuelData.vehicle_id) errors.vehicle_id = 'Vehicle is required';
    if (!fuelData.date) {
      errors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fuelData.date)) {
      errors.date = 'Use YYYY-MM-DD date format';
    }
    
    const qty = Number(fuelData.fuel_quantity);
    if (isNaN(qty) || qty <= 0) errors.fuel_quantity = 'Quantity must be positive';

    const cost = Number(fuelData.cost);
    if (isNaN(cost) || cost < 0) errors.cost = 'Cost cannot be negative';

    const odo = Number(fuelData.odometer_reading);
    if (isNaN(odo) || odo < 0) errors.odometer_reading = 'Odometer reading cannot be negative';

    setFuelErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveFuel = async (e) => {
    e.preventDefault();
    if (!validateFuelForm()) return;

    try {
      const response = await fetch('/api/fuel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fuelData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save fuel log');

      showToast('Success', 'Refuel logged and dynamic expense generated successfully', 'success');
      setIsFuelModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDeleteFuel = async (id) => {
    if (!window.confirm('Delete this fuel entry?')) return;

    try {
      const response = await fetch(`/api/fuel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete fuel log');

      showToast('Deleted', 'Fuel log entry deleted', 'success');
      fetchData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Expense modal actions
  const openExpenseModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setExpenseData({
      trip_id: '',
      category: 'Other',
      amount: '',
      date: today,
      description: ''
    });
    setExpenseErrors({});
    setIsExpenseModalOpen(true);
  };

  const validateExpenseForm = () => {
    const errors = {};
    if (!expenseData.category) errors.category = 'Category is required';
    if (!expenseData.date) {
      errors.date = 'Date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseData.date)) {
      errors.date = 'Use YYYY-MM-DD date format';
    }

    const amt = Number(expenseData.amount);
    if (isNaN(amt) || amt <= 0) errors.amount = 'Amount must be positive';

    if (!expenseData.description.trim()) errors.description = 'Description is required';

    setExpenseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!validateExpenseForm()) return;

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expenseData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to log expense');

      showToast('Success', 'Operational expense logged successfully', 'success');
      setIsExpenseModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense entry?')) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete expense');

      showToast('Deleted', 'Expense log entry deleted', 'success');
      fetchData();
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Filter logs
  const filteredFuel = fuelLogs.filter(l => 
    l.vehicle_registration.toLowerCase().includes(search.toLowerCase()) ||
    l.vehicle_name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    (e.trip_source && e.trip_source.toLowerCase().includes(search.toLowerCase())) ||
    (e.trip_destination && e.trip_destination.toLowerCase().includes(search.toLowerCase()))
  );

  // Financial aggregates
  const totalFuelQuantity = fuelLogs.reduce((acc, curr) => acc + curr.fuel_quantity, 0);
  const totalFuelCost = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
      
      {/* Dynamic Tab Switchers */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
        <button
          onClick={() => { setActiveTab('fuel'); setSearch(''); }}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: activeTab === 'fuel' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'fuel' ? '3px solid var(--accent-amber)' : '3px solid transparent',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            fontWeight: '600'
          }}
        >
          Fuel Logs
        </button>
        <button
          onClick={() => { setActiveTab('expenses'); setSearch(''); }}
          style={{
            padding: '12px 24px',
            backgroundColor: 'transparent',
            color: activeTab === 'expenses' ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'expenses' ? '3px solid var(--accent-amber)' : '3px solid transparent',
            borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
            fontWeight: '600'
          }}
        >
          Expense Ledger
        </button>
      </div>

      {/* Fuel logs segment */}
      {activeTab === 'fuel' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Fuel cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Fleet Refuel quantity</span>
              <div style={{ fontSize: '28px', fontWeight: '700' }}>{totalFuelQuantity.toLocaleString(undefined, { maximumFractionDigits: 1 })} Liters</div>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cumulative Fuel Spend</span>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-amber)' }}>
                ${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="search-controls">
            <div className="search-input-wrapper">
              <svg className="search-icon-svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search fuel by vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {canLogFuel && (
              <button onClick={openFuelModal} className="btn btn-primary">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Log Refuel Event
              </button>
            )}
          </div>

          {/* Table */}
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Loading fuel registries...</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle Plate</th>
                    <th>Model</th>
                    <th>Date</th>
                    <th>Fuel (Liters)</th>
                    <th>Cost ($)</th>
                    <th>Odometer (km)</th>
                    {isManager && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredFuel.length > 0 ? (
                    filteredFuel.map((l) => (
                      <tr key={l.id}>
                        <td>{l.id}</td>
                        <td style={{ fontWeight: '700' }}>{l.vehicle_registration}</td>
                        <td>{l.vehicle_name}</td>
                        <td>{l.date}</td>
                        <td>{l.fuel_quantity.toLocaleString()} L</td>
                        <td style={{ fontWeight: '600', color: '#F59E0B' }}>${l.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>{l.odometer_reading.toLocaleString()} km</td>
                        {isManager && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteFuel(l.id)}
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
                      <td colSpan={isManager ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                        No fuel logs found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Expenses Ledger segment */}
      {activeTab === 'expenses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Expense aggregate card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Cumulative Expenses</span>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--accent-amber)' }}>
              ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Controls */}
          <div className="search-controls">
            <div className="search-input-wrapper">
              <svg className="search-icon-svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search ledger by description, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {canLogExpense && (
              <button onClick={openExpenseModal} className="btn btn-primary">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Log Expense Entry
              </button>
            )}
          </div>

          {/* Table */}
          <div className="table-container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Loading ledger books...</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Amount ($)</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Linked Trip</th>
                    {canLogExpense && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((e) => (
                      <tr key={e.id}>
                        <td>{e.id}</td>
                        <td style={{ fontWeight: '700' }}>
                          <span
                            className="pill-badge"
                            style={{
                              backgroundColor: e.category === 'Fuel' ? 'rgba(59, 130, 246, 0.15)' : e.category === 'Maintenance' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: e.category === 'Fuel' ? '#3B82F6' : e.category === 'Maintenance' ? '#F59E0B' : '#10B981'
                            }}
                          >
                            {e.category}
                          </span>
                        </td>
                        <td style={{ fontWeight: '600', color: '#F59E0B' }}>${e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>{e.date}</td>
                        <td>{e.description}</td>
                        <td>
                          {e.trip_id ? (
                            <span style={{ fontSize: '13px' }}>
                              Trip #{e.trip_id} ({e.trip_source} → {e.trip_destination})
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>General Overhead</span>
                          )}
                        </td>
                        {canLogExpense && (
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
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
                      <td colSpan={canLogExpense ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                        No expenses found matching search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Log Refuel Modal */}
      <Modal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        title="Log Refuel Event"
      >
        <form onSubmit={handleSaveFuel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Select Vehicle</label>
            <select
              className="form-select"
              value={fuelData.vehicle_id}
              onChange={(e) => setFuelData({ ...fuelData, vehicle_id: e.target.value })}
            >
              <option value="">-- Choose Fleet Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name_model} ({v.registration_number}) - Current Odo: {v.odometer}km
                </option>
              ))}
            </select>
            {fuelErrors.vehicle_id && <span className="form-error-msg">{fuelErrors.vehicle_id}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Refuel Date</label>
              <input
                type="date"
                className={`form-input ${fuelErrors.date ? 'error' : ''}`}
                value={fuelData.date}
                onChange={(e) => setFuelData({ ...fuelData, date: e.target.value })}
              />
              {fuelErrors.date && <span className="form-error-msg">{fuelErrors.date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Fuel Quantity (Liters)</label>
              <input
                type="number"
                step="0.01"
                className={`form-input ${fuelErrors.fuel_quantity ? 'error' : ''}`}
                value={fuelData.fuel_quantity}
                onChange={(e) => setFuelData({ ...fuelData, fuel_quantity: e.target.value })}
                placeholder="0.00"
              />
              {fuelErrors.fuel_quantity && <span className="form-error-msg">{fuelErrors.fuel_quantity}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Refuel Cost ($)</label>
              <input
                type="number"
                step="0.01"
                className={`form-input ${fuelErrors.cost ? 'error' : ''}`}
                value={fuelData.cost}
                onChange={(e) => setFuelData({ ...fuelData, cost: e.target.value })}
                placeholder="0.00"
              />
              {fuelErrors.cost && <span className="form-error-msg">{fuelErrors.cost}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Odometer Reading (km)</label>
              <input
                type="number"
                className={`form-input ${fuelErrors.odometer_reading ? 'error' : ''}`}
                value={fuelData.odometer_reading}
                onChange={(e) => setFuelData({ ...fuelData, odometer_reading: e.target.value })}
                placeholder="e.g. 120500"
              />
              {fuelErrors.odometer_reading && <span className="form-error-msg">{fuelErrors.odometer_reading}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFuelModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log Fuel Stop
            </button>
          </div>

        </form>
      </Modal>

      {/* Log Expense Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record General Operating Expense"
      >
        <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Expense Date</label>
              <input
                type="date"
                className={`form-input ${expenseErrors.date ? 'error' : ''}`}
                value={expenseData.date}
                onChange={(e) => setExpenseData({ ...expenseData, date: e.target.value })}
              />
              {expenseErrors.date && <span className="form-error-msg">{expenseErrors.date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Expense Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className={`form-input ${expenseErrors.amount ? 'error' : ''}`}
                value={expenseData.amount}
                onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })}
                placeholder="0.00"
              />
              {expenseErrors.amount && <span className="form-error-msg">{expenseErrors.amount}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Expense Category</label>
              <select
                className="form-select"
                value={expenseData.category}
                onChange={(e) => setExpenseData({ ...expenseData, category: e.target.value })}
              >
                <option value="Tolls">Tolls</option>
                <option value="Salaries">Salaries</option>
                <option value="Fuel">Fuel (Direct Purchase)</option>
                <option value="Maintenance">Maintenance (Direct Spend)</option>
                <option value="Other">Other Overhead</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Link to Active Trip (Optional)</label>
              <select
                className="form-select"
                value={expenseData.trip_id}
                onChange={(e) => setExpenseData({ ...expenseData, trip_id: e.target.value })}
              >
                <option value="">-- No Linked Trip --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    Trip #{t.id} ({t.source} → {t.destination}) [{t.status}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Expense Description</label>
            <textarea
              rows="3"
              className={`form-input ${expenseErrors.description ? 'error' : ''}`}
              value={expenseData.description}
              onChange={(e) => setExpenseData({ ...expenseData, description: e.target.value })}
              placeholder="Detail reasons for this expense (e.g. Turnpike toll fees)..."
            />
            {expenseErrors.description && <span className="form-error-msg">{expenseErrors.description}</span>}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Log Expense
            </button>
          </div>

        </form>
      </Modal>
    </div>
  );
};

export default FuelExpenses;
