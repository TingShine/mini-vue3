import { isObject } from "../shared";
import { track, trigger } from "./effect";
import { reactive, ReactiveFlags, reactiveMap, readonly, readonlyMap, shallowReadonlyMap } from "./reactive";

export const createGetter = (isReadonly = false, shallowReadonly = false) => {
  return (target, key, receiver) => {
    const isExistReactiveMap = () => key === ReactiveFlags.RAW && reactiveMap.get(target) === receiver
    const isExistReadonlyMap = () => key === ReactiveFlags.RAW && readonlyMap.get(target) === receiver
    const isExistShallowReadonlyMap = () => key === ReactiveFlags.RAW && shallowReadonlyMap.get(target) === receiver

    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (
      // 使用函数如果满足前面条件，后面可以不用计算取值
      isExistReactiveMap() ||
      isExistReadonlyMap() ||
      isExistShallowReadonlyMap()
    ) {
      return target
    }

    const result = Reflect.get(target, key, receiver);

    // readonly无法set，即无法trigger
    if (!isReadonly) {
      track(target, "get", key);
    }

    // shallowReadonly直接返回
    if (shallowReadonly) {
      return result
    }

    if (isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result)
    }

    return result
  }
}

export const createSetter = () => {
  return (target, key, value, receiver) => {
    const result = Reflect.set(target, key, value, receiver)
  
    // 触发依赖
    trigger(target, key);
  
    return result
  }
}

// reavtive
const get = createGetter()
const set = createSetter()
export const mutableHandlers = {
  get,
  set
}

// readonly
const readonlyGet = createGetter(true)
const readonlySet = (target, key) => {
  // readonly的对象不允许赋值
  console.warn(`Failed on key ${key}: target is readonly.`, target)

  return true
}
export const readonlyHandlers = {
  get: readonlyGet,
  set: readonlySet
}

// shallow
const shallowGet = createGetter(false, true)
const shallowReadonlySet = (target, key) => {
  console.warn(`Failed on key ${key}: target is readonly.`, target)

  return true
}
export const shallowReadonlyHandlers = {
  get: shallowGet,
  set: shallowReadonlySet
}