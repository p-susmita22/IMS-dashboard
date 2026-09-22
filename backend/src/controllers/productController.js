const Product = require('../models/Product');
const ProductVariant = require('../models/ProductVariant');
const Inventory = require('../models/Inventory');
const StockMovement = require('../models/StockMovement');
const { generateSku } = require('../utils/generateSku');

// @desc Get all products with variants & stock summary
// @route GET /api/products
// @access Private
const getProducts = async (req, res, next) => {
  try {
    const { search, category, brand, status } = req.query;

    const query = { isDeleted: { $ne: true } };
    if (status) query.status = status;
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds } });

    const variantIds = variants.map((v) => v._id);
    const inventories = await Inventory.find({ variantId: { $in: variantIds } });

    // Build inventory map: variantId -> { total, reserved, available, damaged }
    const invMap = {};
    inventories.forEach((inv) => {
      const vid = inv.variantId.toString();
      if (!invMap[vid]) {
        invMap[vid] = { total: 0, reserved: 0, available: 0, damaged: 0 };
      }
      invMap[vid].total += inv.quantity;
      invMap[vid].reserved += inv.reservedQuantity;
      invMap[vid].available += Math.max(0, inv.quantity - inv.reservedQuantity);
      invMap[vid].damaged += inv.damagedQuantity;
    });

    // Group variants by productId
    const variantMap = {};
    variants.forEach((v) => {
      const pid = v.productId.toString();
      if (!variantMap[pid]) variantMap[pid] = [];
      const stock = invMap[v._id.toString()] || { total: 0, reserved: 0, available: 0, damaged: 0 };
      variantMap[pid].push({
        ...v.toObject(),
        stock
      });
    });

    const results = products.map((p) => {
      const pVars = variantMap[p._id.toString()] || [];
      const totalStock = pVars.reduce((sum, v) => sum + v.stock.total, 0);
      const reservedStock = pVars.reduce((sum, v) => sum + v.stock.reserved, 0);
      const availableStock = pVars.reduce((sum, v) => sum + v.stock.available, 0);
      const damagedStock = pVars.reduce((sum, v) => sum + v.stock.damaged, 0);

      return {
        ...p.toObject(),
        variants: pVars,
        totalStock,
        reservedStock,
        availableStock,
        damagedStock
      };
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get product by ID with all variants and warehouse breakdowns
// @route GET /api/products/:id
// @access Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate('createdBy', 'name');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const variants = await ProductVariant.find({ productId: product._id });
    const variantIds = variants.map((v) => v._id);

    const inventories = await Inventory.find({ variantId: { $in: variantIds } }).populate('locationId');

    const variantsWithInventory = variants.map((v) => {
      const variantInvs = inventories.filter(
        (inv) => inv.variantId.toString() === v._id.toString()
      );

      const locationStock = variantInvs.map((inv) => ({
        locationId: inv.locationId ? inv.locationId._id : null,
        locationName: inv.locationId ? inv.locationId.name : 'Unknown',
        locationCode: inv.locationId ? inv.locationId.code : '',
        quantity: inv.quantity,
        reservedQuantity: inv.reservedQuantity,
        availableStock: Math.max(0, inv.quantity - inv.reservedQuantity),
        damagedQuantity: inv.damagedQuantity
      }));

      const totalQuantity = locationStock.reduce((acc, curr) => acc + curr.quantity, 0);
      const reservedQuantity = locationStock.reduce((acc, curr) => acc + curr.reservedQuantity, 0);
      const availableStock = locationStock.reduce((acc, curr) => acc + curr.availableStock, 0);
      const damagedQuantity = locationStock.reduce((acc, curr) => acc + curr.damagedQuantity, 0);

      return {
        ...v.toObject(),
        locationStock,
        totalStock: totalQuantity,
        reservedStock: reservedQuantity,
        availableStock,
        damagedStock: damagedQuantity
      };
    });

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        variants: variantsWithInventory
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create new product (and optionally variants)
// @route POST /api/products
// @access Admin / Manager
const createProduct = async (req, res, next) => {
  try {
    const { name, category, brand, description, productImage, status, variants, defaultVendor, defaultLocation } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        success: false,
        message: 'Product name and category are required'
      });
    }

    const product = await Product.create({
      name: name.trim(),
      category: category.trim(),
      brand: (brand || '').trim(),
      description: (description || '').trim(),
      productImage: (productImage || '').trim(),
      status: status || 'ACTIVE',
      createdBy: req.user._id,
      defaultVendor: defaultVendor || undefined,
      defaultLocation: defaultLocation || undefined
    });

    const createdVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      // Validate initial stock location
      const hasInitialStock = variants.some(v => Number(v.initialStock) > 0);
      if (hasInitialStock && !defaultLocation) {
        return res.status(400).json({
          success: false,
          message: 'A Default Warehouse is required when adding Initial Stock.'
        });
      }

      for (const v of variants) {
        const sku = v.sku
          ? v.sku.toUpperCase().trim()
          : await generateSku(product.name, v.colour, v.size);

        const newVariant = await ProductVariant.create({
          productId: product._id,
          size: v.size,
          colour: v.colour,
          sku,
          barcode: v.barcode ? v.barcode.trim() : '',
          purchasePrice: Number(v.purchasePrice) || 0,
          sellingPrice: Number(v.sellingPrice) || 0,
          minimumStockLevel: Number(v.minimumStockLevel) || 10,
          status: v.status || 'ACTIVE'
        });
        createdVariants.push(newVariant);

        // Handle initial stock
        const initialStock = Number(v.initialStock) || 0;
        if (initialStock > 0 && defaultLocation) {
          await Inventory.create({
            variantId: newVariant._id,
            locationId: defaultLocation,
            quantity: initialStock,
            reservedQuantity: 0,
            damagedQuantity: 0
          });

          await StockMovement.create({
            variantId: newVariant._id,
            locationId: defaultLocation,
            movementType: 'STOCK_IN',
            quantity: initialStock,
            previousQuantity: 0,
            newQuantity: initialStock,
            unitPrice: newVariant.purchasePrice,
            referenceType: 'INITIAL',
            referenceId: product._id.toString(),
            vendorId: defaultVendor || undefined,
            performedBy: req.user._id,
            notes: 'Initial stock added during product creation'
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: {
        ...product.toObject(),
        variants: createdVariants
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update product
// @route PUT /api/products/:id
// @access Admin / Manager
const updateProduct = async (req, res, next) => {
  try {
    const { name, category, brand, description, productImage, status, defaultVendor, defaultLocation } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (name) product.name = name.trim();
    if (category) product.category = category.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (description !== undefined) product.description = description.trim();
    if (productImage !== undefined) product.productImage = productImage.trim();
    if (status) product.status = status;
    if (defaultVendor !== undefined) product.defaultVendor = defaultVendor || undefined;
    if (defaultLocation !== undefined) product.defaultLocation = defaultLocation || undefined;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add variant to product
// @route POST /api/products/:id/variants
// @access Admin / Manager
const createVariant = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const { size, colour, sku, barcode, purchasePrice, sellingPrice, minimumStockLevel, status } =
      req.body;

    if (!size || !colour) {
      return res.status(400).json({
        success: false,
        message: 'Size and colour are required for variant'
      });
    }

    const finalSku = sku
      ? sku.toUpperCase().trim()
      : await generateSku(product.name, colour, size);

    const existingSku = await ProductVariant.findOne({ sku: finalSku });
    if (existingSku) {
      return res.status(400).json({
        success: false,
        message: `SKU ${finalSku} already exists. Please choose a different SKU.`
      });
    }

    const variant = await ProductVariant.create({
      productId: product._id,
      size: size.trim(),
      colour: colour.trim(),
      sku: finalSku,
      barcode: barcode ? barcode.trim() : '',
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      minimumStockLevel: Number(minimumStockLevel) || 10,
      status: status || 'ACTIVE'
    });

    res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      data: variant
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update variant details (NEVER allows direct stock modification)
// @route PUT /api/variants/:id
// @access Admin / Manager
const updateVariant = async (req, res, next) => {
  try {
    const { size, colour, barcode, purchasePrice, sellingPrice, minimumStockLevel, status } =
      req.body;

    const variant = await ProductVariant.findById(req.params.id);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    if (size) variant.size = size.trim();
    if (colour) variant.colour = colour.trim();
    if (barcode !== undefined) variant.barcode = barcode.trim();
    if (purchasePrice !== undefined) variant.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) variant.sellingPrice = Number(sellingPrice);
    if (minimumStockLevel !== undefined) variant.minimumStockLevel = Number(minimumStockLevel);
    if (status) variant.status = status;

    await variant.save();

    res.json({
      success: true,
      message: 'Variant updated successfully',
      data: variant
    });
  } catch (error) {
    next(error);
  }
};

// @desc Soft delete product
// @route DELETE /api/products/:id
// @access Admin / Manager
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.json({ success: true, message: 'Product moved to trash' });
  } catch (error) {
    next(error);
  }
};

// @desc Get all distinct product categories
// @route GET /api/products/categories
// @access Private
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isDeleted: { $ne: true } });
    const cleaned = categories
      .filter((c) => c && typeof c === 'string' && c.trim().length > 0)
      .map((c) => c.trim())
      .sort((a, b) => a.localeCompare(b));
    const unique = [...new Set(cleaned)];
    res.status(200).json({ success: true, data: unique });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  updateVariant
};

