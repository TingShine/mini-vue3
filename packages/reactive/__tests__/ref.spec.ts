import { effect } from "../effect";
import { ref } from "../ref";

describe("ref", () => {
  it("base function", () => {
    const count = ref(0);
    count.value += 1;
    expect(count.value).toBe(1);
  });

  it("reactive", () => {
    const count = ref(0);
    let temp = -1;
    let calls = 0;

    effect(() => {
      calls++;
      temp = count.value;
    });
    expect(calls).toBe(1);
    expect(temp).toBe(0);

    count.value += 1;
    expect(calls).toBe(2);
    expect(temp).toBe(1);

    count.value = 1;
    expect(calls).toBe(2);
    expect(temp).toBe(1);
  });
});
