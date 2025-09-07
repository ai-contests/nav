<template>
  <NuxtLink
    :to="`/contest/${contest.id}`"
    class="block bg-surface-0 border border-surface-1 rounded-lg p-6 hover:border-mauve transition-colors duration-200"
  >
    <!-- Header -->
    <div class="flex items-start justify-between mb-3">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-text line-clamp-2 mb-1">
          {{ contest.title }}
        </h3>
        <div class="flex items-center gap-2">
          <span class="text-xs px-2 py-1 bg-surface-2 text-subtext-1 rounded">
            {{ contest.platform }}
          </span>
          <span
            class="text-xs px-2 py-1 rounded"
            :class="statusClasses[contest.status]"
          >
            {{ contest.status }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-1 ml-2">
        <span class="text-yellow text-sm">★</span>
        <span class="text-subtext-1 text-sm">{{ contest.quality }}/10</span>
      </div>
    </div>

    <!-- Description -->
    <p class="text-subtext-0 text-sm mb-4 line-clamp-3">
      {{ contest.description }}
    </p>

    <!-- Tags -->
    <div class="flex flex-wrap gap-1 mb-4">
      <span
        v-for="tag in contest.tags.slice(0, 3)"
        :key="tag"
        class="text-xs px-2 py-1 bg-surface-2 text-subtext-1 rounded"
      >
        {{ tag }}
      </span>
      <span
        v-if="contest.tags.length > 3"
        class="text-xs px-2 py-1 bg-surface-2 text-subtext-1 rounded"
      >
        +{{ contest.tags.length - 3 }}
      </span>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between text-sm">
      <div class="text-subtext-1">
        <span v-if="contest.prize">Prize: {{ contest.prize }}</span>
      </div>
      <div class="text-subtext-1">
        <span v-if="contest.endDate"
          >Ends: {{ formatDate(contest.endDate) }}</span
        >
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Props {
  contest: {
    id: string;
    title: string;
    platform: string;
    status: 'active' | 'upcoming' | 'ended';
    description: string;
    endDate?: string;
    prize?: string;
    tags: string[];
    quality: number;
  };
}

const props = defineProps<Props>();

// Status color classes
const statusClasses = {
  active: 'bg-green text-base',
  upcoming: 'bg-blue text-base',
  ended: 'bg-overlay-1 text-subtext-0',
};

// Format date helper
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};
</script>
