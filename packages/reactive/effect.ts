import { extend } from "../shared/index";
import { createDep } from "./dep";
import { RefImf } from "./ref";

let activeEffect = void 0; // 相当于undefined
let shouldTrack = false;

export class ReactiveEffect {
  deps = [];
  active = true;

  constructor(public fn: Function, public scheduler?) {}

  run() {
    if (!this.active) {
      return this.fn();
    }

    shouldTrack = true;
    activeEffect = this as any;

    const result = this.fn();

    shouldTrack = false;
    activeEffect = undefined;

    return result;
  }
}

const trackEffects = (dep: Set<any>) => {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    (activeEffect as any).deps.push(dep);
  }
};

export const trackRef = (ref: RefImf) => {
  if (isTracking()) {
    trackEffects(ref.dep);
  }
};

export const effect = (fn, options = {}) => {
  const _effect = new ReactiveEffect(fn);

  extend(_effect, options);
  _effect.run();

  const runner: any = _effect.run.bind(_effect);
  runner.effect = _effect;

  return runner;
};

export const isTracking = () => {
  return shouldTrack && activeEffect !== undefined;
};

export const triggerEffects = (dep) => {
  for (const effect of dep) {
    if (effect.scheduler) {
      // runtime-core 中使用 scheduler 实现 nextTick 逻辑
      effect.scheduler();
    } else {
      effect.run();
    }
  }
};

const targetMap = new WeakMap()

// reactive依赖收集
export const track = (target, type, key) => {
  // 判断是否需要收集
  if (!isTracking()) {
    return;
  }

  // 获取target对应的依赖关系Map
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  // 获取key对应的依赖关系Set
  let dep = depsMap.get(key)
  if (!dep) {
    dep = createDep()
    depsMap.set(key, dep);
  }

  console.log('track收集');
  
  trackEffects(dep);
}

// 触发reactive依赖
export const trigger = (target, type, key) => {
  const depsMap = targetMap.get(target)
  if (!depsMap) {
    return;
  } 

  const depSet = depsMap.get(key);
  if (!depSet) {
    return;
  }

  const deps = [...depSet];
  console.log('trigger 触发');
  
  triggerEffects(createDep(deps));
}
