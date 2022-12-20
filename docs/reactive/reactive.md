# Reactive

一般而言，数值、布尔值、字符串、数组变量的响应式使用`ref`，而对象的响应式使用`reactive`，可以深度检测内部对象的变更

## 实现分析

通过`reactive`双向绑定的vue文件样例，我们分析一下需要实现的功能特性

```vue
<template>
  <input v-model:value="form.username" type="text" name="username" />
  <input v-model:value="form.password" type="password" name="password" />
</template>

<script setup>
import { reactive, watchEffect } from 'vue'
const form = reactive({
  username: '',
  password: ''
})
watchEffect(() => {
  console.log(form.username)
  console.log(form.password)
})
</script>
```

从上述样例可以看出，`reactive`作为函数，参数为对象进行调用，返回一个变量，该变量仍然具有对象的特征，且需要具有响应式的特征，那么在取值和赋值的时候就都需要进行监听介入，我们无法使用上一个篇章`Ref`一样使用`class`，因为对象里面的键值对是不可知，我们使用`Ref`需要监听每个`key`也是不可取的。

`ECMAScript 6`提供了一个新的特性 [Proxy](https://es6.ruanyifeng.com/#docs/proxy) ,`Proxy`代理可以劫持对象，对目标对象的访问都需要经过一层“拦截”，我们可以使用代理来实现响应式的功能。

那么我们可以总结需要实现的`reactive`特性如下：

- `reactive`函数包裹的参数为对象
- 使用`Proxy`代理劫持对象，分别在`get`和`set`的时候进行拦截

::: details vue2和vue3对比
`vue2`使用`Object.defineProperty`进行劫持，`vue3`使用`Proxy`，两者有性能上和作用范围上的差异，在后续章节会进行对比
:::

## Proxy代理

`reactive`的核心是创建`Proxy`，关键实现应该在于`set`和`get`的拦截


### 1. 创建Proxy

```ts
// 创建reactive对象，返回Proxy
export const reactive = (target) => {
  return createReactiveObject(target)
}

// 创建Proxy
export const createReactiveObject = (target) => {
  return new Proxy(target, mutableHandlers)
}
```

`mutableHandlers`为`get`和`set`的实现，在后续步骤实现

### 2. 缓存目标对象

为了避免目标对象重复套用`reactive`，进行不必要的计算，使用 [WeakMap](https://es6.ruanyifeng.com/#docs/set-map#WeakMap) 缓存该对象得到的 `Proxy`代理，在下一次调用`reactive`函数时可以直接返回。

```ts{1,8-12,15-16}
const targetMap = new WeakMap()

export const reactive = (target) => {
  return createReactiveObject(target)
}

export const createReactiveObject = (target) => {
  const existPrpxy = targetMap.get(target)
  // 判断是否已经缓存
  if (existPrpxy) {
    return existPrpxy
  }

  const proxy = new Proxy(target, mutableHandlers)
  // 缓存对象的代理
  targetMap.set(target, proxy)

  return proxy
}
```

### 3. 劫持对象

与`Ref`相似，我们主要在获取数据时收集依赖，在改变数据时触发依赖，那么`baseHandlers`主要涉及`get`和`set`两种操作

```ts
export const mutableHandlers = {
  get,
  set
}
```

### 4. 拦截get

`Proxy`的`get`的初始获取是以下方式：

```ts
export const get = (target, key, receiver) {
  return Reflect.get(target, key, receiver)
}
```

我们需要在获取之前进行依赖收集

```ts{2-3}
export const get = (target, key, receiver) {
  // 依赖收集
  track(target, key, 'get')

  return Reflect.get(target, key, receiver)
}
```
其中，`track`函数就是进行依赖收集，在后面章节我们会具体实现

### 5. 拦截set

`Proxy`的`get`的初始赋值是以下方式：

```ts
export const set = (target, key, value, receiver) {
  return Reflect.set(target, key, value, receiver)
}
```

我们需要在赋值后进行依赖触发（通知订阅者）

```ts{4-5}
export const set = (target, key, value, receiver) {
  const result = Reflect.set(target, key, value, receiver)

  // 触发依赖
  trigger(target, key, 'set')

  return result
}
```
其中，`trigger`函数就是进行依赖触发，在后面章节我们会具体实现

## 依赖收集和触发

依赖收集和触发就是实现`track`和`trigger`函数，其具体实现需要与`ref`有差异性，因为`reactive`的的参数是对象，是一个有键值对的数据结构，我们获取一个对象里的一个值是通过`key`去获取的，其他的`key`可能不需要进行监听以免浪费不必要的内存空间和计算能力，所以我们需要对`key`进行依赖收集

### 1. 依赖收集

首先，对`target`进行缓存，以避免多次对该目标对象取值时重复计算

```ts
const targetMap = new WeakMap()

export const track = (target, key, type) => {
// 判断是否需要收集
  if (!isTracking()) {
    return;
  }

  // 获取target对应的依赖关系Map
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
}
```

::: tip
使用`targetMap`这个`WeakMap`将`target`缓存起来，其中`depsMap`就是`target`相对应的依赖Map关系
:::

接着，我们来实现`key`对应的依赖关系

```ts{3-6,21-26}
const targetMap = new WeakMap()

// 创建依赖集合（订阅者集合）
export const createDep = (effects?: any) => {
  return new Set(effects);
}

export const track = (target, key, type) => {
// 判断是否需要收集
  if (!isTracking()) {
    return;
  }

  // 获取target对应的依赖关系Map
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 获取key对应的依赖关系Set
  let dep = depsMap.get(key)
  if (!dep) {
    dep = createDep()
    depsMap.set(key, dep);
  }
}
```

我们可以看到`dep`变量就是`key`对应的依赖集合（订阅者集合），`createDep`是创建`Set`类型依赖集合的函数

最后就是正式将`Effect`添加进该`key`的依赖集合中，我们使用在[依赖添加](./effect#_1-依赖收集)中的`trackEffect`函数实现

```ts{28}
const targetMap = new WeakMap()

// 创建依赖集合（订阅者集合）
export const createDep = (effects?: any) => {
  return new Set(effects);
}

export const track = (target, key, type) => {
// 判断是否需要收集
  if (!isTracking()) {
    return;
  }

  // 获取target对应的依赖关系Map
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 获取key对应的依赖关系Set
  let dep = depsMap.get(key)
  if (!dep) {
    dep = createDep()
    depsMap.set(key, dep);
  }

  trackEffects(dep);
}
```

### 2. 依赖触发

依赖触发跟依赖收集的步骤相似，使用的是[依赖通知](./effect#_2-触发依赖)中的`triggerEffect`函数实现，下面是实现的代码:

```ts
// 触发reactive依赖
export const trigger = (target, key, type) => {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return;
  } 

  const depSet = depsMap.get(key);
  if (!depSet) {
    return;
  }

  const deps = [...depSet];
  
  triggerEffects(createDep(deps));
}
```

## 进阶

我们的代码都是基于`reative`特性而写，但其实`readonly`和`shallowReadonly`都跟`reative`原理相近，我们来优化一下我们的代码风格，使其在后续篇章能够被复用

以下是代码的优化点：

### 1. createReactiveObject优化

```ts
export function createReactiveObject (target, proxyMap, baseHandlers) {
  const existPrpxy = proxyMap.get(target)
  if (existPrpxy) {
    return existPrpxy;
  }

  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  
  return proxy
}
```

`createReactiveObject`参数添加`proxyMap`和`baseHandlers`，分别代表`target`的代理缓存和代理的劫持操作，这样后期支持`readonly`和`shallowReadonly`仅需要改变对应的传参即可，那么相应`reactive`调用的时候需要更改为:

```ts
export function reactive (target) {
  return createReactiveObject(target, targetMap, mutableHandlers);
}
```
