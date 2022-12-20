import { track, trigger } from "./effect";
import { ReactiveFlags } from "./reactive";

const get = (target, key, reciever) => {
  // 获取原对象
  if (key === ReactiveFlags.RAW) {
    return target
  }

  // 获取是否为reactive对象
  if (key === ReactiveFlags.IS_REACTIVE) {
    return true
  }

  track(target, "get", key);

  return Reflect.get(target, key, reciever);
}
const set = (target, key, value, reciever) => {
  const result = Reflect.set(target, key, value, reciever)

  // 触发依赖
  trigger(target, key);

  return result
}

export const mutableHandlers = {
  get,
  set
}