"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hyphenate = exports.toHandlerKey = exports.capitalize = exports.hasOwn = exports.hasChanged = exports.isOn = exports.extend = exports.camelize = exports.isString = exports.isObject = void 0;
var isObject = function (val) {
    return val !== null && typeof val === "object";
};
exports.isObject = isObject;
var isString = function (val) { return typeof val === "string"; };
exports.isString = isString;
var camelizeRE = /-(\w)/g;
/**
 * @private
 * 把烤肉串命名方式转换成驼峰命名方式
 */
var camelize = function (str) {
    return str.replace(camelizeRE, function (_, c) { return (c ? c.toUpperCase() : ""); });
};
exports.camelize = camelize;
exports.extend = Object.assign;
// 必须是 on+一个大写字母的格式开头
var isOn = function (key) { return /^on[A-Z]/.test(key); };
exports.isOn = isOn;
function hasChanged(value, oldValue) {
    return !Object.is(value, oldValue);
}
exports.hasChanged = hasChanged;
function hasOwn(val, key) {
    return Object.prototype.hasOwnProperty.call(val, key);
}
exports.hasOwn = hasOwn;
/**
 * @private
 * 首字母大写
 */
var capitalize = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
exports.capitalize = capitalize;
/**
 * @private
 * 添加 on 前缀，并且首字母大写
 */
var toHandlerKey = function (str) {
    return str ? "on".concat((0, exports.capitalize)(str)) : "";
};
exports.toHandlerKey = toHandlerKey;
// 用来匹配 kebab-case 的情况
// 比如 onTest-event 可以匹配到 T
// 然后取到 T 在前面加一个 - 就可以
// \BT 就可以匹配到 T 前面是字母的位置
var hyphenateRE = /\B([A-Z])/g;
/**
 * @private
 */
var hyphenate = function (str) {
    return str.replace(hyphenateRE, "-$1").toLowerCase();
};
exports.hyphenate = hyphenate;
