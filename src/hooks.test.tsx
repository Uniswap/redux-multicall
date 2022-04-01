import '@testing-library/jest-dom'
import { combineReducers, configureStore, Store } from '@reduxjs/toolkit'
import React, { useMemo, useRef } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { Provider } from 'react-redux'

import { useCallsDataSubscription } from './hooks'
import { createMulticallSlice, MulticallActions } from './slice'
import { toCallKey } from './utils/callKeys'
import { MulticallContext } from './context'
import { Call } from './types'

describe('multicall hooks', () => {
  let container: HTMLDivElement | null = null
  let actions: MulticallActions
  let context: MulticallContext
  let store: Store
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    const slice = createMulticallSlice('multicall')
    actions = slice.actions
    context = { reducerPath: 'multicall', actions }
    store = configureStore({ reducer: combineReducers({ multicall: slice.reducer }) })
  })
  afterEach(() => {
    if (container) {
      unmountComponentAtNode(container)
      container.remove()
    }
    container = null
  })

  function updateCallResult(call: Call, result: string) {
    store.dispatch(
      actions.updateMulticallResults({
        chainId: 1,
        blockNumber: 1,
        results: { [toCallKey(call)]: result },
      })
    )
  }

  describe('useCallsDataSubscription', () => {
    function Caller({ call }: { call: Call }) {
      const calls = useMemo(() => [call], [call])
      const [{ data }] = useCallsDataSubscription(context, 1, calls)
      return (
        <>
          {toCallKey(call)}:{data}
        </>
      )
    }

    describe('stabilizes values', () => {
      it('returns data matching calls', () => {
        const callA = { address: 'a', callData: '' }
        const callB = { address: 'b', callData: '' }
        updateCallResult(callA, '0xa')
        updateCallResult(callB, '0xb')

        render(
          <Provider store={store}>
            <Caller call={callA} />
          </Provider>,
          container
        )
        expect(container?.textContent).toBe('a-:0xa')

        render(
          <Provider store={store}>
            <Caller call={callB} />
          </Provider>,
          container
        )
        expect(container?.textContent).toBe('b-:0xb')
      })

      it('returns updates immediately', () => {
        const call = { address: 'a', callData: '' }
        updateCallResult(call, '0xa')

        render(
          <Provider store={store}>
            <Caller call={call} />
          </Provider>,
          container
        )
        expect(container?.textContent).toBe('a-:0xa')

        updateCallResult(call, '0xb')
        expect(container?.textContent).toBe('a-:0xb')
      })

      it('ignores subsequent updates if data is stable', () => {
        function Caller({ call }: { call: Call }) {
          const calls = useMemo(() => [call], [call])
          const data = useCallsDataSubscription(context, 1, calls)
          const { current: initialData } = useRef(data)
          return <>{(data === initialData).toString()}</>
        }
        const mock = jest.fn(Caller)
        const MockCaller: typeof Caller = mock

        const call = { address: 'a', callData: '' }
        updateCallResult(call, '0xa')

        render(
          <Provider store={store}>
            <MockCaller call={call} />
          </Provider>,
          container
        )
        expect(container?.textContent).toBe('true')

        // stable update
        updateCallResult(call, '0xa')
        expect(container?.textContent).toBe('true')

        // unrelated update
        updateCallResult({ address: 'b', callData: '' }, '0xb')
        expect(container?.textContent).toBe('true')
      })
    })
  })
})
