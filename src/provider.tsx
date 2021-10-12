import React, { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { store } from './store'

// Include this in your App component tree as you would a normal redux provider
export const MulticallProvider = ({ children }: PropsWithChildren<any>) => {
  return <Provider store={store}>{children}</Provider>
}
