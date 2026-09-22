import React, { useState, useEffect } from 'react';
import { Building2, Plus, Phone, MapPin, Layers, PackageCheck, Trash2 } from 'lucide-react';
import { locationApi } from '../services/opsApi';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Locations = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: '',
    contactNumber: '',
    status: 'ACTIVE'
  });

  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await locationApi.getLocations();
      if (res.success) setLocations(res.data || []);
    } catch (err) {
      showToast('Failed to fetch warehouses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      showToast('Warehouse name and code are required', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await locationApi.createLocation(formData);
      if (res.success) {
        showToast('Warehouse location created successfully!', 'success');
        setIsModalOpen(false);
        setFormData({
          name: '',
          code: '',
          address: '',
          contactNumber: '',
          status: 'ACTIVE'
        });
        fetchLocations();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating warehouse', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocation = async (location) => {
    if (window.confirm(`Are you sure you want to delete warehouse ${location.name}? It will be moved to the Trash Bin.`)) {
      try {
        const res = await locationApi.deleteLocation(location._id);
        if (res.success) {
          showToast(res.message, 'success');
          fetchLocations();
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to delete warehouse', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-emerald-600" />
            Warehouses & Locations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Physical warehouse locations. Stock is independently tracked and transferred between them.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="brand"
            size="lg"
            icon={Plus}
          >
            Add Warehouse
          </Button>
        )}
      </div>

      {loading ? (
        <Loader message="Loading warehouse network..." />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Warehouses Configured"
          description="Create your first warehouse to begin stocking inventory."
          actionText={isAdmin ? 'Add Warehouse' : null}
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => {
            const sum = loc.inventorySummary || {
              totalStock: 0,
              reservedStock: 0,
              availableStock: 0,
              damagedStock: 0
            };

            return (
              <div
                key={loc._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {loc.name}
                      </h3>
                      <span className="font-mono text-xs font-bold text-slate-500 block mt-0.5">
                        Code: {loc.code}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        {loc.status}
                      </span>
                      <button
                        onClick={() => handleDeleteLocation(loc)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    {loc.address && (
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{loc.address}</span>
                      </p>
                    )}
                    {loc.contactNumber && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{loc.contactNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Warehouse Stock Breakdown */}
                <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                      Total
                    </span>
                    <strong className="text-base font-bold text-slate-800">
                      {sum.totalStock}
                    </strong>
                  </div>
                  <div className="bg-purple-50/60 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-purple-700 block font-semibold">
                      Reserved
                    </span>
                    <strong className="text-base font-bold text-purple-800">
                      {sum.reservedStock}
                    </strong>
                  </div>
                  <div className="bg-emerald-50/60 p-2.5 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-700 block font-semibold">
                      Available
                    </span>
                    <strong className="text-base font-extrabold text-emerald-700">
                      {sum.availableStock}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Warehouse Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Warehouse Location"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Warehouse Name"
            required
            placeholder="e.g. Bhubaneswar Warehouse"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Warehouse Code (Unique)"
            required
            placeholder="e.g. BBSR-WH"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <Input
            label="Address"
            placeholder="Industrial Estate, City, State"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label="Contact Phone"
            placeholder="+91 98765 43210"
            value={formData.contactNumber}
            onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
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
              Save Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
