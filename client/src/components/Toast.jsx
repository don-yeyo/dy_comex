import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast notification system — reemplaza alert() nativo.
 * Uso: <ToastContainer toasts={toasts} removeToast={removeToast} />
 *      addToast({ type: 'success', message: '...' })
 */

// Hook para manejar toasts
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}

const TOAST_ICONS = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div className={`toast toast-${toast.type} ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      <span className="toast-icon">{TOAST_ICONS[toast.type]}</span>
      <div className="toast-content">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-message">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={handleClose}><X size={14} /></button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={removeToast} />)}
    </div>
  );
}
