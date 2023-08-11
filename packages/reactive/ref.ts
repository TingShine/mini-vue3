import { hasChanged, isObject } from "../shared";
import { ComputedRefImpl } from "./computed";
import { createDep } from "./dep";
import { isTracking, trackRef, triggerEffects, trackEffects} from "./effect";

export class RefImf {
  private _rawValue: any;
  private _value: any;
  public dep;
  public _v_isRef = true;

  constructor(value) {
    this._rawValue = value;
    this._value = convert(value);
    this.dep = createDep();
  }

  get value() {
    trackRef(this);
    return this._value;
  }

  set value(newVal) {
    if (hasChanged(newVal, this._rawValue)) {
      this._value = convert(newVal);
      this._rawValue = newVal;

      triggerRef(this);
    }
  }
}

export const ref = (value) => {
  return createRef(value);
};

export function isRef(value) {
  return !!value.__v_isRef;
}

export const unRef = (ref) => {
  return isRef(ref) ? ref.value : ref;
}

export const createRef = (value) => {
  return new RefImf(value);
};

// Todo: 判断是object则嵌套reactive
const convert = (value) => value;

const triggerRef = (ref: RefImf) => {
  triggerEffects(ref.dep);
};

export const trackRefValue = (ref: RefImf | ComputedRefImpl) => {
  if (isTracking()) {
    trackEffects(ref.dep)
  }
}

export const triggerRefValue = (ref: RefImf | ComputedRefImpl) => {
  if (isTracking()) {
    triggerEffects(ref.dep);
  }
}

const shallowUnwrapHandlers = {
  get(target, key, receiver) {
    return unRef(Reflect.get(target, key, receiver));
  },
  set(target, key, value, receiver) {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      return (target[key].value = value);
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  },
};

export const proxyRefs = (objectWidthRefs) => {
  return new Proxy(objectWidthRefs, shallowUnwrapHandlers)
}
