import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { productApi } from '../services/productApi';
import { locationApi } from '../services/opsApi';
import { orderApi } from '../services/orderApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { useToast } from '../context/ToastContext';

export const CreateOrder = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Customer & Location Form State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');

  // Order Items
  const [items, setItems] = useState([
    { variantId: '', quantity: 1, price: 0 }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, lRes] = await Promise.all([
        productApi.getProducts(),
        locationApi.getLocations()
      ]);

      if (pRes.success) setProducts(pRes.data || []);
      if (lRes.success) {
        setLocations(lRes.data || []);
        if (lRes.data.length > 0) {
          setLocationId(lRes.data[0]._id);
        }
      }
    } catch (err) {
      showToast('Failed to load products and locations', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Build a flat list of all variants
  const allVariants = [];
  products.forEach((p) => {
    (p.variants || []).forEach((v) => {
      allVariants.push({
        ...v,
        productName: p.name,
        category: p.category
      });
    });
  });

  const handleAddItem = () => {
    setItems((prev) => [...prev, { variantId: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index, variantId) => {
    const v = allVariants.find((item) => item._id === variantId);
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        variantId,
        price: v ? v.sellingPrice : 0
      };
      return updated;
    });
  };

  const handleFieldChange = (index, field, val) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index][field] = val;
      return updated;
    });
  };

  const totalOrderAmount = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || !phoneNumber || !deliveryAddress || !locationId) {
      showToast('Please fill all customer and location details', 'error');
      return;
    }

    if (items.length === 0 || items.some((it) => !it.variantId || Number(it.quantity) <= 0)) {
      showToast('Please specify valid product variants and quantities', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await orderApi.createOrder({
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        deliveryAddress: deliveryAddress.trim(),
        locationId,
        items: items.map((it) => ({
          variantId: it.variantId,
          quantity: Number(it.quantity),
          price: Number(it.price)
        })),
        notes: notes.trim()
      });

      if (res.success) {
        showToast(res.message || 'Order created successfully!', 'success');
        navigate(`/orders/${res.data._id}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/orders')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-indigo-600" />
            Create Wholesale Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Orders begin in NEW state. Stock will be reserved upon confirmation.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Customer & Delivery Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Customer / Store Name"
                required
                placeholder="e.g. Apex Clothing Mart"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />

              <Input
                label="Contact Phone"
                required
                placeholder="e.g. +91 99370 12345"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <Input
                label="Delivery Address"
                required
                placeholder="e.g. Shop 14, Grand Bazaar, Bhubaneswar"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />

              <Select
                label="Fulfillment Warehouse"
                required
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                options={locations.map((l) => ({
                  value: l._id,
                  label: `${l.name} (${l.code})`
                }))}
                placeholder="-- Choose Warehouse --"
              />
            </div>
          </div>

          {/* Products List Section */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Order Items
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Another Product
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const lineTotal =
                  (Number(item.quantity) || 0) * (Number(item.price) || 0);

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1">
                      <select
                        value={item.variantId}
                        required
                        onChange={(e) => handleVariantChange(idx, e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="" disabled>
                          -- Choose Product Variant --
                        </option>
                        {allVariants.map((v) => (
                          <option key={v._id} value={v._id}>
                            {v.productName} — {v.sku} ({v.colour}/{v.size}) [Avail: {v.stock?.available || 0}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          required
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) =>
                            handleFieldChange(idx, 'quantity', e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800 text-center"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          required
                          placeholder="Price ₹"
                          value={item.price}
                          onChange={(e) =>
                            handleFieldChange(idx, 'price', e.target.value)
                          }
                          className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-bold text-slate-800 text-center"
                        />
                      </div>

                      <div className="w-28 text-right font-extrabold text-sm text-slate-900 pr-1">
                        ₹{lineTotal.toLocaleString()}
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Calculation Display */}
            <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">Total Order Amount:</span>
              <span className="text-xl font-black text-indigo-950">
                ₹{totalOrderAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Notes */}
          <Input
            label="Internal Notes"
            placeholder="e.g. Special packing instructions or customer dispatch time preference"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/orders')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="lg"
              loading={submitting}
            >
              Create Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
