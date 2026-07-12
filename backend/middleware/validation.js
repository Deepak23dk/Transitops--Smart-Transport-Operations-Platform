// Validation middleware for TransitOps models

const isNonNegativeNumber = (val) => typeof val === 'number' && !isNaN(val) && val >= 0;
const isPositiveNumber = (val) => typeof val === 'number' && !isNaN(val) && val > 0;
const isValidDate = (val) => typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);

export const validateVehicle = (req, res, next) => {
  const { registration_number, name_model, type, max_load_capacity, odometer, acquisition_cost, status } = req.body;

  if (!registration_number || typeof registration_number !== 'string' || registration_number.trim() === '') {
    return res.status(400).json({ error: 'Registration number is required and must be a non-empty string' });
  }
  if (!name_model || typeof name_model !== 'string' || name_model.trim() === '') {
    return res.status(400).json({ error: 'Vehicle name/model is required' });
  }
  if (!type || typeof type !== 'string' || type.trim() === '') {
    return res.status(400).json({ error: 'Vehicle type is required' });
  }
  if (!isPositiveNumber(Number(max_load_capacity))) {
    return res.status(400).json({ error: 'Max load capacity must be a positive number' });
  }
  if (!isNonNegativeNumber(Number(odometer))) {
    return res.status(400).json({ error: 'Odometer must be a non-negative number' });
  }
  if (!isNonNegativeNumber(Number(acquisition_cost))) {
    return res.status(400).json({ error: 'Acquisition cost must be a non-negative number' });
  }
  
  const validStatuses = ['Available', 'On Trip', 'In Shop', 'Retired'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status is required and must be one of: ${validStatuses.join(', ')}` });
  }

  // Parse types
  req.body.max_load_capacity = Number(max_load_capacity);
  req.body.odometer = Number(odometer);
  req.body.acquisition_cost = Number(acquisition_cost);

  next();
};

export const validateDriver = (req, res, next) => {
  const { name, license_number, license_category, license_expiry_date, contact_number, safety_score, status } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!license_number || typeof license_number !== 'string' || license_number.trim() === '') {
    return res.status(400).json({ error: 'License number is required' });
  }
  if (!license_category || typeof license_category !== 'string' || license_category.trim() === '') {
    return res.status(400).json({ error: 'License category is required' });
  }
  if (!license_expiry_date || !isValidDate(license_expiry_date)) {
    return res.status(400).json({ error: 'License expiry date is required in YYYY-MM-DD format' });
  }
  if (!contact_number || typeof contact_number !== 'string' || contact_number.trim() === '') {
    return res.status(400).json({ error: 'Contact number is required' });
  }
  
  const scoreNum = Number(safety_score);
  if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
    return res.status(400).json({ error: 'Safety score must be a number between 0 and 100' });
  }

  const validStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status is required and must be one of: ${validStatuses.join(', ')}` });
  }

  req.body.safety_score = scoreNum;
  next();
};

export const validateTrip = (req, res, next) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status } = req.body;

  if (!source || typeof source !== 'string' || source.trim() === '') {
    return res.status(400).json({ error: 'Source location is required' });
  }
  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    return res.status(400).json({ error: 'Destination location is required' });
  }
  if (!vehicle_id || isNaN(Number(vehicle_id))) {
    return res.status(400).json({ error: 'Vehicle ID is required and must be a number' });
  }
  if (!driver_id || isNaN(Number(driver_id))) {
    return res.status(400).json({ error: 'Driver ID is required and must be a number' });
  }
  if (!isPositiveNumber(Number(cargo_weight))) {
    return res.status(400).json({ error: 'Cargo weight must be a positive number' });
  }
  if (!isPositiveNumber(Number(planned_distance))) {
    return res.status(400).json({ error: 'Planned distance must be a positive number' });
  }

  const validStatuses = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status is required and must be one of: ${validStatuses.join(', ')}` });
  }

  req.body.vehicle_id = Number(vehicle_id);
  req.body.driver_id = Number(driver_id);
  req.body.cargo_weight = Number(cargo_weight);
  req.body.planned_distance = Number(planned_distance);

  next();
};

export const validateMaintenanceLog = (req, res, next) => {
  const { vehicle_id, date, description, cost, performed_by } = req.body;

  if (!vehicle_id || isNaN(Number(vehicle_id))) {
    return res.status(400).json({ error: 'Vehicle ID is required and must be a number' });
  }
  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: 'Date is required in YYYY-MM-DD format' });
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required' });
  }
  if (!isNonNegativeNumber(Number(cost))) {
    return res.status(400).json({ error: 'Cost must be a non-negative number' });
  }
  if (!performed_by || typeof performed_by !== 'string' || performed_by.trim() === '') {
    return res.status(400).json({ error: 'Performed by is required' });
  }

  req.body.vehicle_id = Number(vehicle_id);
  req.body.cost = Number(cost);
  next();
};

export const validateFuelLog = (req, res, next) => {
  const { vehicle_id, date, fuel_quantity, cost, odometer_reading } = req.body;

  if (!vehicle_id || isNaN(Number(vehicle_id))) {
    return res.status(400).json({ error: 'Vehicle ID is required and must be a number' });
  }
  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: 'Date is required in YYYY-MM-DD format' });
  }
  if (!isPositiveNumber(Number(fuel_quantity))) {
    return res.status(400).json({ error: 'Fuel quantity must be a positive number' });
  }
  if (!isNonNegativeNumber(Number(cost))) {
    return res.status(400).json({ error: 'Cost must be a non-negative number' });
  }
  if (!isNonNegativeNumber(Number(odometer_reading))) {
    return res.status(400).json({ error: 'Odometer reading must be a non-negative number' });
  }

  req.body.vehicle_id = Number(vehicle_id);
  req.body.fuel_quantity = Number(fuel_quantity);
  req.body.cost = Number(cost);
  req.body.odometer_reading = Number(odometer_reading);
  next();
};

export const validateExpense = (req, res, next) => {
  const { trip_id, category, amount, date, description } = req.body;

  if (trip_id !== undefined && trip_id !== null && trip_id !== '' && isNaN(Number(trip_id))) {
    return res.status(400).json({ error: 'Trip ID must be a number' });
  }
  const validCategories = ['Fuel', 'Maintenance', 'Tolls', 'Salaries', 'Other'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ error: `Category is required and must be one of: ${validCategories.join(', ')}` });
  }
  if (!isPositiveNumber(Number(amount))) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }
  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: 'Date is required in YYYY-MM-DD format' });
  }
  if (!description || typeof description !== 'string' || description.trim() === '') {
    return res.status(400).json({ error: 'Description is required' });
  }

  req.body.trip_id = trip_id ? Number(trip_id) : null;
  req.body.amount = Number(amount);
  next();
};
