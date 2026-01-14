<script setup>
defineProps({
  process: {
    type: Object,
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

defineEmits(['select']);

function getGroupName(groupId, groups) {
  if (!groupId || !groups) return '—';
  const group = groups[groupId];
  return group || '—';
}

function getSubjectsCount(countId, subjects) {
  if (!countId || !subjects) return '—';
  const count = subjects[countId];
  return count || '—';
}
</script>

<template>
  <div class="process-card">
    <div class="card-header">
      <a href="#" class="card-title" @click.prevent="$emit('select', process)">
        {{ process['Процесс'] }}
      </a>
      <span class="card-id">ID: {{ process['ПроцессID'] }}</span>
    </div>
    <div class="card-body">
      <div class="card-row">
        <span class="label">Группа:</span>
        <span class="value">{{ getGroupName(process['Группа'], groups) }}</span>
      </div>
      <div class="card-row">
        <span class="label">Количество субъектов ПДн:</span>
        <span class="value">{{ getSubjectsCount(process['Количество субъектов ПДн'], subjects) }}</span>
      </div>
      <div class="card-row">
        <span class="label">Дата создания:</span>
        <span class="value">{{ process['Дата создания'] || '—' }}</span>
      </div>
      <div class="card-row">
        <span class="label">Создатель:</span>
        <span class="value">{{ process['Имя'] || '—' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.process-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}

.process-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.card-title {
  color: #1976d2;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  flex: 1;
}

.card-title:hover {
  text-decoration: underline;
}

.card-id {
  color: #999;
  font-size: 0.75rem;
  white-space: nowrap;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-row {
  display: flex;
  gap: 8px;
  font-size: 0.875rem;
}

.label {
  color: #666;
  flex-shrink: 0;
}

.value {
  color: #333;
  font-weight: 500;
}
</style>
