<!-- components/ChatInterface.vue -->
<template>
  <div class="chat-interface bg-white rounded-lg shadow-lg flex flex-col h-[calc(100vh-12rem)]">
    <!-- Header with title -->
    <div class="px-4 py-3 border-b border-gray-200">
      <div class="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <h2 class="text-lg font-semibold text-gray-800">Chat Assistant</h2>
      </div>
    </div>

    <!-- Messages container -->
    <div class="messages-container flex-1 overflow-y-auto p-4">
      <div v-for="(msg, index) in messages" :key="index" class="mb-4">
        <div :class="[
          'p-3 rounded-lg max-w-3/4',
          msg.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
        ]">
          <p :class="msg.sender === 'user' ? 'text-blue-800' : 'text-gray-800'">
            {{ msg.text }}
          </p>
          <img v-if="msg.image" :src="msg.image" alt="Uploaded image" class="mt-2 max-w-full h-auto rounded" />
        </div>
        <p :class="[
          'text-xs mt-1',
          msg.sender === 'user' ? 'text-right' : 'text-left'
        ]">
          {{ msg.timestamp }}
        </p>
      </div>
    </div>

    <!-- Input container -->
    <div class="input-container bg-gray-50 p-4 border-t border-gray-200">
      <div class="flex items-center space-x-3">
        <input
          v-model="userInput"
          @keyup.enter="sendMessage"
          type="text"
          placeholder="Type your message..."
          class="flex-grow bg-white rounded-lg px-4 py-2 outline-none border border-gray-300 focus:border-blue-500 transition duration-300"
          :disabled="isLoading"
        />
        <label class="cursor-pointer">
          <input
            type="file"
            @change="handleFileUpload"
            accept="image/*"
            class="hidden"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500 hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </label>
        <button 
          @click="sendMessage" 
          :disabled="isLoading" 
          class="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition duration-300 disabled:opacity-50"
        >
          <svg v-if="!isLoading" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <svg v-else class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatApi } from '~/composables/useChatApi'

const userInput = ref('')
const messages = ref([
  { sender: 'bot', text: 'Hello! How can I help you today?', timestamp: new Date().toLocaleTimeString() }
])
const isLoading = ref(false)

const { sendMessage: sendMessageToApi } = useChatApi()

const sendMessage = async () => {
  if (!userInput.value.trim() || isLoading.value) return

  isLoading.value = true

  // Add user message
  messages.value.push({
    sender: 'user',
    text: userInput.value,
    timestamp: new Date().toLocaleTimeString()
  })

  try {
    // Send message to API
    const response = await sendMessageToApi(userInput.value)

    const botResponse = response?.data?.answer

    // Add bot message
    messages.value.push({
      sender: 'bot',
      text: botResponse,
      timestamp: new Date().toLocaleTimeString()
    })

    console.log('Response of content', response.data)

  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      sender: 'bot',
      text: 'Sorry, there was an error processing your message.',
      timestamp: new Date().toLocaleTimeString()
    })
  } finally {
    isLoading.value = false
    userInput.value = ''
  }
}

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      messages.value.push({
        sender: 'user',
        text: 'Uploaded an image:',
        image: e.target?.result as string,
        timestamp: new Date().toLocaleTimeString()
      })
    }
    reader.readAsDataURL(file)
  }
}
</script>