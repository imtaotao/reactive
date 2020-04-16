import { isObject, makeMap } from './utils'
import { mutableHandlers } from './handlers'

const rawToReactive = new WeakMap()
const reactiveToRaw = new WeakMap()
const isObservableType = makeMap('Object,Array,Map,Set,WeakMap,WeakSet')
const nonReactiveValues = new WeakSet()

const canObserve = value => {
  return (
    !value._isVue &&
    !value._isVNode &&
    isObservableType(toRawType(value)) &&
    !nonReactiveValues.has(value) &&
    !Object.isFrozen(value)
  )
}

export function reactive(target) {
  return createReactiveObject(
    target,
    rawToReactive,
    reactiveToRaw,
    mutableHandlers
  )
}

function createReactiveObject(target, toProxy, toRaw, baseHandlers) {
    if (!isObject(target)) return target
    // target already has corresponding Proxy
    let observed = toProxy.get(target)
    if (observed !== undefined) return observed
    // target is already a Proxy
    if (toRaw.has(target)) return target
    // only a whitelist of value types can be observed.
    if (!canObserve(target)) {
      return target
    }
    const handlers = baseHandlers
    observed = new Proxy(target, handlers)
    toProxy.set(target, observed)
    toRaw.set(observed, target)
    return observed
}

export function toRaw(observed) {
  return reactiveToRaw.get(observed) || observed
}