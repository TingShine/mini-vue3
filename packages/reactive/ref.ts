import { hasChanged, isObject } from "../shared";
import { createDep } from "./dep";
import { trackRef, triggerEffects } from "./effect";

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

export const createRef = (value) => {
  return new RefImf(value);
};

// Todo: 判断是object则嵌套reactive
const convert = (value) => value;

const triggerRef = (ref: RefImf) => {
  triggerEffects(ref.dep);
};
