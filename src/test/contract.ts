import { abi as MulticallABI } from '@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json'
import { Contract, providers } from 'ethers'
import { useMemo } from 'react'
import { UniswapInterfaceMulticall } from '../abi/types'

export const address = '0x1F98415757620B543A52E61c46B32eB19261F984' // Multicall address on Mainnet

export function useContract() {
  return useMemo(() => {
    const provider = new providers.JsonRpcProvider('localhost:3045')
    return new Contract(address, MulticallABI, provider) as UniswapInterfaceMulticall
  }, [])
}
