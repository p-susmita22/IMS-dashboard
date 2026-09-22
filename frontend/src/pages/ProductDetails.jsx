import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  PlusCircle,
  MinusCircle,
  ArrowLeftRight,
  History,
  Building2,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Calendar,
  User as UserIcon
} from 'lucide-react';
import { productApi } from '../services/productApi';
import { inventoryApi } from '../services/inventoryApi';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { StockStatusBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { useToast } from '../context/ToastContext';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Stock History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [variantAudit, setVariantAudit] = useState(null);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await productApi.getProductById(id);
      if (res.success) {
        setProduct(res.data);
        if (res.data.variants && res.data.variants.length > 0) {
          setSelectedVariant(res.data.variants[0]);
        }
      }
    } catch (err) {
      showToast('Failed to load product details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async (variant) => {
    setSelectedVariant(variant);
    setIsHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await inventoryApi.getVariantInventory(variant._id);
      if (res.success) {
        setVariantAudit(res.data);
      }
    } catch (err) {
      showToast('Failed to load movement audit trail', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading product details..." className="h-96" />;
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-base text-slate-600">Product not found.</p>
        <Button onClick={() => navigate('/products')} variant="secondary" className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Link & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/products')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{product.category}</span>
              {product.brand && <span>• {product.brand}</span>}
            </div>
          </div>
        </div>

        {/* Global Action Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => navigate(`/add-stock`)}
            variant="brand"
            size="md"
            icon={PlusCircle}
          >
            Add Stock
          </Button>
          <Button
            onClick={() => navigate(`/stock-out`)}
            variant="primary"
            size="md"
            icon={MinusCircle}
          >
            Stock Out
          </Button>
        </div>
      </div>

      {/* Main Product Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="w-full aspect-square rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
            {product.productImage ? (
              <img
                src={product.productImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-16 h-16 text-slate-300" />
            )}
          </div>
        </div>

        <div className="md:col-span-3 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">{product.name}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description || 'No detailed product description provided.'}
            </p>
            <div className="flex flex-wrap gap-4 pt-2 text-xs">
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400 block">Category</span>
                <span className="font-bold text-slate-800">{product.category}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400 block">Brand</span>
                <span className="font-bold text-slate-800">{product.brand || 'Unbranded'}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <span className="text-slate-400 block">Status</span>
                <span className="font-bold text-emerald-600">{product.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Variants & Location Inventory Breakdown Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" /> Variants & Multi-Warehouse Stock
        </h3>

        <div className="space-y-4">
          {product.variants.map((v) => (
            <div
              key={v._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      {v.colour} / {v.size}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold">
                      {v.sku}
                    </span>
                    {v.barcode && (
                      <span className="text-xs text-slate-500 font-mono">
                        Barcode: {v.barcode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>Purchase: <strong>₹{v.purchasePrice}</strong></span>
                    <span>•</span>
                    <span>Selling: <strong>₹{v.sellingPrice}</strong></span>
                    <span>•</span>
                    <span>Min Stock Level: <strong>{v.minimumStockLevel}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <StockStatusBadge
                    available={v.availableStock}
                    minimumStock={v.minimumStockLevel}
                  />
                  <Button
                    onClick={() => handleOpenHistory(v)}
                    variant="outline"
                    size="sm"
                    icon={History}
                  >
                    Stock History
                  </Button>
                </div>
              </div>

              {/* Stock Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Physical Stock
                  </span>
                  <p className="text-lg font-bold text-slate-900">{v.totalStock}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Reserved Stock
                  </span>
                  <p className="text-lg font-bold text-indigo-600">{v.reservedStock}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Available Stock
                  </span>
                  <p className="text-lg font-extrabold text-emerald-600">{v.availableStock}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Damaged Stock
                  </span>
                  <p className="text-lg font-bold text-rose-600">{v.damagedStock}</p>
                </div>
              </div>

              {/* Location-wise Breakdown Table */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Warehouse Allocations
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {v.locationStock && v.locationStock.length > 0 ? (
                    v.locationStock.map((loc, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {loc.locationName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {loc.locationCode}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-xs mt-2 pt-2 border-t border-slate-100">
                          <span className="text-slate-500">Total: {loc.quantity}</span>
                          <span className="text-xs font-bold text-emerald-600">
                            Avail: {loc.availableStock}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">No warehouse stock allocated yet.</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock History Modal (Auditable Movement Trail) */}
      <Modal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Stock History Audit: ${selectedVariant?.sku || ''}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Permanent Movement Trail
              </p>
              <h4 className="text-base font-bold text-white">
                How did we arrive at the current stock?
              </h4>
            </div>
            {variantAudit && (
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span>Physical: <strong className="text-white">{variantAudit.summary?.totalPhysical}</strong></span>
                <span>Reserved: <strong className="text-indigo-300">{variantAudit.summary?.totalReserved}</strong></span>
                <span>Available: <strong className="text-emerald-400 text-sm font-extrabold">{variantAudit.summary?.totalAvailable}</strong></span>
              </div>
            )}
          </div>

          {historyLoading ? (
            <Loader message="Loading audit trail..." />
          ) : !variantAudit || variantAudit.movements.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-500">
              No stock movements recorded for this variant.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                    <th className="p-3">Date</th>
                    <th className="p-3">Operation</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Prev</th>
                    <th className="p-3 text-right">New</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">User</th>
                    <th className="p-3">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {variantAudit.movements.map((m) => {
                    const isPlus = [
                      'STOCK_IN',
                      'TRANSFER_IN',
                      'RETURN_GOOD'
                    ].includes(m.movementType);
                    const isMinus = [
                      'STOCK_OUT',
                      'TRANSFER_OUT'
                    ].includes(m.movementType);

                    return (
                      <tr key={m._id} className="hover:bg-slate-50">
                        <td className="p-3 whitespace-nowrap text-slate-500">
                          {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              m.movementType === 'STOCK_IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.movementType === 'STOCK_OUT'
                                ? 'bg-rose-100 text-rose-800'
                                : m.movementType.includes('TRANSFER')
                                ? 'bg-blue-100 text-blue-800'
                                : m.movementType.includes('RETURN')
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {m.movementType}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-extrabold text-sm ${isPlus ? 'text-emerald-600' : isMinus ? 'text-rose-600' : 'text-slate-800'}`}>
                          {isPlus ? `+${m.quantity}` : isMinus ? `-${m.quantity}` : m.quantity}
                        </td>
                        <td className="p-3 text-right text-slate-500 font-mono">
                          {m.previousQuantity}
                        </td>
                        <td className="p-3 text-right text-slate-900 font-bold font-mono">
                          {m.newQuantity}
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-700">
                          {m.locationId ? m.locationId.name : '-'}
                        </td>
                        <td className="p-3 whitespace-nowrap text-slate-600">
                          {m.performedBy?.name || 'System'}
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate" title={m.notes || m.reason}>
                          {m.notes || m.reason || m.referenceId || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
