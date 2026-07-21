import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Modal de confirmación — reemplaza window.confirm() nativo.
 * Props:
 *   open: boolean
 *   title: string
 *   message: string
 *   confirmLabel: string (default: 'Eliminar')
 *   cancelLabel: string (default: 'Cancelar')
 *   variant: 'danger' | 'warning' (default: 'danger')
 *   onConfirm: () => void
 *   onCancel: () => void
 */
export default function ConfirmModal({ open, title, message, confirmLabel = 'Eliminar', cancelLabel = 'Cancelar', variant = 'danger', onConfirm, onCancel }) {
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    }
    return () => {
      if (open) document.body.classList.remove('modal-open');
    };
  }, [open]);

  if (!open) return null;

  const iconColor = variant === 'danger' ? 'var(--error)' : 'var(--warning)';
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-warning';

  return (
    <div className="modal-backdrop confirm-backdrop" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-icon" style={{ color: iconColor }}>
          {variant === 'danger' ? <Trash2 size={28} /> : <AlertTriangle size={28} />}
        </div>
        <h3 className="confirm-modal-title">{title || '¿Confirmar acción?'}</h3>
        <p className="confirm-modal-message">{message || '¿Estás seguro? Esta acción no se puede deshacer.'}</p>
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button className={`btn ${btnClass}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
