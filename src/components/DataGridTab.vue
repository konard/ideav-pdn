<script setup>
import { ref, computed, onMounted } from 'vue';
import { fetchTabData } from '../api';

const props = defineProps({
  tabName: {
    type: String,
    required: true
  },
  processId: {
    type: [String, Number],
    required: true
  }
});

const loading = ref(false);
const error = ref(null);
const items = ref([]);
const searchQuery = ref('');
const page = ref(1);
const itemsPerPage = 10;

const columns = computed(() => {
  if (!items.value.length) return [];
  const firstItem = items.value[0];
  return Object.keys(firstItem).filter(key => !key.endsWith('ID'));
});

const hasIdColumns = computed(() => {
  if (!items.value.length) return false;
  const firstItem = items.value[0];
  return Object.keys(firstItem).some(key => key.endsWith('ID'));
});

const displayMode = computed(() => {
  return columns.value.length < 3 ? 'table' : 'cards';
});

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return items.value;
  const query = searchQuery.value.toLowerCase();
  return items.value.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(query)
    )
  );
});

const paginatedItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredItems.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / itemsPerPage);
});

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const data = await fetchTabData(props.tabName, props.processId);
    items.value = Array.isArray(data) ? data : [];
    page.value = 1;
  } catch (e) {
    error.value = e.message || `Failed to load ${props.tabName}`;
  } finally {
    loading.value = false;
  }
}

function handleSearch(e) {
  searchQuery.value = e.target.value;
  page.value = 1;
}

function loadMore() {
  if (page.value < totalPages.value) {
    page.value++;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="data-grid-tab">
    <div class="tab-toolbar">
      <button class="btn-add">+ Добавить</button>
      <input
        type="text"
        class="search-input"
        placeholder="Поиск и фильтрация..."
        @input="handleSearch"
      />
    </div>

    <div v-if="loading" class="loading">Загрузка данных...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="!items.length" class="empty">Нет данных</div>

    <div v-else class="grid-content">
      <!-- Table view -->
      <div v-if="displayMode === 'table'" class="table-view">
        <table>
          <thead>
            <tr>
              <th v-for="col in columns" :key="col">{{ col }}</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in paginatedItems" :key="idx">
              <td v-for="col in columns" :key="col">{{ item[col] }}</td>
              <td class="actions">
                <button class="action-btn">Ред.</button>
                <button class="action-btn">Удал.</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Cards view -->
      <div v-else class="cards-view">
        <div v-for="(item, idx) in paginatedItems" :key="idx" class="card">
          <div v-for="col in columns" :key="col" class="card-field">
            <span class="field-label">{{ col }}:</span>
            <span class="field-value">{{ item[col] }}</span>
          </div>
          <div class="card-actions">
            <button class="action-btn">Ред.</button>
            <button class="action-btn">Удал.</button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredItems.length > itemsPerPage" class="pagination">
        <button
          v-if="page < totalPages"
          class="btn-load-more"
          @click="loadMore"
        >
          Загрузить еще ({{ paginatedItems.length }} из {{ filteredItems.length }})
        </button>
        <span class="page-info">
          Страница {{ page }} из {{ totalPages }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-grid-tab {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.tab-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-add {
  padding: 8px 16px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.btn-add:hover {
  background: #1565c0;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #1976d2;
}

.loading,
.error,
.empty {
  padding: 40px;
  text-align: center;
  color: #666;
}

.error {
  color: #d32f2f;
  background: #ffebee;
  border-radius: 6px;
}

.grid-content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.table-view {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

thead {
  background: #f5f5f5;
  position: sticky;
  top: 0;
}

th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  color: #333;
}

td {
  padding: 10px 8px;
  border-bottom: 1px solid #e0e0e0;
  word-break: break-word;
}

tbody tr:hover {
  background: #fafafa;
}

.actions {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.cards-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  flex: 1;
}

.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
  transition: box-shadow 0.2s;
}

.card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-weight: 600;
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
}

.field-value {
  font-size: 0.875rem;
  color: #333;
  word-break: break-word;
}

.card-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.action-btn {
  flex: 1;
  padding: 6px 12px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #e0e0e0;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid #e0e0e0;
  margin-top: auto;
}

.btn-load-more {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;
}

.btn-load-more:hover {
  background: #e0e0e0;
}

.page-info {
  font-size: 0.875rem;
  color: #666;
}
</style>
