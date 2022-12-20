import { mutableHandlers } from "./basehandlers";

const targetMap = new WeakMap()

export enum ReactiveFlags {
  RAW = '_v_raw_',
  IS_REACTIVE = '_v_isReactive'
}

export function reactive (target) {
  return createReactiveObject(target, targetMap, mutableHandlers);
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