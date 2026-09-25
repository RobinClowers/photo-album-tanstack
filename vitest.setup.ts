import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest runs without `globals`, so Testing Library cannot register its own
// auto-cleanup; unmount rendered trees between tests here instead.
afterEach(() => {
  cleanup()
})

// jsdom's CSSOM silently drops declarations it cannot parse, such as
// `color: color-mix(in srgb, var(--x) 40%, black)`. Keep the raw text of
// every rule StyleX injects so `declaredStyle` (src/components/ui/test-utils)
// can still assert those values.
const rawRules: string[] = []
;(globalThis as { __rawCssRules?: string[] }).__rawCssRules = rawRules
if (typeof CSSStyleSheet !== 'undefined') {
  const insertRule = CSSStyleSheet.prototype.insertRule
  CSSStyleSheet.prototype.insertRule = function (rule, index) {
    rawRules.push(rule)
    return insertRule.call(this, rule, index)
  }
}
