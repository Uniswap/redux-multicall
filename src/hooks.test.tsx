import '@testing-library/jest-dom'
import { combineReducers, configureStore, Store } from '@reduxjs/toolkit'
import React, { useEffect, useState } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { Provider } from 'react-redux'

import { useCallsDataSubscription } from './hooks'
import { createMulticallSlice, MulticallActions } from './slice'
import { toCallKey } from './utils/callKeys'

describe('multicall hooks', () => {
  let container: HTMLDivElement | null = null
  let store: Store
  let actions: MulticallActions
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    const slice = createMulticallSlice('multicall')
    actions = slice.actions
    const rootReducer = combineReducers({ multicall: slice.reducer })
    store = configureStore({ reducer: rootReducer })
  })
  afterEach(() => {
    if (container) {
      unmountComponentAtNode(container)
      container.remove()
    }
    container = null
  })

  describe('useCallsDataSubscription', () => {
    const call = { address: 'abc', callData: '' }
    const callKey = toCallKey(call)
    function Caller() {
      const callResults = useCallsDataSubscription({ reducerPath: 'multicall', actions }, 1, [call])
      const [count, setCount] = useState(0)
      useEffect(() => setCount((count) => ++count), [callResults])

      return (
        <>
          Data: {callResults[0].data} Count: {count}
        </>
      )
    }

    it('stabilizes values', () => {
      act(() => {
        render(
          <Provider store={store}>
            <Caller />
          </Provider>,
          container
        )
      })

      act(() => {
        store.dispatch(
          actions.updateMulticallResults({
            chainId: 1,
            blockNumber: 1,
            results: {
              [callKey]: '0x1',
            },
          })
        )
        store.dispatch(
          actions.updateMulticallResults({
            chainId: 1,
            blockNumber: 1,
            results: {
              [callKey]: '0x1',
            },
          })
        )
      })

      // expect 2 renders: initial + data available
      expect(container?.textContent).toBe('Data: 0x1 Count: 2')
    })
  })
})
