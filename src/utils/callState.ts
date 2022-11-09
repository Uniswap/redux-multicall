import type { FunctionFragment, Interface } from '@ethersproject/abi'
import deepEqual from 'fast-deep-equal'
import { useMemo, useRef } from 'react'
import { INVALID_CALL_STATE, LOADING_CALL_STATE } from '../constants'
import type { CallResult, CallState, CallStateResult } from '../types'

// Converts CallResult[] to CallState[], carrying over any decoded objects between calls.
// This ensures that the CallState results remain referentially stable when unchanged, preventing
// spurious re-renders which would otherwise occur because mapping always creates a new object.
export function useStableCallStates(
  results: CallResult[],
  contractInterface: Interface | undefined,
  fragment: ((i: number) => FunctionFragment | undefined) | FunctionFragment | undefined,
  latestBlockNumber: number | undefined
): CallState[] {
  const lastStates = useRef<CallState[]>([])
  return useMemo(() => {
    const callStates = results.map((result, i) => {
      const resultFragment = typeof fragment === 'function' ? fragment(i) : fragment
      const callState = toCallState(result, contractInterface, resultFragment, latestBlockNumber)

      // if the result has not changed, return a referentially stable result
      const lastState = lastStates.current[i]
      if (deepEqual(callState, lastState)) {
        return lastState
      }

      return callState
    })
    // if no results have changed, return a referentially stable array
    if (callStates.every((result, i) => result === lastStates.current[i])) return lastStates.current

    // if some results have changed, update the stable array
    return (lastStates.current = callStates)
  }, [contractInterface, fragment, latestBlockNumber, results])
}

export function toCallState(
  callResult: CallResult | undefined,
  contractInterface: Interface | undefined,
  fragment: FunctionFragment | undefined,
  latestBlockNumber: number | undefined
): CallState {
  if (!callResult) return INVALID_CALL_STATE
  const { valid, data, blockNumber } = callResult
  if (!valid) return INVALID_CALL_STATE
  if (valid && !blockNumber) return LOADING_CALL_STATE
  if (!contractInterface || !fragment || !latestBlockNumber) return LOADING_CALL_STATE
  const success = data && data.length > 2
  const syncing = (blockNumber ?? 0) < latestBlockNumber
  let result: CallStateResult | undefined = undefined
  if (success && data) {
    try {
      result = contractInterface.decodeFunctionResult(fragment, data)
    } catch (error) {
      console.debug('Result data parsing failed', fragment, data)
      return {
        valid: true,
        loading: false,
        error: true,
        syncing,
        result,
      }
    }
  }
  return {
    valid: true,
    loading: false,
    syncing,
    result,
    error: !success,
  }
}
