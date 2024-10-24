import { ref } from 'vue'

export const useChatApi = () => {
  const threadId = ref<string | null>(null)

  const sendMessage = async (message: string) => {
    const options = {
      method: 'POST',
      body: JSON.stringify({ 
        message: message,
        threadId: threadId.value
      })
    }

    try {
      const { data, error } = await useFetch('/api/chat', options)

      if (error.value) {
        console.error('Error sending message:', error.value)
        throw new Error('Failed to send message')
      }

      if (data.value?.success === 1 && data.value.data) {
        threadId.value = data.value.data.threadId
        return data.value.data
      } else {
        throw new Error(data.value?.message || 'Unknown error occurred')
      }
    } catch (e) {
      console.error('Error in sendMessage:', e)
      throw e
    }
  }

  return {
    sendMessage
  }
}