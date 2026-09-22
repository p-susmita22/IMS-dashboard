import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Calendar,
  Building2,
  Phone,
  Clock,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../services/orderApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Table } from '../components/common/Table';
import { OrderStatusBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const statuses = [
    'ALL',
    'NEW',
    'CONFIRMED',
    'PACKED',
    'DISPATCHED',
    'DELIVERED',
    'CANCELLED'
  ];

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrders({
        status: statusFilter,
        search
      });
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleDeleteOrder = async (order) => {
    if (window.confirm(`Are you sure you want to delete order ${order.orderNumber}? It will be moved to the Trash Bin.`)) {
      try {
        const res = await orderApi.deleteOrder(order._id);
        if (res.success) {
          showToast(res.message, 'success');
          fetchOrders();
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete order', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Orders
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track status progression, inventory reservation, and dispatch delivery.
          </p>
        </div>
        <Button
          onClick={() => navigate('/orders/create')}
          variant="brand"
          size="lg"
          icon={Plus}
        >
          Create New Order
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <Input
            placeholder="Search by Order #, Customer Name, or Phone..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {loading ? (
          <Loader message="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No Orders Found"
            description="There are no wholesale orders matching this status."
            actionText="Create Order"
            onAction={() => navigate('/orders/create')}
          />
        ) : (
          <Table
            headers={[
              'Order #',
              'Date',
              'Customer',
              'Warehouse',
              'Items',
              'Total Amount',
              'Reservation',
              'Status',
              'Actions'
            ]}
          >
            {orders.map((o) => (
              <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-xs">
                  {o.orderNumber}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-bold text-slate-800 block text-xs">
                    {o.customerName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {o.phoneNumber}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                  {o.locationId?.name || 'N/A'}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-700 font-semibold">
                  {o.items?.length || 0} product(s)
                </td>
                <td className="px-5 py-3.5 text-sm font-extrabold text-slate-900">
                  ₹{o.totalAmount.toLocaleString()}
                </td>
                <td className="px-5 py-3.5 text-xs">
                  {o.isReserved ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      ● Stock Reserved
                    </span>
                  ) : o.isStockDeducted ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      ✓ Stock Dispatched
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Unreserved</span>
                  )}
                </td>
                <td className="px-5 py-3.5">
                  <OrderStatusBadge status={o.orderStatus} />
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/orders/${o._id}`)}
                      variant="outline"
                      size="sm"
                      icon={Eye}
                    >
                      View
                    </Button>
                    {isAdmin && (
                      <Button
                        onClick={() => handleDeleteOrder(o)}
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
          <Loader message="Loading orders..." />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No Orders Found"
            description="There are no wholesale orders matching this status."
          />
        ) : (
          orders.map((o) => (
            <div
              key={o._id}
              onClick={() => navigate(`/orders/${o._id}`)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {o.orderNumber}
                </span>
                <OrderStatusBadge status={o.orderStatus} />
              </div>

              <div className="flex items-start justify-between gap-2 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{o.customerName}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">{o.phoneNumber}</p>
                  <p className="text-slate-400 mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {o.locationId?.name}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-slate-900 block">
                    ₹{o.totalAmount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {o.items?.length || 0} items
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {new Date(o.createdAt).toLocaleDateString()}
                </span>
                {o.isReserved && (
                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    Stock Reserved
                  </span>
                )}
                {o.isStockDeducted && (
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Stock Dispatched
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
