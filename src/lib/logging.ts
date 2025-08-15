import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { logEvent } from '@/lib/logger'

export function withLogging(
  handler: NextApiHandler,
  context: string
): NextApiHandler {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const start = Date.now()
    await logEvent('DEBUG', `→ ${context} called [${req.method}]`, context)

    try {
      await handler(req, res)
      await logEvent('INFO', `✔ ${context} succeeded [${req.method}]`, context)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      await logEvent('ERROR', `✖ ${context} error: ${message}`, context)
      throw err
    } finally {
      const ms = Date.now() - start
      await logEvent('DEBUG', `← ${context} done in ${ms}ms`, context)
    }
  }
}