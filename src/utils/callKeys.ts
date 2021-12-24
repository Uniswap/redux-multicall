import { Call } from '../types'

export function toCallKey(call: Call): string {
  let key = `${call.address}-${call.callData}`
  if (call.gasRequired) {
    if (!Number.isSafeInteger(call.gasRequired)) {
      throw new Error(`Invalid number: ${call.gasRequired}`)
    }
    key += `-${call.gasRequired}`
  }
  return key
}

export function parseCallKey(callKey: string): Call {
  const pcs = callKey.split('-')
  if (![2, 3].includes(pcs.length)) {
    throw new Error(`Invalid call key: ${callKey}`)
  }
  return {
    address: pcs[0],
    callData: pcs[1],
    ...(pcs[2] ? { gasRequired: Number.parseInt(pcs[2]) } : {}),
  }
}

export function callsToCallKeys(calls?: Array<Call | undefined>) {
  return (
    calls
      ?.filter((c): c is Call => Boolean(c))
      ?.map(toCallKey)
      ?.sort() ?? []
  )
}

export function callKeysToCalls(callKeys: string[]) {
  if (!callKeys?.length) return null
  return callKeys.map((key) => parseCallKey(key))
}
