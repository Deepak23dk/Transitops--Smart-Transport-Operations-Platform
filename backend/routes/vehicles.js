import express from 'express';
import { dbQuery, dbGet, dbRun } from '../database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateVehicle } from '../middleware/validation.js';

const router = express.Router();

// GET /api/vehicles - Read all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const vehicles = await dbQuery('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(vehicles);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET /api/vehicles/:id - Read one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const vehicle = await dbGet('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (err) {
    console.error('Error fetching vehicle:', err);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// POST /api/vehicles - Create
router.post('/', authenticateToken, authorizeRoles('FleetManager'), validateVehicle, async (req, res) => {
  const { registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status } = req.body;

  try {
    // Check if unique registration number
    const existing = await dbGet('SELECT id FROM vehicles WHERE registration_number = ?', [registration_number]);
    if (existing) {
      return res.status(400).json({ error: `Vehicle with registration number '${registration_number}' already exists` });
    }

    const result = await dbRun(
      'INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status]
    );

    const newVehicle = await dbGet('SELECT * FROM vehicles WHERE id = ?', [result.id]);
    res.status(201).json(newVehicle);
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// PUT /api/vehicles/:id - Update
router.put('/:id', authenticateToken, authorizeRoles('FleetManager'), validateVehicle, async (req, res) => {
  const { registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status } = req.body;
  const { id } = req.params;

  try {
    const vehicle = await dbGet('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check unique registration number if changed
    const existing = await dbGet('SELECT id FROM vehicles WHERE registration_number = ? AND id != ?', [registration_number, id]);
    if (existing) {
      return res.status(400).json({ error: `Vehicle with registration number '${registration_number}' already exists` });
    }

    await dbRun(
      'UPDATE vehicles SET registration_number = ?, name_model = ?, type = ?, max_load_capacity = ?, odometer = ?, acquisition_cost = ?, status = ? WHERE id = ?',
      [registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status, id]
    );

    const updatedVehicle = await dbGet('SELECT * FROM vehicles WHERE id = ?', [id]);
    res.json(updatedVehicle);
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /api/vehicles/:id - Delete
router.delete('/:id', authenticateToken, authorizeRoles('FleetManager'), async (req, res) => {
  const { id } = req.params;
  try {
    const vehicle = await dbGet('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if vehicle has associated trips or logs that restrict deletion
    const trips = await dbGet('SELECT id FROM trips WHERE vehicle_id = ? LIMIT 1', [id]);
    if (trips) {
      return res.status(400).json({ error: 'Cannot delete vehicle because it has associated trips. Please cancel or delete the trips first.' });
    }

    await dbRun('DELETE FROM vehicles WHERE id = ?', [id]);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

export default router;
