const ESM_RE = /([\s;]|^)(import[\s'"*{]|export\b|import\.meta\b)/m

export function hasESMSyntax (code: string): boolean {
  return ESM_RE.test(code)
}

const CJS_RE = /([\s;]|^)(module.exports\b|exports\.|require\s*\(|global\b)/m
export function hasCJSSyntax (code: string): boolean {
  return CJS_RE.test(code)
}

export function detectSyntax (code: string) {
  const hasESM = hasESMSyntax(code)
  const hasCJS = hasCJSSyntax(code)

  return {
    hasESM,
    hasCJS,
    isMixed: hasESM && hasCJS
  }
}
