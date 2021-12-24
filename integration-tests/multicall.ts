import { createMulticall } from '../src/create'

// Create a multicall instance with default settings
export const multicall = createMulticall()
export const {
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData,
  useSingleContractWithCallData,
  useMultiChainMultiContractSingleData,
  useMultiChainSingleContractSingleData,
} = multicall.hooks
