import { toCallState } from './callState'

describe('callState', () => {
  describe('#toCallState', () => {
    it('Handles missing values', () => {
      expect(toCallState(undefined, undefined, undefined, 1000)).toEqual({
        error: false,
        loading: false,
        result: undefined,
        syncing: false,
        valid: false,
      })
    })

    it('Returns loading state', () => {
      const callResult = {
        valid: true,
        data: '0xabcd',
        blockNumber: 1000,
      }
      expect(toCallState(callResult, undefined, undefined, 1000)).toEqual({
        error: false,
        loading: true,
        result: undefined,
        syncing: true,
        valid: true,
      })
    })
  })
})
