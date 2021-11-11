import { BigNumber, Contract, utils } from 'ethers'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { INVALID_RESULT } from './constants'
import type { MulticallContext } from './context'
import type { Call, CallResult, CallState, CallStateResult, ListenerOptions, WithMulticallState } from './types'
import { parseCallKey, toCallKey } from './utils/callKeys'

type MethodArg = string | number | BigNumber
type MethodArgs = Array<MethodArg | MethodArg[]>

type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined

function isMethodArg(x: unknown): x is MethodArg {
  return BigNumber.isBigNumber(x) || ['string', 'number'].indexOf(typeof x) !== -1
}

function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
  return (
    x === undefined ||
    (Array.isArray(x) && x.every((xi) => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg))))
  )
}

// the lowest level call for subscribing to contract data
function useCallsData(
  context: MulticallContext,
  chainId: number | undefined,
  calls: (Call | undefined)[],
  { blocksPerFetch }: ListenerOptions = { blocksPerFetch: 1 }
): CallResult[] {
  const { reducerPath, actions } = context
  const callResults = useSelector((state: WithMulticallState) => state[reducerPath].callResults)
  const dispatch = useDispatch()

  const serializedCallKeys: string = useMemo(
    () =>
      JSON.stringify(
        calls
          ?.filter((c): c is Call => Boolean(c))
          ?.map(toCallKey)
          ?.sort() ?? []
      ),
    [calls]
  )

  // update listeners when there is an actual change that persists for at least 100ms
  useEffect(() => {
    const callKeys: string[] = JSON.parse(serializedCallKeys)
    if (!chainId || callKeys.length === 0) return undefined
    const calls = callKeys.map((key) => parseCallKey(key))
    dispatch(
      actions.addMulticallListeners({
        chainId,
        calls,
        options: { blocksPerFetch },
      })
    )

    return () => {
      dispatch(
        actions.removeMulticallListeners({
          chainId,
          calls,
          options: { blocksPerFetch },
        })
      )
    }
  }, [actions, chainId, dispatch, blocksPerFetch, serializedCallKeys])

  return useMemo(
    () =>
      calls.map<CallResult>((call) => {
        if (!chainId || !call) return INVALID_RESULT

        const result = callResults[chainId]?.[toCallKey(call)]
        let data
        if (result?.data && result?.data !== '0x') {
          data = result.data
        }

        return { valid: true, data, blockNumber: result?.blockNumber }
      }),
    [callResults, calls, chainId]
  )
}

const INVALID_CALL_STATE: CallState = { valid: false, result: undefined, loading: false, syncing: false, error: false }
const LOADING_CALL_STATE: CallState = { valid: true, result: undefined, loading: true, syncing: true, error: false }

function toCallState(
  callResult: CallResult | undefined,
  contractInterface: utils.Interface | undefined,
  fragment: utils.FunctionFragment | undefined,
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

// formats many calls to a single function on a single contract, with the function name and inputs specified
export function useSingleContractMultipleData(
  context: MulticallContext,
  chainId: number | undefined,
  latestBlockNumber: number | undefined,
  contract: Contract | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[],
  options: Partial<ListenerOptions> & { gasRequired?: number } = {}
): CallState[] {
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])

  // encode callDatas
  const callDatas = useMemo(
    () =>
      contract && fragment
        ? callInputs.map<string | undefined>((callInput) =>
            isValidMethodArgs(callInput) ? contract.interface.encodeFunctionData(fragment, callInput) : undefined
          )
        : [],
    [callInputs, contract, fragment]
  )

  const gasRequired = options?.gasRequired
  const blocksPerFetch = options?.blocksPerFetch

  // encode calls
  const calls = useMemo(
    () =>
      contract
        ? callDatas.map<Call | undefined>((callData) =>
            callData
              ? {
                  address: contract.address,
                  callData,
                  gasRequired,
                }
              : undefined
          )
        : [],
    [contract, callDatas, gasRequired]
  )

  const results = useCallsData(context, chainId, calls, blocksPerFetch ? { blocksPerFetch } : undefined)

  return useMemo(() => {
    return results.map((result) => toCallState(result, contract?.interface, fragment, latestBlockNumber))
  }, [results, contract, fragment, latestBlockNumber])
}

export function useMultipleContractSingleData(
  context: MulticallContext,
  chainId: number | undefined,
  latestBlockNumber: number | undefined,
  addresses: (string | undefined)[],
  contractInterface: utils.Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options: Partial<ListenerOptions> & { gasRequired?: number } = {}
): CallState[] {
  const fragment = useMemo(() => contractInterface.getFunction(methodName), [contractInterface, methodName])

  // encode callData
  const callData: string | undefined = useMemo(
    () => (isValidMethodArgs(callInputs) ? contractInterface.encodeFunctionData(fragment, callInputs) : undefined),
    [callInputs, contractInterface, fragment]
  )

  const gasRequired = options?.gasRequired
  const blocksPerFetch = options?.blocksPerFetch

  // encode calls
  const calls = useMemo(
    () =>
      callData
        ? addresses.map<Call | undefined>((address) => {
            return address
              ? {
                  address,
                  callData,
                  gasRequired,
                }
              : undefined
          })
        : [],
    [addresses, callData, gasRequired]
  )

  const results = useCallsData(context, chainId, calls, blocksPerFetch ? { blocksPerFetch } : undefined)

  return useMemo(() => {
    return results.map((result) => toCallState(result, contractInterface, fragment, latestBlockNumber))
  }, [fragment, results, contractInterface, latestBlockNumber])
}

export function useSingleCallResult(
  context: MulticallContext,
  chainId: number | undefined,
  latestBlockNumber: number | undefined,
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  options: Partial<ListenerOptions> & { gasRequired?: number } = {}
): CallState {
  return (
    useSingleContractMultipleData(context, chainId, latestBlockNumber, contract, methodName, [inputs], options)[0] ??
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
  options: Partial<ListenerOptions> & { gasRequired?: number } = {}
): CallState[] {
  const gasRequired = options?.gasRequired
  const blocksPerFetch = options?.blocksPerFetch

  // encode calls
  const calls = useMemo(
    () =>
      contract
        ? callDatas.map<Call>((callData) => {
            return {
              address: contract.address,
              callData,
              gasRequired,
            }
          })
        : [],
    [contract, callDatas, gasRequired]
  )

  const results = useCallsData(context, chainId, calls, blocksPerFetch ? { blocksPerFetch } : undefined)

  return useMemo(() => {
    return results.map((result, i) =>
      toCallState(
        result,
        contract?.interface,
        contract?.interface?.getFunction(callDatas[i].substring(0, 10)),
        latestBlockNumber
      )
    )
  }, [results, contract, callDatas, latestBlockNumber])
}
