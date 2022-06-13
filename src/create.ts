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
import { createUpdaterAndHooks } from './updater'

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

  const { UpdaterContextBound: Updater, hooks } = createUpdaterAndHooks(context)
  
  return {
    reducerPath,
    reducer,
    actions,
    hooks,
    Updater,
  }
}
