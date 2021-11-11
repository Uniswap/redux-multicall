import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { Contract, providers } from 'ethers'
import { useMemo } from 'react'
import { UniswapInterfaceMulticall } from './abi/types'

// Based partly on useContract in https://github.com/Uniswap/interface/blob/main/src/hooks/useContract.ts
export function useMulticall2Contract(address: string, provider: providers.Provider): UniswapInterfaceMulticall | null {
  return useMemo(() => {
    if (!address) {
      console.error('No address found for multicall')
      return null
    }
    try {
      return new Contract(address, MulticallABI, provider) as UniswapInterfaceMulticall
    } catch (error) {
      console.error('Failed to get multicall contract', error)
      return null
    }
  }, [address, provider])
}
