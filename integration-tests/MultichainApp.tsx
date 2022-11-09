import React, { useMemo } from 'react'
import { Provider } from 'react-redux'
import { ChainId } from './consts'
import { getProvider, useCurrentBlockTimestampMultichain, useLatestBlock } from './hooks'
import { store } from './store'
import { Updater } from './Updater'

export function MultichainApp() {
  const providerMainnet = getProvider(ChainId.MAINNET)
  const providerGoerli = getProvider(ChainId.GOERLI)
  const blockNumberMainnet = useLatestBlock(providerMainnet)
  const blockNumberGoerli = useLatestBlock(providerGoerli)
  const chains = useMemo(() => [ChainId.MAINNET, ChainId.GOERLI], [])
  const blocks = useMemo(() => [blockNumberMainnet, blockNumberGoerli], [blockNumberMainnet, blockNumberGoerli])
  return (
    <Provider store={store}>
      <Updater chainId={ChainId.MAINNET} blockNumber={blockNumberMainnet} />
      <Updater chainId={ChainId.GOERLI} blockNumber={blockNumberGoerli} blocksPerFetch={5} />
      <Home chainIds={chains} blockNumbers={blocks} />
    </Provider>
  )
}

interface HomeProps {
  chainIds: Array<ChainId>
  blockNumbers: Array<number | undefined>
}

function Home({ chainIds, blockNumbers }: HomeProps) {
  const blockTimestamps = useCurrentBlockTimestampMultichain(chainIds, blockNumbers)
  const isReady = blockTimestamps.filter((b) => !!b).length >= 2
  return (
    <div>
      <h1>Hello Multichain Multicall</h1>
      <h2>Block Timestamps:</h2>
      {isReady && <p data-testid="blockTimestamps">{blockTimestamps.join(',')}</p>}
    </div>
  )
}
