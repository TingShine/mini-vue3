# 响应式

vue框架的核心特性之一就是响应式，vue是一个MVVM框架，即视图——模型双向绑定：更新数据，对应的视图随着更新；同时在视图更新，对应的数据模型也会随着更新。



## Ref

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

> 双向绑定可以通过`发布-订阅者`模式来实现，`.value`可以通过`class`的实例来实现，那么`ref()`函数返回的就是对应的实例

### 创建RefImf类

1. 第一步实现`.value`的特性

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

2. 第二步实现`value`值转化, 判断是否是`object`

``` typescript
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

3. 第三步实现依赖收集

当获取值时，要将其获取请求者加入依赖列表中，当自身的值发生变化时进行逐一通知，也就是`发布者——订阅`模式

``` typescript
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

### 依赖收集

我们需要模拟在`vue`框架下实现双向绑定的过程，这里我们使用`effect`函数来暂时替代，通过在函数内运行模拟环境，具体示例如下：

``` typescript
effect(() => {
  // 具体代码
})
```

要实现上述思路，需要我们在传入`effect`函数的参数也为函数`Fn`，在`Fn`运行前开始允许依赖收集，`Fn`结束后禁止依赖收集

1. 创建`ReactiveEffect`类和`effect`函数

```typescript
class ReactiveEffect {
  constructor(public fn: Function) {}
}

const effect = (fn: Function) => {
  return new ReactiveEffect(fn);
}
```

2. 模拟运行环境
```typescript
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
