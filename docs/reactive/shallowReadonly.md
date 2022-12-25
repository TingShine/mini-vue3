# ShallowReadoly

`shallow`是浅层的意思，`shallowReadonly`跟`readonly`的区别是：`shallowReadonly`是浅层只读，其嵌套的属性如果为对象，则不用进行深层的`readonly`操作，即可以改变嵌套属性的对象里的值

## 实现

### 1. get拦截改造

实现`shallowReadonly`只需要在`readonly`的基础上改造，在判断嵌套属性是对象时不进行`readonly`就可以，我们首先来看下`readonly`的`get拦截`：

```ts
export enum ReactiveFlags {
  RAW = '_v_raw_',
  IS_REACTIVE = '_v_isReactive',
  IS_READONLY = '_v_isReadonly'
}

export const createGetter = (isReadonly = false, shallow = false) => {
  return (target, key, receiver) => {
    const isExistReactiveMap = () => key === ReactiveFlags.RAW && reactiveMap.get(target) === receiver
    const isExistReadonlyMap = () => key === ReactiveFlags.RAW && readonlyMap.get(target) === receiver
  
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 判断是否响应式
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      // 判断是否为只读
      return isReadonly
    } else if (
      isExistReactiveMap() ||
      isExistReadonlyMap()
    ) {
      // 获取原对象
      return target
    }
  
    const result = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      track(target, key, 'get')
    }
  
    if (isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result)
    }

    return result
  }
}
```

进行改造：

```ts{11,22,34-36}
export enum ReactiveFlags {
  RAW = '_v_raw_',
  IS_REACTIVE = '_v_isReactive',
  IS_READONLY = '_v_isReadonly'
}

export const createGetter = (isReadonly = false, shallow = false) => {
  return (target, key, receiver) => {
    const isExistReactiveMap = () => key === ReactiveFlags.RAW && reactiveMap.get(target) === receiver
    const isExistReadonlyMap = () => key === ReactiveFlags.RAW && readonlyMap.get(target) === receiver
    const isExistShallowReadonlyMap = () => key === ReactiveFlags.RAW && shallowReadonlyMap.get(target) === receiver
  
    if (key === ReactiveFlags.IS_REACTIVE) {
      // 判断是否响应式
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      // 判断是否为只读
      return isReadonly
    } else if (
      isExistReactiveMap() ||
      isExistReadonlyMap() ||
      isExistShallowReadonlyMap()
    ) {
      // 获取原对象
      return target
    }
  
    const result = Reflect.get(target, key, receiver);

    if (!isReadonly) {
      track(target, key, 'get')
    }

    if (shallow) {
      return result
    }
  
    if (isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result)
    }

    return result
  }
}
```

### 2. 代理劫持

`shallowReadonly`的代理劫持有之前`readonly`的示例，很容易可以实现代码：

```ts
const shallowGet = createGetter(false, true)
const shallowReadonlySet = (target, key) => {
  console.warn(`Failed on key ${key}: target is readonly.`, target)

  return true
}
export const shallowReadonlyHandlers = {
  get: shallowGet,
  set: shallowReadonlySet
}
```

### 3. 入口函数

```ts
export const shallowReadonlyMap = new WeakMap()

export function shallowReadonly (target) {
  return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers)
}
```

## 单元测试

```ts
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
```