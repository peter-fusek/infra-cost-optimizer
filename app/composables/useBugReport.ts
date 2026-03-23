export interface BugContext {
  url: string
  title: string
  userAgent: string
  viewport: { width: number; height: number }
  timestamp: string
  consoleErrors: string[]
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

  function captureContext(): BugContext {
    return {
      url: window.location.href,
      title: document.title,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      timestamp: new Date().toISOString(),
      consoleErrors: [...consoleErrors].slice(-10),
    }
  }

  return { captureContext, clearCapturedErrors }
}
