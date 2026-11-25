import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api.js';

export const login = createAsyncThunk('auth/login', async ({ username, password }) => {
  const { user } = await api.post('/login', { username, password });
  return user;
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/logout');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null },
  reducers: {
    sessionExpired(state) {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { sessionExpired } = authSlice.actions;
export default authSlice.reducer;
