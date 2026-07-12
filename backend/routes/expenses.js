import express from 'express';
import { dbQuery, dbGet, dbRun } from '../database.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateExpense } from '../middleware/validation.js';

const router = express.Router();

// GET /api/expenses - Read all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const expenses = await dbQuery(`
      SELECT e.*, t.source AS trip_source, t.destination AS trip_destination
      FROM expenses e
      LEFT JOIN trips t ON e.trip_id = t.id
      ORDER BY e.date DESC, e.id DESC
    `);
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses - Create
router.post('/', authenticateToken, authorizeRoles('FleetManager', 'FinancialAnalyst'), validateExpense, async (req, res) => {
  const { trip_id, category, amount, date, description } = req.body;

  try {
    if (trip_id) {
      const trip = await dbGet('SELECT id FROM trips WHERE id = ?', [trip_id]);
      if (!trip) {
        return res.status(400).json({ error: 'Associated trip not found' });
      }
    }

    const result = await dbRun(
      'INSERT INTO expenses (trip_id, category, amount, date, description) VALUES (?, ?, ?, ?, ?)',
      [trip_id, category, amount, date, description]
    );

    const newExpense = await dbGet('SELECT * FROM expenses WHERE id = ?', [result.id]);
    res.status(201).json(newExpense);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id - Update
router.put('/:id', authenticateToken, authorizeRoles('FleetManager', 'FinancialAnalyst'), validateExpense, async (req, res) => {
  const { trip_id, category, amount, date, description } = req.body;
  const { id } = req.params;

  try {
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    if (trip_id) {
      const trip = await dbGet('SELECT id FROM trips WHERE id = ?', [trip_id]);
      if (!trip) {
        return res.status(400).json({ error: 'Associated trip not found' });
      }
    }

    await dbRun(
      'UPDATE expenses SET trip_id = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?',
      [trip_id, category, amount, date, description, id]
    );

    const updatedExpense = await dbGet('SELECT * FROM expenses WHERE id = ?', [id]);
    res.json(updatedExpense);
  } catch (err) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete
router.delete('/:id', authenticateToken, authorizeRoles('FleetManager', 'FinancialAnalyst'), async (req, res) => {
  try {
    const expense = await dbGet('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    await dbRun('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
