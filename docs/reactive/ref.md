# Ref

vue框架的核心特性之一就是响应式，vue是一个MVVM框架，即视图——模型双向绑定：更新数据，对应的视图随着更新；同时在视图更新，对应的数据模型也会随着更新。

## 实现分析

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

### 3. 模拟依赖收集和触发

当获取值时，要将其获取请求者加入依赖列表中，当自身的值发生变化时进行逐一通知，也就是`发布者——订阅`模式

``` typescript{5,12-13,18,23-24,28-30}
class RefImf {
  // 原始数据
  private _rawValue;
  private _value;
  public deps;

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

### 4. 思维导图

<img src="/images/ref.png">

## 依赖收集和触发

在上述教程中收集依赖使用的是`trackRef`，触发依赖使用的是`triggerRef`，参数都是自身的实例，在这个过程中我们需要与上一篇 [Effect](./effect.md) 挂钩。

我们使用`Effect`来作为订阅者，而`RefImf`作为发布者，当在`Effect`的参数函数中读取到`RefImf`的值时，`Effect`的`ReactiveEffect`实例作为依赖添加到`RefImf`的`deps`中，当`RefImf`的`value`值发生变化时，会通知`deps`的集合，具体的操作是遍历集合，依次调用依赖集合的实例的`run`函数，也就是运行`Effect`的副作用函数。

### 1. 依赖收集

首先，我们来实现`trackRef`函数，参数为`RefImf`实例：
```ts
export const trackRef = (instance: RefImf) => {
  if (isTracking()) {
    trackEffect(instance.deps)
  }
}
```

其中`isTracking`和`trackEffect`函数都已经在 [Effect](./effect.md) 篇章中实现，主要作用是判断是否可以添加依赖和收集依赖，其中判断是否重复添加依赖已经在`trackEffect`中实现



### 2. 触发依赖

当`RefImf`的`value`成员发生变更时，触发依赖是`triggerRef`函数，实现如下代码：
```ts
export const triggerRef = (instance: RefImf) => {
  triggerEffect(instance.deps)
}
```
同样，`triggerEffect`在 [Effect](./effect.md) 篇章中实现，这里就不再赘述

## 单元测试

单元测试使用`jest`进行测试，主要验证其基本的取值、赋值和响应式

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