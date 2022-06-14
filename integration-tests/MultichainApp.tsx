require('dotenv').config()
import React, { useMemo } from 'react'
import { Provider } from 'react-redux'
import { ChainId } from './consts'
import { getProvider, useCurrentBlockTimestampMultichain, useLatestBlock } from './hooks'
import { store } from './store'
import { Updater } from './Updater'

export function MultichainApp() {
  const providerMainnet = getProvider(ChainId.MAINNET)
  const providerRinkeby = getProvider(ChainId.RINKEBY)
  const blockNumberMainnet = useLatestBlock(providerMainnet)
  const blockNumberRinkeby = useLatestBlock(providerRinkeby)
  const chains = useMemo(() => [ChainId.MAINNET, ChainId.RINKEBY], [])
  const blocks = useMemo(() => [blockNumberMainnet, blockNumberRinkeby], [blockNumberMainnet, blockNumberRinkeby])
  return (
    <Provider store={store}>
      <Updater chainId={ChainId.MAINNET} blockNumber={blockNumberMainnet} blocksPerFetch={2}/>
      <Updater chainId={ChainId.RINKEBY} blockNumber={blockNumberRinkeby} blocksPerFetch={5}/>
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
