import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { Contract, providers } from 'ethers'
import { useMemo } from 'react'
import { MULTICALL_ADDRESS } from './constants'
import { UniswapInterfaceMulticall } from './types'

// Based partly on useContract in https://github.com/Uniswap/interface/blob/main/src/hooks/useContract.ts
export function useMulticall2Contract(chainId: number, library: providers.Provider): UniswapInterfaceMulticall | null {
  const address = MULTICALL_ADDRESS[chainId]
  if (!address) {
    console.error('No address found for multicall')
    return null
  }
  return useMemo(() => {
    try {
      return new Contract(address, MulticallABI, library) as UniswapInterfaceMulticall
    } catch (error) {
      console.error('Failed to get multicall contract', error)
      return null
    }
  }, [address, MulticallABI, library])
}
