import { effect, shallowReadonly } from '..';

describe('shallowReadonly', () => {
  it ('base', () => {
    const form = shallowReadonly({
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
    const form = shallowReadonly({
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
    expect(form.inner.count).toBe(2)
  })
})