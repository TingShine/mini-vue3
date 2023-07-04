import { computed, reactive } from '../';
import { describe, it, expect, vi } from 'vitest';

describe('computed', () => {
  it('reactive', () => {
    const form = reactive({ 
      user: 'hello',
    })

    const getter = computed(() => form.user)

    form.user = 'world'
    expect(getter.value).toBe('world')
  })

  it('computed lazy', () => {
    const form = reactive({ 
      count: 1,
    })

    const getter = vi.fn(() => form.count)
    const computedValue = computed(getter)

    expect(getter).not.toHaveBeenCalled()
    expect(computedValue.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    computedValue.value;
    expect(getter).toHaveBeenCalledTimes(1);

    form.count++;
    expect(getter).toHaveBeenCalledTimes(1);
    expect(computedValue.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);

    computedValue.value;
    expect(getter).toHaveBeenCalledTimes(2);
  })
})