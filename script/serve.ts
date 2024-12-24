import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { logger } from 'hono/logger'
import { streamSSE } from 'hono/streaming'

import { watch } from 'fs/promises'
import Path from 'path'

import { PUBLIC_PATH, URL_PREFIX } from './config'

const SCOPE = URL_PREFIX + '*'
const SSE_SOURCE = '/sse'
const HOT_RELOAD_SCRIPT = 'script/hot-reload.js'

const removePrefix = (s: string, prefix: string) =>
  s.startsWith(prefix) ? s.slice(prefix.length) : null

function injectScript(html: string, script: string) {
  const where = html.indexOf('</head>')
  return html.slice(0, where) + `<script type="module">
    ${script}
  </script>` + html.slice(where)
}

function getHTMLBody(html: string) {
  const open = '<body>', close = '</body>'
  return html.slice(
    html.indexOf(open) + open.length,
    html.indexOf(close)
  ).trim()
}

const watcher = watch(PUBLIC_PATH)
const hotReloadScript = await Bun.file(HOT_RELOAD_SCRIPT).text()

const app = new Hono()
app.use(SCOPE, logger())

app.get(SSE_SOURCE + '/*', async c => streamSSE(c, async stream => {
  const targetFile = removePrefix(
    new URL(c.req.url).pathname,
    Path.join(SSE_SOURCE, URL_PREFIX) + '/'
  )
  for await (const event of watcher) {
    if (!event.filename) return
    if (event.filename === targetFile) {
      const bodyInnerHTML = getHTMLBody(
        await Bun.file(Path.join(PUBLIC_PATH, targetFile)).text()
      )
      await stream.writeSSE({
        event: 'updateHTML',
        data: bodyInnerHTML
      })
    }
  }
}))

app.get(SCOPE, async c => {
  const path = new URL(c.req.url).pathname
  const pathWithoutPrefix = removePrefix(path, URL_PREFIX)
  if (pathWithoutPrefix === null) return c.notFound()

  const file = Bun.file(Path.join(PUBLIC_PATH, pathWithoutPrefix))
  if (!await file.exists()) return c.notFound()

  c.header('Content-Type', file.type)
  const body = await file.text()

  if (file.type.includes('text/html')) {
    return c.body(injectScript(body, hotReloadScript))
  }

  return c.body(body)
})

import './watch.ts'

export default {
  fetch: app.fetch,
  idleTimeout: 0,
};
