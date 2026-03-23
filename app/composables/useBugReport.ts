export interface BugContext {
  screenshotDataUrl: string
  url: string
  title: string
  userAgent: string
  viewport: { width: number; height: number }
  timestamp: string
  consoleErrors: string[]
  visibleText: string
}

const consoleErrors: string[] = []
let interceptInstalled = false

function installConsoleInterceptor() {
  if (interceptInstalled || !import.meta.client) return
  interceptInstalled = true

  const originalError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    const msg = args.map(String).join(' ')
    if (!msg.startsWith('[Vue warn]')) {
      consoleErrors.push(msg.slice(0, 300))
      if (consoleErrors.length >= 20) consoleErrors.shift()
    }
    originalError(...args)
  }
}

export function clearCapturedErrors() {
  consoleErrors.length = 0
}

export function useBugReport() {
  installConsoleInterceptor()

  async function capture(): Promise<BugContext> {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      allowTaint: false,
      scale: 0.5,
      logging: false,
    })

    const mainEl = document.querySelector('main')
    const visibleText = (mainEl?.innerText || document.body.innerText || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000)

    return {
      screenshotDataUrl: canvas.toDataURL('image/jpeg', 0.7),
      url: window.location.href,
      title: document.title,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      timestamp: new Date().toISOString(),
      consoleErrors: [...consoleErrors].slice(-10),
      visibleText,
    }
  }

  return { capture, clearCapturedErrors }
}
