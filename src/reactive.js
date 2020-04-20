import { mutableHandlers } from './handlers.js'
import { isObject, makeMap, toRawType } from './utils.js'

const rawToReactive = new WeakMap()
const reactiveToRaw = new WeakMap()
const isObservableType = makeMap('Object,Array,Map,Set,WeakMap,WeakSet')
const nonReactiveValues = new WeakSet()

const canObserve = value => {
  return (
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
    let observed = toProxy.get(target)
    if (observed !== undefined) return observed
    if (toRaw.has(target)) return target
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