import express from 'express';
import { dbQuery, dbGet, dbRun, dbTransaction } from '../database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateMaintenanceLog } from '../middleware/validation.js';

const router = express.Router();

// GET /api/maintenance - Read all with vehicle registration
router.get('/', authenticateToken, async (req, res) => {
  try {
    const logs = await dbQuery(`
      SELECT m.*, v.registration_number AS vehicle_registration, v.name_model AS vehicle_name
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.date DESC, m.id DESC
    `);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching maintenance logs:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

// POST /api/maintenance - Create
router.post('/', authenticateToken, authorizeRoles('FleetManager', 'SafetyOfficer'), validateMaintenanceLog, async (req, res) => {
  const { vehicle_id, date, description, cost, performed_by } = req.body;

  try {
    const vehicle = await dbGet('SELECT id, registration_number FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(400).json({ error: 'Associated vehicle not found' });
    }

    // Insert maintenance log and expense record together
    const insertLogSql = 'INSERT INTO maintenance_logs (vehicle_id, date, description, cost, performed_by) VALUES (?, ?, ?, ?, ?)';
    const insertLogParams = [vehicle_id, date, description, cost, performed_by];

    const expenseDesc = `Maintenance: ${description} (Vehicle: ${vehicle.registration_number})`;
    const insertExpenseSql = 'INSERT INTO expenses (trip_id, category, amount, date, description) VALUES (NULL, "Maintenance", ?, ?, ?)';
    const insertExpenseParams = [cost, date, expenseDesc];

    const result = await dbRun(insertLogSql, insertLogParams);
    
    // Log expense if cost is greater than 0
    if (cost > 0) {
      await dbRun(insertExpenseSql, insertExpenseParams);
    }

    const newLog = await dbGet('SELECT * FROM maintenance_logs WHERE id = ?', [result.id]);
    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error logging maintenance:', err);
    res.status(500).json({ error: 'Failed to log maintenance' });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', authenticateToken, authorizeRoles('FleetManager'), async (req, res) => {
  try {
    const log = await dbGet('SELECT * FROM maintenance_logs WHERE id = ?', [req.params.id]);
    if (!log) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    // Optionally delete from expenses as well. Since we don't have direct linkage, we can find by matching description, or just delete the log.
    // Deleting the log itself is enough.
    await dbRun('DELETE FROM maintenance_logs WHERE id = ?', [req.params.id]);
    res.json({ message: 'Maintenance log deleted successfully' });
  } catch (err) {
    console.error('Error deleting maintenance log:', err);
    res.status(500).json({ error: 'Failed to delete maintenance log' });
  }
});

export default router;
