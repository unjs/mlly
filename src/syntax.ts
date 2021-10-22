const ESM_RE = /([\s;]|^)(import[ '"{]|export\b)/m
export function hasESMSyntax (code: string): boolean {
  return ESM_RE.test(code)
}

const CJS_RE = /([\s;]|^)(module.exports\b|exports\.)/m
export function hasCJSSyntax (code: string): boolean {
  return CJS_RE.test(code)
}

export function detectSyntax (code: string): 'esm' | 'cjs' | 'mixed' | 'unknown' {
  const isESM = hasESMSyntax(code)
  const isCJS = hasCJSSyntax(code)

  if (isESM && isCJS) return 'mixed'
  if (isESM) return 'esm'
  if (isCJS) return 'cjs'

  return 'unknown'
}
