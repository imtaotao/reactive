import { toRaw, reactive } from './reactive'
import { hasOwn, isArray, isSymbol, isObject } from './utils'
import { TrackOpTypes, TriggerOpTypes } from './operations'
import { track } from './effect'

function createSetter(isReadonly = false, shallow = false) {
  return function set(
    target,
    key,
    value,
    receiver
  ) {
    const oldValue = target[key]
    
    value = toRaw(value)

    const hadKey = hasOwn(target, key)
    const result = Reflect.set(target, key, value, receiver)
    // don't trigger if target is something up in the prototype chain of original
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        // 新增key
        trigger(target, TriggerOpTypes.ADD, key, value)
      } else if (hasChanged(value, oldValue)) {
        // 修改key
        trigger(target, TriggerOpTypes.SET, key, value, oldValue)
      }
    }
    return result
  }
}

function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    // if (isArray(target) && hasOwn(arrayInstrumentations, key)) {
    //   return Reflect.get(arrayInstrumentations, key, receiver)
    // }
    const res = Reflect.get(target, key, receiver)
    // 添加订阅
    track(target, TrackOpTypes.GET, key)
    // 如果取到的值是一个基本数据类型，则直接返回
    // 如果是个复杂数据类型，则返回一个Proxy对象
    return isObject(res) ? reactive(res) : res
  }
}

const get = createGetter();
const set = createSetter();
const deleteProperty;
const has;
const ownKeys;

export const mutableHandlers = {
  get,
  set,
  // deleteProperty,
  // has,
  // ownKeys,
}
