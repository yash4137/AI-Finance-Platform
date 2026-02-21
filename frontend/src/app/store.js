import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import storage from "redux-persist/lib/storage";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from "redux-persist";
import { apiClient } from "./api-client";
const persistConfig = {
  key: "root",
  // Key for the persisted data in storage
  storage,
  // Storage engine to use (localStorage)
  blacklist: [apiClient.reducerPath]
  // Specify which reducers not to persist (RTK Query cache)
  // transforms: [
  //     encryptTransform({
  //       secretKey: import.meta.env.VITE_REDUX_PERSIST_SECRET_KEY!,
  //       onError: function (error) {
  //         console.error('Encryption error:', error);
  //       },
  //     }),
  //   ],
};
const rootReducer = combineReducers({
  [apiClient.reducerPath]: apiClient.reducer,
  // Add API client reducer to root reducer
  auth: authReducer
  // Add auth reducer to root reducer
});
const persistedReducer = persistReducer(
  persistConfig,
  rootReducer
);
const reduxPersistActions = [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER];
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: reduxPersistActions
      /// Ignore specific actions in serializable checks
    }
  }).concat(apiClient.middleware)
});
const persistor = persistStore(store);
export {
  persistor,
  store
};
