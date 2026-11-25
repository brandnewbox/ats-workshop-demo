import { createSlice, nanoid } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] },
  reducers: {
    showToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({ message, kind = 'error' }) {
        return { payload: { id: nanoid(), message, kind } };
      },
    },
    hideToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { showToast, hideToast } = uiSlice.actions;
export const showError = (message) => showToast({ message, kind: 'error' });
export const showSuccess = (message) => showToast({ message, kind: 'success' });
export default uiSlice.reducer;
