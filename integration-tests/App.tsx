import React from 'react'
import { Provider } from 'react-redux'
import { Home } from './Home'
import { useLatestBlock } from './hooks'
import { store } from './store'
import { Updater } from './Updater'

export function App() {
  const blockNumber = useLatestBlock()
  return (
    <Provider store={store}>
      <Updater blockNumber={blockNumber} />
      <Home blockNumber={blockNumber} />
    </Provider>
  )
}
