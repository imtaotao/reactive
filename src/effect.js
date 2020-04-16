import { TriggerOpTypes } from './operations'
import { isArray } from './utils'

export function isEffect(fn) {
  return fn && fn._isEffect === true
}

export function effect(fn, options) {
  if (isEffect(fn)) {
    fn = fn.raw
  }
  const effect = createReactiveEffect(fn, options)
  if (!options.lazy) {
    effect()
  }
  return effect

const effectStack = []
const targetMap = new WeakMap()
export let activeEffect
let shouldTrack = true
const trackStack = []

export function trigger(target, type, key, newValue, oldValue, oldTarget) {
  // 当前target的所有依赖
  const depsMap = targetMap.get(target)
  // 当前target还没有被追踪，不用更新
  if (depsMap === undefined) {
    // never been tracked
    return
  }

  const effects = new Set()

  const add = (effectsToAdd) => {
    if (effectsToAdd !== undefined) {
      effectsToAdd.forEach((effect) => {
        effects.add(effect)
      })
    }
  }

  // schedule runs for SET | ADD | DELETE
  if (key !== undefined) {
    // 收集待执行的 当前target的当前key的所有依赖项
    add(depsMap.get(key))
  }
  // also run for iteration key on ADD | DELETE | Map.SET
  const isAddOrDelete =
    type === TriggerOpTypes.ADD ||
    (type === TriggerOpTypes.DELETE && !isArray(target))
  if (isAddOrDelete || (type === TriggerOpTypes.SET && target instanceof Map)) {
    add(depsMap.get(isArray(target) ? 'length' : ''))
  }

  const run = (effect) => {
    effect()
  }

  // Important: computed effects must be run first so that computed getters
  // can be invalidated before any normal effects that depend on them are run.
  // computedRunners.forEach(run)
  // 执行刚才收集的effects
  effects.forEach(run)
}

export function track(target, type, key) {
  if (!shouldTrack || activeEffect === undefined) {
    return
  }
  // 该对象的所有依赖
  let depsMap = targetMap.get(target)
  // 如果该对象还没有依赖，则初始化一个空的
  if (depsMap === undefined) {
    targetMap.set(target, (depsMap = new Map()))
  }
  // 该对象具体某个key的依赖
  let dep = depsMap.get(key)
  // 如果该对象的某个key还没有依赖，则初始化空的
  if (dep === undefined) {
    depsMap.set(key, (dep = new Set()))
  }
  // 如果当前副作用还没添加到当前的key，则添加
  if (!dep.has(activeEffect)) {
    // 添加当前副作用回调到当前target的当前key的依赖集合
    dep.add(activeEffect)
    // 当前副作用可能有多个依赖，添加当前的key的集合到当前副作用的依赖里面
    // 完成双向依赖的过程
    activeEffect.deps.push(dep)
  }
}


function createReactiveEffect(fn, options) {
  const effect = function reactiveEffect(...args) {
    if (!effect.active) {
      return options.scheduler ? undefined : fn(...args)
    }
    if (!effectStack.includes(effect)) {
      cleanup(effect)
      try {
        enableTracking()
        effectStack.push(effect)
        activeEffect = effect
        return fn(...args)
      } finally {
        effectStack.pop()
        resetTracking()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  } as ReactiveEffect
  effect.id = uid++
  effect._isEffect = true
  effect.active = true
  effect.raw = fn
  effect.deps = []
  effect.options = options
  return effect
}