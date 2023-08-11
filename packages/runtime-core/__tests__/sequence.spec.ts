import { describe, it, expect, vi } from 'vitest';
import { getSequenceIndexs } from '../render';

describe('test longest child sequence', () => {
  it('first', () => {
    const arr = [2, 8, 6, 4, 7, 3, -100, -99, -98, -97, -96, -95, -94, 1, 29, 30, 10, 11, 120, 150, 999, 99999, 100];
    const sequence = getSequenceIndexs(arr);
    expect(sequence).toHaveLength(14)
  })
})