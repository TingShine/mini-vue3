# Readonly

`Readonly`跟`Reactive`的用法和原理基本一致，不同的是`reactive`返回的是响应式数据，`readonly`返回的是只读数据，这意味着只能够读取，无法改变对应的键值对，所以也就没有了触发依赖的机会，不需要再收集依赖，同样是通过`Proxy`实现

::: tip
`readonly`是深层次的，其内部值为对象时仍然具有只读性
:::

## 实现

我们直接在`reactive`的代码上来进行兼容改造

### 1. 创建readonly

```ts
export const readonlyMap = new WeakMap()

export const readonly = (target) => {
  return createReactiveObject(target, readonlyMap, readonlyHandlers)
}
```

其中`createReactiveObject`在上一章 [createreactiveobject优化](./reactive.md#_1-createreactiveobject优化) 涉及，`readonlyHandlers`便是`readonly`的代理拦截操作

### 2. Get拦截实现

在上一个篇章中[Reactive Get拦截](./reactive.md#_3-get拦截优化)，我们已经进行了一次代码风格的优化，在此基础上来完成我们的`readonly`拦截功能，以下是原先的`createGetter`函数:

```ts
// 枚举
export enum ReactiveFlags {
  RAW = '_v_raw_',
  IS_REACTIVE = '_v_isReactive'
}

export const createGetter = (isReadonly = false, shallow = false) => {
  return (target, key, receiver) => {
    // 获取原对象
    if (key === ReactiveFlags.RAW && reactiveMap.get(target) === receiver) {
      return target
    }
  
    // 获取是否为reactive对象
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
  
    const result = Reflect.get(target, key, receiver);

    track(target, key, 'get')

    if (isObject(result)) {
      return reactive(result)
    }

    return result
  }
}
```

我们需要添加`IS_READONLY`枚举，然后获取是否为`readonly`时返回`true`，同时获取`RAW`的`key`时也要返回原对象

```ts{4,9-24}
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

    track(target, key, 'get')

    if (isObject(result)) {
      return reactive(result)
    }

    return result
  }
}
```

在上面的代码中，我们可以看到几个小的优化点：
- 使用`if-else if`，当`key`优先符合判断条件时，不会进行接下来其余判断，减少不必要的计算
- 使用`isExistReactiveMap`和`isExistReadonlyMap`函数调用来返回原对象，前面被判断条件符合时不会执行后面函数，减少计算

`readonly`的数据是只读的，也就是不需要收集依赖，需要判断`isReadonly`进行处理:

```ts{28-30}
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
      return reactive(result)
    }

    return result
  }
}
```

`readonly`是深层次的，所以如果取出来的值为对象，同样也需要进行`readonly`处理:

```ts{33}
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

### 3. Set拦截实现

`readonly`返回的数据具有只读性，所以无法进行赋值，也无需进行依赖触发，实现起来比较简单：

```ts
const readonlySet = (target, key) => {
  // readonly的对象不允许赋值
  console.warn(`Failed on key ${key}: target is readonly.`, target)

  return true
}
```

由于开发过程中开发人员可能对`readonly`进行赋值，所以给了个`warn`提示

### 4. 收尾工作

定义`readonlyHandlers`的Proxy拦截操作，`readonly`就创建完成了

```ts
// readonly
const readonlyGet = createGetter(true)
const readonlySet = (target, key) => {
  // readonly的对象不允许赋值
  console.warn(`Failed on key ${key}: target is readonly.`, target)

  return true
}

export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet
}
```

## 单元测试

```ts
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
```