import { effect } from "../effect";
import { reactive } from '../reactive';

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
      count: 1
    })
    let calls = 0;

    effect(() => {
      console.log(form.count);
      calls++;
    })

    expect(calls).toBe(1);
    form.count += 1;
    expect(calls).toBe(2);
    expect(form.count).toBe(2);
  })
})