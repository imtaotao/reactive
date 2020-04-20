import { track, trigger } from './effect.js'
import { toRaw, reactive } from './reactive.js'
import { TrackOpTypes, TriggerOpTypes } from './operations.js'
import { hasOwn, isArray, isSymbol, isObject, hasChanged } from './utils.js'

const arrayInstrumentations = {}

['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
  arrayInstrumentations[key] = function(...args) {
    const arr = toRaw(this)
    for (let i = 0, l = (this).length; i < l; i++) {
      track(arr, TrackOpTypes.GET, i + '')
    }
    // we run the method using the original args first (which may be reactive)
    const res = arr[key](...args)
    if (res === -1 || res === false) {
      // if that didn't work, run it again using raw values.
      return arr[key](...args.map(toRaw))
    } else {
      return res
    }
  }
})


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
    if (isArray(target) && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver)
    }
    const res = Reflect.get(target, key, receiver)
    // 添加订阅
    track(target, TrackOpTypes.GET, key)
    // 如果取到的值是一个基本数据类型，则直接返回
    // 如果是个复杂数据类型，则返回一个Proxy对象
    return isObject(res) ? reactive(res) : res
  }
}

function deleteProperty(target, key) {
  const hadKey = hasOwn(target, key)
  const oldValue = target[key]
  const result = Reflect.deleteProperty(target, key)
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, undefined, oldValue)
  }
  return result
}

function has(target, key) {
  const result = Reflect.has(target, key)
  track(target, TrackOpTypes.HAS, key)
  return result
}

const get = createGetter();
const set = createSetter();
// const has;
// const ownKeys;

export const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has
  // ownKeys,
}
