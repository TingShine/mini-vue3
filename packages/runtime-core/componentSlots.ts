import { ShapeFlags } from "../shared/shapeFlags";
import { IComponentInstance } from "./component";

export const initSlots = (instance: IComponentInstance, children) => {
  const { vnode } = instance
  
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, (instance.slots = {}))
  }
}

const normalizeSlotValue = (value) => {
  return Array.isArray(value) ? value : [value]
}

const normalizeObjectSlots = (rawSlots, slots) => {
  for (const key in rawSlots) {
    const value = rawSlots[key]

    if (typeof value === 'function') {
      slots[key] = (props) => normalizeSlotValue(value(props));
    }
  }
}