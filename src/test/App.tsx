import React from 'react'
import { Provider } from 'react-redux'
import { Home } from './Home'
import { store } from './store'
import { Updater } from './updater'

export function App() {
  return (
    <Provider store={store}>
      <Updater />
      <Home />
    </Provider>
  )
}
