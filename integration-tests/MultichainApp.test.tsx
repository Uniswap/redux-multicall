import '@testing-library/jest-dom'
import { act } from 'react-dom/test-utils'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { MultichainApp } from './MultichainApp'
import { sleep } from './utils'

const MAX_BLOCK_AGE = 600_000 // 10 minutes

describe('Use multicall in test multichain application', () => {
  it('Renders correctly initially', () => {
    act(() => {
      render(<MultichainApp />)
    })
    const h1 = screen.getByText('Hello Multichain Multicall') // H1 in Home
    expect(h1).toBeTruthy()
    const missing = screen.queryByText('Does Not Exist')
    expect(missing).toBeFalsy()
  })

  it('Performs a multichain single contract multicall query', async () => {
    act(() => {
      render(<MultichainApp />)
    })
    // Check that block timestamp is correctly retrieved from block
    const timestamps1 = await waitFor(() => screen.getByTestId('blockTimestamps'), { timeout: 20_000 /* 20 seconds */ })
    expect(timestamps1 && timestamps1?.textContent).toBeTruthy()
    const values1 = parseTimestamp(timestamps1.textContent)
    const now1 = Date.now()
    expect(values1.length).toEqual(2)
    expect(now1 - values1[0]).toBeLessThan(MAX_BLOCK_AGE)
    expect(now1 - values1[1]).toBeLessThan(MAX_BLOCK_AGE)

    // Wait for an updated block timestamp
    await sleep(20_000 /* 20 seconds */)

    // Check that the block timestamp has updated correctly
    const timestamps2 = await waitFor(() => screen.getByTestId('blockTimestamps'), { timeout: 1_000 /* 1 second */ })
    expect(timestamps2 && timestamps2.textContent).toBeTruthy()
    const values2 = parseTimestamp(timestamps2.textContent)
    const now2 = Date.now()
    expect(values2.length).toEqual(2)
    expect(now2 - values2[0]).toBeLessThan(MAX_BLOCK_AGE)
    expect(now2 - values2[1]).toBeLessThan(MAX_BLOCK_AGE)
  }, 50_000 /* 50 seconds */)
})

function parseTimestamp(value: string | null) {
  if (!value) throw new Error('No timestamp to parse')
  return value.split(',').map((v) => parseInt(v, 10) * 1000)
}
