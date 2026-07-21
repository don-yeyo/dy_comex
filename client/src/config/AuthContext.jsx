import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { loginRequest } from "./msal";
import { InteractionStatus } from "@azure/msal-browser";
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal();
  const isMsAuthenticated = useIsAuthenticated();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [validatedEmail, setValidatedEmail] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      // BYPASS DE AUTENTICACION PARA DESARROLLO LOCAL O DEPLOY SINS MSAL
      if (import.meta.env.DEV && import.meta.env.VITE_MOCK_AUTH === 'true') {
        const mockEmail = import.meta.env.VITE_MOCK_AUTH_EMAIL || "gabrielt@donyeyo.com.ar";
        const mockName = import.meta.env.VITE_MOCK_AUTH_NAME || "Gabriel (Don Yeyo)";

        console.log(`⚠️ MODO MOCK ACTIVADO: Entrando como ${mockEmail}`);
        setIsAuthenticated(true);
        setUser({
          name: mockName,
          email: mockEmail,
          provider: 'mock'
        });
        setLoading(false);
        return;
      }

      let pendingUser = null;
      if (isMsAuthenticated && accounts.length > 0) {
        const primaryEmail = (
          accounts[0].idTokenClaims?.email || 
          accounts[0].idTokenClaims?.preferred_username || 
          accounts[0].idTokenClaims?.upn || 
          accounts[0].username || 
          ""
        ).trim().toLowerCase();

        pendingUser = {
          name: accounts[0].name || accounts[0].idTokenClaims?.name || accounts[0].username,
          email: primaryEmail,
          provider: 'microsoft'
        };
      }


      if (pendingUser) {
        if (validatedEmail === pendingUser.email) {
          if (!isAuthenticated && inProgress === InteractionStatus.None) {
            setLoading(false);
          }
          return;
        }

        try {
          const response = await axios.get(`/system/validate-email?email=${encodeURIComponent(pendingUser.email)}`);
          if (response.data && typeof response.data === 'object' && response.data.authorized === true) {
            setIsAuthenticated(true);
            setUser(pendingUser);
            setAuthError(null);
          } else if (response.data && typeof response.data === 'object' && response.data.authorized === false) {
            setIsAuthenticated(false);
            setUser(null);
            setAuthError(`La cuenta ${pendingUser.email} no está autorizada para ingresar a ComEx CRM.`);
          } else {
            console.warn("Respuesta de API diferida/no estructurada, autorizando acceso MSAL:", response.data);
            setIsAuthenticated(true);
            setUser(pendingUser);
            setAuthError(null);
          }
        } catch (error) {
          console.warn("Validación de email diferida por error de red/backend:", error.message);
          setIsAuthenticated(true);
          setUser(pendingUser);
          setAuthError(null);
        }
        setValidatedEmail(pendingUser.email);
        setLoading(false);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setAuthError(null);
        setValidatedEmail(null);
        if (inProgress === InteractionStatus.None) {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [isMsAuthenticated, accounts, inProgress, validatedEmail, isAuthenticated]);

  const login = () => {
    setAuthError(null);
    if (inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch(e => {
        console.error("[MSAL] Error en loginRedirect:", e);
        setAuthError("No se pudo iniciar el flujo de autenticación con Microsoft.");
      });
    }
  };

  const loginMock = () => {
    const mockEmail = import.meta.env.VITE_MOCK_AUTH_EMAIL || "gabrielt@donyeyo.com.ar";
    const mockName = import.meta.env.VITE_MOCK_AUTH_NAME || "Gabriel (Don Yeyo)";
    setIsAuthenticated(true);
    setUser({
      name: mockName,
      email: mockEmail,
      provider: 'mock'
    });
    setAuthError(null);
  };

  const logout = () => {
    if (user?.provider === 'microsoft' && isMsAuthenticated) {
      instance.logoutRedirect({
        postLogoutRedirectUri: window.location.origin,
      }).catch(e => {
        console.error(e);
      });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading: loading || inProgress !== InteractionStatus.None,
      inProgress,
      authError,
      login,
      loginMock,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
