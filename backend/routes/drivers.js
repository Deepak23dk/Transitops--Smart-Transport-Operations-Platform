import express from 'express';
import { dbQuery, dbGet, dbRun } from '../database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateDriver } from '../middleware/validation.js';

const router = express.Router();

// GET /api/drivers - Read all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const drivers = await dbQuery('SELECT * FROM drivers ORDER BY id DESC');
    res.json(drivers);
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET /api/drivers/:id - Read one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const driver = await dbGet('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (err) {
    console.error('Error fetching driver:', err);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// POST /api/drivers - Create
router.post('/', authenticateToken, authorizeRoles('FleetManager', 'SafetyOfficer'), validateDriver, async (req, res) => {
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score, status } = req.body;

  try {
    // Check if unique license number
    const existing = await dbGet('SELECT id FROM drivers WHERE license_number = ?', [license_number]);
    if (existing) {
      return res.status(400).json({ error: `Driver with license number '${license_number}' already exists` });
    }

    const result = await dbRun(
      'INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, license_number, license_category, license_expiry_date, contact_number, safety_score, status]
    );

    const newDriver = await dbGet('SELECT * FROM drivers WHERE id = ?', [result.id]);
    res.status(201).json(newDriver);
  } catch (err) {
    console.error('Error creating driver:', err);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// PUT /api/drivers/:id - Update
router.put('/:id', authenticateToken, authorizeRoles('FleetManager', 'SafetyOfficer'), validateDriver, async (req, res) => {
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score, status } = req.body;
  const { id } = req.params;

  try {
    const driver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id]);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check unique license number if changed
    const existing = await dbGet('SELECT id FROM drivers WHERE license_number = ? AND id != ?', [license_number, id]);
    if (existing) {
      return res.status(400).json({ error: `Driver with license number '${license_number}' already exists` });
    }

    await dbRun(
      'UPDATE drivers SET name = ?, license_number = ?, license_category = ?, license_expiry_date = ?, contact_number = ?, safety_score = ?, status = ? WHERE id = ?',
      [name, license_number, license_category, license_expiry_date, contact_number, safety_score, status, id]
    );

    const updatedDriver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id]);
    res.json(updatedDriver);
  } catch (err) {
    console.error('Error updating driver:', err);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

// DELETE /api/drivers/:id - Delete
router.delete('/:id', authenticateToken, authorizeRoles('FleetManager', 'SafetyOfficer'), async (req, res) => {
  const { id } = req.params;
  try {
    const driver = await dbGet('SELECT * FROM drivers WHERE id = ?', [id]);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check if driver has associated trips that restrict deletion
    const trips = await dbGet('SELECT id FROM trips WHERE driver_id = ? LIMIT 1', [id]);
    if (trips) {
      return res.status(400).json({ error: 'Cannot delete driver because they have associated trips. Please cancel or delete the trips first.' });
    }

    await dbRun('DELETE FROM drivers WHERE id = ?', [id]);
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error('Error deleting driver:', err);
    res.status(500).json({ error: 'Failed to delete driver' });
  }
});

export default router;
