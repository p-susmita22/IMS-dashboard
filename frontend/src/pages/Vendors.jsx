import React, { useState, useEffect } from 'react';
import { Users2, Plus, Phone, Mail, Building, History, ExternalLink, Trash2 } from 'lucide-react';
import { vendorApi } from '../services/opsApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Table } from '../components/common/Table';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Vendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Vendor History Modal
  const [selectedVendorHistory, setSelectedVendorHistory] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // New/Edit Vendor State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    contactPerson: '',
    status: 'ACTIVE'
  });

  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await vendorApi.getVendors();
      if (res.success) setVendors(res.data || []);
    } catch (err) {
      showToast('Failed to fetch vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async (vendor) => {
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await vendorApi.getVendorById(vendor._id);
      if (res.success) {
        setSelectedVendorHistory(res.data);
      }
    } catch (err) {
      showToast('Failed to load vendor purchase history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Vendor name is required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await vendorApi.createVendor(formData);
      if (res.success) {
        showToast('Vendor created successfully!', 'success');
        setIsModalOpen(false);
        setFormData({
          name: '',
          phone: '',
          email: '',
          address: '',
          gstNumber: '',
          contactPerson: '',
          status: 'ACTIVE'
        });
        fetchVendors();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating vendor', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVendor = async (vendor) => {
    if (window.confirm(`Are you sure you want to delete vendor ${vendor.name}? It will be moved to the Trash Bin.`)) {
      try {
        const res = await vendorApi.deleteVendor(vendor._id);
        if (res.success) {
          showToast(res.message, 'success');
          fetchVendors();
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete vendor', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users2 className="w-7 h-7 text-indigo-600" />
            Wholesale Suppliers & Vendors
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Suppliers for restocking. Products can be sourced from multiple vendors over time.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="brand"
            size="lg"
            icon={Plus}
          >
            Add New Vendor
          </Button>
        )}
      </div>

      {loading ? (
        <Loader message="Loading vendors..." />
      ) : vendors.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No Vendors Found"
          description="Add your wholesale suppliers to begin logging purchases."
          actionText={isAdmin ? 'Add Vendor' : null}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div
              key={v._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {v.name}
                  </h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {v.status}
                  </span>
                </div>
                {v.contactPerson && (
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Contact: {v.contactPerson}
                  </p>
                )}

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  {v.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.phone}</span>
                    </div>
                  )}
                  {v.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{v.email}</span>
                    </div>
                  )}
                  {v.gstNumber && (
                    <div className="text-[11px] font-mono text-slate-500">
                      GST: <strong>{v.gstNumber}</strong>
                    </div>
                  )}
                  {v.address && (
                    <p className="text-[11px] text-slate-500 truncate">{v.address}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Added {new Date(v.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleOpenHistory(v)}
                    variant="outline"
                    size="sm"
                    icon={History}
                  >
                    Purchases
                  </Button>
                  <Button
                    onClick={() => handleDeleteVendor(v)}
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Purchase History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Purchase History: ${selectedVendorHistory?.vendor?.name || ''}`}
        maxWidth="max-w-3xl"
      >
        {historyLoading ? (
          <Loader message="Loading purchase history..." />
        ) : !selectedVendorHistory || selectedVendorHistory.purchases.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-500">
            No stock purchases recorded from this vendor yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase">
                  <th className="p-3">Date</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Price (₹)</th>
                  <th className="p-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {selectedVendorHistory.purchases.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {p.variantId?.productId?.name || 'Product'}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">
                      {p.variantId?.sku}
                    </td>
                    <td className="p-3 text-slate-600">
                      {p.locationId?.name}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">
                      +{p.quantity}
                    </td>
                    <td className="p-3 text-right text-slate-600">
                      ₹{p.unitPrice || 0}
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700">
                      ₹{(p.quantity * (p.unitPrice || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Wholesale Vendor"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Vendor / Supplier Name"
            required
            placeholder="e.g. ABC Traders"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Contact Person"
            placeholder="e.g. Multimaart Admin"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="sales@vendor.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <Input
            label="GST Identification Number"
            placeholder="e.g. 24AAAAA0000A1Z5"
            value={formData.gstNumber}
            onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
          />
          <Input
            label="Address"
            placeholder="Factory or market address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
              Save Vendor
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
