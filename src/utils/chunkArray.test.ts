import { DEFAULT_CHUNK_GAS_REQUIRED } from '../constants'
import chunkArray from './chunkArray'

describe('#chunkArray', () => {
  it('size 1', () => {
    expect(chunkArray([1, 2, 3], 1)).toEqual([[1], [2], [3]])
    expect(chunkArray([1, 2, 3], DEFAULT_CHUNK_GAS_REQUIRED)).toEqual([[1], [2], [3]])
  })
  it('size gt items', () => {
    expect(chunkArray([1, 2, 3], DEFAULT_CHUNK_GAS_REQUIRED * 3 + 1)).toEqual([[1, 2, 3]])
  })
  it('size exact half', () => {
    expect(chunkArray([1, 2, 3, 4], DEFAULT_CHUNK_GAS_REQUIRED * 2 + 1)).toEqual([
      [1, 2],
      [3, 4],
    ])
  })
})
