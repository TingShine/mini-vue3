import { Nullable } from "vitest";
import { Fragment, IVNode, Text } from "./vnode";
import { ShapeFlags } from "../shared/shapeFlags";

export const createRenderer = (options) => {
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setText: hostSetText,
    createText: hostCreateText
  } = options;

  const render = (vnode, container) => {
    patch(null, vnode, container)
  }

  /**
   * 对比前后的虚拟节点vnode，根据diff结果挂载到对应dom上渲染，这里是工厂函数
   * @param vnode1 旧虚拟节点，null代表新增节点
   * @param vnode2 新虚拟节点
   * @param container 要挂载的dom对象
   * @param anchor 
   * @param patchComponent 
   */
  const patch = (vnode1: Nullable<IVNode>, vnode2: IVNode, container = null, anchor = null, patchComponent = null) => {
    const { type, shapeFlag } = vnode2

    switch (type) {
      case Text:
        processText(vnode1, vnode2, container)
        break;

      case Fragment:
        processFragment(vnode1, vnode2, container);
        break;

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode1, vnode2,  anchor, container, patchComponent);
        }
    }
  }

  /** 处理文本节点 */
  const processText = (vnode1: Nullable<IVNode>, vnode2: IVNode, container = null) => {
    if (vnode1 === null) {
      hostInsert((vnode2.el = hostCreateText(vnode2.children as string)), container)
    } else {
      const el = (vnode2.el = vnode1!.el)
      // 对比文本是否一样，如若vnode1不为文本节点则会直接更新
      if (vnode2.children !== vnode1!.children) {
        hostSetText(el, vnode2.children as string);
      }
    }
  }

  /** 处理切片节点 */
  const processFragment = (vnode1: Nullable<IVNode>, vnode2: IVNode, container = null) => {
    if (!vnode1) {
      mountChildren(vnode2, container);
    }
  }

  /**
   * 挂载子组件到对应dom下
   * @param children 子组件
   * @param container 挂载的dom对象
   */
  const mountChildren = (children, container) => {
    children.forEach((VNodeChild) => {
      patch(null, VNodeChild, container)
    });
  }

  const processElement = (vnode1: Nullable<IVNode>, vnode2: IVNode, anchor, container, parentComponent) => {
    if (!vnode1) {
      mountElement(vnode2, container, anchor);
    } else {
      updateElement(vnode1!, vnode2, container, anchor, parentComponent);
    }
  }

  /**
   * 挂载虚拟节点vnode到对应dom下
   * @param vnode 
   * @param container 
   * @param anchor 
   */
  const mountElement = (vnode: IVNode, container, anchor) => {
    const { shapeFlag, props } = vnode

    const el = (vnode.el = hostCreateElement(vnode.type));

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el);
    }

    if (props) {
      for (const key in props) {
        const nextVal = props[key]
        hostPatchProp(el, key, null, nextVal)
      }
    }
  }

  const updateElement = (vnode1: IVNode, vnode2: IVNode, container, anchor, parentComponent) => {
    const oldProps = (vnode1 && vnode1.props) || {}
    const newProps = vnode2.props || {}

    const el = (vnode2.el = vnode1.el)

    patchProps(el, oldProps, newProps)

    patchChildren(vnode1, vnode2, container, anchor, parentComponent)
  }

  /**
   * 比对props的值，决定是否更新组件
   * @param el 要更新的组件
   * @param oldProps 旧props
   * @param newProps 新props
   */
  const patchProps = (el, oldProps, newProps) => {
    // 对比props有三种情况

    // 1. old和new都有相同的key，但value值变化了
    // 2. new有key， old没有
    for (const key in newProps) {
      const prevVal = oldProps[key]
      const nextVal =  newProps[key]

      if (prevVal !== nextVal) {
        // 交给host更新对应的key
        hostPatchProp(el, key, prevVal, nextVal)
      }
    }

    // 3. oldProps 有key， newProps没有
    for (const key in oldProps) {
      const prevVal = oldProps[key]
      const nextVal =  null

      if (!(key in newProps)) {
        hostPatchProp(el, key, prevVal, nextVal)
      }
    }
  }

  const patchChildren = (vnode1: IVNode, vnode2: IVNode, container, anchor, parentComponent) => {
    const { shapeFlag: prevShapeFlag, children: c1 } = vnode1
    const { shapeFlag: newShapeFlag, children: c2 } = vnode2
    
    if (newShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (c2 !== c1) {
        hostSetElementText(container, c2 as string)
      }

      return;
    }
    
    if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(container, '')
      mountChildren(c2, container)

      return;
    }

    patchKeyedChildren(c1 as any[], c2 as any[], container, parentComponent, anchor)
  }

  /**
   * 对比具有key值的children组件，一般用于v-for场景下
   * @param c1 旧vnode数组
   * @param c2 新vnode数组
   * @param container 挂载的dom容器
   * @param parentAnchor 
   * @param parentComponent 父组件实例
   */
  const patchKeyedChildren = (c1: any[], c2: any[], container, parentAnchor, parentComponent) => {
    let index = 0;
    let l1 = c1.length - 1
    let l2 = c2.length - 1

    // 判断是否相同的vnode
    const isSameVNode = (v1: IVNode, v2: IVNode) => v1.type === v2.type && v1.key === v2.key;
    
    // 从左到右
    // 有两种情况退出循环
    // 1. 索引超出l1或l2的长度
    // 2. 遇到两个节点不是同类型的节点或key值不相同
    while (index <= l1 && index <= l2) {
      const prevChild = c1[index];
      const nextChild = c2[index];

      // 两个节点不是同个vnode
      if (!isSameVNode(prevChild, nextChild)) {
        break;
      }

      // 两个vnode相同，对比子child
      patch(prevChild, nextChild, container, parentAnchor, parentComponent);
      index++;
    }                                                                                                                                                                    

    // 从右向左
    // 与上面情况类似的场景退出循环
    while (index <= l1 && index <= l2) {
      const prevChild = c1[l1];
      const nextChild = c2[l2];

      if (!isSameVNode(prevChild, nextChild)) {
        break;
      }

      patch(prevChild, nextChild, container, parentAnchor, parentComponent);

      l1--;
      l2--;
    }

    // 经过上述两个步骤，剩下以下几种场景:
    // 1. 新旧children的长度不一致
    // 2. 存在不相同的vnode中断了循环

    // 旧children长度比较短
    if (index > l1 && index <= l2) {
      const nextPos = l2 + 1;
      const anchor = nextPos < c2.length ? c2[nextPos].el : parentAnchor
      // 插入新节点
      while (index <= l2) {
        patch(null, c2[index], container, anchor, parentComponent)
        index++;
      }
    } else if (index > l2 && index <= l1) {
      // 删除旧节点
      while (index <= l1) {
        hostRemove(c1[index].el)
        index++;
      }
    } else {
      // 中间顺序变动

      let s1 = index;
      let s2 = index;
      const keyToNewIndexMap = new Map();
      let moved =false;
      let maxNewIndexSoFar = 0;

      // 将新节点数组中间部分的索引和key值组成的map存储起来
      for (let i = s2; i <= l2; i++) {
        keyToNewIndexMap.set(c2[i].key, i)
      }

      // 需要处理新节点数量
      const toBePatched = l2 - s2 + 1;
      let patched = 0;
      // 新索引与旧索引的映射
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);

      // 遍历旧节点中间部分
      for (let i = s1; i <= l1; i++) {
        const prevChild = c1[i];

        let newIndex: number | undefined;

        if (prevChild.key != null) {
          // 旧节点的key值存在，在新节点中找到相同key值的索引
          newIndex = keyToNewIndexMap.get(prevChild!.key)
        } else {
          // 旧节点的key值不存在
          for (let j = s2; j <= l2; j++) {
            // 判断vnode.type相等，同时新节点的key值也不存在时则认为相同
            if (isSameVNode(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }

        // 没找到与旧节点相匹配的新节点
        if (newIndex === undefined) {
          // 删除节点
          hostRemove(prevChild.el)
        } else {
          // 新旧节点存在且相匹配，存下在旧节点的索引+1，加一的目的是为了不等于初始值0，代表找得到
          newIndexToOldIndexMap[newIndex - s2] = i + 1;

          if (newIndex >=  maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }

          patch(prevChild, c2[newIndex], container, null, parentComponent);
          patched++;
        }
      }

      // 经过上面的步骤，已经获取newIndexToOldIndexMap新节点的旧索引映射
      // 根据newIndexToOldIndexMap分析，存在两种情况
      // 1. 新节点在旧节点中没有匹配的，在数组中值为0
      // 2. 新节点在旧节点中匹配，值为旧节点的索引+1，同时已经经过了patch

      // 使用最长递增子序列来优化移动逻辑
      // 通过moved来优化，没有移动时则不需要执行算法
      const increasingNewIndexSequence: number[] = moved ? getSequenceIndexs(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;

      // 遍历新节点
      for (let i = toBePatched; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];

        // 锚点等于当前节点索引+1
        // 也就是当前节点的后面一个节点
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;

        if (newIndexToOldIndexMap[i] === 0) {
          // 说明新节点在旧节点中不存在
          // 创建
          patch(null, nextChild, container, anchor, parentComponent)
        } else if (moved) {
          // 需要移动
          // 最长子序列索引中的值和当前的值匹配不上
          if (j < 0 || increasingNewIndexSequence[j] !== i) {
            // 移动的话使用insert
            hostInsert(nextChild.el, container, anchor)
          } else {
            // 命中，index 和最长递增子序列的值
            // 可以移动指针
            j--;
          }
        }
      }
    }
  }

  const updateComponent = (n1, n2, container) => {
    
  }
}

/**
 * 最长递增子序列算法，时间复杂度O(n^2)
 * @param {number[]} arr 要判断的数组
 * @returns 递增序列的索引数组
 */
export function getSequenceIndexs(arr: number[]): number[] {
  if (!arr.length) {
    return [];
  }

  // 最优解数组
  const dp: number[] = new Array(arr.length).fill(0);
  dp[0] = 1;
  let maxDep = 1;
  let maxDepIndex = 0;

  // 计算最大dep和其索引
  // 最优解dp数组计算完成
  for (let i = 1; i < arr.length; i++) {
    let max = 0;
    const num = arr[i];
    for (let j = 0; j < i; j++) {
      if (num > arr[j]) {
        max = Math.max(max, dp[j])
      }
    }
    dp[i] = max + 1;

    if (dp[i] > maxDep) {
      maxDep = dp[i];
      maxDepIndex = i;
    }
  }

  const indexs: number[] = [];
  let index = maxDepIndex;
  while (index > 0 && maxDep >= 0) {
    if (dp[index] === maxDep) {
      indexs.push(index);
      maxDep--;
    }

    index--;
  }

  return indexs.reverse();
}

