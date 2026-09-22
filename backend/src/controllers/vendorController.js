const Vendor = require('../models/Vendor');
const StockMovement = require('../models/StockMovement');

// @desc Get all vendors
// @route GET /api/vendors
// @access Private
const getVendors = async (req, res, next) => {
  try {
    const { search, status } = req.query;

    const query = { isDeleted: { $ne: true } };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const vendors = await Vendor.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get vendor by ID with purchase history
// @route GET /api/vendors/:id
// @access Private
const getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Retrieve purchases from this vendor
    const purchases = await StockMovement.find({
      vendorId: vendor._id,
      movementType: 'STOCK_IN'
    })
      .populate({
        path: 'variantId',
        populate: { path: 'productId' }
      })
      .populate('locationId', 'name code')
      .populate('performedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        vendor,
        purchases
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create vendor
// @route POST /api/vendors
// @access Private (Admin)
const createVendor = async (req, res, next) => {
  try {
    const { name, phone, email, address, gstNumber, contactPerson, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vendor name is required'
      });
    }

    const vendor = await Vendor.create({
      name: name.trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim().toLowerCase(),
      address: (address || '').trim(),
      gstNumber: (gstNumber || '').trim().toUpperCase(),
      contactPerson: (contactPerson || '').trim(),
      status: status || 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Vendor created successfully',
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update vendor
// @route PUT /api/vendors/:id
// @access Private (Admin)
const updateVendor = async (req, res, next) => {
  try {
    const { name, phone, email, address, gstNumber, contactPerson, status } = req.body;

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (name) vendor.name = name.trim();
    if (phone !== undefined) vendor.phone = phone.trim();
    if (email !== undefined) vendor.email = email.trim().toLowerCase();
    if (address !== undefined) vendor.address = address.trim();
    if (gstNumber !== undefined) vendor.gstNumber = gstNumber.trim().toUpperCase();
    if (contactPerson !== undefined) vendor.contactPerson = contactPerson.trim();
    if (status) vendor.status = status;

    await vendor.save();

    res.json({
      success: true,
      message: 'Vendor updated successfully',
      data: vendor
    });
  } catch (error) {
    next(error);
  }
};

// @desc Soft delete vendor
// @route DELETE /api/vendors/:id
// @access Private (Admin)
const deleteVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.isDeleted = true;
    vendor.deletedAt = new Date();
    await vendor.save();

    res.json({ success: true, message: 'Vendor moved to trash' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor
};
