import { callKeysToCalls, callsToCallKeys, parseCallKey, toCallKey } from './callKeys'

describe('callKeys', () => {
  describe('#parseCallKey', () => {
    it('does not throw for invalid address', () => {
      expect(parseCallKey('0x-0x')).toEqual({ address: '0x', callData: '0x' })
    })
    it('does not throw for invalid calldata', () => {
      expect(parseCallKey('0x6b175474e89094c44da98b954eedeac495271d0f-abc')).toEqual({
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        callData: 'abc',
      })
    })
    it('throws for uppercase calldata', () => {
      expect(parseCallKey('0x6b175474e89094c44da98b954eedeac495271d0f-0xabcD')).toEqual({
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        callData: '0xabcD',
      })
    })
    it('parses pieces into address', () => {
      expect(parseCallKey('0x6b175474e89094c44da98b954eedeac495271d0f-0xabcd')).toEqual({
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        callData: '0xabcd',
      })
    })
  })

  describe('#toCallKey', () => {
    it('concatenates address to data', () => {
      expect(toCallKey({ address: '0x6b175474e89094c44da98b954eedeac495271d0f', callData: '0xabcd' })).toEqual(
        '0x6b175474e89094c44da98b954eedeac495271d0f-0xabcd'
      )
    })
  })

  const call1 = { address: '0x6b175474e89094c44da98b954eedeac495271d0f', callData: '0xabcd' }
  const call2 = { address: '0xE92a65EB6f2928e733d013F2f315f71EFD8788B4', callData: '0xdefg' }
  const result = [
    '0x6b175474e89094c44da98b954eedeac495271d0f-0xabcd',
    '0xE92a65EB6f2928e733d013F2f315f71EFD8788B4-0xdefg',
  ]

  describe('#callsToCallKeys', () => {
    it('Returns ordered, serialized call keys', () => {
      expect(callsToCallKeys([call1, call2])).toEqual(result)
      expect(callsToCallKeys([call2, call1])).toEqual(result)
    })

    it('Handles empty lists', () => {
      expect(callsToCallKeys(undefined)).toEqual([])
      expect(callsToCallKeys([undefined])).toEqual([])
    })
  })

  describe('#callKeysToCalls', () => {
    it('Returns deserialized calls', () => {
      expect(callKeysToCalls(result)).toEqual([call1, call2])
    })

    it('Handles empty lists', () => {
      expect(callKeysToCalls([])).toEqual(null)
    })
  })
})
