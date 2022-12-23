import { effect, readonly } from '..';

describe('readonly', () => {
  it ('base', () => {
    const form = readonly({
      count: 1
    })
    let sum = 0;
    let calls = 0

    effect(() => {
      sum += form.count;
      calls++
    })

    expect(sum).toBe(1)
    expect(calls).toBe(1)

    form.count += 1
    expect(sum).toBe(1)
    expect(calls).toBe(1)
  }),

  it ('deep readonly', () => {
    const form = readonly({
      inner: {
        count: 1
      }
    })
    let sum = 0;
    let calls = 0

    effect(() => {
      sum += form.inner.count;
      calls++
    })

    expect(sum).toBe(1)
    expect(calls).toBe(1)

    form.inner.count += 1
    expect(sum).toBe(1)
    expect(calls).toBe(1)
    expect(form.inner.count).toBe(1)
  })
})