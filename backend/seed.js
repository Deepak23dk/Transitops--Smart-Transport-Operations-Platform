import bcrypt from 'bcryptjs';
import { initDb, dbRun, dbGet } from './database.js';

const hashPassword = (pwd) => bcrypt.hashSync(pwd, 10);

async function runSeed() {
  try {
    // 1. Initialize tables
    await initDb();

    console.log('Seeding database...');

    // 2. Clear old data (optional, but good for resetting)
    await dbRun('DELETE FROM expenses');
    await dbRun('DELETE FROM fuel_logs');
    await dbRun('DELETE FROM maintenance_logs');
    await dbRun('DELETE FROM trips');
    await dbRun('DELETE FROM drivers');
    await dbRun('DELETE FROM vehicles');
    await dbRun('DELETE FROM users');

    console.log('Cleared existing tables.');

    // 3. Seed Users
    const users = [
      { name: 'Alice Manager', username: 'alice', email: 'alice@transitops.com', role: 'FleetManager', password: hashPassword('password123') },
      { name: 'Bob Fleet', username: 'bob', email: 'bob@transitops.com', role: 'FleetManager', password: hashPassword('password123') },
      { name: 'Charlie Driver', username: 'charlie', email: 'charlie@transitops.com', role: 'Driver', password: hashPassword('password123') },
      { name: 'David Road', username: 'david', email: 'david@transitops.com', role: 'Driver', password: hashPassword('password123') },
      { name: 'Eva Wheel', username: 'eva', email: 'eva@transitops.com', role: 'Driver', password: hashPassword('password123') },
      { name: 'Frank Safety', username: 'frank', email: 'frank@transitops.com', role: 'SafetyOfficer', password: hashPassword('password123') },
      { name: 'Grace Guard', username: 'grace', email: 'grace@transitops.com', role: 'SafetyOfficer', password: hashPassword('password123') },
      { name: 'Henry Finance', username: 'henry', email: 'henry@transitops.com', role: 'FinancialAnalyst', password: hashPassword('password123') },
      { name: 'Ivy Ledger', username: 'ivy', email: 'ivy@transitops.com', role: 'FinancialAnalyst', password: hashPassword('password123') }
    ];

    for (const u of users) {
      await dbRun(
        'INSERT INTO users (name, username, email, role, password) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.username, u.email, u.role, u.password]
      );
    }
    console.log('Users seeded.');

    // 4. Seed Vehicles
    const vehicles = [
      { registration_number: 'CA-1234-A', name_model: 'Volvo FH16', type: 'Semi-Truck', max_load_capacity: 25000, odometer: 120000, acquisition_cost: 150000, status: 'Available' },
      { registration_number: 'NY-5678-B', name_model: 'Ford Transit 350', type: 'Cargo Van', max_load_capacity: 3500, odometer: 45000, acquisition_cost: 45000, status: 'Available' },
      { registration_number: 'TX-9012-C', name_model: 'Isuzu NPR-HD', type: 'Box Truck', max_load_capacity: 8000, odometer: 85000, acquisition_cost: 65000, status: 'In Shop' },
      { registration_number: 'FL-3456-D', name_model: 'Scania R500', type: 'Heavy Hauler', max_load_capacity: 40000, odometer: 180000, acquisition_cost: 210000, status: 'On Trip' },
      { registration_number: 'IL-7890-E', name_model: 'Mercedes-Benz Sprinter', type: 'Cargo Van', max_load_capacity: 4000, odometer: 32000, acquisition_cost: 48000, status: 'Available' }
    ];

    for (const v of vehicles) {
      await dbRun(
        'INSERT INTO vehicles (registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [v.registration_number, v.name_model, v.type, v.max_load_capacity, v.odometer, v.acquisition_cost, v.status]
      );
    }
    console.log('Vehicles seeded.');

    // 5. Seed Drivers
    const drivers = [
      { name: 'Charlie Driver', license_number: 'DL-98765432-A', license_category: 'Class A CDL', license_expiry_date: '2028-12-31', contact_number: '+1-555-0101', safety_score: 92.5, status: 'Available' },
      { name: 'David Road', license_number: 'DL-12345678-B', license_category: 'Class A CDL', license_expiry_date: '2027-06-30', contact_number: '+1-555-0102', safety_score: 88.0, status: 'On Trip' },
      { name: 'Eva Wheel', license_number: 'DL-87654321-C', license_category: 'Class B CDL', license_expiry_date: '2026-09-15', contact_number: '+1-555-0103', safety_score: 78.4, status: 'Available' },
      { name: 'Gary Speed', license_number: 'DL-11223344-D', license_category: 'Class B CDL', license_expiry_date: '2025-12-31', contact_number: '+1-555-0104', safety_score: 62.1, status: 'Available' },
      { name: 'Helen Safe', license_number: 'DL-55667788-E', license_category: 'Class A CDL', license_expiry_date: '2029-01-01', contact_number: '+1-555-0105', safety_score: 96.8, status: 'Available' }
    ];

    for (const d of drivers) {
      await dbRun(
        'INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [d.name, d.license_number, d.license_category, d.license_expiry_date, d.contact_number, d.safety_score, d.status]
      );
    }
    console.log('Drivers seeded.');

    // 6. Seed Trips
    // Retrieve some IDs to avoid hardcoded mismatch
    const vVolvo = await dbGet('SELECT id FROM vehicles WHERE registration_number = "CA-1234-A"');
    const vTransit = await dbGet('SELECT id FROM vehicles WHERE registration_number = "NY-5678-B"');
    const vScania = await dbGet('SELECT id FROM vehicles WHERE registration_number = "FL-3456-D"');
    const vSprinter = await dbGet('SELECT id FROM vehicles WHERE registration_number = "IL-7890-E"');

    const dCharlie = await dbGet('SELECT id FROM drivers WHERE name = "Charlie Driver"');
    const dDavid = await dbGet('SELECT id FROM drivers WHERE name = "David Road"');
    const dEva = await dbGet('SELECT id FROM drivers WHERE name = "Eva Wheel"');
    const dHelen = await dbGet('SELECT id FROM drivers WHERE name = "Helen Safe"');

    const trips = [
      { source: 'Los Angeles', destination: 'San Francisco', vehicle_id: vVolvo.id, driver_id: dCharlie.id, cargo_weight: 18000, planned_distance: 380, status: 'Completed' },
      { source: 'Chicago', destination: 'Detroit', vehicle_id: vTransit.id, driver_id: dEva.id, cargo_weight: 2500, planned_distance: 280, status: 'Draft' },
      { source: 'Dallas', destination: 'Houston', vehicle_id: vScania.id, driver_id: dDavid.id, cargo_weight: 35000, planned_distance: 240, status: 'Dispatched' },
      { source: 'Seattle', destination: 'Portland', vehicle_id: vSprinter.id, driver_id: dHelen.id, cargo_weight: 3000, planned_distance: 175, status: 'Cancelled' }
    ];

    for (const t of trips) {
      await dbRun(
        'INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [t.source, t.destination, t.vehicle_id, t.driver_id, t.cargo_weight, t.planned_distance, t.status]
      );
    }
    console.log('Trips seeded.');

    // 7. Seed Maintenance Logs
    const vIsuzu = await dbGet('SELECT id FROM vehicles WHERE registration_number = "TX-9012-C"');
    const maintenanceLogs = [
      { vehicle_id: vIsuzu.id, date: '2026-07-01', description: 'Brake pad replacement and oil change', cost: 450.0, performed_by: 'Master Mechanics Shop' },
      { vehicle_id: vVolvo.id, date: '2026-06-15', description: 'Transmission fluid flush and tire rotation', cost: 850.0, performed_by: 'Volvo Service Center' }
    ];

    for (const m of maintenanceLogs) {
      await dbRun(
        'INSERT INTO maintenance_logs (vehicle_id, date, description, cost, performed_by) VALUES (?, ?, ?, ?, ?)',
        [m.vehicle_id, m.date, m.description, m.cost, m.performed_by]
      );
    }
    console.log('Maintenance logs seeded.');

    // 8. Seed Fuel Logs
    const fuelLogs = [
      { vehicle_id: vVolvo.id, date: '2026-07-10', fuel_quantity: 120.5, cost: 480.0, odometer_reading: 119850 },
      { vehicle_id: vTransit.id, date: '2026-07-11', fuel_quantity: 22.1, cost: 85.5, odometer_reading: 44920 }
    ];

    for (const f of fuelLogs) {
      await dbRun(
        'INSERT INTO fuel_logs (vehicle_id, date, fuel_quantity, cost, odometer_reading) VALUES (?, ?, ?, ?, ?)',
        [f.vehicle_id, f.date, f.fuel_quantity, f.cost, f.odometer_reading]
      );
    }
    console.log('Fuel logs seeded.');

    // 9. Seed Expenses
    const tripLA = await dbGet('SELECT id FROM trips WHERE source = "Los Angeles" AND destination = "San Francisco"');
    const expenses = [
      { trip_id: null, category: 'Maintenance', amount: 450.0, date: '2026-07-01', description: 'Maintenance for Vehicle Isuzu - Brake pads' },
      { trip_id: null, category: 'Maintenance', amount: 850.0, date: '2026-06-15', description: 'Maintenance for Vehicle Volvo - Transmission fluid' },
      { trip_id: null, category: 'Fuel', amount: 480.0, date: '2026-07-10', description: 'Fuel for Vehicle Volvo (CA-1234-A)' },
      { trip_id: null, category: 'Fuel', amount: 85.5, date: '2026-07-11', description: 'Fuel for Vehicle Ford Transit (NY-5678-B)' },
      { trip_id: tripLA.id, category: 'Tolls', amount: 35.0, date: '2026-07-10', description: 'Highway tolls for Los Angeles to San Francisco trip' }
    ];

    for (const e of expenses) {
      await dbRun(
        'INSERT INTO expenses (trip_id, category, amount, date, description) VALUES (?, ?, ?, ?, ?)',
        [e.trip_id, e.category, e.amount, e.date, e.description]
      );
    }
    console.log('Expenses seeded.');

    console.log('Database seeding finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Database seeding failed:', err);
    process.exit(1);
  }
}

runSeed();
