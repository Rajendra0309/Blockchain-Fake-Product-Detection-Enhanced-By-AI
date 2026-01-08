export function parseQrText(text) {
  try {
    const obj = JSON.parse(text)
    if (obj && obj.productSN) return obj.productSN
  } catch {}
  return text
}
