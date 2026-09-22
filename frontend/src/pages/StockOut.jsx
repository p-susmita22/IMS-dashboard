import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MinusCircle, ArrowLeft, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { productApi } from '../services/productApi';
import { inventoryApi } from '../services/inventoryApi';
import { locationApi } from '../services/opsApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { useToast } from '../context/ToastContext';

export const StockOut = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [reason, setReason] = useState('Sale / Wholesale Fulfillment');
  const [notes, setNotes] = useState('');

  // Live warehouse stock feedback
  const [stockInfo, setStockInfo] = useState(null);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
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
          setSelectedLocationId(lRes.data[0]._id);
        }
      }
    } catch (err) {
      showToast('Failed to load prerequisites', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const variants = selectedProduct?.variants || [];
  const selectedVariant = variants.find((v) => v._id === selectedVariantId);

  // Whenever variant or location changes, fetch exact inventory at that warehouse
  useEffect(() => {
    const checkStock = async () => {
      if (selectedVariantId && selectedLocationId) {
        try {
          const res = await inventoryApi.getVariantInventory(selectedVariantId);
          if (res.success && res.data.inventories) {
            const locInv = res.data.inventories.find(
              (inv) => inv.locationId?._id?.toString() === selectedLocationId.toString()
            );
            if (locInv) {
              setStockInfo({
                total: locInv.quantity,
                reserved: locInv.reservedQuantity,
                available: Math.max(0, locInv.quantity - locInv.reservedQuantity)
              });
            } else {
              setStockInfo({ total: 0, reserved: 0, available: 0 });
            }
          }
        } catch (e) {
          console.error('Failed to fetch stock info', e);
        }
      } else {
        setStockInfo(null);
      }
    };

    checkStock();
  }, [selectedVariantId, selectedLocationId]);

  const requestedQty = Number(quantity) || 0;
  const isInsufficient = stockInfo && requestedQty > stockInfo.available;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedVariantId || !selectedLocationId || !quantity) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (requestedQty <= 0) {
      showToast('Quantity must be a positive integer', 'error');
      return;
    }

    if (isInsufficient) {
      showToast(
        `Insufficient available stock. Available: ${stockInfo.available}, Requested: ${requestedQty}`,
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await inventoryApi.stockOut({
        variantId: selectedVariantId,
        locationId: selectedLocationId,
        quantity: requestedQty,
        customerName: customerName.trim(),
        orderNumber: orderNumber.trim(),
        reason: reason.trim(),
        notes: notes.trim()
      });

      if (res.success) {
        showToast(res.message || `${requestedQty} units removed successfully.`, 'success');
        navigate('/');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing stock out', 'error');
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
            <MinusCircle className="w-7 h-7 text-slate-900" />
            Stock Out (Sale / Dispatch)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Deduct physical inventory. Negative stock is strictly prevented.
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
              onChange={(e) => setSelectedVariantId(e.target.value)}
              options={variants.map((v) => ({
                value: v._id,
                label: `${v.sku} - ${v.colour} / ${v.size}`
              }))}
              placeholder="-- Choose Variant --"
            />
          )}

          {/* 3. Location Selection */}
          <Select
            label="3. Warehouse Location"
            required
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            options={locations.map((l) => ({
              value: l._id,
              label: `${l.name} (${l.code})`
            }))}
            placeholder="-- Choose Warehouse --"
          />

          {/* Live Available Stock Box */}
          {stockInfo && (
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isInsufficient
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Warehouse Inventory Level</span>
                {isInsufficient ? (
                  <span className="text-rose-600 font-bold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> Insufficient Stock
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Stock Available
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Total Stock</span>
                  <strong className="text-base text-slate-900">{stockInfo.total}</strong>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Reserved</span>
                  <strong className="text-base text-indigo-600">{stockInfo.reserved}</strong>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block">Available</span>
                  <strong
                    className={`text-base font-extrabold ${
                      isInsufficient ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {stockInfo.available}
                  </strong>
                </div>
              </div>

              {isInsufficient && (
                <div className="mt-3 text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  ❌ Insufficient available stock. Available: {stockInfo.available}, Requested: {requestedQty}
                </div>
              )}
            </div>
          )}

          {/* 4. Quantity to Stock Out */}
          <Input
            label="4. Quantity to Remove / Sell"
            type="number"
            min="1"
            required
            placeholder="e.g. 20"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            error={isInsufficient ? `Cannot exceed available stock of ${stockInfo?.available}` : ''}
          />

          {/* 5. Customer and Order Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="5. Customer / Retailer Name"
              placeholder="e.g. XYZ Stores"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />

            <Input
              label="6. Order / Delivery Ref #"
              placeholder="e.g. ORD-2026-99"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
          </div>

          {/* 6. Reason & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="7. Reason"
              placeholder="e.g. Sale, Consignment dispatch"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <Input
              label="8. Notes"
              placeholder="e.g. Dispatched via Express logistics"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

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
              variant="primary"
              size="lg"
              loading={submitting}
              disabled={isInsufficient || requestedQty <= 0}
            >
              - Confirm & Stock Out
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
