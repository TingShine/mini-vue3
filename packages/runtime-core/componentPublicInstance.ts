import { hasOwn } from "../shared";
import { IComponentInstance } from "./component";

const publicPropertiesMap = {
  $el: (i) => i.vnode.el,
  $emit: (i) => i.emit,
  $slots: (i) => i.slots,
  $props: (i) => i.props
}

export const PublicInstanceProxyHandlers = {
  get({ _: instance }, key: string) {
    const { setupState, props } = instance as IComponentInstance;
    
    console.log(`触发proxy hook, key => ${key}`);
    
    if (!key.startsWith('$')) {
      if (hasOwn(setupState, key)) {
        return setupState[key];
      } else if (hasOwn(props, key)) {
        return props[key];
      }
    }

    const publicGetter = publicPropertiesMap[key];

    if (publicGetter) {
      return publicGetter[key];
    }

    return undefined;
  },
  set({ _: instance, key, value }) {
    const { setupState } = instance as IComponentInstance;

    if (hasOwn(setupState, key)) {
      setupState[key] = value;
    }

    return true;
  }
}