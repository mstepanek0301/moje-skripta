const SSE_SOURCE = '/sse'

const path = new URL(location.href).pathname

const eventSource = new EventSource(SSE_SOURCE + path)
eventSource.addEventListener('updateHTML', event => {
  document.body.innerHTML = event.data
})
eventSource.onerror = event => {
  console.error('SSE error:', event)
  eventSource.close()
}
