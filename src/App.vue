<script setup>
import { ref, onMounted } from 'vue';
import ProcessList from './components/ProcessList.vue';
import ProcessForm from './components/ProcessForm.vue';
import { fetchProcesses, fetchReferenceList } from './api';

const processes = ref([]);
const loading = ref(true);
const error = ref(null);
const showForm = ref(false);
const selectedProcess = ref(null);

const groups = ref({});
const subjects = ref({});

const uid = ref(window.uid || null);

async function loadProcesses() {
  loading.value = true;
  error.value = null;
  try {
    processes.value = await fetchProcesses();
  } catch (e) {
    error.value = e.message || 'Ошибка загрузки процессов';
    processes.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadReferences() {
  try {
    const [groupData, subjectData] = await Promise.all([
      fetchReferenceList('Группа').catch(() => []),
      fetchReferenceList('Количество субъектов ПДн').catch(() => [])
    ]);

    groupData.forEach(item => {
      const idKey = Object.keys(item).find(k => k.endsWith('ID'));
      const valKey = Object.keys(item).find(k => !k.endsWith('ID'));
      if (idKey && valKey) {
        groups.value[item[idKey]] = item[valKey];
      }
    });

    subjectData.forEach(item => {
      const idKey = Object.keys(item).find(k => k.endsWith('ID'));
      const valKey = Object.keys(item).find(k => !k.endsWith('ID'));
      if (idKey && valKey) {
        subjects.value[item[idKey]] = item[valKey];
      }
    });
  } catch (e) {
    console.error('Failed to load references:', e);
  }
}

function openAddForm() {
  selectedProcess.value = null;
  showForm.value = true;
}

function openEditForm(process) {
  selectedProcess.value = process;
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  selectedProcess.value = null;
}

async function handleSaved() {
  closeForm();
  await loadProcesses();
}

onMounted(() => {
  loadProcesses();
  loadReferences();
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Процессы обработки ПДн</h1>
    </header>

    <main class="app-main">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загрузка процессов...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="loadProcesses">Повторить</button>
      </div>

      <ProcessList
        v-else
        :processes="processes"
        :groups="groups"
        :subjects="subjects"
        @select="openEditForm"
        @add="openAddForm"
      />
    </main>

    <ProcessForm
      v-if="showForm"
      :process="selectedProcess"
      :processes="processes"
      :uid="uid"
      @close="closeForm"
      @saved="handleSaved"
    />
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f7fa;
  color: #333;
  line-height: 1.5;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #1976d2;
  color: #fff;
  padding: 20px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state p {
  color: #d32f2f;
  margin-bottom: 16px;
}

.error-state button {
  padding: 10px 20px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.error-state button:hover {
  background: #1565c0;
}
</style>
