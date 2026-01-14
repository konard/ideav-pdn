<script setup>
import { ref, computed } from 'vue';
import ProcessCard from './ProcessCard.vue';

const props = defineProps({
  processes: {
    type: Array,
    required: true
  },
  groups: {
    type: Object,
    default: () => ({})
  },
  subjects: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['select', 'add']);

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 20;

const filteredProcesses = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.processes;
  }
  const query = searchQuery.value.toLowerCase();
  return props.processes.filter(process => {
    return Object.values(process).some(value =>
      String(value).toLowerCase().includes(query)
    );
  });
});

const totalPages = computed(() => {
  return Math.ceil(filteredProcesses.value.length / itemsPerPage);
});

const paginatedProcesses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProcesses.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push('...');
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push('...');
      for (let i = current - 1; i <= current + 1; i++) pages.push(i);
      pages.push('...');
      pages.push(total);
    }
  }
  return pages;
});

function goToPage(page) {
  if (page !== '...' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function onSearch() {
  currentPage.value = 1;
}
</script>

<template>
  <div class="process-list">
    <div class="list-header">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по любому полю..."
          class="search-input"
          @input="onSearch"
        />
      </div>
      <button class="add-btn" @click="$emit('add')">
        + Добавить
      </button>
    </div>

    <div v-if="paginatedProcesses.length === 0" class="empty-state">
      <p v-if="searchQuery">Ничего не найдено по запросу "{{ searchQuery }}"</p>
      <p v-else>Список процессов пуст</p>
    </div>

    <div v-else class="cards-grid">
      <ProcessCard
        v-for="process in paginatedProcesses"
        :key="process['ПроцессID']"
        :process="process"
        :groups="groups"
        :subjects="subjects"
        @select="$emit('select', process)"
      />
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        &laquo;
      </button>
      <button
        v-for="page in visiblePages"
        :key="page"
        class="page-btn"
        :class="{ active: page === currentPage, ellipsis: page === '...' }"
        :disabled="page === '...'"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        &raquo;
      </button>
    </div>

    <div class="list-footer">
      <span>Показано {{ paginatedProcesses.length }} из {{ filteredProcesses.length }}</span>
    </div>
  </div>
</template>

<style scoped>
.process-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.list-header {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1976d2;
}

.add-btn {
  padding: 10px 20px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.add-btn:hover {
  background: #1565c0;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled):not(.ellipsis) {
  background: #f5f5f5;
  border-color: #1976d2;
}

.page-btn.active {
  background: #1976d2;
  color: #fff;
  border-color: #1976d2;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.ellipsis {
  border: none;
  background: none;
}

.list-footer {
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}
</style>
