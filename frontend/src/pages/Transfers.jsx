import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Plus, Building2, Calendar, User as UserIcon } from 'lucide-react';
import { transferApi } from '../services/transferApi';
import { productApi } from '../services/productApi';
import { locationApi } from '../services/opsApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form prerequisites
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);

  // Form State
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await transferApi.getTransfers();
      if (res.success) setTransfers(res.data || []);
    } catch (err) {
      showToast('Failed to fetch transfers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openTransferModal = async () => {
    setIsModalOpen(true);
    try {
      const [lRes, pRes] = await Promise.all([
        locationApi.getLocations(),
        productApi.getProducts()
      ]);
      if (lRes.success) setLocations(lRes.data || []);
      if (pRes.success) setProducts(pRes.data || []);
    } catch (err) {
      showToast('Failed to load locations or products', 'error');
    }
  };

  const selectedProduct = products.find((p) => p._id === selectedProductId);
  const variants = selectedProduct?.variants || [];

  const handleTransferSubmit = async (e) => {
    e.preventDefault();

    if (!fromLocationId || !toLocationId || !selectedVariantId || !quantity) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (fromLocationId === toLocationId) {
      showToast('Source and destination warehouse cannot be the same', 'error');
      return;
    }

    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      showToast('Quantity must be a positive integer', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await transferApi.createTransfer({
        fromLocationId,
        toLocationId,
        variantId: selectedVariantId,
        quantity: qty,
        notes: notes.trim()
      });

      if (res.success) {
        showToast(res.message || 'Transfer completed successfully!', 'success');
        setIsModalOpen(false);
        setQuantity('');
        setNotes('');
        fetchTransfers();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error processing transfer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-7 h-7 text-blue-600" />
            Stock Transfers
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Inter-warehouse stock movements. Validates source stock and logs dual audit records.
          </p>
        </div>
        <Button
          onClick={openTransferModal}
          variant="brand"
          size="lg"
          icon={Plus}
        >
          ⇄ Transfer Stock
        </Button>
      </div>

      {/* Transfer History Table */}
      {loading ? (
        <Loader message="Loading transfers..." />
      ) : transfers.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No Transfers Recorded"
          description="There are no inter-warehouse transfers logged yet."
          actionText="Transfer Stock"
          onAction={openTransferModal}
        />
      ) : (
        <Table
          headers={[
            'Transfer #',
            'Date',
            'From Warehouse',
            'To Warehouse',
            'Product / SKU',
            'Quantity',
            'Status',
            'Transferred By',
            'Notes'
          ]}
        >
          {transfers.map((t) => (
            <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-xs">
                {t.transferNumber}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                {new Date(t.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3.5 text-xs font-semibold text-rose-700">
                {t.fromLocationId?.name}
              </td>
              <td className="px-5 py-3.5 text-xs font-semibold text-emerald-700">
                {t.toLocationId?.name}
              </td>
              <td className="px-5 py-3.5">
                <span className="text-xs font-bold text-slate-900 block">
                  {t.variantId?.productId?.name || 'Product'}
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {t.variantId?.sku} ({t.variantId?.colour}/{t.variantId?.size})
                </span>
              </td>
              <td className="px-5 py-3.5 text-sm font-extrabold text-slate-900">
                {t.quantity} units
              </td>
              <td className="px-5 py-3.5">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {t.status}
                </span>
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-600">
                {t.performedBy?.name || 'System'}
              </td>
              <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">
                {t.notes || '-'}
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* New Transfer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Transfer Stock Between Warehouses"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="From (Source Warehouse)"
              required
              value={fromLocationId}
              onChange={(e) => setFromLocationId(e.target.value)}
              options={locations.map((l) => ({ value: l._id, label: l.name }))}
              placeholder="-- Source --"
            />
            <Select
              label="To (Destination Warehouse)"
              required
              value={toLocationId}
              onChange={(e) => setToLocationId(e.target.value)}
              options={locations.map((l) => ({ value: l._id, label: l.name }))}
              placeholder="-- Destination --"
            />
          </div>

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

          <Input
            label="Quantity to Transfer"
            type="number"
            min="1"
            required
            placeholder="e.g. 20"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <Input
            label="Transfer Notes / Reason"
            placeholder="e.g. Replenish showroom display stock"
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
              Confirm Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
