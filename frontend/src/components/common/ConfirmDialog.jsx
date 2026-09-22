import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showClose={false}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-base font-bold text-slate-900 mb-1">{title}</h4>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
