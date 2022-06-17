import { createStore, Store } from '@reduxjs/toolkit'
import { createMulticallSlice, MulticallActions } from './slice'
import { MulticallState } from './types'

const DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'

describe('multicall reducer', () => {
  let store: Store<MulticallState>
  let actions: MulticallActions
  beforeEach(() => {
    const slice = createMulticallSlice('multicall')
    actions = slice.actions
    store = createStore(slice.reducer)
  })

  it('has correct initial state', () => {
    expect(store.getState().callResults).toEqual({})
    expect(store.getState().callListeners).toBeUndefined()
    expect(store.getState().listenerOptions).toBeUndefined()
  })

  describe('addMulticallListeners', () => {
    it('adds listeners', () => {
      store.dispatch(
        actions.addMulticallListeners({
          chainId: 1,
          calls: [
            {
              address: DAI_ADDRESS,
              callData: '0x',
            },
          ],
          options: { blocksPerFetch: 1 },
        })
      )
      expect(store.getState()).toEqual({
        callListeners: {
          [1]: {
            [`${DAI_ADDRESS}-0x`]: {
              [1]: 1,
            },
          },
        },
        callResults: {},
      })
    })
  })

  describe('removeMulticallListeners', () => {
    it('noop', () => {
      store.dispatch(
        actions.removeMulticallListeners({
          calls: [
            {
              address: DAI_ADDRESS,
              callData: '0x',
            },
          ],
          chainId: 1,
          options: { blocksPerFetch: 1 },
        })
      )
      expect(store.getState()).toEqual({ callResults: {}, callListeners: {} })
    })
    it('removes listeners', () => {
      store.dispatch(
        actions.addMulticallListeners({
          chainId: 1,
          calls: [
            {
              address: DAI_ADDRESS,
              callData: '0x',
            },
          ],
          options: { blocksPerFetch: 1 },
        })
      )
      store.dispatch(
        actions.removeMulticallListeners({
          calls: [
            {
              address: DAI_ADDRESS,
              callData: '0x',
            },
          ],
          chainId: 1,
          options: { blocksPerFetch: 1 },
        })
      )
      expect(store.getState()).toEqual({
        callResults: {},
        callListeners: { [1]: { [`${DAI_ADDRESS}-0x`]: {} } },
      })
    })
  })

  describe('updateMulticallResults', () => {
    it('updates data if not present', () => {
      store.dispatch(
        actions.updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x',
          },
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 1,
              data: '0x',
            },
          },
        },
      })
    })
    it('updates old data', () => {
      store.dispatch(
        actions.updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x',
          },
        })
      )
      store.dispatch(
        actions.updateMulticallResults({
          chainId: 1,
          blockNumber: 2,
          results: {
            abc: '0x2',
          },
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 2,
              data: '0x2',
            },
          },
        },
      })
    })
    it('ignores late updates', () => {
      store.dispatch(
        actions.updateMulticallResults({
          chainId: 1,
          blockNumber: 2,
          results: {
            abc: '0x2',
          },
        })
      )
      store.dispatch(
        actions.updateMulticallResults({
          chainId: 1,
          blockNumber: 1,
          results: {
            abc: '0x1',
          },
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            abc: {
              blockNumber: 2,
              data: '0x2',
            },
          },
        },
      })
    })
  })
  describe('fetchingMulticallResults', () => {
    it('updates state to fetching', () => {
      store.dispatch(
        actions.fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: { fetchingBlockNumber: 2 },
          },
        },
      })
    })

    it('updates state to fetching even if already fetching older block', () => {
      store.dispatch(
        actions.fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      store.dispatch(
        actions.fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 3,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: { fetchingBlockNumber: 3 },
          },
        },
      })
    })

    it('does not do update if fetching newer block', () => {
      store.dispatch(
        actions.fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      store.dispatch(
        actions.fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 1,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: { fetchingBlockNumber: 2 },
          },
        },
      })
    })
  })

  describe('errorFetchingMulticallResults', () => {
    it('does nothing if not fetching', () => {
      store.dispatch(
        actions.errorFetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 1,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {},
        },
      })
    })
    it('updates block number if we were fetching', () => {
      store.dispatch(
        actions.fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      store.dispatch(
        actions.errorFetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: {
              blockNumber: 2,
              // null data indicates error
              data: null,
            },
          },
        },
      })
    })
    it('does nothing if not errored on latest block', () => {
      store.dispatch(
        actions.fetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 3,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      store.dispatch(
        actions.errorFetchingMulticallResults({
          chainId: 1,
          fetchingBlockNumber: 2,
          calls: [{ address: DAI_ADDRESS, callData: '0x0' }],
        })
      )
      expect(store.getState()).toEqual({
        callResults: {
          [1]: {
            [`${DAI_ADDRESS}-0x0`]: { fetchingBlockNumber: 3 },
          },
        },
      })
    })
  })

  describe('updateListenerOptions', () => {
    it('initializes listenerOptions map in state if not present and updates', () => {
      store.dispatch(
        actions.updateListenerOptions({
          chainId: 1,
          listenerOptions: {
            blocksPerFetch: 5,
          },
        })
      )
      expect(store.getState().listenerOptions).toEqual({
        1: {
          blocksPerFetch: 5,
        },
      })
    })

    it('updates listenerOptions map when overriding with new values for multiple chain IDs', () => {
      store.dispatch(
        actions.updateListenerOptions({
          chainId: 1,
          listenerOptions: {
            blocksPerFetch: 5,
          },
        })
      )
      store.dispatch(
        actions.updateListenerOptions({
          chainId: 2,
          listenerOptions: {
            blocksPerFetch: 10,
          },
        })
      )
      expect(store.getState().listenerOptions).toEqual({
        1: {
          blocksPerFetch: 5,
        },
        2: {
          blocksPerFetch: 10,
        },
      })
      store.dispatch(
        actions.updateListenerOptions({
          chainId: 1,
          listenerOptions: {
            blocksPerFetch: 1,
          },
        })
      )
      store.dispatch(
        actions.updateListenerOptions({
          chainId: 2,
          listenerOptions: {
            blocksPerFetch: 100,
          },
        })
      )
      expect(store.getState().listenerOptions).toEqual({
        1: {
          blocksPerFetch: 1,
        },
        2: {
          blocksPerFetch: 100,
        },
      })
    })
  })
})
