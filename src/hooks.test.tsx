import '@testing-library/jest-dom'
import { act } from 'react-dom/test-utils'
import { combineReducers, configureStore, Store } from '@reduxjs/toolkit'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { Provider } from 'react-redux'

import { useCallsDataSubscription } from './hooks'
import { createMulticallSlice, MulticallActions } from './slice'
import { toCallKey } from './utils/callKeys'
import { MulticallContext } from './context'
import { Call, ListenerOptions } from './types'

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
    function Caller({
      calls,
      multicallContext,
      listenerOptions,
    }: {
      calls: Call[]
      multicallContext?: MulticallContext | any
      listenerOptions?: ListenerOptions
    }) {
      const data = useCallsDataSubscription(multicallContext ?? context, 1, calls, listenerOptions)
      return <>{calls.map((call, i) => `${toCallKey(call)}:${data[i].data}`).join(';')}</>
    }

    it('returns data matching calls', () => {
      const callA = { address: 'a', callData: '' }
      const callB = { address: 'b', callData: '' }
      updateCallResult(callA, '0xa')
      updateCallResult(callB, '0xb')

      render(
        <Provider store={store}>
          <Caller calls={[callA]} />
        </Provider>,
        container
      )
      expect(container?.textContent).toBe('a-:0xa')

      render(
        <Provider store={store}>
          <Caller calls={[callB]} />
        </Provider>,
        container
      )
      expect(container?.textContent).toBe('b-:0xb')

      render(
        <Provider store={store}>
          <Caller calls={[callA, callB]} />
        </Provider>,
        container
      )
      expect(container?.textContent).toBe('a-:0xa;b-:0xb')
    })

    it('returns updates immediately', () => {
      const call = { address: 'a', callData: '' }
      updateCallResult(call, '0xa')

      render(
        <Provider store={store}>
          <Caller calls={[call]} />
        </Provider>,
        container
      )
      expect(container?.textContent).toBe('a-:0xa')

      updateCallResult(call, '0xb')
      expect(container?.textContent).toBe('a-:0xb')
    })

    describe('utilizes correct blocksPerFetch values from defaultListenerOptions in store', () => {
      it('utilizes blocksPerFetch configured in defaultListenerOptions in store', () => {
        const callA = { address: 'a', callData: '' }
        const chainId = 1
        const blocksPerFetch = 10
        updateCallResult(callA, '0xa')

        store.dispatch(
          actions.updateListenerOptions({
            chainId,
            listenerOptions: {
              blocksPerFetch,
            },
          })
        )

        const mockContext = {
          reducerPath: 'multicall',
          actions: {
            addMulticallListeners: jest
              .fn()
              .mockImplementation((arg: Object) => ({ type: 'multicall/addMulticallListeners', payload: arg })),
            removeMulticallListeners: jest
              .fn()
              .mockImplementation((arg: Object) => ({ type: 'multicall/removeMulticallListeners', payload: arg })),
          },
        }

        act(() => {
          render(
            <Provider store={store}>
              <Caller calls={[callA]} multicallContext={mockContext} />
            </Provider>,
            container
          )
        })

        expect(mockContext.actions.addMulticallListeners).toHaveBeenCalledWith({
          chainId,
          calls: [callA],
          options: { blocksPerFetch },
        })
      })

      it('overrides blocksPerFetch configured in defaultListenerOptions in store when blocksPerFetch param is provided', () => {
        const callA = { address: 'a', callData: '' }
        const chainId = 1
        const blocksPerFetch = 10
        updateCallResult(callA, '0xa')

        store.dispatch(
          actions.updateListenerOptions({
            chainId,
            listenerOptions: {
              blocksPerFetch,
            },
          })
        )

        const mockContext = {
          reducerPath: 'multicall',
          actions: {
            addMulticallListeners: jest
              .fn()
              .mockImplementation((arg: Object) => ({ type: 'multicall/addMulticallListeners', payload: arg })),
            removeMulticallListeners: jest
              .fn()
              .mockImplementation((arg: Object) => ({ type: 'multicall/removeMulticallListeners', payload: arg })),
          },
        }

        act(() => {
          render(
            <Provider store={store}>
              <Caller calls={[callA]} multicallContext={mockContext} listenerOptions={{ blocksPerFetch: 5 }} />
            </Provider>,
            container
          )
        })

        expect(mockContext.actions.addMulticallListeners).toHaveBeenCalledWith({
          chainId,
          calls: [callA],
          options: { blocksPerFetch: 5 },
        })
      })

      it('defaults blocksPerFetch to DEFAULT_BLOCK_PER_FETCH constant when blocksPerFetch param is undefined and no defaultListenerOptions is provided', () => {
        const callA = { address: 'a', callData: '' }
        updateCallResult(callA, '0xa')

        const mockContext = {
          reducerPath: 'multicall',
          actions: {
            addMulticallListeners: jest
              .fn()
              .mockImplementation((arg: Object) => ({ type: 'multicall/addMulticallListeners', payload: arg })),
            removeMulticallListeners: jest
              .fn()
              .mockImplementation((arg: Object) => ({ type: 'multicall/removeMulticallListeners', payload: arg })),
          },
        }

        act(() => {
          render(
            <Provider store={store}>
              <Caller calls={[callA]} multicallContext={mockContext} />
            </Provider>,
            container
          )
        })

        expect(mockContext.actions.addMulticallListeners).toHaveBeenCalledWith({
          chainId: 1,
          calls: [callA],
          options: { blocksPerFetch: 1 },
        })
      })
    })
  })
})
