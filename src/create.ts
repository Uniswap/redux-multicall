import type { MulticallContext } from './context'
import {
  useMultiChainMultiContractSingleData as _useMultiChainMultiContractSingleData,
  useMultiChainSingleContractSingleData as _useMultiChainSingleContractSingleData,
  useMultipleContractSingleData as _useMultipleContractSingleData,
  useSingleCallResult as _useSingleCallResult,
  useSingleContractMultipleData as _useSingleContractMultipleData,
  useSingleContractWithCallData as _useSingleContractWithCallData,
} from './hooks'
import { createMulticallSlice } from './slice'
import { createUpdater } from './updater'

type RemoveFirstFromTuple<T extends any[]> = T['length'] extends 0
  ? undefined
  : ((...b: T) => void) extends (a: any, ...b: infer I) => void
  ? I
  : []
type ParamsWithoutContext<T extends (...args: any) => any> = RemoveFirstFromTuple<Parameters<T>>

export interface MulticallOptions {
  reducerPath?: string
  // More options can be added here as multicall's capabilities are extended
}

// Inspired by RTK Query's createApi
export function createMulticall(options?: MulticallOptions) {
  const reducerPath = options?.reducerPath ?? 'multicall'
  const slice = createMulticallSlice(reducerPath)
  const { actions, reducer } = slice
  const context: MulticallContext = { reducerPath, actions }

  const useMultipleContractSingleData = (...args: ParamsWithoutContext<typeof _useMultipleContractSingleData>) =>
    _useMultipleContractSingleData(context, ...args)
  const useSingleContractMultipleData = (...args: ParamsWithoutContext<typeof _useSingleContractMultipleData>) =>
    _useSingleContractMultipleData(context, ...args)
  const useSingleContractWithCallData = (...args: ParamsWithoutContext<typeof _useSingleContractWithCallData>) =>
    _useSingleContractWithCallData(context, ...args)
  const useSingleCallResult = (...args: ParamsWithoutContext<typeof _useSingleCallResult>) =>
    _useSingleCallResult(context, ...args)
  const useMultiChainMultiContractSingleData = (
    ...args: ParamsWithoutContext<typeof _useMultiChainMultiContractSingleData>
  ) => _useMultiChainMultiContractSingleData(context, ...args)
  const useMultiChainSingleContractSingleData = (
    ...args: ParamsWithoutContext<typeof _useMultiChainSingleContractSingleData>
  ) => _useMultiChainSingleContractSingleData(context, ...args)
  const hooks = {
    useMultipleContractSingleData,
    useSingleContractMultipleData,
    useSingleContractWithCallData,
    useSingleCallResult,
    useMultiChainMultiContractSingleData,
    useMultiChainSingleContractSingleData,
  }

  const Updater = createUpdater(context)

  return {
    reducerPath,
    reducer,
    actions,
    hooks,
    Updater,
  }
}
