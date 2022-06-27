import { describe, it, expect } from 'vitest'
import { findExports } from '../src'

describe('findExports', () => {
  const tests = {
    'export function useA () { return \'a\' }': { name: 'useA', type: 'declaration' },
    'export const useD = () => { return \'d\' }': { name: 'useD', type: 'declaration' },
    'export { useB, _useC as useC }': { names: ['useB', 'useC'], type: 'named' },
    'export default foo': { type: 'default', name: 'default', names: ['default'] },
    'export { default } from "./other"': { type: 'default', name: 'default', names: ['default'], specifier: './other' },
    'export async function foo ()': { type: 'declaration', names: ['foo'] },
    'export const $foo = () => {}': { type: 'declaration', names: ['$foo'] },
    'export { foo as default }': { type: 'default', name: 'default', names: ['default'] },
    'export * from "./other"': { type: 'star', specifier: './other' },
    'export * as foo from "./other"': { type: 'star', specifier: './other', name: 'foo' }
  }

  for (const [input, test] of Object.entries(tests)) {
    it(input.replace(/\n/g, '\\n'), () => {
      const matches = findExports(input)
      expect(matches.length).to.equal(1)
      const match = matches[0]
      if (test.type) {
        expect(match.type).to.eql(test.type)
      }
      if (test.name) {
        expect(match.name).to.eql(test.name)
      }
      if (test.names) {
        expect(match.names).to.deep.eql(test.names)
      }
      if (test.specifier) {
        expect(match.specifier).to.eql(test.specifier)
      }
    })
  }
  it('handles multiple exports', () => {
    const matches = findExports(`
        export { useTestMe1 } from "@/test/foo1";
        export { useTestMe2 } from "@/test/foo2";
        export { useTestMe3 } from "@/test/foo3";
      `)
    expect(matches.length).to.eql(3)
  })

  it('works', () => {
    const code = `
import { pauseTracking, resetTracking, isRef, toRaw, isShallow as isShallow$1, isReactive, ReactiveEffect, ref, shallowReadonly, track, reactive, shallowReactive, trigger, isProxy, EffectScope, markRaw, proxyRefs, computed as computed$1, isReadonly } from '@vue/reactivity';
export { EffectScope, ReactiveEffect, customRef, effect, effectScope, getCurrentScope, isProxy, isReactive, isReadonly, isRef, isShallow, markRaw, onScopeDispose, proxyRefs, reactive, readonly, ref, shallowReactive, shallowReadonly, shallowRef, stop, toRaw, toRef, toRefs, triggerRef, unref } from '@vue/reactivity';
import { isString, isFunction, isPromise, isArray, NOOP, getGlobalThis, extend, EMPTY_OBJ, toHandlerKey, toNumber, hyphenate, camelize, isOn, hasOwn, isModelListener, hasChanged, remove, isObject, isSet, isMap, isPlainObject, invokeArrayFns, isBuiltInDirective, capitalize, isGloballyWhitelisted, def, isReservedProp, EMPTY_ARR, toRawType, makeMap, NO, normalizeClass, normalizeStyle } from '@vue/shared';
export { camelize, capitalize, normalizeClass, normalizeProps, normalizeStyle, toDisplayString, toHandlerKey } from '@vue/shared';
`
    const matches = findExports(code)
    expect(matches).to.have.lengthOf(2)
  })
})
