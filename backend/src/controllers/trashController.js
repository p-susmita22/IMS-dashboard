const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Location = require('../models/Location');
const Order = require('../models/Order');

const getModelByType = (type) => {
  switch (type.toLowerCase()) {
    case 'product': return Product;
    case 'vendor': return Vendor;
    case 'location': return Location;
    case 'order': return Order;
    default: return null;
  }
};

// @desc Get all deleted items (by type or all combined)
// @route GET /api/trash
// @access Private (Admin)
const getTrash = async (req, res, next) => {
  try {
    const { type } = req.query; // optional: product, vendor, location, order

    let data = [];

    if (type) {
      const Model = getModelByType(type);
      if (Model) {
        data = await Model.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean();
        data = data.map(item => ({ ...item, trashType: type }));
      }
    } else {
      // Fetch all
      const [products, vendors, locations, orders] = await Promise.all([
        Product.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean(),
        Vendor.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean(),
        Location.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean(),
        Order.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean()
      ]);

      data = [
        ...products.map(p => ({ ...p, trashType: 'product', title: p.name })),
        ...vendors.map(v => ({ ...v, trashType: 'vendor', title: v.name })),
        ...locations.map(l => ({ ...l, trashType: 'location', title: l.name })),
        ...orders.map(o => ({ ...o, trashType: 'order', title: o.orderNumber }))
      ].sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
    }

    res.json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    next(error);
  }
};

// @desc Restore deleted item
// @route PUT /api/trash/:type/:id/restore
// @access Private (Admin)
const restoreItem = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const Model = getModelByType(type);

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid item type' });
    }

    const item = await Model.findById(id);
    if (!item || !item.isDeleted) {
      return res.status(404).json({ success: false, message: 'Deleted item not found' });
    }

    item.isDeleted = false;
    item.deletedAt = null;
    await item.save();

    res.json({ success: true, message: `${type} restored successfully` });
  } catch (error) {
    next(error);
  }
};

// @desc Permanently delete item
// @route DELETE /api/trash/:type/:id
// @access Private (Admin)
const hardDeleteItem = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const Model = getModelByType(type);

    if (!Model) {
      return res.status(400).json({ success: false, message: 'Invalid item type' });
    }

    const item = await Model.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Deleted item not found' });
    }

    res.json({ success: true, message: `${type} permanently deleted` });
  } catch (error) {
    next(error);
  }
};

// @desc Empty the entire trash
// @route DELETE /api/trash/empty
// @access Private (Admin)
const emptyTrash = async (req, res, next) => {
  try {
    await Promise.all([
      Product.deleteMany({ isDeleted: true }),
      Vendor.deleteMany({ isDeleted: true }),
      Location.deleteMany({ isDeleted: true }),
      Order.deleteMany({ isDeleted: true })
    ]);

    res.json({ success: true, message: 'Trash emptied successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrash,
  restoreItem,
  hardDeleteItem,
  emptyTrash
};
