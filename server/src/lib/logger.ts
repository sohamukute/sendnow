type Level = 'INFO' | 'WARN' | 'ERROR'

function log(level: Level, context: string, message: string, data?: Record<string, unknown>): void {
  const timestamp = new Date().toISOString()
  const suffix = data ? ` ${JSON.stringify(data)}` : ''
  const line = `[${level}] ${timestamp} [${context}] ${message}${suffix}`
  if (level === 'ERROR') console.error(line)
  else if (level === 'WARN') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (ctx: string, msg: string, data?: Record<string, unknown>) => log('INFO', ctx, msg, data),
  warn: (ctx: string, msg: string, data?: Record<string, unknown>) => log('WARN', ctx, msg, data),
  error: (ctx: string, msg: string, data?: Record<string, unknown>) => log('ERROR', ctx, msg, data),
}
