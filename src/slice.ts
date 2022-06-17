import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  MulticallFetchingPayload,
  MulticallListenerPayload,
  MulticallResultsPayload,
  MulticallState,
  MulticallListenerOptionsPayload,
} from './types'
import { toCallKey } from './utils/callKeys'

const initialState: MulticallState = {
  callResults: {},
}

export function createMulticallSlice(reducerPath: string) {
  return createSlice({
    name: reducerPath,
    initialState,
    reducers: {
      addMulticallListeners: (state, action: PayloadAction<MulticallListenerPayload>) => {
        const {
          calls,
          chainId,
          options: { blocksPerFetch },
        } = action.payload
        const listeners: MulticallState['callListeners'] = state.callListeners
          ? state.callListeners
          : (state.callListeners = {})
        listeners[chainId] = listeners[chainId] ?? {}
        calls.forEach((call) => {
          const callKey = toCallKey(call)
          listeners[chainId][callKey] = listeners[chainId][callKey] ?? {}
          listeners[chainId][callKey][blocksPerFetch] = (listeners[chainId][callKey][blocksPerFetch] ?? 0) + 1
        })
      },

      removeMulticallListeners: (state, action: PayloadAction<MulticallListenerPayload>) => {
        const {
          calls,
          chainId,
          options: { blocksPerFetch },
        } = action.payload
        const listeners: MulticallState['callListeners'] = state.callListeners
          ? state.callListeners
          : (state.callListeners = {})

        if (!listeners[chainId]) return
        calls.forEach((call) => {
          const callKey = toCallKey(call)
          if (!listeners[chainId][callKey]) return
          if (!listeners[chainId][callKey][blocksPerFetch]) return

          if (listeners[chainId][callKey][blocksPerFetch] === 1) {
            delete listeners[chainId][callKey][blocksPerFetch]
          } else {
            listeners[chainId][callKey][blocksPerFetch]--
          }
        })
      },

      fetchingMulticallResults: (state, action: PayloadAction<MulticallFetchingPayload>) => {
        const { chainId, fetchingBlockNumber, calls } = action.payload
        state.callResults[chainId] = state.callResults[chainId] ?? {}
        calls.forEach((call) => {
          const callKey = toCallKey(call)
          const current = state.callResults[chainId][callKey]
          if (!current) {
            state.callResults[chainId][callKey] = {
              fetchingBlockNumber,
            }
          } else {
            if ((current.fetchingBlockNumber ?? 0) >= fetchingBlockNumber) return
            state.callResults[chainId][callKey].fetchingBlockNumber = fetchingBlockNumber
          }
        })
      },

      errorFetchingMulticallResults: (state, action: PayloadAction<MulticallFetchingPayload>) => {
        const { chainId, fetchingBlockNumber, calls } = action.payload
        state.callResults[chainId] = state.callResults[chainId] ?? {}
        calls.forEach((call) => {
          const callKey = toCallKey(call)
          const current = state.callResults[chainId][callKey]
          if (!current || typeof current.fetchingBlockNumber !== 'number') return // only should be dispatched if we are already fetching
          if (current.fetchingBlockNumber <= fetchingBlockNumber) {
            delete current.fetchingBlockNumber
            current.data = null
            current.blockNumber = fetchingBlockNumber
          }
        })
      },

      updateMulticallResults: (state, action: PayloadAction<MulticallResultsPayload>) => {
        const { chainId, results, blockNumber } = action.payload
        state.callResults[chainId] = state.callResults[chainId] ?? {}
        Object.keys(results).forEach((callKey) => {
          const current = state.callResults[chainId][callKey]
          if ((current?.blockNumber ?? 0) > blockNumber) return
          if (current?.data === results[callKey] && current?.blockNumber === blockNumber) return
          state.callResults[chainId][callKey] = {
            data: results[callKey],
            blockNumber,
          }
        })
      },

      updateListenerOptions: (state, action: PayloadAction<MulticallListenerOptionsPayload>) => {
        const { chainId, listenerOptions } = action.payload
        state.listenerOptions = state.listenerOptions ?? {}
        state.listenerOptions[chainId] = listenerOptions
      },
    },
  })
}

export type MulticallActions = ReturnType<typeof createMulticallSlice>['actions']
