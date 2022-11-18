import { Contract } from '@ethersproject/contracts'
import { Interface } from '@ethersproject/abi'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { batch, useDispatch, useSelector } from 'react-redux'
import { INVALID_CALL_STATE, INVALID_RESULT, DEFAULT_BLOCKS_PER_FETCH } from './constants'
import type { MulticallContext } from './context'
import type { Call, CallResult, CallState, ListenerOptions, ListenerOptionsWithGas, WithMulticallState } from './types'
import { callKeysToCalls, callsToCallKeys, toCallKey } from './utils/callKeys'
import { toCallState, useCallStates } from './utils/callState'
import { isValidMethodArgs, MethodArg } from './validation'

type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined

// the lowest level call for subscribing to contract data
export function useCallsDataSubscription(
  context: MulticallContext,
  chainId: number | undefined,
  calls: Array<Call | undefined>,
  listenerOptions?: ListenerOptions
): CallResult[] {
  const { reducerPath, actions } = context
  const callResults = useSelector((state: WithMulticallState) => state[reducerPath].callResults)
  const defaultListenerOptions = useSelector((state: WithMulticallState) => state[reducerPath].listenerOptions)
  const dispatch = useDispatch()
  const serializedCallKeys: string = useMemo(() => JSON.stringify(callsToCallKeys(calls)), [calls])

  // update listeners when there is an actual change that persists for at least 100ms
  useEffect(() => {
    const callKeys: string[] = JSON.parse(serializedCallKeys)
    const calls = callKeysToCalls(callKeys)
    if (!chainId || !calls) return
    const blocksPerFetchFromState = (defaultListenerOptions ?? {})[chainId]?.blocksPerFetch
    const blocksPerFetchForChain =
      listenerOptions?.blocksPerFetch ?? blocksPerFetchFromState ?? DEFAULT_BLOCKS_PER_FETCH

    dispatch(
      actions.addMulticallListeners({
        chainId,
        calls,
        options: { blocksPerFetch: blocksPerFetchForChain },
      })
    )

    return () => {
      dispatch(
        actions.removeMulticallListeners({
          chainId,
          calls,
          options: { blocksPerFetch: blocksPerFetchForChain },
        })
      )
    }
  }, [actions, chainId, dispatch, listenerOptions, serializedCallKeys, defaultListenerOptions])

  const lastResults = useRef<CallResult[]>([])
  return useMemo(() => {
    let isChanged = lastResults.current.length !== calls.length

    // Construct results using a for-loop to handle sparse arrays.
    // Array.prototype.map would skip empty entries.
    let results: CallResult[] = []
    for (let i = 0; i < calls.length; ++i) {
      const call = calls[i]
      let result = INVALID_RESULT
      if (chainId && call) {
        const callResult = callResults[chainId]?.[toCallKey(call)]
        result = {
          valid: true,
          data: callResult?.data && callResult.data !== '0x' ? callResult.data : undefined,
          blockNumber: callResult?.blockNumber,
        }
      }

      isChanged = isChanged || !areCallResultsEqual(result, lastResults.current[i])
      results.push(result)
    }

    // Force the results to be referentially stable if they have not changed.
    // This is necessary because *all* callResults are passed as deps when initially memoizing the results.
    if (isChanged) {
      lastResults.current = results
    }
    return lastResults.current
  }, [callResults, calls, chainId])
}

function areCallResultsEqual(a: CallResult, b: CallResult) {
  return a.valid === b.valid && a.data === b.data && a.blockNumber === b.blockNumber
}

