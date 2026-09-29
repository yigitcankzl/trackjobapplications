const SAFE_PROTOCOLS = ['http:', 'https:']

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return SAFE_PROTOCOLS.includes(parsed.protocol)
  } catch {
    return false
  }
}

/** Row/card click: Ctrl/Cmd+click or middle click opens the application in a new tab, a plain click navigates. */
export function openApplication(e: React.MouseEvent, id: number, navigate: (path: string) => void) {
  const path = `/applications/${id}`
  if (e.ctrlKey || e.metaKey || e.button === 1) window.open(path, '_blank', 'noopener')
  else navigate(path)
}
