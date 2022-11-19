import type { FunctionFragment, Interface } from '@ethersproject/abi'
import { useMemo } from 'react'
import { INVALID_CALL_STATE, LOADING_CALL_STATE } from '../constants'
import type { CallResult, CallState, CallStateResult } from '../types'

// Converts CallResult[] to CallState[], only updating if call states have changed.
// Ensures that CallState results remain referentially stable when unchanged, preventing
// spurious re-renders which would otherwise occur because mapping always creates a new object.
export function useCallStates(
  results: CallResult[],
  contractInterface: Interface | undefined,
  fragment: ((i: number) => FunctionFragment | undefined) | FunctionFragment | undefined,
  latestBlockNumber: number | undefined
): CallState[] {
  // Avoid refreshing the results with every changing block number (eg latestBlockNumber).
  // Instead, only refresh the results if they need to be synced - if there is a result which is stale, for which blockNumber < latestBlockNumber.
  const syncingBlockNumber = useMemo(() => {
    const lowestBlockNumber = results.reduce<number | undefined>(
      (memo, result) => (result.blockNumber ? Math.min(memo ?? result.blockNumber, result.blockNumber) : memo),
      undefined
    )
    return Math.max(lowestBlockNumber ?? 0, latestBlockNumber ?? 0)
  }, [results, latestBlockNumber])

  return useMemo(() => {
    return results.map((result, i) => {
      const resultFragment = typeof fragment === 'function' ? fragment(i) : fragment
      return toCallState(result, contractInterface, resultFragment, syncingBlockNumber)
    })
  }, [contractInterface, fragment, results, syncingBlockNumber])
}

export function toCallState(
  callResult: CallResult | undefined,
  contractInterface: Interface | undefined,
  fragment: FunctionFragment | undefined,
  syncingBlockNumber: number | undefined
): CallState {
  if (!callResult || !callResult.valid) {
    return INVALID_CALL_STATE
  }

  const { data, blockNumber } = callResult
  if (!blockNumber || !contractInterface || !fragment || !syncingBlockNumber) {
    return LOADING_CALL_STATE
  }

  const success = data && data.length > 2
  const syncing = blockNumber < syncingBlockNumber
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
