import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { adjustmentApi, locationApi } from '../services/opsApi';
import { productApi } from '../services/productApi';
import { inventoryApi } from '../services/inventoryApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Adjustments = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();

  // Prerequisites
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [systemStock, setSystemStock] = useState(0);
  const [physicalCount, setPhysicalCount] = useState('');
  const [reason, setReason] = useState('Counting Error');
  const [notes, setNotes] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);

  useEffect(() => {
    fetchAdjustments();
  }, []);

  const fetchAdjustments = async () => {
    try {
      setLoading(true);
      const res = await adjustmentApi.getAdjustments();
      if (res.success) setAdjustments(res.data || []);
    } catch (err) {
      showToast('Failed to fetch adjustments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAdjustmentModal = async () => {
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

  // When variant and location are selected, fetch live system stock
  useEffect(() => {
    const fetchCurrentSystemStock = async () => {
      if (selectedVariantId && locationId) {
        try {
          const res = await inventoryApi.getVariantInventory(selectedVariantId);
          if (res.success && res.data.inventories) {
            const inv = res.data.inventories.find(
              (i) => i.locationId?._id?.toString() === locationId.toString()
            );
            setSystemStock(inv ? inv.quantity : 0);
          }
        } catch (e) {
          setSystemStock(0);
        }
      }
    };
    fetchCurrentSystemStock();
  }, [selectedVariantId, locationId]);

  const countVal = physicalCount === '' ? systemStock : Number(physicalCount);
  const difference = countVal - systemStock;

  const handleAdjustmentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedVariantId || !locationId || physicalCount === '') {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (countVal < 0) {
      showToast('Physical count cannot be negative', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adjustmentApi.createAdjustment({
        variantId: selectedVariantId,
        locationId,
        physicalCount: countVal,
        reason,
        notes: notes.trim(),
        autoApprove: autoApprove && isAdmin
      });

      if (res.success) {
        showToast(res.message || 'Adjustment logged successfully!', 'success');
        setIsModalOpen(false);
        setPhysicalCount('');
        setNotes('');
        fetchAdjustments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing adjustment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'approve' }));
    try {
      const res = await adjustmentApi.approveAdjustment(id);
      if (res.success) {
        showToast(res.message || 'Adjustment approved and stock updated!', 'success');
        fetchAdjustments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error approving adjustment', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading((prev) => ({ ...prev, [id]: 'reject' }));
    try {
      const res = await adjustmentApi.rejectAdjustment(id);
      if (res.success) {
        showToast(res.message || 'Adjustment rejected', 'info');
        fetchAdjustments();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error rejecting adjustment', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <SlidersHorizontal className="w-7 h-7 text-amber-600" />
            Stock Adjustments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Physical inventory count reconciliations with audit reason tracking and manager approval.
          </p>
        </div>
        <Button
          onClick={openAdjustmentModal}
          variant="brand"
          size="lg"
          icon={Plus}
        >
          New Stock Adjustment
        </Button>
      </div>

      {/* Adjustment Table */}
      {loading ? (
        <Loader message="Loading adjustments..." />
      ) : adjustments.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No Adjustments Recorded"
          description="Stock counts are synchronized with the system."
          actionText="New Adjustment"
          onAction={openAdjustmentModal}
        />
      ) : (
        <Table
          headers={[
            'Adjustment #',
            'Date',
            'Warehouse',
            'SKU',
            'System Stock',
            'Physical Count',
            'Difference',
            'Reason',
            'Status',
            'Requested By',
            'Actions'
          ]}
        >
          {adjustments.map((a) => (
            <tr key={a._id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-xs">
                {a.adjustmentNumber}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                {new Date(a.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-600">
                {a.locationId?.name}
              </td>
              <td className="px-5 py-3.5 font-mono font-bold text-slate-800 text-xs">
                {a.variantId?.sku}
              </td>
              <td className="px-5 py-3.5 text-xs font-semibold text-slate-500">
                {a.systemStock}
              </td>
              <td className="px-5 py-3.5 text-xs font-extrabold text-slate-900">
                {a.physicalCount}
              </td>
              <td className="px-5 py-3.5 text-xs font-black">
                {a.difference > 0 ? (
                  <span className="text-emerald-600">+{a.difference}</span>
                ) : a.difference < 0 ? (
                  <span className="text-rose-600">{a.difference}</span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-700">
                <span className="font-semibold">{a.reason}</span>
                {a.notes && <span className="block text-[11px] text-slate-400">{a.notes}</span>}
              </td>
              <td className="px-5 py-3.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    a.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : a.status === 'REJECTED'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {a.status}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500">
                {a.requestedBy?.name || 'Staff'}
              </td>
              <td className="px-5 py-3.5">
                {a.status === 'PENDING' && isAdmin ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleApprove(a._id)}
                      disabled={actionLoading[a._id]}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(a._id)}
                      disabled={actionLoading[a._id]}
                      className="px-2 py-1 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* New Adjustment Modal with Live Difference Calculator */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Physical Stock Adjustment"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
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

          {/* System Stock vs Physical Count Calculator */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                  System Stock
                </span>
                <strong className="text-lg font-bold text-slate-700">{systemStock}</strong>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                  Physical Count
                </span>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Count"
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(e.target.value)}
                  className="w-full text-center p-1.5 rounded-lg border border-slate-300 font-extrabold text-slate-900 bg-white"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                  Difference
                </span>
                <strong
                  className={`text-lg font-black ${
                    difference > 0
                      ? 'text-emerald-600'
                      : difference < 0
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}
                >
                  {difference > 0 ? `+${difference}` : difference}
                </strong>
              </div>
            </div>
          </div>

          <Select
            label="Reason for Adjustment"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            options={[
              { value: 'Counting Error', label: 'Counting Error / Tally Correction' },
              { value: 'Damaged', label: 'Damaged Stock' },
              { value: 'Missing', label: 'Missing / Lost Stock' },
              { value: 'Other', label: 'Other' }
            ]}
          />

          <Input
            label="Audit Notes / Explanation"
            placeholder="e.g. Discrepancy discovered during bi-weekly shelf count"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {isAdmin && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="autoApprove"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <label htmlFor="autoApprove" className="text-xs font-semibold text-slate-700">
                Immediately approve and apply adjustment (Manager / Admin override)
              </label>
            </div>
          )}

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
              Submit Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
