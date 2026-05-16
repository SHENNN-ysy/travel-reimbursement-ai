import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as authApi from '@/api/auth';
import type { AuthResponse } from '@/api/auth';

interface AuthUser {
  userId: number;
  username: string;
  nickname: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
};

export const login = createAsyncThunk(
  'auth/login',
  async (data: { username: string; password: string }) => {
    return await authApi.login(data);
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { username: string; password: string; nickname?: string; email?: string }) => {
    return await authApi.register(data);
  }
);

export const fetchCurrentUser = createAsyncThunk('auth/fetchCurrentUser', async () => {
  return await authApi.getMe();
});

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  return { user: null, token: null, isAuthenticated: false };
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.loading = false;
      state.user = {
        userId: action.payload.userId,
        username: action.payload.username,
        nickname: action.payload.nickname,
      };
      state.token = action.payload.token!;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token!);
    });
    builder.addCase(login.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(register.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(register.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(register.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
      state.user = {
        userId: action.payload.userId,
        username: action.payload.username,
        nickname: action.payload.nickname,
      };
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    });
  },
});

export default authSlice.reducer;
