import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  ArrowUpDown,
  Tag,
  Package,
  Layers,
  Trash2
} from 'lucide-react';
import { productApi } from '../services/productApi';
import { locationApi, vendorApi } from '../services/opsApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { StockStatusBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [editData, setEditData] = useState(null);

  // New Product Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    description: '',
    productImage: '',
    defaultLocation: '',
    defaultVendor: '',
    variants: [
      { size: 'M', colour: 'Black', purchasePrice: '', sellingPrice: '', minimumStockLevel: 10, initialStock: 0 },
      { size: 'L', colour: 'Black', purchasePrice: '', sellingPrice: '', minimumStockLevel: 10, initialStock: 0 }
    ]
  });

  const { isAdmin, isStaff } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchDropdowns();
    fetchCategories();
  }, [categoryFilter, statusFilter]);

  const fetchCategories = async () => {
    try {
      const res = await productApi.getCategories();
      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [locRes, venRes] = await Promise.all([
        locationApi.getLocations(),
        vendorApi.getVendors()
      ]);
      if (locRes.success) setLocations(locRes.data || []);
      if (venRes.success) setVendors(venRes.data || []);
    } catch (e) {
      console.error('Failed to load dropdowns', e);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productApi.getProducts({
        category: categoryFilter,
        search
      });
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (err) {
      showToast('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddVariantRow = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { size: '', colour: '', purchasePrice: '', sellingPrice: '', minimumStockLevel: 10, initialStock: 0 }
      ]
    }));
  };

  const handleRemoveVariantRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index][field] = value;
      return { ...prev, variants: updated };
    });
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      showToast('Product name and category are required', 'error');
      return;
    }

    if (formData.variants.length === 0) {
      showToast('Please add at least one variant', 'error');
      return;
    }

    const hasInitialStock = formData.variants.some(v => Number(v.initialStock) > 0);
    if (hasInitialStock && !formData.defaultLocation) {
      showToast('A Default Warehouse is required when adding Initial Stock', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await productApi.createProduct(formData);
      if (res.success) {
        showToast('Product & variants created successfully!', 'success');
        setIsCreateModalOpen(false);
        setFormData({
          name: '',
          category: '',
          brand: '',
          description: '',
          productImage: '',
          defaultLocation: '',
          defaultVendor: '',
          variants: [
            { size: 'M', colour: 'Black', purchasePrice: '', sellingPrice: '', minimumStockLevel: 10, initialStock: 0 }
          ]
        });
        fetchProducts();
        fetchCategories();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (product, variant) => {
    setEditData({
      productId: product._id,
      variantId: variant._id,
      name: product.name,
      category: product.category,
      brand: product.brand || '',
      productImage: product.productImage || '',
      defaultLocation: product.defaultLocation || '',
      defaultVendor: product.defaultVendor || '',
      size: variant.size || '',
      colour: variant.colour || '',
      purchasePrice: variant.purchasePrice,
      sellingPrice: variant.sellingPrice
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productApi.updateProduct(editData.productId, {
        name: editData.name,
        category: editData.category,
        brand: editData.brand,
        productImage: editData.productImage,
        defaultLocation: editData.defaultLocation,
        defaultVendor: editData.defaultVendor
      });
      await productApi.updateVariant(editData.variantId, {
        size: editData.size,
        colour: editData.colour,
        purchasePrice: editData.purchasePrice,
        sellingPrice: editData.sellingPrice
      });
      showToast('Product updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchProducts();
      fetchCategories();
    } catch (err) {
      showToast('Failed to update product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}? It will be moved to the Trash Bin.`)) {
      try {
        const res = await productApi.deleteProduct(product._id);
        if (res.success) {
          showToast(res.message, 'success');
          fetchProducts();
          fetchCategories();
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete product', 'error');
      }
    }
  };

  // Flattened variant rows for granular viewing
  const variantRows = [];
  products.forEach((p) => {
    if (p.variants && p.variants.length > 0) {
      p.variants.forEach((v) => {
        if (statusFilter === 'LOW_STOCK' && (v.stock.available === 0 || v.stock.available > v.minimumStockLevel)) return;
        if (statusFilter === 'OUT_OF_STOCK' && v.stock.available > 0) return;
        if (statusFilter === 'IN_STOCK' && v.stock.available <= v.minimumStockLevel) return;

        variantRows.push({
          product: p,
          variant: v
        });
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Products & Variants
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage catalog, automated SKUs, and cross-warehouse inventory.
          </p>
        </div>
        {(isAdmin || isStaff) && (
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="brand"
            size="lg"
            icon={Plus}
          >
            Add New Product
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
          <Input
            placeholder="Search by product, category, brand..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {loading ? (
          <Loader message="Loading products..." />
        ) : variantRows.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No Products Found"
            description="Try changing your search query or add a new product."
            actionText={(isAdmin || isStaff) ? 'Add Product' : null}
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <Table
            headers={[
              'Product',
              'SKU',
              'Size / Colour',
              'Price',
              'Physical Stock',
              'Reserved',
              'Available',
              'Status',
              'Actions'
            ]}
          >
            {variantRows.map(({ product, variant }) => (
              <tr key={variant._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                      {product.productImage ? (
                        <img
                          src={product.productImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {product.name}
                      </span>
                      <span className="text-xs text-slate-400">{product.category}</span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono font-bold text-slate-800 text-xs">
                  {variant.sku}
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-slate-600">
                  {variant.colour} / {variant.size}
                </td>
                <td className="px-5 py-3.5 text-xs font-bold text-slate-900">
                  ₹{variant.sellingPrice}
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-slate-700">
                  {variant.stock.total}
                </td>
                <td className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                  {variant.stock.reserved}
                </td>
                <td className="px-5 py-3.5 text-sm font-extrabold text-slate-900">
                  {variant.stock.available}
                </td>
                <td className="px-5 py-3.5">
                  <StockStatusBadge
                    available={variant.stock.available}
                    minimumStock={variant.minimumStockLevel}
                  />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {(isAdmin || isStaff) && (
                      <Button
                        onClick={() => handleOpenEditModal(product, variant)}
                        variant="outline"
                        size="sm"
                        icon={Pencil}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      onClick={() => navigate(`/products/${product._id}`)}
                      variant="outline"
                      size="sm"
                      icon={Eye}
                    >
                      Details
                    </Button>
                    {(isAdmin || isStaff) && (
                      <Button
                        onClick={() => handleDeleteProduct(product)}
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Mobile Cards View */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <Loader message="Loading products..." />
        ) : variantRows.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No Products Found"
            description="Try changing your search query or add a new product."
          />
        ) : (
          variantRows.map(({ product, variant }) => (
            <div
              key={variant._id}
              onClick={() => navigate(`/products/${product._id}`)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0 flex items-center justify-center">
                  {product.productImage ? (
                    <img
                      src={product.productImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-slate-900 text-sm truncate">
                      {product.name}
                    </span>
                    <StockStatusBadge
                      available={variant.stock.available}
                      minimumStock={variant.minimumStockLevel}
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-mono font-bold mt-0.5">
                    {variant.sku}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                    <span>{variant.colour} / {variant.size}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-900">₹{variant.sellingPrice}</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">Physical: <strong>{variant.stock.total}</strong></span>
                  <span className="text-slate-500">Reserved: <strong>{variant.stock.reserved}</strong></span>
                </div>
                <div className="font-bold text-slate-900">
                  Available: <span className="text-emerald-600 font-extrabold text-sm">{variant.stock.available}</span>
                </div>
              </div>
              
              {(isAdmin || isStaff) && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(product, variant);
                    }}
                    variant="outline"
                    size="sm"
                    icon={Pencil}
                    className="flex-1 justify-center"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProduct(product);
                    }}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    className="flex-1 justify-center"
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Product & Variants"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              required
              placeholder="e.g. Classic Cotton Polo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Category"
              required
              placeholder="Enter category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Brand"
              placeholder="e.g. UrbanCraft"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
            <Input
              label="Image URL"
              placeholder="https://..."
              value={formData.productImage}
              onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Warehouse (Optional)</label>
              <select
                value={formData.defaultLocation}
                onChange={(e) => setFormData({ ...formData, defaultLocation: e.target.value })}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Select Location</option>
                {locations.map((l) => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Vendor (Optional)</label>
              <select
                value={formData.defaultVendor}
                onChange={(e) => setFormData({ ...formData, defaultVendor: e.target.value })}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Variants Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Product Variants (SKUs will auto-generate)
              </label>
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {formData.variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Size <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. M"
                        value={v.size}
                        required
                        onChange={(e) => handleVariantChange(idx, 'size', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Colour <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Black"
                        value={v.colour}
                        required
                        onChange={(e) => handleVariantChange(idx, 'colour', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Purchase (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={v.purchasePrice}
                        required
                        onChange={(e) => handleVariantChange(idx, 'purchasePrice', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Selling (₹) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={v.sellingPrice}
                        required
                        onChange={(e) => handleVariantChange(idx, 'sellingPrice', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">Initial Qty</label>
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantRow(idx)}
                            className="text-rose-500 hover:text-rose-700 font-extrabold text-sm leading-none"
                            title="Remove variant"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        placeholder="0"
                        value={v.initialStock}
                        onChange={(e) => handleVariantChange(idx, 'initialStock', e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 bg-emerald-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="brand" loading={submitting}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      {editData && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Product Details"
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product Name"
                required
                placeholder="e.g. Classic Cotton Polo"
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
              <Input
                label="Category"
                required
                placeholder="Enter category"
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Brand"
                placeholder="e.g. UrbanCraft"
                value={editData.brand}
                onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
              />
              <Input
                label="Image URL"
                placeholder="https://..."
                value={editData.productImage}
                onChange={(e) => setEditData({ ...editData, productImage: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Default Warehouse (Optional)</label>
                <select
                  value={editData.defaultLocation}
                  onChange={(e) => setEditData({ ...editData, defaultLocation: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-700">Default Vendor (Optional)</label>
                <select
                  value={editData.defaultVendor}
                  onChange={(e) => setEditData({ ...editData, defaultVendor: e.target.value })}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Variant Details */}
            <div className="pt-3 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                Variant Details
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                <Input
                  label="Size"
                  required
                  placeholder="Size (e.g. L)"
                  value={editData.size}
                  onChange={(e) => setEditData({ ...editData, size: e.target.value })}
                />
                <Input
                  label="Colour"
                  required
                  placeholder="Colour"
                  value={editData.colour}
                  onChange={(e) => setEditData({ ...editData, colour: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Purchase Price (₹)"
                  type="number"
                  required
                  placeholder="Purchase ₹"
                  value={editData.purchasePrice}
                  onChange={(e) => setEditData({ ...editData, purchasePrice: e.target.value })}
                />
                <Input
                  label="Selling Price (₹)"
                  type="number"
                  required
                  placeholder="Selling ₹"
                  value={editData.sellingPrice}
                  onChange={(e) => setEditData({ ...editData, sellingPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
