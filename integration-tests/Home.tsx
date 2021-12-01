import React from 'react'
import { useCurrentBlockTimestamp, useMaxTokenBalance } from './hooks'

export function Home({ blockNumber }: { blockNumber: number | undefined }) {
  const blockTimestamp = useCurrentBlockTimestamp(blockNumber)
  const maxTokenBalance = useMaxTokenBalance(blockNumber)
  return (
    <div>
      <h1>Hello Multicall</h1>
      <h2>Block Timestamp:</h2>
      {blockTimestamp && <p data-testid="blockTimestamp">{blockTimestamp}</p>}
      <h2>Max Token Balance:</h2>
      {maxTokenBalance && <p data-testid="maxTokenBalance">{maxTokenBalance}</p>}
    </div>
  )
}
