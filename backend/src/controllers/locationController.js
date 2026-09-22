const Location = require('../models/Location');
const Inventory = require('../models/Inventory');

// @desc Get all warehouses/locations
// @route GET /api/locations
// @access Private
const getLocations = async (req, res, next) => {
  try {
    const locations = await Location.find({ isDeleted: { $ne: true } }).sort({ name: 1 });

    const locationIds = locations.map((l) => l._id);
    const inventories = await Inventory.find({ locationId: { $in: locationIds } });

    // Aggregate inventory count per warehouse
    const locSummary = {};
    inventories.forEach((inv) => {
      const lid = inv.locationId.toString();
      if (!locSummary[lid]) {
        locSummary[lid] = { totalStock: 0, reservedStock: 0, availableStock: 0, damagedStock: 0 };
      }
      locSummary[lid].totalStock += inv.quantity;
      locSummary[lid].reservedStock += inv.reservedQuantity;
      locSummary[lid].availableStock += Math.max(0, inv.quantity - inv.reservedQuantity);
      locSummary[lid].damagedStock += inv.damagedQuantity;
    });

    const results = locations.map((loc) => ({
      ...loc.toObject(),
      inventorySummary: locSummary[loc._id.toString()] || {
        totalStock: 0,
        reservedStock: 0,
        availableStock: 0,
        damagedStock: 0
      }
    }));

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create warehouse/location
// @route POST /api/locations
// @access Private (Admin)
const createLocation = async (req, res, next) => {
  try {
    const { name, code, address, contactNumber, status } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Location name and code are required'
      });
    }

    const upperCode = code.toUpperCase().trim();
    const existingCode = await Location.findOne({ code: upperCode });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Location code ${upperCode} already exists`
      });
    }

    const location = await Location.create({
      name: name.trim(),
      code: upperCode,
      address: (address || '').trim(),
      contactNumber: (contactNumber || '').trim(),
      status: status || 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Warehouse location created successfully',
      data: location
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update warehouse/location
// @route PUT /api/locations/:id
// @access Private (Admin)
const updateLocation = async (req, res, next) => {
  try {
    const { name, code, address, contactNumber, status } = req.body;

    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse location not found'
      });
    }

    if (name) location.name = name.trim();
    if (code) {
      const upperCode = code.toUpperCase().trim();
      const existing = await Location.findOne({ code: upperCode, _id: { $ne: location._id } });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Location code ${upperCode} is already taken`
        });
      }
      location.code = upperCode;
    }
    if (address !== undefined) location.address = address.trim();
    if (contactNumber !== undefined) location.contactNumber = contactNumber.trim();
    if (status) location.status = status;

    await location.save();

    res.json({
      success: true,
      message: 'Warehouse location updated successfully',
      data: location
    });
  } catch (error) {
    next(error);
  }
};

// @desc Soft delete warehouse/location
// @route DELETE /api/locations/:id
// @access Private (Admin)
const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Warehouse location not found' });
    }

    location.isDeleted = true;
    location.deletedAt = new Date();
    await location.save();

    res.json({ success: true, message: 'Location moved to trash' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation
};
