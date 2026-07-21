import React from 'react';
import logo from '../assets/logo-don-yeyo-png-sin-fondo.png';
import { useAuth } from '../config/AuthContext';
import { ShieldCheck, LogIn, AlertTriangle, ArrowRight } from 'lucide-react';

export default function LoginScreen() {
  const { login, loginMock, authError, loading } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #071731 0%, #0d2c5c 50%, #1e3a8a 100%)',
      padding: 20,
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        width: '100%',
        maxWidth: 440,
        borderRadius: 20,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top Decorative Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #0d2c5c 0%, #e40521 100%)'
        }} />

        {/* Don Yeyo Logo */}
        <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
          <img src={logo} alt="Don Yeyo S.A." style={{ height: 60, objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0d2c5c', margin: '0 0 6px 0' }}>
          TradeCRM
        </h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 28px 0', lineHeight: 1.4 }}>
          Sistema de Gestión de Comercio Exterior & Exportaciones de Don Yeyo S.A.
        </p>

        {authError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: '0.82rem',
            textAlign: 'left',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#dc2626' }} />
            <div>
              <strong>Acceso denegado:</strong> {authError}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Microsoft Auth Button */}
          <button
            onClick={login}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 12,
              background: '#0d2c5c',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              boxShadow: '0 4px 12px rgba(13, 44, 92, 0.25)',
              transition: 'transform 0.15s, background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0a234a'}
            onMouseLeave={e => e.currentTarget.style.background = '#0d2c5c'}
          >
            {/* SVG Microsoft Logo */}
            <svg width="20" height="20" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            <span>Iniciar sesión con Microsoft Corporativo</span>
          </button>

          {/* Dev Bypass Button */}
          <button
            onClick={loginMock}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: 12,
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            <ShieldCheck size={16} />
            <span>Acceder en Modo Demostración</span>
          </button>
        </div>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#94a3b8' }}>
          🔒 Acceso restringido a personal autorizado de Don Yeyo S.A.
        </div>
      </div>
    </div>
  );
}
