import { defineEventHandler, readBody, sendStream, createError } from 'h3'
import { Readable } from 'stream'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { message, thread_id } = body

  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl

  try {
    const response = await fetch(`${apiUrl}/assistant/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, thread_id })
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `API request failed with status ${response.status}`
      })
    }

    setResponseHeaders(event, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    const stream = Readable.from(response.body!)

    return sendStream(event, stream)

  } catch (error) {
    console.error('Error in chat stream API:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    })
  }
})