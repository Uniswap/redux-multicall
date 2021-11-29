import { createMulticall } from '../create'

// Create a multicall instance with default settings
export const multicall = createMulticall()
export const {
  useMultipleContractSingleData,
  useSingleCallResult,
  useSingleContractMultipleData,
  useSingleContractWithCallData,
} = multicall.hooks
