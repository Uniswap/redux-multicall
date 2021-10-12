import { configureStore } from '@reduxjs/toolkit'
import { multicallReducer } from './reducer'

/**
 * We're opting to use a separate store for multicall for two reasons:
 * 1. Efficiency: avoid having other reducers need to process multicall's actions which may be frequent
 * 2. Modularity: avoid situations where this lib could interfere with app's own state
 */
export const store = configureStore({
  reducer: {
    multicall: multicallReducer
  }
})

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
