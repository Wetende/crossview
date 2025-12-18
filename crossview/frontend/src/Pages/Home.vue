<script setup>
defineProps({
  message: String
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-md">
      <h1 class="text-3xl font-bold text-gray-800 mb-4">
        Crossview LMS
      </h1>
      <p class="text-gray-600">{{ message }}</p>
      <p class="text-sm text-gray-400 mt-4">
        Django + Vue.js + Inertia.js
      </p>
    </div>
  </div>
</template>
