import React, { useEffect } from 'react';
import { ShieldAlert, X, AlertTriangle, Database } from 'lucide-react';

/**
 * Modal de Operación Prohibida / Restricción de Integridad de Base de Datos.
 * Se presenta al usuario cuando una acción está bloqueada por claves foráneas o reglas de negocio.
 * 
 * Props:
 *   open: boolean
 *   title: string
 *   message: string
 *   details: string[]
 *   onClose: () => void
 */
export default function ForbiddenModal({ open, title, message, details = [], onClose }) {
  useEffect(() => {
    if (open) {
      document.body.classList.add('modal-open');
    }
    return () => {
      if (open) document.body.classList.remove('modal-open');
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-backdrop confirm-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="confirm-modal glass"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '90%',
          padding: '28px',
          borderRadius: '20px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Cerrar"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--dy-red, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShieldAlert size={30} />
          </div>
          <div>
            <span
              className="badge badge-red"
              style={{
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 700,
                padding: '3px 8px',
                marginBottom: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Database size={11} /> Restricción de Integridad DB
            </span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text)' }}>
              {title || 'Operación No Permitida'}
            </h3>
          </div>
        </div>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
          {message || 'La operación solicitada viola restricciones de integridad referencial en la base de datos.'}
        </p>

        {details && details.length > 0 && (
          <div
            style={{
              background: 'var(--surface-hover)',
              borderRadius: '12px',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              marginBottom: '20px'
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} style={{ color: 'var(--warning)' }} /> Registros asociados que previenen la acción:
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.6' }}>
              {details.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  <strong>{item}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              fontWeight: 700,
              borderRadius: '12px',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