// Similar to useCallsDataSubscription above but for subscribing to
// calls to multiple chains at once
function useMultichainCallsDataSubscription(
  context: MulticallContext,
  chainToCalls: Record<number, Array<Call | undefined>>,
  listenerOptions?: ListenerOptions
): Record<number, CallResult[]> {
  const { reducerPath, actions } = context
  const callResults = useSelector((state: WithMulticallState) => state[reducerPath].callResults)
  const defaultListenerOptions = useSelector((state: WithMulticallState) => state[reducerPath].listenerOptions)
  const dispatch = useDispatch()

  const serializedCallKeys: string = useMemo(() => {
    const sortedChainIds = getChainIds(chainToCalls).sort()
    const chainCallKeysTuple = sortedChainIds.map((chainId) => {
      const calls = chainToCalls[chainId]
      const callKeys = callsToCallKeys(calls)
      // Note, using a tuple to ensure consistent order when serialized
      return [chainId, callKeys]
    })
    return JSON.stringify(chainCallKeysTuple)
  }, [chainToCalls])

  useEffect(() => {
    const chainCallKeysTuples: Array<[number, string[]]> = JSON.parse(serializedCallKeys)
    if (!chainCallKeysTuples?.length) return

    batch(() => {
      for (const [chainId, callKeys] of chainCallKeysTuples) {
        const calls = callKeysToCalls(callKeys)
        if (!calls?.length) continue
        const blocksPerFetchFromState = (defaultListenerOptions ?? {})[chainId]?.blocksPerFetch
        const blocksPerFetchForChain =
          listenerOptions?.blocksPerFetch ?? blocksPerFetchFromState ?? DEFAULT_BLOCKS_PER_FETCH

        dispatch(
          actions.addMulticallListeners({
            chainId,
            calls,
            options: { blocksPerFetch: blocksPerFetchForChain },
          })
        )
      }
    })

    return () => {
      batch(() => {
        for (const [chainId, callKeys] of chainCallKeysTuples) {
          const calls = callKeysToCalls(callKeys)
          if (!calls?.length) continue
          const blocksPerFetchFromState = (defaultListenerOptions ?? {})[chainId]?.blocksPerFetch
          const blocksPerFetchForChain =
            listenerOptions?.blocksPerFetch ?? blocksPerFetchFromState ?? DEFAULT_BLOCKS_PER_FETCH
          dispatch(
            actions.removeMulticallListeners({
              chainId,
              calls,
              options: { blocksPerFetch: blocksPerFetchForChain },
            })
          )
        }
      })
    }
  }, [actions, dispatch, listenerOptions, serializedCallKeys, defaultListenerOptions])

  return useMemo(
    () =>
      getChainIds(chainToCalls).reduce((result, chainId) => {
        const calls = chainToCalls[chainId]
        result[chainId] = calls.map<CallResult>((call) => {
          if (!chainId || !call) return INVALID_RESULT
          const result = callResults[chainId]?.[toCallKey(call)]
          const data = result?.data && result.data !== '0x' ? result.data : undefined
          return { valid: true, data, blockNumber: result?.blockNumber }
        })
        return result
      }, {} as Record<number, CallResult[]>),
    [callResults, chainToCalls]
  )
}

// formats many calls to a single function on a single contract, with the function name and inputs specified
export function useSingleContractMultipleData(
  context: MulticallContext,
  chainId: number | undefined,
  latestBlockNumber: number | undefined,
  contract: Contract | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[],
  options?: Partial<ListenerOptionsWithGas>
): CallState[] {
  const { gasRequired } = options ?? {}

  // Create ethers function fragment
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])

  // Get encoded call data. Note can't use useCallData below b.c. this is  for a list of CallInputs
  const callDatas = useMemo(() => {
    if (!contract || !fragment) return []
    return callInputs.map<string | undefined>((callInput) =>
      isValidMethodArgs(callInput) ? contract.interface.encodeFunctionData(fragment, callInput) : undefined
    )
  }, [callInputs, contract, fragment])

  // Create call objects
  const calls = useMemo(() => {
    if (!contract) return []
    return callDatas.map<Call | undefined>((callData) => {
      if (!callData) return undefined
      return {
        address: contract.address,
        callData,
        gasRequired,
      }
    })
  }, [contract, callDatas, gasRequired])

  // Subscribe to call data
  const results = useCallsDataSubscription(context, chainId, calls, options as ListenerOptions)
  return useCallStates(results, contract?.interface, fragment, latestBlockNumber)
}

export function useMultipleContractSingleData(
  context: MulticallContext,
  chainId: number | undefined,
  latestBlockNumber: number | undefined,
  addresses: (string | undefined)[],
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options?: Partial<ListenerOptionsWithGas>
): CallState[] {
  const { gasRequired } = options ?? {}

  const { fragment, callData } = useCallData(methodName, contractInterface, callInputs)

  // Create call objects
  const calls = useMemo(() => {
    if (!callData) return []
    return addresses.map<Call | undefined>((address) => {
      if (!address) return undefined
      return { address, callData, gasRequired }
    })
  }, [addresses, callData, gasRequired])

  // Subscribe to call data
  const results = useCallsDataSubscription(context, chainId, calls, options as ListenerOptions)
  return useCallStates(results, contractInterface, fragment, latestBlockNumber)
}

export function useSingleCallResult(
  context: MulticallContext,
  chainId: number | undefined,
  latestBlockNumber: number | undefined,
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  options?: Partial<ListenerOptionsWithGas>
): CallState {
  const callInputs = useMemo(() => [inputs], [inputs])
  return (
    useSingleContractMultipleData(context, chainId, latestBlockNumber, contract, methodName, callInputs, options)[0] ??
    INVALID_CALL_STATE
  )
}

