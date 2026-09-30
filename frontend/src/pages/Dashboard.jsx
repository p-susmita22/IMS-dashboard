import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  MinusCircle,
  ShoppingCart,
  ArrowLeftRight,
  Boxes,
  BarChart3,
  Package,
  Layers,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  RotateCcw,
  ArrowRight,
  Building2
} from 'lucide-react';
import { inventoryApi } from '../services/inventoryApi';
import { StockStatusBadge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await inventoryApi.getDashboardSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await inventoryApi.globalSearch(val);
      if (res.success) {
        setSearchResults(res.data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  if (loading && !summary) {
    return <Loader message="Loading inventory dashboard..." className="h-96" />;
  }

  const { cards, todayActivity, alerts } = summary || {
    cards: { totalProducts: 0, totalStock: 0, lowStock: 0, outOfStock: 0 },
    todayActivity: { stockAdded: 0, stockSold: 0, stockTransferred: 0, returns: 0 },
    alerts: { lowStock: [], outOfStock: [], pendingOrdersCount: 0 }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Global Search Bar */}
      <div className="relative">
        <div className="relative flex items-center shadow-lg shadow-slate-200/50 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
          <div className="pl-4 sm:pl-5 text-slate-400 dark:text-white dark:text-white">
            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search Product, SKU, Barcode, Size, Colour, Vendor..."
            className="w-full py-3.5 sm:py-4 px-3 sm:px-4 text-sm sm:text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:text-white dark:text-white focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="pr-4 text-xs font-semibold text-slate-400 dark:text-white dark:text-white hover:text-slate-600 dark:text-white "
            >
              Clear
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown Overlay */}
        {searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-[70vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
            {searching ? (
              <div className="p-6 text-center text-slate-500 dark:text-white  text-sm">
                Searching inventory...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-white  text-sm">
                No matching product, variant, or vendor found for "{searchQuery}".
              </div>
            ) : (
              searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    navigate(`/products/${item.productId}`);
                    setSearchQuery('');
                  }}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                          {item.productName}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-semibold text-slate-700 dark:text-white">
                          {item.colour} / {item.size}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-white  mt-1">
                        <span>SKU: <strong className="text-slate-700 dark:text-white">{item.sku}</strong></span>
                        {item.barcode && <span>Barcode: {item.barcode}</span>}
                        <span>Vendor: {item.vendor}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 dark:text-white dark:text-white font-medium">Physical: {item.totalStock} | Reserved: {item.reservedStock}</div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Available: <span className="text-emerald-600 dark:text-white">{item.availableStock}</span>
                        </div>
                      </div>
                      <StockStatusBadge
                        available={item.availableStock}
                        minimumStock={item.minimumStockLevel}
                      />
                    </div>
                  </div>

                  {/* Warehouse Breakdown */}
                  {item.locations && item.locations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-white ">
                      {item.locations.map((loc, lIdx) => (
                        <span key={lIdx} className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {loc.locationName}: <strong>{loc.available}</strong> avail ({loc.total} total)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 2. Large Quick Action Buttons (Mobile-Friendly) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/add-stock')}
          className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all text-center min-h-[90px]"
        >
          <PlusCircle className="w-7 h-7 sm:w-8 sm:h-8 mb-1.5" />
          <span className="font-bold text-xs sm:text-sm tracking-wide">+ ADD STOCK</span>
        </button>

        <button
          onClick={() => navigate('/stock-out')}
          className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-95 transition-all text-center min-h-[90px]"
        >
          <MinusCircle className="w-7 h-7 sm:w-8 sm:h-8 mb-1.5" />
          <span className="font-bold text-xs sm:text-sm tracking-wide">- STOCK OUT</span>
        </button>

        <button
          onClick={() => navigate('/orders')}
          className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all text-center min-h-[90px]"
        >
          <ShoppingCart className="w-7 h-7 sm:w-8 sm:h-8 mb-1.5" />
          <span className="font-bold text-xs sm:text-sm tracking-wide">ORDERS</span>
        </button>


        <button
          onClick={() => navigate('/products')}
          className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 transition-all text-center min-h-[90px]"
        >
          <Boxes className="w-7 h-7 sm:w-8 sm:h-8 mb-1.5" />
          <span className="font-bold text-xs sm:text-sm tracking-wide">PRODUCTS</span>
        </button>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => navigate('/reports')}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700 active:scale-95 transition-all text-center min-h-[90px]"
          >
            <BarChart3 className="w-7 h-7 sm:w-8 sm:h-8 mb-1.5" />
            <span className="font-bold text-xs sm:text-sm tracking-wide">REPORTS</span>
          </button>
        )}
      </div>

      {/* 3. Dashboard Stock Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Total Products */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white  uppercase tracking-wider">
              Total Products
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {cards.totalProducts.toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-white ">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Total Stock */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-white  uppercase tracking-wider">
              Total Stock Units
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {cards.totalStock.toLocaleString()}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-white flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-amber-200 bg-amber-50/20 dark:bg-amber-900/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-white uppercase tracking-wider">
              Low Stock
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-900 dark:text-white mt-1">
              {cards.lowStock}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-white flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-rose-200 bg-rose-50/20 dark:bg-rose-900/20 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-white uppercase tracking-wider">
              Out of Stock
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-900 dark:text-white mt-1">
              {cards.outOfStock}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-white flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Today's Activity & Alerts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Activity */}
        <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500 dark:text-white " /> Today's Activity
            </h3>
            <span className="text-xs font-semibold text-slate-400 dark:text-white dark:text-white">Live summary</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-white" />
                <span className="text-sm font-semibold text-slate-700 dark:text-white">Stock Added</span>
              </div>
              <span className="text-base font-bold text-emerald-700 dark:text-white">
                +{todayActivity.stockAdded}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <TrendingDown className="w-4 h-4 text-slate-600 dark:text-white " />
                <span className="text-sm font-semibold text-slate-700 dark:text-white">Stock Sold / Out</span>
              </div>
              <span className="text-base font-bold text-slate-800 dark:text-white">
                -{todayActivity.stockSold}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-white" />
                <span className="text-sm font-semibold text-slate-700 dark:text-white">Transferred</span>
              </div>
              <span className="text-base font-bold text-blue-700 dark:text-white">
                {todayActivity.stockTransferred}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-purple-600 dark:text-white" />
                <span className="text-sm font-semibold text-slate-700 dark:text-white">Returns Handled</span>
              </div>
              <span className="text-base font-bold text-purple-700 dark:text-white">
                {todayActivity.returns}
              </span>
            </div>
          </div>
        </div>

        {/* Critical Alerts (Low Stock & Out of Stock) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-white" /> Critical Stock Alerts
              </h3>
              {alerts.pendingOrdersCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-200 text-indigo-700 dark:text-white text-xs font-bold">
                  {alerts.pendingOrdersCount} Pending Orders
                </span>
              )}
            </div>

            {alerts.outOfStock.length === 0 && alerts.lowStock.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-white  py-6 text-center">
                All variants have healthy inventory levels. No critical stock alerts!
              </p>
            ) : (
              <div className="space-y-2.5">
                {/* Out of stock list */}
                {alerts.outOfStock.map((item, idx) => (
                  <div
                    key={`out-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-rose-50 dark:bg-rose-900/50 border border-rose-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🔴</span>
                      <div>
                        <span className="text-sm font-bold text-rose-950 dark:text-white">{item.sku}</span>
                        <span className="text-xs text-rose-700 dark:text-white ml-2">
                          ({item.colour} / {item.size})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-rose-600 text-white rounded-lg">
                      OUT OF STOCK (0 left)
                    </span>
                  </div>
                ))}

                {/* Low stock list */}
                {alerts.lowStock.map((item, idx) => (
                  <div
                    key={`low-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/50 border border-amber-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">⚠️</span>
                      <div>
                        <span className="text-sm font-bold text-amber-950 dark:text-white">{item.sku}</span>
                        <span className="text-xs text-amber-700 dark:text-white ml-2">
                          ({item.colour} / {item.size})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-amber-500 text-white rounded-lg">
                      LOW STOCK: {item.availableStock} remaining (Min: {item.minimumStockLevel})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-white  font-medium">
              Immediate restocking recommended for flagged items.
            </span>
            <button
              onClick={() => navigate('/add-stock')}
              className="text-xs font-bold text-emerald-600 dark:text-white hover:text-emerald-700 dark:text-white flex items-center gap-1"
            >
              Restock Now <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
