import React, { useState, useEffect } from 'react';
import { trashApi } from '../services/trashApi';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { Trash2, RotateCcw, ArchiveX, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const TrashBin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchTrash();
  }, [activeTab]);

  const fetchTrash = async () => {
    try {
      setLoading(true);
      const res = await trashApi.getTrash(activeTab);
      if (res.success) {
        setItems(res.data);
      }
    } catch (err) {
      showToast('Failed to fetch trash items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (type, id) => {
    try {
      const res = await trashApi.restoreItem(type, id);
      if (res.success) {
        showToast(res.message, 'success');
        fetchTrash();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to restore item', 'error');
    }
  };

  const handleHardDelete = async (type, id) => {
    try {
      const res = await trashApi.hardDeleteItem(type, id);
      if (res.success) {
        showToast(res.message, 'success');
        fetchTrash();
        setIsConfirmOpen(false);
        setItemToDelete(null);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to permanently delete item', 'error');
    }
  };

  const handleEmptyTrash = async () => {
    if (window.confirm("Are you absolutely sure you want to empty the entire trash? This action cannot be undone.")) {
      try {
        const res = await trashApi.emptyTrash();
        if (res.success) {
          showToast(res.message, 'success');
          fetchTrash();
        }
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to empty trash', 'error');
      }
    }
  };

  const openDeleteConfirm = (item) => {
    setItemToDelete(item);
    setIsConfirmOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Trash2 className="w-8 h-8 text-rose-500" />
            Trash Bin
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage and permanently delete soft-deleted items.
          </p>
        </div>
        
        {items.length > 0 && (
          <Button
            onClick={handleEmptyTrash}
            variant="danger"
            size="lg"
            icon={ArchiveX}
          >
            Empty Trash
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: '', label: 'All Items' },
          { id: 'product', label: 'Products' },
          { id: 'vendor', label: 'Vendors' },
          { id: 'location', label: 'Locations' },
          { id: 'order', label: 'Orders' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <Loader message="Loading trash..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is Empty"
          description="No deleted items found."
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <Table
            headers={['Item Type', 'Name / ID', 'Deleted At', 'Actions']}
          >
            {items.map((item) => (
              <tr key={item._id} className="hover:bg-slate-50/70">
                <td className="px-5 py-3.5">
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 font-semibold rounded text-xs uppercase tracking-wider">
                    {item.trashType}
                  </span>
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-900 text-sm">
                  {item.title}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">
                  {new Date(item.deletedAt).toLocaleString()}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleRestore(item.trashType, item._id)}
                      variant="outline"
                      size="sm"
                      icon={RotateCcw}
                    >
                      Restore
                    </Button>
                    <Button
                      onClick={() => openDeleteConfirm(item)}
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                    >
                      Delete Permanently
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <Modal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          title="Confirm Permanent Deletion"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p className="text-sm font-semibold">
                This action cannot be undone. This {itemToDelete.trashType} will be permanently removed from the system.
              </p>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete <strong>{itemToDelete.title}</strong>?
            </p>
            
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button onClick={() => setIsConfirmOpen(false)} variant="secondary">
                Cancel
              </Button>
              <Button onClick={() => handleHardDelete(itemToDelete.trashType, itemToDelete._id)} variant="danger">
                Yes, Delete Permanently
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
