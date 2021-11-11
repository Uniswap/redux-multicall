import { CallResult, ListenerOptions } from './types'

export const DEFAULT_CALL_GAS_REQUIRED = 1_000_000
export const DEFAULT_CHUNK_GAS_REQUIRED = 200_000
export const CHUNK_GAS_LIMIT = 100_000_000
export const CONSERVATIVE_BLOCK_GAS_LIMIT = 10_000_000 // conservative, hard-coded estimate of the current block gas limit

// Consts for hooks
export const INVALID_RESULT: CallResult = { valid: false, blockNumber: undefined, data: undefined }
export const NEVER_RELOAD: ListenerOptions = {
  blocksPerFetch: Infinity,
}
