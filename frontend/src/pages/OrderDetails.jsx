import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle2,
  PackageCheck,
  Truck,
  CheckCheck,
  XCircle,
  Building2,
  Clock,
  User as UserIcon,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { orderApi } from '../services/orderApi';
import { Button } from '../components/common/Button';
import { OrderStatusBadge } from '../components/common/Badge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Loader } from '../components/common/Loader';
import { useToast } from '../context/ToastContext';

export const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Dialogs
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    targetStatus: '',
    title: '',
    message: '',
    variant: 'brand'
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrderById(id);
      if (res.success) {
        setOrder(res.data);
      }
    } catch (err) {
      showToast('Failed to load order details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus, notes = '') => {
    setUpdating(true);
    try {
      const res = await orderApi.updateOrderStatus(order._id, targetStatus, notes);
      if (res.success) {
        showToast(res.message || `Order updated to ${targetStatus}`, 'success');
        setOrder(res.data);
        if (targetStatus === 'DELIVERED') {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error updating order status', 'error');
    } finally {
      setUpdating(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  if (loading) {
    return <Loader message="Loading order details..." className="h-96" />;
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-base text-slate-600">Order not found.</p>
        <Button onClick={() => navigate('/orders')} variant="secondary" className="mt-4">
          Back to Orders
        </Button>
      </div>
    );
  }

  const steps = ['NEW', 'CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED'];
  const currentStepIdx = steps.indexOf(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <OrderStatusBadge status={order.orderStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created on {new Date(order.createdAt).toLocaleString()} by{' '}
              {order.createdBy?.name || 'Staff'}
            </p>
          </div>
        </div>

        {/* Dynamic Action Buttons based on Status */}
        <div className="flex flex-wrap items-center gap-2">
          {order.orderStatus === 'NEW' && (
            <>
              <Button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    targetStatus: 'CONFIRMED',
                    title: 'Confirm Order & Reserve Stock',
                    message:
                      'This will immediately reserve the required variant quantities at the warehouse. Available stock will decrease while physical stock remains untouched.',
                    variant: 'brand'
                  })
                }
                variant="brand"
                size="md"
                loading={updating}
              >
                Confirm & Reserve Stock
              </Button>
              <Button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    targetStatus: 'CANCELLED',
                    title: 'Cancel Order',
                    message: 'Are you sure you want to cancel this order?',
                    variant: 'danger'
                  })
                }
                variant="outline"
                size="md"
                loading={updating}
              >
                Cancel
              </Button>
            </>
          )}

          {order.orderStatus === 'CONFIRMED' && (
            <>
              <Button
                onClick={() => handleStatusChange('PACKED')}
                variant="brand"
                size="md"
                loading={updating}
              >
                Mark as Packed
              </Button>
              <Button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    targetStatus: 'CANCELLED',
                    title: 'Cancel Order & Release Reservation',
                    message:
                      'Cancelling this order will release all reserved items back into available warehouse stock.',
                    variant: 'danger'
                  })
                }
                variant="outline"
                size="md"
                loading={updating}
              >
                Cancel Order
              </Button>
            </>
          )}

          {order.orderStatus === 'PACKED' && (
            <>
              <Button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    targetStatus: 'DISPATCHED',
                    title: 'Dispatch Order (Stock Out)',
                    message:
                      'Dispatching this order will convert the reservation into actual stock out and deduct physical inventory. A permanent STOCK_OUT audit record will be logged.',
                    variant: 'brand'
                  })
                }
                variant="brand"
                size="md"
                loading={updating}
              >
                Dispatch Order (Deduct Stock)
              </Button>
              <Button
                onClick={() =>
                  setConfirmModal({
                    isOpen: true,
                    targetStatus: 'CANCELLED',
                    title: 'Cancel Order & Release Stock',
                    message:
                      'Cancelling this order will release the reserved inventory back to available stock.',
                    variant: 'danger'
                  })
                }
                variant="outline"
                size="md"
                loading={updating}
              >
                Cancel Order
              </Button>
            </>
          )}

          {order.orderStatus === 'DISPATCHED' && (
            <Button
              onClick={() => handleStatusChange('DELIVERED')}
              variant="brand"
              size="md"
              loading={updating}
            >
              Mark as Delivered
            </Button>
          )}
        </div>
      </div>

      {/* Visual Status Progression Timeline */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
          Order Status Lifecycle
        </h3>

        {order.orderStatus === 'CANCELLED' ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-900">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Order Cancelled</h4>
              <p className="text-xs text-rose-700">
                Any reserved stock has been safely released back into warehouse inventory.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-2">
            {steps.map((st, idx) => {
              const isDone = currentStepIdx >= idx;
              const isCurrent = currentStepIdx === idx;

              return (
                <div key={st} className="flex-1 flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center relative">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-50'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isDone ? <CheckCheck className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        isCurrent
                          ? 'text-slate-900 font-extrabold'
                          : isDone
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {st}
                    </span>
                    {st === 'CONFIRMED' && (
                      <span className="text-[10px] text-purple-700 font-semibold block sm:inline">
                        Stock Reserved
                      </span>
                    )}
                    {st === 'DISPATCHED' && (
                      <span className="text-[10px] text-indigo-700 font-semibold block sm:inline">
                        Stock Deducted
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer and Warehouse Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Customer Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer Information
          </h3>
          <p className="text-base font-bold text-slate-900">{order.customerName}</p>
          <p className="text-xs text-slate-600 font-mono font-medium">{order.phoneNumber}</p>
          <p className="text-xs text-slate-500">{order.deliveryAddress}</p>
        </div>

        {/* Warehouse Details & Reservation Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Fulfillment Warehouse
          </h3>
          <p className="text-base font-bold text-slate-900 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            {order.locationId?.name} ({order.locationId?.code})
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            {order.isReserved && (
              <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-lg">
                ● Stock Reserved
              </span>
            )}
            {order.isStockDeducted && (
              <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg">
                ✓ Physical Stock Deducted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ordered Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Order Items</h3>
          <span className="text-xs text-slate-400 font-medium">
            {order.items?.length || 0} product(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-xs">
                <th className="p-4">Product</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Variant</th>
                <th className="p-4 text-right">Quantity</th>
                <th className="p-4 text-right">Unit Price</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {order.items?.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="p-4 font-bold text-slate-900">{it.productName}</td>
                  <td className="p-4 font-mono font-bold text-slate-700">{it.sku}</td>
                  <td className="p-4 text-slate-600">{it.colour} / {it.size}</td>
                  <td className="p-4 text-right font-extrabold text-slate-900">{it.quantity}</td>
                  <td className="p-4 text-right text-slate-600">₹{it.price}</td>
                  <td className="p-4 text-right font-bold text-slate-900">
                    ₹{it.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold border-t border-slate-200 text-sm">
                <td colSpan={5} className="p-4 text-right text-slate-700">
                  Grand Total:
                </td>
                <td className="p-4 text-right font-black text-indigo-950 text-base">
                  ₹{order.totalAmount?.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => handleStatusChange(confirmModal.targetStatus)}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmVariant={confirmModal.variant}
        confirmText="Yes, Proceed"
        loading={updating}
      />
    </div>
  );
};
