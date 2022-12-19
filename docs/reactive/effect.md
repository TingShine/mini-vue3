# Effect

在创建响应式示例之前，我们需要有运行示例的"`vue环境`"，这里我们模拟vue3框架中的`watchEffect`为运行响应式的环境，创建`effect`运行环境

## 实现分析

要实现`watchEffect`的功能，我们需要进行依赖收集和触发依赖，先看下`watchEffect`的使用样例：

```vue
<template>
  <div>{{ count }}</div>
  <button @click="count += 1"></button>
</template>

<script setup>
import { watchEffect, ref } from 'vue'

const count = ref(0)

watchEffect(() => {
  console.log(count.value)
})
</script>
```

从上述示例运行结果可以看出，`watchEffect`接收一个函数，在script执行过程中会立即执行一次，当接收的函数内部读取响应式变量时（当前示例为`count`变量），会去监听这些响应式变量，当响应式变量的数据发生改变时会再次运行该函数。

总结可以得出我们要实现的`effect`函数有以下特点:

- `effect`作为一个函数，接收的参数为一个“副作用”函数
- `effect`和响应式变量如`ref`和`reactive`的关系，相当于`发布者-订阅`模式，`effect` 去订阅响应式数据的变化，然后执行相对应的逻辑


## 基础架构搭建

在上述分析中，我们得出`effect`作为一个函数，接收的参数为一个“副作用”函数，如以下使用方式：

``` typescript
effect(() => {
  // 具体代码
})
```

由于要实现`发布者-订阅`模式，且`effect`作为`订阅`的一方，需要在`发布者`变更时进行通知，然后执行参数中的“副作用”函数，那么`effect`应当返回一个对象的实例，作为订阅者存入`发布者`（响应式数据）的依赖列表中，当发生变更时进行通知，这里我们可以认为是调用实例的方法（即“副作用”函数）

接下是进行实现步骤：

### 1. 创建`ReactiveEffect`类和`effect`函数

`effect`接收副作用函数`fn`,返回`ReactiveEffect`的实例（后面会采取存入`activeEffect`变量中）

```typescript
class ReactiveEffect {
  constructor(public fn: Function) {}
}

const effect = (fn: Function) => {
  return new ReactiveEffect(fn);
}
```

### 2. 模拟运行环境

只有在`effect`运行过程中才允许收集依赖（`发布者`将`订阅者`添加进通知列表中），模拟真实的运行环境

```typescript{1,6-12,15-17}
let shouldTrack = false

class ReactiveEffect {
  constructor(public fn: Function) {}

  // 真正的运行环境
  run() {
    shouldTrack = true;
    this.fn()
    shouldTrack = false;
  }
}

const effect = (fn: Function) => {
  const _effect = new ReactiveEffect(fn);

  _effect.run()
}
```

### 3. 保留实例和判断是否添加依赖

运行`run`函数前将当前运行环境的实例`this`保存至`activeEffect`实例中，`isTracking`函数判断是否可以收集依赖

```typescript{2,10,15,25-28}
let shouldTrack = false;
let activeEffect = void 0;  // 相当于undefined

class ReactiveEffect {
  constructor(public fn: Function) {}

  // 真正的运行环境
  run() {
    shouldTrack = true;
    activeEffect = this;

    this.fn()

    shouldTrack = false;
    activeEffect = undefined;
  }
}

const effect = (fn: Function) => {
  const _effect = new ReactiveEffect(fn);

  _effect.run()
}

// 判断是否可以添加依赖
const isTracking = () => {
  return shouldTrack && activeEffect !== undefined;
}
```

## 依赖收集和触发

依赖收集和触发指的是响应式数据如`ref`和`reactive`会维护一个依赖列表（订阅者列表），当数据发生变更时通知订阅者（触发`ReactiveEffect`的`run`函数）

### 1. 依赖收集
```ts{5,31-43}
let shouldTrack = false;
let activeEffect = void 0;  // 相当于undefined

class ReactiveEffect {
  private deps = [];  // 保存发布者依赖列表
  constructor(public fn: Function) {}

  // 真正的运行环境
  run() {
    shouldTrack = true;
    activeEffect = this;

    this.fn()

    shouldTrack = false;
    activeEffect = undefined;
  }
}

const effect = (fn: Function) => {
  const _effect = new ReactiveEffect(fn);

  _effect.run()
}

// 判断是否可以添加依赖
const isTracking = () => {
  return shouldTrack && activeEffect !== undefined;
}

/**
 * 依赖收集
 * @params dep 响应式变量的依赖列表
 */
const trackEffects = (dep: Set<any>) => {
  // 判断是否已添加实例
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);

    // 反过来也需要存放发布者的依赖列表地址
    (activeEffect as any).deps.push(dep);
  }
}

```

### 2. 触发依赖

当响应式数据发生变化时，需要逐一通知其订阅者，运行对应的函数

```ts{39-44}
let shouldTrack = false;
let activeEffect = void 0;  // 相当于undefined

class ReactiveEffect {
  private deps = [];
  constructor(public fn: Function) {}

  // 真正的运行环境
  run() {
    shouldTrack = true;
    activeEffect = this;

    this.fn()

    shouldTrack = false;
    activeEffect = undefined;
  }
}

const effect = (fn: Function) => {
  const _effect = new ReactiveEffect(fn);

  _effect.run()
}

// 判断是否可以添加依赖
const isTracking = () => {
  return shouldTrack && activeEffect !== undefined;
}

// 依赖收集
const trackEffects = (dep: Set<any>) => {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    (activeEffect as any).push(dep);
  }
}

// 触发依赖
export const triggerEffects = (dep: Set<any>) => {
  for (const effect of dep) {
    effect.run()
  }
};
```

## 收尾之作
当不再需要进行触发依赖时（退出了环境）

新增 `ReactiveEffect`类`active`成员变量进行控制

```ts{3,6-8}
class ReactiveEffect {
  ...
  private active = false;

  run () {
    if (!this.active) {
      return;
    }

    ...
  }

  ...
}
```
