import { FunctionFragment, Interface } from '@ethersproject/abi'
import React, { useRef } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import { toCallState, useStableCallStates } from './callState'

describe('callState', () => {
  describe('#useStableCallStates', () => {
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

    function Caller({ result }: { result: any }) {
      const contractInterface = { decodeFunctionResult: () => result } as unknown as Interface
      const fragment = {} as FunctionFragment
      const data = useStableCallStates([{ valid: true, data: '0xa', blockNumber: 1 }], contractInterface, fragment, 1)
      const last = useRef(data)
      return <>{data[0].result === last.current[0].result ? 'true' : 'false'}</>
    }

    it('Stabilizes values across renders', () => {
      render(<Caller result={[{}]} />, container)
      render(<Caller result={[{}]} />, container)
      expect(container?.textContent).toBe('true')
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
