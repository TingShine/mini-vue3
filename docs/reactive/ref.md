# Ref

vue框架的核心特性之一就是响应式，vue是一个MVVM框架，即视图——模型双向绑定：更新数据，对应的视图随着更新；同时在视图更新，对应的数据模型也会随着更新。

## 分析

通过使用`ref`双向绑定的vue单文件样例，来分析响应式数据需要实现的功能特性：
```vue
<template>
  <div> {{ count }} </div>
  <button @click="count += 1"></button>
</template>

<script setup>
import { ref, watchEffect } from 'vue'
const count = ref(0)
watchEffect(() => {
  console.log(count.value)
})
</script>
```

可以看到模板中count的值取自`count`变量，当点击按钮时改变了`count`的值，视图对数据进行了更新，同时页面上的数字也会跟着变化，也就是视图也随数据变化而变化

根据上述样例，我们可以得出`ref`的几个特点：
- 创建响应式数据时需要`ref()`函数进行包裹
- 在访问数据和赋值时需要添加`.value`
- 在模板视图中访问数据，视图和数据会双向绑定

::: tip
双向绑定可以通过`发布-订阅者`模式来实现，`.value`可以通过`class`的实例来实现，那么`ref()`函数返回的就是对应的实例
:::

## 创建RefImf类

### 1. 实现`.value`的特性

``` typescript
class RefImf {
  private _rawValue;

  constructor(initialValue) {
    this._rawValue = initialValue;
  }

  get value() {
    return _rawValue;
  }

  set value(newVal) {
    this._rawValue = newVal;
  }
}
```

### 2. 实现`value`值转化

 判断是否是`object`

``` typescript{8-9,18}
class RefImf {
  // 原始数据
  private _rawValue;
  private _value;

  constructor(initialValue) {
    this._rawValue = initialValue;
    // convert函数对value转化
    this._value = convert(this._rawValue);
  }

  get value() {
    return _value;
  }

  set value(newVal) {
    this._rawValue = newVal;
    this._value = convert(this._rawValue)
  }
}
```

### 3. 模拟依赖收集

当获取值时，要将其获取请求者加入依赖列表中，当自身的值发生变化时进行逐一通知，也就是`发布者——订阅`模式

``` typescript{5,12-13,18,23-24,28-30}
class RefImf {
  // 原始数据
  private _rawValue;
  private _value;
  private deps;

  constructor(initialValue) {
    this._rawValue = initialValue;
    // convert函数对value转化
    this._value = convert(this._rawValue);

    // 初始化时设置依赖列表
    this.deps = createDep()
  }

  get value() {
    // 收集依赖
    trackRef(this);
    return _value;
  }

  set value(newVal) {
    // 原始值发生变化时
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = convert(this._rawValue);

      // 触发依赖通知
      triggerRef(this);
    }
  }
}
```

`RefImf`类中的`deps`是依赖列表，可以理解为订阅者的列表，在这里我们需要设置一个集合，将订阅者添加到其中，对应的`createDep`实现如下:

``` typescript
const createDep = (effects?: any) => {
  return new Set(effects);
};
```

在代码中我们可以看到`trackRef`用于依赖收集，`triggerRef`用于在改变值的时候通知订阅者，映射到实际场景中就是在视图模板中引用到了数据的时候，响应式数据进行依赖收集，当数据变化时通知视图，视图改变数据时直接修改`RefImf`实例中的值

## 依赖收集和触发

我们需要模拟在`vue`框架下实现双向绑定的过程，这里我们使用`effect`函数来暂时替代，通过在函数内运行模拟环境，具体示例如下：

``` typescript
effect(() => {
  // 具体代码
})
```

要实现上述思路，需要我们在传入`effect`函数的参数也为函数`Fn`，在`Fn`运行前开始允许依赖收集，`Fn`结束后禁止依赖收集

### 1. 创建`ReactiveEffect`类和`effect`函数

```typescript
class ReactiveEffect {
  constructor(public fn: Function) {}
}

const effect = (fn: Function) => {
  return new ReactiveEffect(fn);
}
```

### 2. 模拟运行环境
```typescript{1,6-12,17}
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

### 3. 判断是否可以添加依赖

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

### 4. 依赖收集

```ts{5,31-36,38-44}
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

// 收集Ref的依赖
const trackRef = (ref: RefImf) => {
  if (isTracking()) {
    trackEffects(ref.deps);
  }
}

// 依赖收集
const trackEffects = (dep: Set<any>) => {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    (activeEffect as any).push(dep);
  }
}

```
我们可以看到`trackRef`函数是在获取`ref`数据的时候开始进行依赖的收集，首先判断是否可以收集依赖，判断可以后调用`trackEffects`函数将依赖`RefImf.deps`添加进`ReactiveEffect.deps`中

::: details 辅助理解
可以将`ReactiveEffec`的实例看作vue3中的`watchEffect`函数，其`deps`数组存放着响应性数据的依赖关系
:::

### 5. 触发依赖

当响应式数据发生变化时，需要逐一通知其订阅者，运行对应的函数

```ts{46-49,51-56}
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

// 收集Ref的依赖
const trackRef = (ref: RefImf) => {
  if (isTracking()) {
    trackEffects(ref.deps);
  }
}

// 依赖收集
const trackEffects = (dep: Set<any>) => {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    (activeEffect as any).push(dep);
  }
}

// ref值变化，触发依赖
const triggerRef = (ref: RefImf) => {
  triggerEffects(ref.deps);
};

// 触发依赖
export const triggerEffects = (dep: Set<any>) => {
  for (const effect of dep) {
    effect.run()
  }
};
```

### 6. 收尾之作
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

## 单元测试

```ts
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

```