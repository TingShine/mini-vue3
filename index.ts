import { reactive } from './packages/reactive/reactive';
import { effect } from './packages/reactive/effect';

const form = reactive({
  count: 1
})

let calls = 0;

effect(() => {
  console.log(form);
  calls++
})

form.count = 2;
console.log(calls);
 