import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { App } from './App'

describe('Use multicall in test application', () => {
  it('Renders successfully', async () => {
    render(<App />)
    const h1 = screen.getByText('Hello Multicall') // H1 in Home.tsx
    expect(h1).toBeTruthy()
    const missing = screen.queryByText('Does Not Exist')
    expect(missing).toBeFalsy()
  })
})
