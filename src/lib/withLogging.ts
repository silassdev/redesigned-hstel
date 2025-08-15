import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { logEvent } from './logger'

/**

 *
 * @param handler  
 * @param context  
 */
export function withLogging(
  handler: NextApiHandler,
  context: string
): NextApiHandler {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const start = Date.now()
    await logEvent('DEBUG', `→ [${context}] ${req.method} ${req.url}`, context)

    try {
      await handler(req, res)
      await logEvent('INFO', `✔ [${context}] succeeded`, context)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'Unknown error'

      await logEvent('ERROR', `✖ [${context}] failed: ${message}`, context)
      throw err // rethrow so Next returns 500 if you didn't handle it below
    } finally {
      const ms = Date.now() - start
      await logEvent('DEBUG', `← [${context}] done in ${ms}ms`, context)
    }
  }
}
