import type { FunctionFragment, Interface } from '@ethersproject/abi'
import { useMemo } from 'react'
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
  const lowestBlockNumber = useMemo(() => results.reduce((memo, result) => result.blockNumber ? Math.min(result.blockNumber, memo) : memo, 0), [results])
  const syncingBlockNumber = Math.max(lowestBlockNumber, latestBlockNumber ?? 0)

  return useMemo(() => {
    return results.map((result, i) => {
      const resultFragment = typeof fragment === 'function' ? fragment(i) : fragment
      // Avoid refreshing the results with every changing block number (eg latestBlockNumber).
      // Instead, only refresh the results if they need to be synced - if there is a result which is stale.
      return toCallState(result, contractInterface, resultFragment, syncingBlockNumber)
    })
  }, [contractInterface, fragment, syncingBlockNumber])
}

export function toCallState(
  callResult: CallResult | undefined,
  contractInterface: Interface | undefined,
  fragment: FunctionFragment | undefined,
  syncingBlockNumber: number | undefined
): CallState {
  if (!callResult) return INVALID_CALL_STATE
  const { valid, data, blockNumber } = callResult
  if (!valid) return INVALID_CALL_STATE
  if (!blockNumber) return LOADING_CALL_STATE
  syncingBlockNumber = syncingBlockNumber || blockNumber
  if (!contractInterface || !fragment) return LOADING_CALL_STATE
  const success = data && data.length > 2
  const syncing = (blockNumber ?? 0) < syncingBlockNumber
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
