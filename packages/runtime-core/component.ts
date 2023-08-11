import { shallowReadonly } from "../reactive";
import { proxyRefs } from "../reactive/ref";
import { emit } from "./componentEmits";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";

export interface IComponentInstance {
    type: any;
    vnode: any;
    next: null;
    props: {};
    providers: any;
    proxy: null;
    isMounted: boolean;
    attrs: {};
    slots: {};
    ctx: { _?: IComponentInstance };
    setupState: {};
    emit: () => void;
    render?: Function;
    [x: string]: any;
}

let currentInstance = {};

export const getCurrentInstance = () => currentInstance

export const createComponentInstance = (vnode, parent): IComponentInstance => {
  const instance: IComponentInstance = {
    type: vnode.type,
    vnode,
    next: null,
    props: {},
    providers: parent ? parent.providers : {},
    proxy: null,
    isMounted: false,
    attrs: {},
    slots: {},
    ctx: {},
    setupState: {},
    emit: () => {}
  }

  instance.ctx = {
    _: instance
  }

  instance.emit = emit.bind(null, instance) as any;

  return instance;
}

export const setupComponent = (instance: IComponentInstance) => {
  const { props, children } = instance.vnode;
  initProps(instance, props);
  initSlots(instance, children);

  setupStatefulComponent(instance);
}

export const setupStatefulComponent = (instance) => {
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)

  const Component = instance.type
  const { setup } = Component

  if (setup) {
    // setup函数中可以获取当前instance，所以必须提前设置当前的instance
    setCurrentInstance(instance);

    const setupContext = createSetupContext(instance);
    const setupResult = setup && setup(shallowReadonly(instance.props), setupContext)

    setCurrentInstance(null);

    handleSetupResult(instance, setupResult);
  } else {
    finishComponentSetup(instance);
  }
}


/**
 * 创建setup函数的第二入参
 * @param instance 当前组件实例
 */
const createSetupContext = (instance) => {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {}
  }
}

const setCurrentInstance = (instance) => {
  currentInstance = instance;
}

const handleSetupResult = (instance: IComponentInstance, setupResult) => {
  if (typeof setupResult === "function") {
    instance.render = setupResult
  } else if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

const finishComponentSetup = (instance: IComponentInstance) => {
  const Component = instance.type;
  const { template } = Component;

  if (!instance.render) {
    if (!Component.render) {
      // Component.render = compile(template);
    }
  }

  instance.render = Component.render;
}