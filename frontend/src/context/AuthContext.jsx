import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Helper: decode JWT payload without a library
const decodeJwtPayload = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Helper: check if JWT is expired
const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  // exp is in seconds, Date.now() is in ms
  return Date.now() >= payload.exp * 1000;
};

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceReset, setForceReset] = useState(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState(null);
  const inactivityTimer = useRef(null);

  // ── Inactivity timeout management ──
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      // Auto-logout on inactivity
      console.warn('Session expired due to inactivity.');
      performLogout('Your session has expired due to 30 minutes of inactivity. Please log in again.');
    }, INACTIVITY_TIMEOUT_MS);
  }, []);

  const startInactivityTracking = useCallback(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer(); // Start the initial timer
  }, [resetInactivityTimer]);

  const stopInactivityTracking = useCallback(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => {
      window.removeEventListener(event, resetInactivityTimer);
    });
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  }, [resetInactivityTimer]);

  // ── Core logout function ──
  const performLogout = useCallback((message = null) => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
    setForceReset(false);
    stopInactivityTracking();
    if (message) {
      setSessionExpiredMessage(message);
    }
  }, [stopInactivityTracking]);

  // ── Verify token with backend ──
  const verifyTokenWithServer = useCallback(async (storedToken) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify-token`, {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      if (!response.ok) {
        return false;
      }
      return true;
    } catch {
      // Network error — allow offline access but token is still locally valid
      return true;
    }
  }, []);

  // ── Initialize session on app load ──
  useEffect(() => {
    const initSession = async () => {
      const storedToken = localStorage.getItem('jwt_token');
      const storedUser = localStorage.getItem('user_data');

      if (storedToken && storedUser) {
        // 1. Client-side expiry check
        if (isTokenExpired(storedToken)) {
          performLogout('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }

        // 2. Server-side validation
        const isValid = await verifyTokenWithServer(storedToken);
        if (!isValid) {
          performLogout('Your session is no longer valid. Please log in again.');
          setLoading(false);
          return;
        }

        // 3. Session is valid — restore state
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        if (parsedUser.is_temp_password) {
          setForceReset(true);
        }
        startInactivityTracking();
      }
      setLoading(false);
    };

    initSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Periodic token expiry check (every 60 seconds) ──
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        performLogout('Your session has expired. Please log in again.');
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [token, performLogout]);

  const login = (jwtToken, userData) => {
    localStorage.setItem('jwt_token', jwtToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    setSessionExpiredMessage(null); // Clear any previous expiry message

    if (userData.is_temp_password) {
      setForceReset(true);
    } else {
      setForceReset(false);
    }
    startInactivityTracking();
  };

  const logout = () => {
    performLogout();
  };

  const dismissSessionMessage = () => {
    setSessionExpiredMessage(null);
  };

  const completePasswordReset = async (newPassword) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      if (response.ok) {
        const updatedUser = { ...user, is_temp_password: false };
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setForceReset(false);
        return { success: true };
      } else {
        const errData = await response.json().catch(() => ({}));
        const errorMessage = errData.detail || `Password update failed (HTTP ${response.status}). Please try again or contact admin.`;
        console.error('Password update failed:', response.status, errData);
        return { success: false, error: errorMessage };
      }
    } catch (err) {
      console.error('Password update network error:', err);
      return { success: false, error: 'Network error. Please check your connection and try again.' };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, token, loading, forceReset, sessionExpiredMessage,
      login, logout, completePasswordReset, dismissSessionMessage
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
