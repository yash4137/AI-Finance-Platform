import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";
import { store } from "./store";
import type { RootState } from "./store";

export type AppDispatch = typeof store.dispatch; // Type for dispatch function
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useTypedSelector: TypedUseSelectorHook<RootState> = useSelector;