import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowLeft, CheckCircle2, Warehouse, Truck, DollarSign } from 'lucide-react';
import { productApi } from '../services/productApi';
import { inventoryApi } from '../services/inventoryApi';
import { vendorApi, locationApi } from '../services/opsApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { useToast } from '../context/ToastContext';

export const AddStock = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const [pRes, vRes, lRes] = await Promise.all([
        productApi.getProducts(),
        vendorApi.getVendors(),
        locationApi.getLocations()
      ]);

      if (pRes.success) setProducts(pRes.data || []);
      if (vRes.success) setVendors(vRes.data || []);
      if (lRes.success) {
        setLocations(lRes.data || []);
        if (lRes.data.length > 0) {
          setSelectedLocationId(lRes.data[0]._id);
        }
      }
    } catch (err) {
      showToast('Failed to load form prerequisites', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const variants = selectedProduct?.variants || [];
  const selectedVariant = variants.find((v) => v._id === selectedVariantId);

  // When variant changes, pre-fill default purchase price
  const handleVariantSelect = (variantId) => {
    setSelectedVariantId(variantId);
    const variant = variants.find((v) => v._id === variantId);
    if (variant && variant.purchasePrice) {
      setPurchasePrice(variant.purchasePrice);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedVariantId || !selectedLocationId || !quantity) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Quantity must be a positive integer', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await inventoryApi.stockIn({
        variantId: selectedVariantId,
        locationId: selectedLocationId,
        quantity: qty,
        purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
        vendorId: selectedVendorId || undefined,
        notes: notes.trim()
      });

      if (res.success) {
        showToast(res.message || `${qty} units added successfully.`, 'success');
        navigate('/');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing stock in', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <PlusCircle className="w-7 h-7 text-emerald-600" />
            Add Stock (Stock In)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Receive inventory from vendor purchases. Every change logs an immutable audit trail.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. Product Selection */}
          <Select
            label="1. Select Product"
            required
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setSelectedVariantId('');
            }}
            options={products.map((p) => ({
              value: p._id,
              label: `${p.name} (${p.category})`
            }))}
            placeholder="-- Choose Product --"
          />

          {/* 2. Variant Selection */}
          {selectedProductId && (
            <Select
              label="2. Select Variant (SKU / Size / Colour)"
              required
              value={selectedVariantId}
              onChange={(e) => handleVariantSelect(e.target.value)}
              options={variants.map((v) => ({
                value: v._id,
                label: `${v.sku} - ${v.colour} / ${v.size} (Current: ${v.stock?.total || 0} units)`
              }))}
              placeholder="-- Choose Variant --"
            />
          )}

          {/* 3. Vendor and Location Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="3. Supplier / Vendor"
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              options={vendors.map((v) => ({
                value: v._id,
                label: v.name
              }))}
              placeholder="-- Choose Vendor (Optional) --"
            />

            <Select
              label="4. Warehouse Location"
              required
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              options={locations.map((l) => ({
                value: l._id,
                label: `${l.name} (${l.code})`
              }))}
              placeholder="-- Choose Warehouse --"
            />
          </div>

          {/* 4. Quantity and Purchase Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="5. Quantity to Add"
              type="number"
              min="1"
              required
              placeholder="e.g. 100"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Input
              label="6. Purchase Price (₹ per unit)"
              type="number"
              min="0"
              placeholder="e.g. 250"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
            />
          </div>

          {/* 5. Notes */}
          <Input
            label="7. Notes / Reference (e.g. Invoice # / PO #)"
            placeholder="e.g. Invoice #INV-2026-904 from ABC Traders"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              loading={submitting}
            >
              + Confirm & Add Stock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
