import { baseHandlers } from "./basehandlers";

const targetMap = new Map()

export enum ReactiveFlags {
  RAW = '_v_raw_',
  IS_REACTIVE = '_v_isReactive'
}

export function reactive (target) {
  return createReactiveObject(target);
}

export function createReactiveObject (target) {
  const existPrpxy = targetMap.get(target)
  if (existPrpxy) {
    return existPrpxy;
  }

  const proxy = new Proxy(target, baseHandlers)
  
  console.log(proxy);
  
  return proxy
}