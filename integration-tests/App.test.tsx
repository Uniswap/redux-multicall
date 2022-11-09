import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { BigNumber } from '@ethersproject/bignumber'
import React from 'react'
import { App } from './App'
import { sleep } from './utils'

const MAX_BLOCK_AGE = 600_000 // 10 minutes

describe('Use multicall in test application', () => {
  it('Renders correctly initially', () => {
    render(<App />)
    const h1 = screen.getByText('Hello Multicall') // H1 in Home
    expect(h1).toBeTruthy()
    const missing = screen.queryByText('Does Not Exist')
    expect(missing).toBeFalsy()
  })

  it('Performs a single contract multicall query', async () => {
    render(<App />)

    // Check that block timestamp is correctly retrieved from block
    const timestamp1 = await waitFor(() => screen.getByTestId('blockTimestamp'), { timeout: 20_000 })
    expect(timestamp1 && timestamp1?.textContent).toBeTruthy()
    const value1 = parseInt(timestamp1.textContent!, 10) * 1000
    const now1 = Date.now()
    expect(now1 - value1).toBeLessThan(MAX_BLOCK_AGE)

    // Wait for an updated block timestamp
    await sleep(12_000)

    // Check that the block timestamp has updated correctly
    const timestamp2 = await waitFor(() => screen.getByTestId('blockTimestamp'), { timeout: 1_000 })
    expect(timestamp2 && timestamp2.textContent).toBeTruthy()
    const value2 = parseInt(timestamp1.textContent!, 10) * 1000
    const now2 = Date.now()
    expect(now2 - value2).toBeLessThan(MAX_BLOCK_AGE)
  }, 35_000)

  it('Performs a multi contract multicall query', async () => {
    render(<App />)

    // Check that max token balance is correctly retrieved
    const balance = await waitFor(() => screen.getByTestId('maxTokenBalance'), { timeout: 20_000 })
    expect(balance && balance?.textContent).toBeTruthy()
    const value1 = BigNumber.from(balance.textContent)
    expect(value1.gt(0)).toBeTruthy()
  }, 25_000)
})
