
import { createDep } from './dep';
import { ReactiveEffect } from './effect';
import { trackRefValue, triggerRefValue } from './ref';

export class ComputedRefImpl {
  public dep: any;
  public effect: ReactiveEffect;

  // 避免重复计算
  public _dirty: boolean;
  public _value;

  constructor(getter) {
    this._dirty = true;
    this.dep = createDep();
    this.effect = new ReactiveEffect(getter, () => {
      if (this._dirty) return;

      this._dirty = true;
      triggerRefValue(this);
    })
  }

  get value() {
    // 收集依赖
    trackRefValue(this);

    // 判断是否脏数据
    if (this._dirty) {
      this._dirty = false;
      this._value = this.effect.run();
    }

    return this._value;
  }
}

export const computed = (getter) => {
  return new ComputedRefImpl(getter);
}
