import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { BigNumber, Contract, providers, utils } from 'ethers'
import { useEffect, useMemo, useState } from 'react'
import { UniswapInterfaceMulticall } from '../src/abi/types'
import ERC20_ABI from './erc20.json'
import { useMultipleContractSingleData, useSingleCallResult } from './multicall'

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
export const MULTICALL_ADDRESS = '0x1F98415757620B543A52E61c46B32eB19261F984' // Address on Mainnet
export const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
export const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'

let provider: providers.JsonRpcProvider

export function useContract() {
  return useMemo(() => {
    return new Contract(MULTICALL_ADDRESS, MulticallABI, getProvider()) as UniswapInterfaceMulticall
  }, [])
}

export function useLatestBlock() {
  const [blockNumber, setBlockNumber] = useState<number | undefined>(undefined)
  useEffect(() => {
    const onBlock = (num: number) => setBlockNumber(num)
    provider.on('block', onBlock)
    return () => {
      provider.off('block', onBlock)
    }
  }, [setBlockNumber])
  return blockNumber
}

export function useCurrentBlockTimestamp(blockNumber: number | undefined): string | undefined {
  const contract = useContract()
  const result = useSingleCallResult(1, blockNumber, contract, 'getCurrentBlockTimestamp')
  return result.result?.[0]?.toString()
}

export function useMaxTokenBalance(blockNumber: number | undefined): string | undefined {
  const ERC20Interface = new utils.Interface(ERC20_ABI)
  const results = useMultipleContractSingleData(
    1,
    blockNumber,
    [USDC_ADDRESS, USDT_ADDRESS],
    ERC20Interface,
    'balanceOf',
    [NULL_ADDRESS]
  )
  let max
  for (const result of results) {
    if (!result.valid || !result.result?.length) continue
    const value = BigNumber.from(result.result[0])
    if (!max || value.gt(max)) max = value
  }
  return max?.toString()
}

function getProvider() {
  if (provider) return provider
  const infuraKey = process.env.INFURA_PROJECT_ID
  if (!infuraKey) throw new Error('INFURA_PROJECT_ID is required for provider')
  // Connect to mainnet
  provider = new providers.InfuraProvider('homestead', infuraKey)
  return provider
}
