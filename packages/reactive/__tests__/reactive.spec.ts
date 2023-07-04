import { effect, reactive } from "..";
import { describe, it, expect } from 'vitest';

describe("reactive", () => {
  it('base function', () => {
    const form = reactive({
      username: 'hello',
      password: 'world'
    })

    form.username = `${form.username} ${form.password}`
    expect(form.username).toBe('hello world')
  }),
  it('reactibility', () => {
    const form = reactive({
      count: 1,
    })
    let calls = 0;
    let sum = 0

    effect(() => {
      sum += form.count
      calls++;
    })

    expect(calls).toBe(1);
    form.count += 1;
    expect(calls).toBe(2);
    expect(form.count).toBe(2);
    expect(sum).toBe(3)
  }),
  it('deep reactibility', () => {
    const form = reactive({
      inner: {
        count: 1
      }
    })
    let sum = 0
    let calls = 0

    effect(() => {
      sum += form.inner.count ;
      calls++
    })

    expect(form.inner.count).toBe(1)
    form.inner.count += 1;
    expect(form.inner.count).toBe(2)
    expect(calls).toBe(2)
    expect(sum).toBe(3)
  })
})