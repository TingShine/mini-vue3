import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./basehandlers";

export const reactiveMap = new WeakMap()
export const readonlyMap = new WeakMap()
export const shallowReadonlyMap = new WeakMap()

export enum ReactiveFlags {
  RAW = '_v_raw_',
  IS_REACTIVE = '_v_isReactive',
  IS_READONLY = '_v_isReadonly'
}

export function reactive (target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers)
}

export function readonly (target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers)
}

export function shallowReadonly (target) {
  return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers)
}

export function createReactiveObject (target, proxyMap, baseHandlers) {
  const existPrpxy = proxyMap.get(target)
  if (existPrpxy) {
    return existPrpxy;
  }

  const proxy = new Proxy(target, baseHandlers)
  proxyMap.set(target, proxy)
  
  return proxy
}
