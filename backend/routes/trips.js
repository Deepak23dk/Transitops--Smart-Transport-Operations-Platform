import express from 'express';
import { dbQuery, dbGet, dbRun, dbTransaction } from '../database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateTrip } from '../middleware/validation.js';

const router = express.Router();

// GET /api/trips - Read all with vehicle and driver info
router.get('/', authenticateToken, async (req, res) => {
  try {
    const trips = await dbQuery(`
      SELECT t.*, 
             v.name_model AS vehicle_name, v.registration_number AS vehicle_registration, v.max_load_capacity AS vehicle_capacity,
             d.name AS driver_name, d.license_number AS driver_license, d.license_expiry_date AS driver_license_expiry
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `);
    res.json(trips);
  } catch (err) {
    console.error('Error fetching trips:', err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /api/trips/:id - Read one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const trip = await dbGet(`
      SELECT t.*, 
             v.name_model AS vehicle_name, v.registration_number AS vehicle_registration, v.max_load_capacity AS vehicle_capacity,
             d.name AS driver_name, d.license_number AS driver_license, d.license_expiry_date AS driver_license_expiry
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (err) {
    console.error('Error fetching trip:', err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// POST /api/trips - Create (Default status Draft)
router.post('/', authenticateToken, authorizeRoles('FleetManager'), validateTrip, async (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status } = req.body;

  try {
    // Check if vehicle and driver exist
    const vehicle = await dbGet('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(400).json({ error: 'Selected vehicle does not exist' });
    }

    const driver = await dbGet('SELECT id FROM drivers WHERE id = ?', [driver_id]);
    if (!driver) {
      return res.status(400).json({ error: 'Selected driver does not exist' });
    }

    const result = await dbRun(
      'INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status || 'Draft']
    );

    const newTrip = await dbGet('SELECT * FROM trips WHERE id = ?', [result.id]);
    res.status(201).json(newTrip);
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// PUT /api/trips/:id - Update
router.put('/:id', authenticateToken, authorizeRoles('FleetManager'), validateTrip, async (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status } = req.body;
  const { id } = req.params;

  try {
    const trip = await dbGet('SELECT * FROM trips WHERE id = ?', [id]);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status === 'Dispatched' || trip.status === 'Completed') {
      return res.status(400).json({ error: `Cannot update a trip that is already ${trip.status.toLowerCase()}` });
    }

    // Check if vehicle and driver exist
    const vehicle = await dbGet('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(400).json({ error: 'Selected vehicle does not exist' });
    }

    const driver = await dbGet('SELECT id FROM drivers WHERE id = ?', [driver_id]);
    if (!driver) {
      return res.status(400).json({ error: 'Selected driver does not exist' });
    }

    await dbRun(
      'UPDATE trips SET source = ?, destination = ?, vehicle_id = ?, driver_id = ?, cargo_weight = ?, planned_distance = ?, status = ? WHERE id = ?',
      [source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status, id]
    );

    const updatedTrip = await dbGet('SELECT * FROM trips WHERE id = ?', [id]);
    res.json(updatedTrip);
  } catch (err) {
    console.error('Error updating trip:', err);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// POST /api/trips/:id/dispatch - Dispatch Trip Business Logic
router.post('/:id/dispatch', authenticateToken, authorizeRoles('FleetManager'), async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await dbGet('SELECT * FROM trips WHERE id = ?', [id]);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status === 'Dispatched') {
      return res.status(400).json({ error: 'Trip is already dispatched' });
    }
    if (trip.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot dispatch a completed trip' });
    }

    const vehicle = await dbGet('SELECT * FROM vehicles WHERE id = ?', [trip.vehicle_id]);
    const driver = await dbGet('SELECT * FROM drivers WHERE id = ?', [trip.driver_id]);

    if (!vehicle) {
      return res.status(400).json({ error: 'Associated vehicle not found' });
    }
    if (!driver) {
      return res.status(400).json({ error: 'Associated driver not found' });
    }

    // Business Rule 1: Validate cargo weight against vehicle capacity
    if (trip.cargo_weight > vehicle.max_load_capacity) {
      return res.status(400).json({
        error: `Cargo weight (${trip.cargo_weight} kg) exceeds vehicle maximum capacity (${vehicle.max_load_capacity} kg)`
      });
    }

    // Business Rule 2: Validate driver license isn't expired
    const currentDate = new Date().toISOString().split('T')[0];
    if (driver.license_expiry_date < currentDate) {
      return res.status(400).json({
        error: `Driver's license expired on ${driver.license_expiry_date}. Cannot dispatch.`
      });
    }

    // Business Rule 3: Check driver and vehicle statuses are 'Available'
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ error: `Vehicle is currently not available (status: ${vehicle.status})` });
    }
    if (driver.status !== 'Available') {
      return res.status(400).json({ error: `Driver is currently not available (status: ${driver.status})` });
    }

    // Transactional status changes
    await dbTransaction([
      { sql: 'UPDATE vehicles SET status = "On Trip" WHERE id = ?', params: [vehicle.id] },
      { sql: 'UPDATE drivers SET status = "On Trip" WHERE id = ?', params: [driver.id] },
      { sql: 'UPDATE trips SET status = "Dispatched" WHERE id = ?', params: [trip.id] }
    ]);

    res.json({ message: 'Trip successfully dispatched. Vehicle and driver status updated to "On Trip".' });
  } catch (err) {
    console.error('Error dispatching trip:', err);
    res.status(500).json({ error: 'Failed to dispatch trip: ' + err.message });
  }
});

