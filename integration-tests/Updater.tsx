import React from 'react'
import { useContract } from './hooks'
import { multicall } from './multicall'

export function Updater({ blockNumber }: { blockNumber: number | undefined }) {
  const contract = useContract()
  return <multicall.Updater chainId={1} latestBlockNumber={blockNumber} contract={contract} />
}
