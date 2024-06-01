const status = document.querySelector<HTMLElement>('#status')
export function setClangdStatus(
  status: 'ready' | 'indeterminate' | 'disabled'
): void
export function setClangdStatus(value: number, max: number): void
export function setClangdStatus(strOrVal: string | number, max?: number) {
  if (!status) return
  if (typeof strOrVal === 'number') {
    status.removeAttribute('data-ready')
    status.removeAttribute('data-disabled')
    status.removeAttribute('data-indeterminate')
    max = !max ? 97077187 : max
    status.style.setProperty('--progress', `${Math.min(strOrVal, max) / max}`)
  } else if (strOrVal === 'ready') {
    status.setAttribute('data-ready', '')
    status.removeAttribute('data-disabled')
    status.removeAttribute('data-indeterminate')
  } else if (strOrVal === 'disabled') {
    status.removeAttribute('data-ready')
    status.setAttribute('data-disabled', '')
    status.removeAttribute('data-indeterminate')
  } else if (strOrVal === 'indeterminate') {
    status.removeAttribute('data-ready')
    status.removeAttribute('data-disabled')
    status.setAttribute('data-indeterminate', '')
  }
}
