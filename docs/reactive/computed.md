# Computed

`computed`跟`ref`的用法类似，都是通过`.value`来访问响应式数据，不同的是接收的参数为有返回值的函数，当函数内的响应式数据发生变化时，通过自动的计算得到对应的值

::: tip
`computed`如果没有获取值时，是不会主动运行函数，避免多余的算力消耗
:::

## 实现分析

`computed`实现的功能与`watchEffect`相近，都是通过传入一个函数，在依赖发生变化时运行函数，不同的是`computed`具有返回值，同时在没有获取时不会主动运行函数，那么我们可以复用`effect`来实现

## 具体实现

### 1. 创建ComputedRefImf类

参考[RefImf](/mini-vue3/reactive/ref.html#创建refimf类)的实现，先构建一个类，传入函数参数，维护依赖列表

```ts
import { createDep } from './dep';
import { ReactiveEffect } from './effect';

class ComputedRefImf {
  public deps: any;
  public effect: ReactiveEffect;

  constructor(getter) {
    this.deps = createDep();
    this.effect = new ReactiveEffect(getter);
  }
}
```
### 2. 获取返回值

在获取值时，构建依赖关系，运行effect函数，同时保存返回值

::: details 思路
在收集依赖时，可以借鉴`ref`类的实现，维护类里面`dep`依赖列表，然后改造一下原来的触发方式
```ts
export const trackRefValue = (ref: RefImf | ComputedRefImpl) => {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

export const triggerRefValue = (ref: RefImf | ComputedRefImpl) => {
  if (isTracking()) {
    triggerEffects(ref.dep);
  }
}
```
:::

```ts{3,8,15-21}
import { createDep } from './dep';
import { ReactiveEffect } from './effect';
import { trackRefValue } from './ref';

class ComputedRefImf {
  public dep: any;
  public effect: ReactiveEffect;
  public _value: any;

  constructor(getter) {
    this.dep = createDep();
    this.effect = new ReactiveEffect(getter);
  }

  get value() {
    // 收集依赖
    trackRefValue(this);
    this._value = this.effect.run();

    return _value;
  }
}
```

到了这一步，我们就实现了在获取`computed`值的时候收集依赖，将类里面的dep添加进相关响应式数据的依赖触发列表中，当响应式数据发生变化时会进行通知

### 3. 控制执行时机

`computed` 具有缓存的特性，当响应式数据没有变化时，不会重新调用直接使用原来的结果，所以可以通过变量`_dirty`控制

```ts{3,10-11,16-21,28-31}
import { createDep } from './dep';
import { ReactiveEffect } from './effect';
import { trackRefValue, triggerRefValue } from './ref';

class ComputedRefImf {
  public dep: any;
  public effect: ReactiveEffect;
  public _value: any;

  // 是否是脏数据，避免重复计算
  public _dirty: boolean;

  constructor(getter) {
    this._dirty = true;
    this.dep = createDep();
    this.effect = new ReactiveEffect(getter, () => {
      if (this._dirty) return;

      this._dirty = true;
      triggerRefValue(this);
    });
  }

  get value() {
    // 收集依赖
    trackRefValue(this);

    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }

    return _value;
  }
}
```

## 单元测试

```ts
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
```