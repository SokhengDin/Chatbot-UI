<template>
  <div class="chat-interface bg-white rounded-lg shadow-md p-4">
    <div 
      ref="messagesContainer"
      class="messages-container h-96 overflow-y-auto mb-4 p-2"
    >
      <div 
        v-for="(msg, index) in messages" 
        :key="index" 
        class="mb-4"
      >
        <div :class="[
          'p-3 rounded-lg max-w-3/4',
          msg.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
        ]">
          <p :class="[
            msg.sender === 'user' ? 'text-blue-800' : 'text-gray-800',
            'whitespace-pre-wrap'
          ]">
            {{ msg.text }}
            <span v-if="msg.isTyping" class="typing-indicator">▋</span>
          </p>
          <img 
            v-if="msg.image" 
            :src="msg.image" 
            alt="Uploaded image" 
            class="mt-2 max-w-full h-auto rounded" 
          />
        </div>
        <p :class="[
          'text-xs mt-1',
          msg.sender === 'user' ? 'text-right' : 'text-left'
        ]">
          {{ msg.timestamp }}
        </p>
      </div>
    </div>

    <div class="input-container flex items-center bg-gray-100 rounded-lg p-2">
      <textarea
        v-model="userInput"
        @keydown.enter.prevent="handleEnterPress"
        placeholder="Type your message..."
        rows="1"
        class="flex-grow bg-transparent outline-none resize-none"
        :disabled="isLoading"
      />
      <button 
        @click="sendMessage" 
        :disabled="isLoading || !userInput.trim()"
        class="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
      >
        <svg 
          v-if="!isLoading" 
          xmlns="http://www.w3.org/2000/svg" 
          class="h-6 w-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
          />
        </svg>
        <svg 
          v-else 
          class="animate-spin h-6 w-6" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            class="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            stroke-width="4"
          />
          <path 
            class="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useChatStreamApi } from '~/composables/useChatStreamApi'

interface Message {
  sender: 'user' | 'bot'
  text: string
  timestamp: string
  image?: string
  isTyping?: boolean
  conversationId?: string
}

const userInput = ref('')
const messages = ref<Message[]>([
  { 
    sender: 'bot', 
    text: 'Hello! How can I help you today?', 
    timestamp: new Date().toLocaleTimeString() 
  }
])
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const { sendStreamMessage, currentThreadId } = useChatStreamApi()

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const handleEnterPress = (e: KeyboardEvent) => {
  if (e.shiftKey) return
  sendMessage()
}

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  isLoading.value = true
  const currentInput = userInput.value
  userInput.value = ''

  messages.value.push({
    sender: 'user',
    text: currentInput,
    timestamp: new Date().toLocaleTimeString(),
    conversationId: currentThreadId.value
  })
  await scrollToBottom()

  const botMessageIndex = messages.value.length
  messages.value.push({
    sender: 'bot',
    text: '',
    timestamp: new Date().toLocaleTimeString(),
    isTyping: true,
    conversationId: currentThreadId.value
  })
  await scrollToBottom()

  try {
    await sendStreamMessage(
      currentInput,
      // On chunk
      async (chunk: string) => {
        if (messages.value[botMessageIndex]) {
          messages.value[botMessageIndex].text += chunk
          messages.value[botMessageIndex].isTyping = true
          await scrollToBottom()
        }
      },
      // On complete
      async () => {
        if (messages.value[botMessageIndex]) {
          messages.value[botMessageIndex].isTyping = false
          await scrollToBottom()
        }
      },
      // On error
      async (error) => {
        console.error('Error sending message:', error)
        messages.value.push({
          sender: 'bot',
          text: 'Sorry, there was an error processing your message.',
          timestamp: new Date().toLocaleTimeString()
        })
        await scrollToBottom()
      }
    )
  } catch (error) {
    console.error('Error:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.typing-indicator {
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

textarea {
  max-height: 120px;
  min-height: 24px;
}
</style>