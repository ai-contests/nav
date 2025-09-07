<template>
  <div>
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-mauve mb-4">
        Catppuccin Mocha Color Palette
      </h1>
      <p class="text-subtext-1 text-lg">
        Complete color palette showcase for the AI Contests Navigator
      </p>
    </div>

    <!-- Accent Colors -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold text-text mb-6">Accent Colors</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div class="bg-rosewater text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Rosewater</div>
          <div class="text-xs opacity-80">#f5e0dc</div>
        </div>
        <div class="bg-flamingo text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Flamingo</div>
          <div class="text-xs opacity-80">#f2cdcd</div>
        </div>
        <div class="bg-pink text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Pink</div>
          <div class="text-xs opacity-80">#f5c2e7</div>
        </div>
        <div class="bg-mauve text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Mauve</div>
          <div class="text-xs opacity-80">#cba6f7</div>
        </div>
        <div class="bg-red text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Red</div>
          <div class="text-xs opacity-80">#f38ba8</div>
        </div>
        <div class="bg-maroon text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Maroon</div>
          <div class="text-xs opacity-80">#eba0ac</div>
        </div>
        <div class="bg-peach text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Peach</div>
          <div class="text-xs opacity-80">#fab387</div>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-4">
        <div class="bg-yellow text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Yellow</div>
          <div class="text-xs opacity-80">#f9e2af</div>
        </div>
        <div class="bg-green text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Green</div>
          <div class="text-xs opacity-80">#a6e3a1</div>
        </div>
        <div class="bg-teal text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Teal</div>
          <div class="text-xs opacity-80">#94e2d5</div>
        </div>
        <div class="bg-sky text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Sky</div>
          <div class="text-xs opacity-80">#89dceb</div>
        </div>
        <div class="bg-sapphire text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Sapphire</div>
          <div class="text-xs opacity-80">#74c7ec</div>
        </div>
        <div class="bg-blue text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Blue</div>
          <div class="text-xs opacity-80">#89b4fa</div>
        </div>
        <div class="bg-lavender text-crust p-4 rounded-lg text-center">
          <div class="text-sm font-medium">Lavender</div>
          <div class="text-xs opacity-80">#b4befe</div>
        </div>
      </div>
    </section>

    <!-- Demo Components -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold text-text mb-6">Demo Components</h2>
      <div class="bg-surface-0 p-6 rounded-lg border border-surface-1">
        <!-- Buttons -->
        <div class="flex flex-wrap gap-4 mb-6">
          <button
            class="px-4 py-2 bg-mauve text-crust rounded hover:bg-pink transition-colors border border-mauve hover:border-pink"
          >
            Primary Button
          </button>
          <button
            class="px-4 py-2 bg-surface-1 text-text rounded hover:bg-surface-2 transition-colors border border-surface-2"
          >
            Secondary Button
          </button>
          <button
            class="px-4 py-2 bg-green text-crust rounded hover:bg-teal transition-colors border border-green hover:border-teal"
          >
            Success Button
          </button>
        </div>

        <!-- Status Badges -->
        <div class="flex flex-wrap gap-2 mb-6">
          <span
            class="px-3 py-1 bg-green/20 text-green border border-green/30 rounded-full text-sm font-medium"
          >
            Active
          </span>
          <span
            class="px-3 py-1 bg-blue/20 text-blue border border-blue/30 rounded-full text-sm font-medium"
          >
            Upcoming
          </span>
          <span
            class="px-3 py-1 bg-red/20 text-red border border-red/30 rounded-full text-sm font-medium"
          >
            Ended
          </span>
          <span
            class="px-3 py-1 bg-yellow/20 text-yellow border border-yellow/30 rounded-full text-sm font-medium"
          >
            Featured
          </span>
        </div>
      </div>
    </section>

    <!-- Back to Home -->
    <div class="text-center">
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-mauve hover:text-pink transition-colors text-lg font-medium"
      >
        ← Back to Home
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
// Color palette showcase page
</script>
