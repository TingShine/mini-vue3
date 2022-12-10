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

从上述样例可以看出，`reactive`作为函数，参数为对象进行调用，返回一个变量，该变量仍然具有对象的特征