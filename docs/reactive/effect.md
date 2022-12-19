# Effect

在创建响应式示例之前，我们需要有运行示例的"`vue环境`"，这里我们模拟vue3框架中的`watchEffect`为运行响应式的环境，创建`effect`运行环境

## 分析

要实现`watchEffect`的功能，我们需要进行依赖收集和触发依赖，先看下`watchEffect`的使用样例：

```vue
```