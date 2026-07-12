import express from 'express';
import { dbGet, dbQuery } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalVehicles = await dbGet('SELECT COUNT(*) AS count FROM vehicles');
    const activeTrips = await dbGet('SELECT COUNT(*) AS count FROM trips WHERE status = "Dispatched"');
    const availableDrivers = await dbGet('SELECT COUNT(*) AS count FROM drivers WHERE status = "Available"');
    
    // MTD Expenses (Month to Date). Today is July 12, 2026. We filter from 2026-07-01.
    const currentMonthStart = '2026-07-01';
    const mtdExpenses = await dbGet('SELECT SUM(amount) AS total FROM expenses WHERE date >= ?', [currentMonthStart]);
    
    // Safety score average
    const avgSafetyScore = await dbGet('SELECT AVG(safety_score) AS avg FROM drivers WHERE status != "Suspended"');

    // Recent dispatches
    const recentDispatches = await dbQuery(`
      SELECT t.*, v.registration_number, v.name_model AS vehicle_name, d.name AS driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC LIMIT 5
    `);

    // Vehicle status summary
    const vehicleStatusSummary = await dbQuery(`
      SELECT status, COUNT(*) AS count 
      FROM vehicles 
      GROUP BY status
    `);

    // Expense category breakdown
    const expenseBreakdown = await dbQuery(`
      SELECT category, SUM(amount) AS total 
      FROM expenses 
      GROUP BY category
    `);

    res.json({
      totalVehicles: totalVehicles.count,
      activeTrips: activeTrips.count,
      availableDrivers: availableDrivers.count,
      mtdExpenses: mtdExpenses.total || 0,
      avgSafetyScore: avgSafetyScore.avg ? Number(avgSafetyScore.avg.toFixed(1)) : 0,
      recentDispatches,
      vehicleStatusSummary,
      expenseBreakdown
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
