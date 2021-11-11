# MultiCall

A React + Redux library for fetching, batching, and caching chain state via the MultiCall contract.

## Setup

`yarn add @uniswap/multicall` or `npm install @uniswap/multicall`

## Usage

The usage of this library is similar to [RTK Query](https://redux-toolkit.js.org/rtk-query/overview#create-an-api-slice).

```js
// Somewhere in your app
export const multicall = createMulticall({ reducerPath: 'multicall' })

// In your store's root reducer
export const rootReducer = combineReducers({
  // Other reducers
  [multicall.reducerPath]: multicall.reducer,
})
```

## Alpha software

The latest version of the SDK is used in production in the Uniswap Interface,
but it is considered Alpha software and may contain bugs or change significantly between patch versions.
If you have questions about how to use the SDK, please reach out in the `#dev-chat` channel of the Discord.
Pull requests welcome!
