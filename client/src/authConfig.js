/**
 * Configuración de Azure Active Directory (MSAL) para login corporativo de Microsoft.
 */
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID || "mock-client-id",
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID || "common"}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};

// Scopes requeridos por Microsoft Graph o tokens de acceso
export const loginRequest = {
  scopes: ["User.Read"]
};
