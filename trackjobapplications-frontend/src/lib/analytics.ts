declare global {
  function gtag(...args: unknown[]): void
}

export function trackPageView(path: string) {
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', { page_path: path })
  }
}
