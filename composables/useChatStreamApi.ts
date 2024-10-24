import { ref } from 'vue'

interface StreamResponse {
  status: boolean
  message: string
  data: {
    answer: string
    thread_id: string
    is_complete: boolean
    processing_time?: number
  }
}

export const useChatStreamApi = () => {
  

  const currentThreadId = ref<string | null>(null)

  const isStreaming = ref(false)

  const sendStreamMessage = async (
    message: string,
    onChunk: (text: string) => void,
    onComplete?: (response: StreamResponse) => void,
    onError?: (error: any) => void
  ) => {
    isStreaming.value = true

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          thread_id: currentThreadId.value
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Failed to get response reader')

      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const parsedChunk: StreamResponse = JSON.parse(line)
            
            if (parsedChunk.data) {

              if (parsedChunk.data.thread_id && !currentThreadId.value) {
                currentThreadId.value = parsedChunk.data.thread_id
              }

              
              if (parsedChunk.message === 'streaming' && parsedChunk.data.answer) {
                onChunk(parsedChunk.data.answer)
              }

            
              if (parsedChunk.message === 'complete' && parsedChunk.data.is_complete) {
                onComplete?.(parsedChunk)
              }
            }
          } catch (e) {
            console.error('Error parsing chunk:', e)
          }
        }
      }

    } catch (error) {
      console.error('Error in sendStreamMessage:', error)
      onError?.(error)
    } finally {
      isStreaming.value = false
    }
  }

  return {
    currentThreadId,
    isStreaming,
    sendStreamMessage
  }
}