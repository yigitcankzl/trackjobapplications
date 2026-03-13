const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

declare global {
  interface Window {
    dataLayer: unknown[][]
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(args)
}

export function initGA() {
  if (!GA_ID) return

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(['js', new Date()])
  window.dataLayer.push(['config', GA_ID, { send_page_view: false }])
}

export function trackPageView(path: string) {
  if (!GA_ID) return
  gtag('config', GA_ID, { page_path: path })
}
