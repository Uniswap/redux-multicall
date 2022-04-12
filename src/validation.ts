import { BigNumber } from '@ethersproject/bignumber'

export type MethodArg = string | number | BigNumber
export type MethodArgs = Array<MethodArg | MethodArg[]>

export function isMethodArg(x: unknown): x is MethodArg {
  return BigNumber.isBigNumber(x) || ['string', 'number'].indexOf(typeof x) !== -1
}

export function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
  return (
    x === undefined ||
    (Array.isArray(x) && x.every((xi) => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg))))
  )
}