// formats many calls to any number of functions on a single contract, with only the calldata specified
export function useSingleContractWithCallData(
  context: MulticallContext,
  chainId: number | undefined,
  latestBlockNumber: number | undefined,
  contract: Contract | null | undefined,
  callDatas: string[],
  options?: Partial<ListenerOptionsWithGas>
): CallState[] {
  const { gasRequired } = options ?? {}

  // Create call objects
  const calls = useMemo(() => {
    if (!contract) return []
    return callDatas.map<Call>((callData) => ({
      address: contract.address,
      callData,
      gasRequired,
    }))
  }, [callDatas, contract, gasRequired])

  // Subscribe to call data
  const results = useCallsDataSubscription(context, chainId, calls, options as ListenerOptions)
  const fragment = useCallback(
    (i: number) => contract?.interface?.getFunction(callDatas[i].substring(0, 10)),
    [callDatas, contract]
  )
  return useCallStates(results, contract?.interface, fragment, latestBlockNumber)
}

// Similar to useMultipleContractSingleData but instead of multiple contracts on one chain,
// this is for querying compatible contracts on multiple chains
export function useMultiChainMultiContractSingleData(
  context: MulticallContext,
  chainToBlockNumber: Record<number, number | undefined>,
  chainToAddresses: Record<number, Array<string | undefined>>,
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options?: Partial<ListenerOptionsWithGas>
): Record<number, CallState[]> {
  const { gasRequired } = options ?? {}

  const { fragment, callData } = useCallData(methodName, contractInterface, callInputs)

  // Create call objects
  const chainToCalls = useMemo(() => {
    if (!callData || !chainToAddresses) return {}
    return getChainIds(chainToAddresses).reduce((result, chainId) => {
      const addresses = chainToAddresses[chainId]
      const calls = addresses.map<Call | undefined>((address) => {
        if (!address) return undefined
        return { address, callData, gasRequired }
      })
      result[chainId] = calls
      return result
    }, {} as Record<number, Array<Call | undefined>>)
  }, [chainToAddresses, callData, gasRequired])

  // Subscribe to call data
  const chainIdToResults = useMultichainCallsDataSubscription(context, chainToCalls, options as ListenerOptions)

  // TODO(WEB-2097): Multichain states are not referentially stable, because they cannot use the
  // same codepath (eg useCallStates).
  return useMemo(() => {
    return getChainIds(chainIdToResults).reduce((combinedResults, chainId) => {
      const latestBlockNumber = chainToBlockNumber?.[chainId]
      const results = chainIdToResults[chainId]
      combinedResults[chainId] = results.map((result) =>
        toCallState(result, contractInterface, fragment, latestBlockNumber)
      )
      return combinedResults
    }, {} as Record<number, CallState[]>)
  }, [fragment, contractInterface, chainIdToResults, chainToBlockNumber])
}

// Similar to useSingleCallResult but instead of one contract on one chain,
// this is for querying a contract on multiple chains
export function useMultiChainSingleContractSingleData(
  context: MulticallContext,
  chainToBlockNumber: Record<number, number | undefined>,
  chainToAddress: Record<number, string | undefined>,
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options?: Partial<ListenerOptionsWithGas>
): Record<number, CallState> {
  // This hook uses the more flexible useMultiChainMultiContractSingleData internally,
  // but transforms the inputs and outputs for convenience
  const chainIdToAddresses = useMemo(() => {
    return getChainIds(chainToAddress).reduce((result, chainId) => {
      result[chainId] = [chainToAddress[chainId]]
      return result
    }, {} as Record<number, Array<string | undefined>>)
  }, [chainToAddress])

  const multiContractResults = useMultiChainMultiContractSingleData(
    context,
    chainToBlockNumber,
    chainIdToAddresses,
    contractInterface,
    methodName,
    callInputs,
    options
  )

  return useMemo(() => {
    return getChainIds(chainToAddress).reduce((result, chainId) => {
      result[chainId] = multiContractResults[chainId]?.[0] ?? INVALID_CALL_STATE
      return result
    }, {} as Record<number, CallState>)
  }, [chainToAddress, multiContractResults])
}

function useCallData(
  methodName: string,
  contractInterface: Interface | null | undefined,
  callInputs: OptionalMethodInputs | undefined
) {
  // Create ethers function fragment
  const fragment = useMemo(() => contractInterface?.getFunction(methodName), [contractInterface, methodName])
  // Get encoded call data
  const callData: string | undefined = useMemo(
    () =>
      fragment && isValidMethodArgs(callInputs)
        ? contractInterface?.encodeFunctionData(fragment, callInputs)
        : undefined,
    [callInputs, contractInterface, fragment]
  )
  return { fragment, callData }
}

function getChainIds(chainIdMap: Record<number, any>) {
  return Object.keys(chainIdMap).map((c) => parseInt(c, 10))
}
