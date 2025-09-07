<template>
  <div>
    <!-- Filters Section -->
    <div class="mb-8">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex items-center gap-2">
          <label for="status-filter" class="text-subtext-1">Status:</label>
          <select
            id="status-filter"
            class="bg-surface-0 border border-surface-1 rounded px-3 py-2 text-text focus:ring-2 focus:ring-mauve focus:border-mauve hover:border-surface-2 transition-colors"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="ended">Ended</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label for="category-filter" class="text-subtext-1">Category:</label>
          <select
            id="category-filter"
            class="bg-surface-0 border border-surface-1 rounded px-3 py-2 text-text focus:ring-2 focus:ring-mauve focus:border-mauve hover:border-surface-2 transition-colors"
          >
            <option value="all">All Categories</option>
            <option value="computer-vision">Computer Vision</option>
            <option value="nlp">NLP</option>
            <option value="reinforcement-learning">
              Reinforcement Learning
            </option>
            <option value="generative-ai">Generative AI</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label for="sort-by" class="text-subtext-1">Sort by:</label>
          <select
            id="sort-by"
            class="bg-surface-0 border border-surface-1 rounded px-3 py-2 text-text focus:ring-2 focus:ring-mauve focus:border-mauve hover:border-surface-2 transition-colors"
          >
            <option value="deadline">Deadline</option>
            <option value="prize">Prize Amount</option>
            <option value="participants">Participants</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Contests Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Contest Cards will be rendered here -->
      <div
        v-for="contest in contests"
        :key="contest.id"
        class="bg-surface-0 rounded-lg border border-surface-1 p-6 hover:border-mauve hover:shadow-lg hover:shadow-mauve/10 transition-all duration-300"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-text mb-2 line-clamp-2">
              {{ contest.title }}
            </h3>
            <p class="text-subtext-1 text-sm mb-3 line-clamp-3">
              {{ contest.description }}
            </p>
          </div>
          <span
            :class="[
              'px-2 py-1 rounded-full text-xs font-medium',
              contest.status === 'active'
                ? 'bg-green/20 text-green border border-green/30'
                : contest.status === 'upcoming'
                  ? 'bg-blue/20 text-blue border border-blue/30'
                  : 'bg-overlay-0/20 text-overlay-0 border border-overlay-0/30',
            ]"
          >
            {{ contest.status }}
          </span>
        </div>

        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-subtext-0">Deadline:</span>
            <span class="text-text">{{ contest.deadline }}</span>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <span class="text-subtext-0">Prize:</span>
            <span class="text-yellow font-medium">{{ contest.prize }}</span>
          </div>

          <div class="flex items-center gap-2 text-sm">
            <span class="text-subtext-0">Participants:</span>
            <span class="text-text">{{ contest.participants }}</span>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <span
              v-for="tag in contest.tags"
              :key="tag"
              class="px-2 py-1 bg-surface-1 text-subtext-1 text-xs rounded border border-surface-2 hover:bg-surface-2 hover:text-text transition-colors"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-surface-1">
          <a
            :href="contest.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-mauve hover:text-pink transition-colors text-sm font-medium"
          >
            View Contest
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div
        class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-mauve"
      ></div>
      <p class="text-subtext-1 mt-4">Loading contests...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-6xl mb-4">⚠️</div>
      <h3 class="text-xl font-semibold text-red mb-2">
        Error Loading Contests
      </h3>
      <p class="text-subtext-1 mb-4">{{ error }}</p>
      <button
        @click="fetchContests"
        class="px-4 py-2 bg-mauve text-crust rounded hover:bg-pink transition-colors border border-mauve hover:border-pink"
      >
        Try Again
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="contests.length === 0" class="text-center py-12">
      <div class="text-6xl mb-4">🏆</div>
      <h3 class="text-xl font-semibold text-text mb-2">No contests found</h3>
      <p class="text-subtext-1">
        Try adjusting your filters or check back later for new contests.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Define contest interface
interface Contest {
  id: string;
  title: string;
  platform: string;
  status: string;
  description: string;
  startDate?: string;
  endDate?: string;
  prize: string;
  tags: string[];
  url: string;
  quality: number;
  lastUpdated?: string;
  deadline?: string;
  participants?: string;
}

// Reactive data
const contests = ref<Contest[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

// Fetch contests data
const fetchContests = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await fetch('/api/contests');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Invalid response format');
    }

    contests.value = data.data.map((contest: any) => ({
      ...contest,
      deadline: contest.endDate || 'TBD',
      participants: contest.participants || 'TBD',
    }));
  } catch (err) {
    console.error('Failed to fetch contests:', err);
    error.value = 'Failed to load contests data';
  } finally {
    loading.value = false;
  }
};

// Fetch data on component mount
onMounted(() => {
  fetchContests();
});
</script>
