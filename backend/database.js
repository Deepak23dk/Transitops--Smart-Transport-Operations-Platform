import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path at the workspace root
const dbPath = join(__dirname, '../transitops.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error('Failed to enable foreign keys:', pragmaErr);
      } else {
        console.log('SQLite Foreign Keys enabled.');
      }
    });
  }
});

// Promise-based helpers
export const dbQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('dbQuery Error executing:', sql, 'params:', params, 'error:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('dbGet Error executing:', sql, 'params:', params, 'error:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        console.error('dbRun Error executing:', sql, 'params:', params, 'error:', err);
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Transaction runner
export const dbTransaction = async (queries) => {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      db.run('BEGIN TRANSACTION;');
      try {
        const results = [];
        for (const q of queries) {
          const res = await new Promise((resIdx, rejIdx) => {
            db.run(q.sql, q.params || [], function (err) {
              if (err) rejIdx(err);
              else resIdx({ id: this.lastID, changes: this.changes });
            });
          });
          results.push(res);
        }
        db.run('COMMIT;', (commitErr) => {
          if (commitErr) reject(commitErr);
          else resolve(results);
        });
      } catch (err) {
        db.run('ROLLBACK;', () => {
          reject(err);
        });
      }
    });
  });
};

export const initDb = async () => {
  console.log('Initializing database tables...');
  
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('FleetManager', 'Driver', 'SafetyOfficer', 'FinancialAnalyst')),
      name TEXT NOT NULL
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_number TEXT UNIQUE NOT NULL,
      name_model TEXT NOT NULL,
      type TEXT NOT NULL,
      max_load_capacity REAL NOT NULL CHECK (max_load_capacity > 0),
      odometer REAL NOT NULL CHECK (odometer >= 0),
      acquisition_cost REAL NOT NULL CHECK (acquisition_cost >= 0),
      status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired'))
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_number TEXT UNIQUE NOT NULL,
      license_category TEXT NOT NULL,
      license_expiry_date TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      safety_score REAL NOT NULL CHECK (safety_score BETWEEN 0 AND 100),
      status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended'))
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      vehicle_id INTEGER NOT NULL,
      driver_id INTEGER NOT NULL,
      cargo_weight REAL NOT NULL CHECK (cargo_weight > 0),
      planned_distance REAL NOT NULL CHECK (planned_distance > 0),
      status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      cost REAL NOT NULL CHECK (cost >= 0),
      performed_by TEXT NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS fuel_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      fuel_quantity REAL NOT NULL CHECK (fuel_quantity > 0),
      cost REAL NOT NULL CHECK (cost >= 0),
      odometer_reading REAL NOT NULL CHECK (odometer_reading >= 0),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      category TEXT NOT NULL CHECK (category IN ('Fuel', 'Maintenance', 'Tolls', 'Salaries', 'Other')),
      amount REAL NOT NULL CHECK (amount > 0),
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
    );
  `);

  console.log('Database tables verified/created successfully.');
};

export default db;
