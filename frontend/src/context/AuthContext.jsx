import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceReset, setForceReset] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('user_data');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (parsedUser.is_temp_password) {
        setForceReset(true);
      }
    }
    setLoading(false);
  }, []);

  const login = (jwtToken, userData) => {
    localStorage.setItem('jwt_token', jwtToken);
    localStorage.setItem('user_data', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    
    if (userData.is_temp_password) {
      setForceReset(true);
    } else {
      setForceReset(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUser(null);
    setForceReset(false);
  };

  const completePasswordReset = () => {
    // Ideally, make an API call to update the password in MantisBT here
    const updatedUser = { ...user, is_temp_password: false };
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setForceReset(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, forceReset, login, logout, completePasswordReset }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
