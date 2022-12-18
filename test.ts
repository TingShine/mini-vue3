import { reactive } from './packages/reactive/reactive';
import { effect } from './packages/reactive/effect';

const form = reactive({
  count: 1
})

let calls = 0;

effect(() => {
  console.log('form.count ===>', form.count);
  calls++;
})

form.count += 1;
console.log('calls ===>', calls);

