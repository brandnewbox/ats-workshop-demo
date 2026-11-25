import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE, persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/es/storage';
import auth from './authSlice.js';
import test from './testSlice.js';
import ui from './uiSlice.js';

export const PERSIST_KEY = 'prairie';

const rootReducer = combineReducers({ auth, test, ui });

// The signed-in student and the test in progress stay in localStorage, so a reload keeps them.
// Tests pass their own `storage`.
export function makeStore(preloadedState, { storage: persistStorage = storage } = {}) {
  const persistConfig = { key: PERSIST_KEY, storage: persistStorage, whitelist: ['auth', 'test'] };
  const store = configureStore({
    reducer: persistReducer(persistConfig, rootReducer),
    preloadedState,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: { ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER] } }),
  });
  const persistor = persistStore(store);
  return { store, persistor };
}
