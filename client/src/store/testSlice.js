import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as api from '../api.js';

// The test that the student is taking now (the test screens).

export const loadAttempt = createAsyncThunk('test/loadAttempt', (attemptId) => api.get(`/attempts/${attemptId}`));

export const saveResponse = createAsyncThunk('test/saveResponse', ({ attemptId, questionId, choice, flagged }) =>
  api.update(`/attempts/${attemptId}/responses/${questionId}`, { choice, flagged }),
);

export const submitAttempt = createAsyncThunk('test/submitAttempt', (attemptId) =>
  api.post(`/attempts/${attemptId}/submit`),
);

const initialState = {
  attempt: null,
  responses: {},
  flags: {},
  tool: 'pointer',
  status: 'idle',
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    selectAnswer(state, action) {
      const { questionId, choice } = action.payload;
      state.responses[questionId] = choice;
    },
    toggleFlag(state, action) {
      const questionId = action.payload;
      state.flags[questionId] = !state.flags[questionId];
    },
    selectTool(state, action) {
      state.tool = action.payload;
    },
    clearTest() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAttempt.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadAttempt.fulfilled, (state, action) => {
        const { responses, flags, ...attempt } = action.payload;
        state.attempt = attempt;
        state.responses = responses;
        state.flags = flags;
        state.status = 'ready';
      })
      .addCase(loadAttempt.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(saveResponse.fulfilled, (state, action) => {
        const { questionId, choice, flagged } = action.payload;
        if (choice === null) delete state.responses[questionId];
        else state.responses[questionId] = choice;
        state.flags[questionId] = flagged;
      });
  },
});

export const { selectAnswer, toggleFlag, selectTool, clearTest } = testSlice.actions;
export default testSlice.reducer;
