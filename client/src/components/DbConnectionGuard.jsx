import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const DbConnectionGuard = () => {
  const [isDbDisconnected, setIsDbDisconnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isCheckingRef = useRef(false);
  const wasDisconnectedRef = useRef(false);

  const checkConnection = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsChecking(true);

    try {
      const res = await axios.get('/system/db-status');
      if (res.data && res.data.status === 'ok') {
        if (wasDisconnectedRef.current) {
          window.location.reload();
          return;
        }
        setIsDbDisconnected(false);
      } else {
        setIsDbDisconnected(true);
        wasDisconnectedRef.current = true;
      }
    } catch (error) {
      console.error('[DbConnectionGuard] Database status check failed:', error);
      setIsDbDisconnected(true);
      wasDisconnectedRef.current = true;
    } finally {
      setIsChecking(false);
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Chequeo inicial
    checkConnection();

    // Polling periódico (intervalo por variable de entorno o fallback 90s)
    const intervalSeconds = parseInt(import.meta.env.VITE_DB_CONNECTION_CHECK_INTERVAL) || 90;
    const interval = setInterval(() => {
      checkConnection();
    }, intervalSeconds * 1000);

    const handleDbError = () => {
      setIsDbDisconnected(true);
      wasDisconnectedRef.current = true;
    };

    const handleAxiosError = (e) => {
      const status = e.detail?.status;
      const errorMsg = e.detail?.message || '';

      if (status === 500 || !status || errorMsg.toLowerCase().includes('network') || errorMsg.toLowerCase().includes('database') || errorMsg.toLowerCase().includes('econndefused')) {
        checkConnection();
      }
    };

    window.addEventListener('db-connection-failed', handleDbError);
    window.addEventListener('api-request-failed', handleAxiosError);

    return () => {
      clearInterval(interval);
      window.removeEventListener('db-connection-failed', handleDbError);
      window.removeEventListener('api-request-failed', handleAxiosError);
    };
  }, [checkConnection]);

  useEffect(() => {
    if (isDbDisconnected) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isDbDisconnected]);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    await checkConnection();
  };

  if (!isDbDisconnected) return null;

  return (
    <div className="modal-backdrop confirm-backdrop" style={{ zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)' }}>
      <div 
        className="modal-content confirm-modal" 
        style={{ 
          maxWidth: 460, 
          width: '90%', 
          padding: '28px 28px', 
          borderRadius: 'var(--radius-lg, 16px)', 
          backgroundColor: 'var(--surface, #ffffff)', 
          color: 'var(--text, #1e293b)', 
          textAlign: 'center', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border)', 
          border: '1px solid var(--border)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--danger)', marginBottom: 20 }}>
          <AlertTriangle size={24} style={{ animation: 'pulse 2s infinite' }} />
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--danger)' }}>Conexión interrumpida</span>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          width: 80,
          height: 80,
          margin: '0 auto 20px auto',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          color: 'var(--danger)'
        }}>
          <Database size={40} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            background: 'var(--danger)',
            color: '#fff',
            borderRadius: '50%',
            padding: 4,
            border: '2px solid var(--surface, #ffffff)'
          }}>
            <WifiOff size={16} />
          </div>
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 12, color: 'var(--text, #1e293b)' }}>
          Sin conexión con la Base de Datos
        </h3>

        <p style={{ fontSize: '0.92rem', color: 'var(--text-muted, #64748b)', lineHeight: 1.55, marginBottom: 20 }}>
          No se ha podido establecer comunicación con la base de datos del sistema.
          Por favor, verificá tu conexión de red o contactate con soporte técnico si el problema persiste.
        </p>

        <div style={{
          padding: '14px 16px',
          borderRadius: 'var(--radius-md, 10px)',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          marginBottom: 24,
          fontSize: '0.88rem',
          textAlign: 'left',
          color: 'var(--text, #1e293b)'
        }}>
          <strong style={{ display: 'block', marginBottom: 6, color: 'var(--text)' }}>Detalles del estado:</strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Servicio ComEx CRM:</span>
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Offline / Desconectado</span>
          </div>
          {retryCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Intentos de reconexión:</span>
              <span style={{ fontWeight: 700 }}>{retryCount}</span>
            </div>
          )}
        </div>

        <button
          className="btn btn-danger"
          disabled={isChecking}
          onClick={handleRetry}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md, 10px)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 700,
            background: 'var(--danger)',
            color: '#ffffff',
            border: 'none',
            cursor: isChecking ? 'not-allowed' : 'pointer',
            opacity: isChecking ? 0.7 : 1,
            transition: 'all 0.2s',
            fontSize: '0.95rem'
          }}
        >
          <RefreshCw size={18} style={{ animation: isChecking ? 'spin 1s linear infinite' : 'none' }} />
          {isChecking ? 'Verificando...' : 'Reintentar Conexión'}
        </button>
      </div>
    </div>
  );
};

export default DbConnectionGuard;

