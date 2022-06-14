import React from 'react'
import { Provider } from 'react-redux'
import { ChainId } from './consts'
import { getProvider, useCurrentBlockTimestamp, useLatestBlock, useMaxTokenBalance } from './hooks'
import { store } from './store'
import { Updater } from './Updater'

export function App() {
  const provider = getProvider(ChainId.MAINNET)
  const blockNumber = useLatestBlock(provider)
  return (
    <Provider store={store}>
      <Updater chainId={ChainId.MAINNET} blockNumber={blockNumber} />
      <Home chainId={ChainId.MAINNET} blockNumber={blockNumber} />
    </Provider>
  )
}

interface HomeProps {
  chainId: ChainId
  blockNumber: number | undefined
}

function Home({ chainId, blockNumber }: HomeProps) {
  const blockTimestamp = useCurrentBlockTimestamp(chainId, blockNumber)
  const maxTokenBalance = useMaxTokenBalance(chainId, blockNumber)
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
