import React, { useState, useEffect } from 'react';
import { RotateCcw, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { returnApi, locationApi } from '../services/opsApi';
import { productApi } from '../services/productApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Prerequisites
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState('GOOD');
  const [reason, setReason] = useState('Customer return - unused');
  const [notes, setNotes] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const res = await returnApi.getReturns();
      if (res.success) setReturns(res.data || []);
    } catch (err) {
      showToast('Failed to fetch returns', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openReturnModal = async () => {
    setIsModalOpen(true);
    try {
      const [lRes, pRes] = await Promise.all([
        locationApi.getLocations(),
        productApi.getProducts()
      ]);
      if (lRes.success) {
        setLocations(lRes.data || []);
        if (lRes.data.length > 0) setLocationId(lRes.data[0]._id);
      }
      if (pRes.success) setProducts(pRes.data || []);
    } catch (err) {
      showToast('Failed to load prerequisites', 'error');
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const variants = selectedProduct?.variants || [];

  const handleReturnSubmit = async (e) => {
    e.preventDefault();

    if (!customerName || !selectedVariantId || !locationId || !quantity || !reason) {
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
      const res = await returnApi.createReturn({
        customerName: customerName.trim(),
        variantId: selectedVariantId,
        locationId,
        quantity: qty,
        condition,
        reason: reason.trim(),
        notes: notes.trim()
      });

      if (res.success) {
        showToast(res.message || 'Return processed successfully!', 'success');
        setIsModalOpen(false);
        setCustomerName('');
        setQuantity('');
        setNotes('');
        fetchReturns();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing return', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-purple-600" />
            Customer Returns
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log returned stock. GOOD condition returns to available stock; DAMAGED is isolated.
          </p>
        </div>
        <Button
          onClick={openReturnModal}
          variant="brand"
          size="lg"
          icon={Plus}
        >
          Process Return
        </Button>
      </div>

      {/* Return History Table */}
      {loading ? (
        <Loader message="Loading returns..." />
      ) : returns.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No Returns Logged"
          description="There are no customer returns recorded in the system yet."
          actionText="Process Return"
          onAction={openReturnModal}
        />
      ) : (
        <Table
          headers={[
            'Return #',
            'Date',
            'Customer',
            'Warehouse',
            'Product / SKU',
            'Quantity',
            'Condition',
            'Reason',
            'Handled By'
          ]}
        >
          {returns.map((r) => (
            <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-xs">
                {r.returnNumber}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                {new Date(r.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3.5 font-bold text-slate-800 text-xs">
                {r.customerName}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-600">
                {r.locationId?.name}
              </td>
              <td className="px-5 py-3.5">
                <span className="text-xs font-bold text-slate-900 block">
                  {r.variantId?.productId?.name || 'Product'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {r.variantId?.sku} ({r.variantId?.colour}/{r.variantId?.size})
                </span>
              </td>
              <td className="px-5 py-3.5 text-sm font-extrabold text-slate-900">
                {r.quantity} units
              </td>
              <td className="px-5 py-3.5">
                {r.condition === 'GOOD' ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    GOOD (Restocked)
                  </span>
                ) : (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    DAMAGED (Quarantined)
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-600">
                {r.reason}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500">
                {r.handledBy?.name || 'Staff'}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* New Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Process Customer Return"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <Input
            label="Customer Name"
            required
            placeholder="e.g. Retailer Name or Customer"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <Select
            label="Warehouse Location"
            required
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            options={locations.map((l) => ({ value: l._id, label: l.name }))}
            placeholder="-- Choose Warehouse --"
          />

          <Select
            label="Product"
            required
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setSelectedVariantId('');
            }}
            options={products.map((p) => ({ value: p._id, label: p.name }))}
            placeholder="-- Choose Product --"
          />

          {selectedProductId && (
            <Select
              label="Variant (SKU)"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              min="1"
              required
              placeholder="e.g. 5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Select
              label="Item Condition"
              required
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              options={[
                { value: 'GOOD', label: 'GOOD (Pristine, adds to available stock)' },
                { value: 'DAMAGED', label: 'DAMAGED (Defect, moves to damaged stock)' }
              ]}
            />
          </div>

          <Input
            label="Reason for Return"
            required
            placeholder="e.g. Size mismatch, defective stitch, overstock return"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <Input
            label="Notes"
            placeholder="Additional inspection notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              loading={submitting}
            >
              Submit Return
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
