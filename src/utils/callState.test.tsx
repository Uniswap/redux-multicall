import { FunctionFragment, Interface } from '@ethersproject/abi'
import React, { useRef } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { toCallState, useCallStates } from './callState'

describe('callState', () => {
  describe('#useCallStates', () => {
    let container: HTMLDivElement | null = null
    beforeEach(() => {
      container = document.createElement('div')
      document.body.appendChild(container)
    })
    afterEach(() => {
      if (container) {
        unmountComponentAtNode(container)
        container.remove()
      }
      container = null
    })

    const contractInterface = { decodeFunctionResult: () => [{}] } as unknown as Interface
    const fragment = {} as FunctionFragment
    const results = [{ valid: true, data: '0xa', blockNumber: 2 }]
    function Caller({ latestBlockNumber }: { latestBlockNumber: number }) {
      const data = useCallStates(results, contractInterface, fragment, latestBlockNumber)
      const last = useRef(data)
      return <>{data[0].result === last.current[0].result ? 'true' : 'false'}</>
    }

    it('Stabilizes values across renders (assuming stable interface/fragment/results)', () => {
      render(<Caller latestBlockNumber={1} />, container)
      render(<Caller latestBlockNumber={2} />, container)
      expect(container?.textContent).toBe('true')
    })

    it('Returns referentially new values if data goes stale', () => {
      render(<Caller latestBlockNumber={2} />, container)
      render(<Caller latestBlockNumber={3} />, container)
      expect(container?.textContent).toBe('false')
    })
  })

  describe('#toCallState', () => {
    it('Handles missing values', () => {
      expect(toCallState(undefined, undefined, undefined, 1000)).toEqual({
        error: false,
        loading: false,
        result: undefined,
        syncing: false,
        valid: false,
      })
    })

    it('Returns loading state', () => {
      const callResult = {
        valid: true,
        data: '0xabcd',
        blockNumber: 1000,
      }
      expect(toCallState(callResult, undefined, undefined, 1000)).toEqual({
        error: false,
        loading: true,
        result: undefined,
        syncing: true,
        valid: true,
      })
    })
  })
})
