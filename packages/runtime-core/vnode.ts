import { ShapeFlags } from "../shared/shapeFlags"

export interface IVNode {
    el: any;
    component: any;
    key: any;
    type: any;
    props: any;
    children: string | any[] | undefined;
    shapeFlag: ShapeFlags;
}

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

const getShapeFlag = (type: any) => {
  return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

/**
 * 创建虚拟节点
 * @param type 节点类型
 * @param props 节点属性，包括传参数
 * @param children 节点子组件，为字符串时代表文本节点
 * @returns 虚拟节点virtual node
 */
export const createVNode = (type: any, props?: any, children?: string | Array<any>) => {
  const vnode = {
    el: null,
    component: null,
    key: props?.key,
    type,
    props: props || {},
    children,
    shapeFlag: getShapeFlag(type)
  }

  if (Array.isArray(children)) {
    vnode.shapeFlag = ShapeFlags.ARRAY_CHILDREN
  } else if (typeof children === 'string') {
    vnode.shapeFlag = ShapeFlags.TEXT_CHILDREN
  }

  normalizeChildren(vnode, children)

  return vnode;
}

export const normalizeChildren = (vnode, children) => {
  if (typeof children === 'object') {
    // slot 类型
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {

    } else {
      // component类型
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    }
  }
}

export const createTextVNode = (text: string = '') => {
  return createVNode(Text, {}, text);
}

