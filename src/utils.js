export const isArray = Array.isArray
export const isFunction = val => typeof val === 'function'
export const isString = val => typeof val === 'string'
export const isSymbol = val => typeof val === 'symbol'
export const isObject = val => val !== null && typeof val === 'object'

export const isPromise = val => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}

export const objectToString = Object.prototype.toString
export const toTypeString = value => objectToString.call(value)

export const toRawType = value => {
  return toTypeString(value).slice(8, -1)
}

export const isPlainObject = val => toTypeString(val) === '[object Object]'

export function makeMap(str, expectsLowerCase) {
  const map = Object.create(null)
  const list = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val]
}

const hasOwnProperty = Object.prototype.hasOwnProperty
export const hasOwn = (val,key) => hasOwnProperty.call(val, key)
