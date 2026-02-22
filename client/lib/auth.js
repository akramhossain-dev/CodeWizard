// Authentication utilities for admin panel
export const AUTH_TOKEN_KEY = 'admin_token';
export const AUTH_USER_KEY = 'admin_user';

export const setAuthToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
};

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
};

export const setAuthUser = (user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
};

export const getAuthUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem(AUTH_USER_KEY);
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};

export const getUserType = () => {
  const user = getAuthUser();
  if (!user) return null;
  // Admin has 'email' field, Employee has 'employeeEmail' field
  return user.employeeEmail ? 'employee' : 'admin';
};

export const isAdmin = () => {
  return getUserType() === 'admin';
};

export const isEmployee = () => {
  return getUserType() === 'employee';
};
