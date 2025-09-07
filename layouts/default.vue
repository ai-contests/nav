<template>
  <div class="min-h-screen bg-base text-text">
    <!-- Header -->
    <header class="bg-mantle border-b border-surface-1">
      <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-mauve">AI Contests Navigator</h1>
            <p class="text-subtext-1 mt-2">
              Discover and participate in the latest AI competitions
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-overlay-1">
              Last updated: {{ new Date().toLocaleDateString() }}
            </p>
            <button
              @click="toggleColorMode"
              class="text-xs text-mauve hover:text-pink transition-colors block mt-1"
            >
              Toggle Theme
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-8">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-mantle border-t border-surface-1 mt-16">
      <div class="container mx-auto px-4 py-6">
        <div class="text-center text-subtext-0 text-sm">
          <p>&copy; 2024 AI Contests Navigator. Built with Nuxt 3 & Vue 3.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Default layout for all pages
import { getCurrentInstance } from 'vue';

const toggleColorMode = () => {
  const instance = getCurrentInstance();
  if (instance) {
    const colorMode = instance.proxy?.$colorMode;
    if (colorMode) {
      colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark';
    }
  }
};
</script>
