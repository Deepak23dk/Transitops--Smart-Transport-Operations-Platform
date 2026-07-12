import express from 'express';
import { dbQuery } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    // 1. Fleet utilization breakdown
    const fleetStatus = await dbQuery(`
      SELECT status, COUNT(*) AS count, 
             ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM vehicles), 1) AS percentage
      FROM vehicles
      GROUP BY status
    `);

    // 2. Financial expense logs grouped by date (last 30 days) for trend charts
    const dailyExpenses = await dbQuery(`
      SELECT date, SUM(amount) AS total 
      FROM expenses 
      GROUP BY date 
      ORDER BY date ASC 
      LIMIT 30
    `);

    // 3. Financial expense logs grouped by category
    const categoryExpenses = await dbQuery(`
      SELECT category, SUM(amount) AS total 
      FROM expenses 
      GROUP BY category
    `);

    // 4. Safety scores summary
    const driverSafety = await dbQuery(`
      SELECT id, name, safety_score, status, license_expiry_date
      FROM drivers 
      ORDER BY safety_score DESC
    `);

    // 5. Trip summary averages
    const tripMetrics = await dbQuery(`
      SELECT COUNT(*) AS total_trips,
             AVG(planned_distance) AS avg_distance,
             AVG(cargo_weight) AS avg_weight,
             status
      FROM trips
      GROUP BY status
    `);

    res.json({
      fleetStatus,
      dailyExpenses,
      categoryExpenses,
      driverSafety,
      tripMetrics
    });
  } catch (err) {
    console.error('Error generating reports:', err);
    res.status(500).json({ error: 'Failed to generate reports data' });
  }
});

export default router;