// POST /api/trips/:id/complete - Complete Trip Business Logic
router.post('/:id/complete', authenticateToken, authorizeRoles('FleetManager'), async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await dbGet('SELECT * FROM trips WHERE id = ?', [id]);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Only dispatched trips can be completed' });
    }

    const vehicle = await dbGet('SELECT * FROM vehicles WHERE id = ?', [trip.vehicle_id]);
    const driver = await dbGet('SELECT * FROM drivers WHERE id = ?', [trip.driver_id]);

    await dbTransaction([
      { sql: 'UPDATE vehicles SET status = "Available", odometer = odometer + ? WHERE id = ?', params: [trip.planned_distance, trip.vehicle_id] },
      { sql: 'UPDATE drivers SET status = "Available" WHERE id = ?', params: [trip.driver_id] },
      { sql: 'UPDATE trips SET status = "Completed" WHERE id = ?', params: [trip.id] }
    ]);

    res.json({ message: 'Trip successfully completed. Vehicle status set to "Available" (odometer updated) and driver set to "Available".' });
  } catch (err) {
    console.error('Error completing trip:', err);
    res.status(500).json({ error: 'Failed to complete trip: ' + err.message });
  }
});

// POST /api/trips/:id/cancel - Cancel Trip Business Logic
router.post('/:id/cancel', authenticateToken, authorizeRoles('FleetManager'), async (req, res) => {
  const { id } = req.params;

  try {
    const trip = await dbGet('SELECT * FROM trips WHERE id = ?', [id]);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status === 'Completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed trip' });
    }

    const isDispatched = trip.status === 'Dispatched';

    const queries = [
      { sql: 'UPDATE trips SET status = "Cancelled" WHERE id = ?', params: [trip.id] }
    ];

    if (isDispatched) {
      queries.push({ sql: 'UPDATE vehicles SET status = "Available" WHERE id = ?', params: [trip.vehicle_id] });
      queries.push({ sql: 'UPDATE drivers SET status = "Available" WHERE id = ?', params: [trip.driver_id] });
    }

    await dbTransaction(queries);

    res.json({ message: 'Trip successfully cancelled. Driver and vehicle status reverted if they were dispatched.' });
  } catch (err) {
    console.error('Error cancelling trip:', err);
    res.status(500).json({ error: 'Failed to cancel trip: ' + err.message });
  }
});

// DELETE /api/trips/:id - Delete
router.delete('/:id', authenticateToken, authorizeRoles('FleetManager'), async (req, res) => {
  const { id } = req.params;
  try {
    const trip = await dbGet('SELECT * FROM trips WHERE id = ?', [id]);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status === 'Dispatched') {
      return res.status(400).json({ error: 'Cannot delete a trip that is currently dispatched. Cancel it first.' });
    }

    await dbRun('DELETE FROM trips WHERE id = ?', [id]);
    res.json({ message: 'Trip deleted successfully' });
  } catch (err) {
    console.error('Error deleting trip:', err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

export default router;
