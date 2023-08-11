import { camelize, hyphenate, toHandlerKey } from "../shared";
import { IComponentInstance } from "./component";

/**
 * 组件emit函数，向父组件传递事件和参数
 * @param {IComponentInstance} instance 组件实例
 * @param {String} eventName 事件名
 * @param rawArgs 传递给父组件的参数
 */
export const emit = (instance: IComponentInstance, eventName: string, ...rawArgs: any[]) => {
  const { props } = instance;

  let handler = props[toHandlerKey(camelize(eventName))]

  if (!handler) {
    handler = props[toHandlerKey(hyphenate(eventName))]
  }

  if (handler) {
    handler(...rawArgs);
  }
}