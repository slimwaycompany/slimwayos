'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, error: null });

  useEffect(() => {
    authApi
      .me()
      .then((res) => setState({ user: res.data, loading: false, error: null }))
      .catch(() => setState({ user: null, loading: false, error: null }));
  }, []);

  const logout = async () => {
    await authApi.logout().catch(() => null);
    setState({ user: null, loading: false, error: null });
    window.location.href = '/login';
  };

  return { ...state, logout };
}
