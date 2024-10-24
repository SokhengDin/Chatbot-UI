import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { message, threadId } = body

  const config = useRuntimeConfig()
  const apiUrl = config.public.apiUrl

  try {
    const response = await fetch(`${apiUrl}/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, threadId })
    })

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error in chat API:', error)
    return {
      success: 0,
      code: '1',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      data: null
    }
  }
})