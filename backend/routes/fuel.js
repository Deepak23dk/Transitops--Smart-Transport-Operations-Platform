import express from 'express';
import { dbQuery, dbGet, dbRun } from '../database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateFuelLog } from '../middleware/validation.js';

const router = express.Router();

// GET /api/fuel - Read all with vehicle registration
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await dbQuery(`
      SELECT f.*, v.registration_number AS vehicle_registration, v.name_model AS vehicle_name
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      ORDER BY f.date DESC, f.id DESC
    `);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching fuel logs:', err);
    res.status(500).json({ error: 'Failed to fetch fuel logs' });
  }
});

// POST /api/fuel - Create (FleetManager and Driver can log)
router.post('/', authenticateToken, authorizeRoles('FleetManager', 'Driver'), validateFuelLog, async (req, res) => {
  const { vehicle_id, date, fuel_quantity, cost, odometer_reading } = req.body;

  try {
    const vehicle = await dbGet('SELECT id, registration_number, odometer FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(400).json({ error: 'Associated vehicle not found' });
    }

    // Insert fuel log
    const insertFuelSql = 'INSERT INTO fuel_logs (vehicle_id, date, fuel_quantity, cost, odometer_reading) VALUES (?, ?, ?, ?, ?)';
    const insertFuelParams = [vehicle_id, date, fuel_quantity, cost, odometer_reading];

    const expenseDesc = `Fuel: ${fuel_quantity}L at Odo ${odometer_reading} (Vehicle: ${vehicle.registration_number})`;
    const insertExpenseSql = 'INSERT INTO expenses (trip_id, category, amount, date, description) VALUES (NULL, "Fuel", ?, ?, ?)';
    const insertExpenseParams = [cost, date, expenseDesc];

    const result = await dbRun(insertFuelSql, insertFuelParams);

    // Update vehicle odometer if this reading is higher than current odometer
    if (odometer_reading > vehicle.odometer) {
      await dbRun('UPDATE vehicles SET odometer = ? WHERE id = ?', [odometer_reading, vehicle_id]);
    }

    // Log expense if cost > 0
    if (cost > 0) {
      await dbRun(insertExpenseSql, insertExpenseParams);
    }

    const newLog = await dbGet('SELECT * FROM fuel_logs WHERE id = ?', [result.id]);
    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error logging fuel:', err);
    res.status(500).json({ error: 'Failed to log fuel' });
  }
});

// DELETE /api/fuel/:id
router.delete('/:id', authenticateToken, authorizeRoles('FleetManager'), async (req, res) => {
  try {
    const log = await dbGet('SELECT * FROM fuel_logs WHERE id = ?', [req.params.id]);
    if (!log) {
      return res.status(404).json({ error: 'Fuel log not found' });
    }
    await dbRun('DELETE FROM fuel_logs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Fuel log deleted successfully' });
  } catch (err) {
    console.error('Error deleting fuel log:', err);
    res.status(500).json({ error: 'Failed to delete fuel log' });
  }
});

export default router;
