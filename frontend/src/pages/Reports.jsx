import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Filter,
  Download,
  Calendar,
  Layers,
  ShoppingBag,
  Truck,
  History
} from 'lucide-react';
import { reportApi } from '../services/reportApi';
import { locationApi } from '../services/opsApi';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';

export const Reports = () => {
  const [activeReport, setActiveReport] = useState('stock'); // 'stock', 'sales', 'purchases', 'movements'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [movementType, setMovementType] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [activeReport, locationId, startDate, endDate, movementType]);

  const loadLocations = async () => {
    try {
      const res = await locationApi.getLocations();
      if (res.success) setLocations(res.data || []);
    } catch (e) {}
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params = {
        locationId: locationId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        movementType: movementType || undefined
      };

      let res;
      if (activeReport === 'stock') res = await reportApi.getStockReport(params);
      else if (activeReport === 'sales') res = await reportApi.getSalesReport(params);
      else if (activeReport === 'purchases') res = await reportApi.getPurchaseReport(params);
      else if (activeReport === 'movements') res = await reportApi.getMovementReport(params);

      if (res && res.success) {
        setData(res.data || []);
      }
    } catch (err) {
      showToast('Failed to load report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const params = {
        locationId: locationId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        movementType: movementType || undefined
      };
      await reportApi.downloadExport(activeReport, format, params);
      showToast(`Exported ${activeReport} report to ${format.toUpperCase()}`, 'success');
    } catch (err) {
      showToast(`Failed to export ${format.toUpperCase()} report`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const reportsNav = [
    { id: 'stock', label: '1. Stock Report', icon: Layers },
    { id: 'sales', label: '2. Sales Report', icon: ShoppingBag },
    { id: 'purchases', label: '3. Purchase Report', icon: Truck },
    { id: 'movements', label: '4. Stock Movement Audit', icon: History }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Inventory & Financial Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit stock levels, sales turnover, purchase volumes, and permanent stock trails.
          </p>
        </div>

        {/* 1-Click Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => handleExport('excel')}
            variant="outline"
            size="md"
            icon={FileSpreadsheet}
            loading={exporting}
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
          >
            Export Excel
          </Button>
          <Button
            onClick={() => handleExport('pdf')}
            variant="outline"
            size="md"
            icon={FileText}
            loading={exporting}
            className="border-rose-300 text-rose-800 hover:bg-rose-50"
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {reportsNav.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeReport === r.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Filter className="w-4 h-4" /> Filters:
        </div>

        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
        >
          <option value="">All Warehouses</option>
          {locations.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>

        {activeReport !== 'stock' && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700"
              />
            </div>
          </>
        )}

        {activeReport === 'movements' && (
          <select
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="">All Movement Types</option>
            <option value="STOCK_IN">STOCK_IN</option>
            <option value="STOCK_OUT">STOCK_OUT</option>
            <option value="TRANSFER_IN">TRANSFER_IN</option>
            <option value="TRANSFER_OUT">TRANSFER_OUT</option>
            <option value="RETURN_GOOD">RETURN_GOOD</option>
            <option value="RETURN_DAMAGED">RETURN_DAMAGED</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </select>
        )}

        {(locationId || startDate || endDate || movementType) && (
          <button
            onClick={() => {
              setLocationId('');
              setStartDate('');
              setEndDate('');
              setMovementType('');
            }}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Dynamic Report Table */}
      {loading ? (
        <Loader message="Generating report data..." />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No Report Records Found"
          description="Try broadening your filter criteria."
        />
      ) : (
        <>
          {activeReport === 'stock' && (
            <Table
              headers={[
                'Product',
                'Category',
                'SKU',
                'Variant',
                'Warehouse',
                'Total Stock',
                'Reserved',
                'Available',
                'Damaged',
                'Status'
              ]}
            >
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-bold text-slate-900 text-xs">{row.productName}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{row.category}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-700 text-xs">{row.sku}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{row.colour} / {row.size}</td>
                  <td className="px-5 py-3.5 text-xs font-medium text-slate-700">{row.location}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{row.totalStock}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-purple-700">{row.reservedStock}</td>
                  <td className="px-5 py-3.5 text-sm font-extrabold text-emerald-700">{row.availableStock}</td>
                  <td className="px-5 py-3.5 text-xs text-rose-600 font-semibold">{row.damagedStock}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        row.status === 'OUT_OF_STOCK'
                          ? 'bg-rose-100 text-rose-800'
                          : row.status === 'LOW_STOCK'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          )}

          {activeReport === 'sales' && (
            <Table
              headers={[
                'Date',
                'Order #',
                'Customer',
                'Product',
                'SKU',
                'Warehouse',
                'Qty',
                'Selling Price',
                'Total Amount',
                'Status'
              ]}
            >
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{row.date}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900 text-xs">{row.orderNumber}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{row.customerName}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-900 font-medium">{row.productName}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-700 text-xs">{row.sku}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{row.location}</td>
                  <td className="px-5 py-3.5 text-xs font-extrabold text-slate-900">{row.quantity}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">₹{row.price}</td>
                  <td className="px-5 py-3.5 text-xs font-black text-indigo-950">₹{(row.total || row.totalAmount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-[10px] font-bold text-slate-600">{row.status}</td>
                </tr>
              ))}
            </Table>
          )}

          {activeReport === 'purchases' && (
            <Table
              headers={[
                'Date',
                'Product',
                'SKU',
                'Vendor',
                'Warehouse',
                'Quantity',
                'Purchase Price',
                'Total Amount',
                'Received By'
              ]}
            >
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{row.date}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-900">{row.productName}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-700 text-xs">{row.sku}</td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-800">{row.vendor}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{row.location}</td>
                  <td className="px-5 py-3.5 text-xs font-extrabold text-emerald-700">+{row.quantity}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">₹{row.purchasePrice}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-900">₹{(row.totalAmount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{row.performedBy}</td>
                </tr>
              ))}
            </Table>
          )}

          {activeReport === 'movements' && (
            <Table
              headers={[
                'Date',
                'Product',
                'SKU',
                'Warehouse',
                'Movement Type',
                'Quantity',
                'Previous',
                'New Stock',
                'Reason / Reference',
                'User'
              ]}
            >
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">{row.date}</td>
                  <td className="px-5 py-3.5 text-xs font-bold text-slate-900">{row.productName}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-700 text-xs">{row.sku}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{row.location}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        row.movementType === 'STOCK_IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.movementType === 'STOCK_OUT'
                          ? 'bg-rose-100 text-rose-800'
                          : row.movementType?.includes('TRANSFER')
                          ? 'bg-blue-100 text-blue-800'
                          : row.movementType?.includes('RETURN')
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.movementType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs font-extrabold text-slate-900">{row.quantity}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 font-mono">{row.previousQuantity}</td>
                  <td className="px-5 py-3.5 text-xs font-black text-slate-900 font-mono">{row.newQuantity}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate">{row.reason}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{row.user}</td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
};
