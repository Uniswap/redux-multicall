import React from 'react'
import { useContract } from './contract'
import { multicall } from './multicall'

export function Updater() {
  const contract = useContract()
  return <multicall.Updater chainId={1} latestBlockNumber={1} contract={contract} />
}
