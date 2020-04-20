import { isArray } from './utils.js'
import { TriggerOpTypes } from './operations.js'

export let activeEffect = undefined
export const EMPTY_OBJ = {}

const effectStack = []
const targetMap = new WeakMap()
window.t = targetMap
export function isEffect(fn) {
  return fn && fn._isEffect === true
}

export function effect(fn, options = EMPTY_OBJ) {
  if (isEffect(fn)) {
    fn = fn.raw
  }
  const effect = createReactiveEffect(fn)
  effect()
  return effect
}

export function trigger(target, type, key, newValue, oldValue, oldTarget) {
  // 当前target的所有依赖
  const depsMap = targetMap.get(target)
  // 当前target还没有被追踪，不用更新
  if (depsMap === undefined) {
    return
  }

  const effects = new Set()
  const add = (effectsToAdd) => {
    if (effectsToAdd !== undefined) {
      effectsToAdd.forEach((effect) => effects.add(effect))
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

  if (isAddOrDelete) {
    add(depsMap.get(isArray(target) ? 'length' : ''))
  }

  const run = (effect) => {
    // if (effect.options.scheduler !== undefined) {
    //   effect.options.scheduler(effect)
    // } else {
    //   effect()
    // }
    effect()
  }

  // 执行刚才收集的effects
  effects.forEach(run)
}

export function track(target, type, key) {
  if (activeEffect === undefined) {
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

function createReactiveEffect(fn) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      cleanup(effect)
      try {
        effectStack.push(effect)
        activeEffect = effect
        return fn()
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length - 1]
      }
    }
  }
  effect._isEffect = true
  effect.raw = fn
  effect.deps = []
  return effect
}

function cleanup({ deps }) {
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}
