import { GLOBAL_KEY_SYMBOL, RETRY_KEY_SYMBOL } from '@sigi/core'

export function restoreState() {
  const sigiStateContent = document.getElementById(GLOBAL_KEY_SYMBOL)?.textContent
  const sigiRetryContent = document.getElementById(RETRY_KEY_SYMBOL)?.textContent

  if (sigiStateContent) {
    window[GLOBAL_KEY_SYMBOL] = JSON.parse(sigiStateContent)
  }

  if (sigiRetryContent) {
    window[RETRY_KEY_SYMBOL] = JSON.parse(sigiRetryContent)
  }
}
