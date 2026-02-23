import { configureStore, combineReducers } from "@reduxjs/toolkit";

import representativeReducer from "./features/representative/representativeSlice";
import partiesReducer from "./features/parties/partiesSlice";

const appReducer = combineReducers({
  representative: representativeReducer,
  parties: partiesReducer,
});

const rootReducer = (state, action) => {
  if (action.type === "auth/resetState") {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export const resetReduxState = () => store.dispatch({ type: "auth/resetState" });
