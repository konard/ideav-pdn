<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { fetchReferenceList, createProcess, saveProcess, REFERENCE_FIELDS } from '../api';

const props = defineProps({
  process: {
    type: Object,
    default: null
  },
  processes: {
    type: Array,
    default: () => []
  },
  uid: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['close', 'saved']);

const activeTab = ref('general');
const loading = ref(false);
const saving = ref(false);
const error = ref(null);
const tabsContainer = ref(null);

const references = ref({});
const loadingRefs = ref(true);

const form = ref({
  t294: '',
  t297: '372',
  t300: '',
  t302: '',
  t365: '',
  t305: '',
  t313: '',
  t319: '',
  t326: '',
  t329: '',
  t392: [],
  t333: '',
  t336: '',
  t338: '',
  t347: '',
  t350: '',
  t352: '',
  t354: null
});

const isNew = computed(() => !props.process);

const parentOptions = computed(() => {
  const currentId = props.process?.['ПроцессID'];
  return props.processes.filter(p => p['ПроцессID'] !== currentId);
});

const tabs = [
  { id: 'general', label: 'Общая информация' },
  { id: 'is', label: 'ИС' },
  { id: 'purpose', label: 'Цель обработки' },
  { id: 'method', label: 'Способ обработки' }
];

async function loadReferences() {
  loadingRefs.value = true;
  try {
    const refNames = Object.keys(REFERENCE_FIELDS);
    const promises = refNames.map(async (name) => {
      try {
        const data = await fetchReferenceList(name);
        return { name, data };
      } catch {
        return { name, data: [] };
      }
    });

    const results = await Promise.all(promises);
    results.forEach(({ name, data }) => {
      references.value[name] = data;
    });
  } catch (e) {
    console.error('Failed to load references:', e);
  } finally {
    loadingRefs.value = false;
  }
}

function populateForm() {
  if (props.process) {
    form.value.t294 = props.process['Процесс'] || '';
    form.value.t297 = props.process['Статус'] || '372';
    form.value.t300 = props.process['Группа'] || '';
    form.value.t302 = props.process['Родительский (Процесс)'] || '';
    form.value.t365 = props.process['Инициатор (Пользователь)'] || '';
    form.value.t305 = props.process['Продукт'] || '';
    form.value.t313 = props.process['Сервис'] || '';
    form.value.t319 = props.process['ИС'] || '';
    form.value.t326 = props.process['Цель обработки ПДн'] || '';
    form.value.t329 = props.process['Микроцель обработки ПДн'] || '';
    const categories = props.process['Категории субъектов ПДн'];
    form.value.t392 = categories ? categories.split(',').filter(Boolean) : [];
    form.value.t333 = props.process['Количество субъектов ПДн'] || '';
    form.value.t336 = props.process['Основание обработки ПДн'] || '';
    form.value.t338 = props.process['Реквизиты нормативного правового акта'] || '';
    form.value.t347 = props.process['Способ обработки ПДн'] || '';
    form.value.t350 = props.process['Срок обработки ПДн'] || '';
    form.value.t352 = props.process['Порядок уничтожения ПДн'] || '';
  } else {
    form.value.t365 = props.uid || '';
  }
}

async function handleSave() {
  saving.value = true;
  error.value = null;

  try {
    const data = { ...form.value };
    if (Array.isArray(data.t392)) {
      data.t392 = data.t392.join(',');
    }
    delete data.t354;

    if (isNew.value) {
      await createProcess(data);
    } else {
      await saveProcess(props.process['ПроцессID'], data);
    }
    emit('saved');
  } catch (e) {
    error.value = e.message || 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
}

function getRefOptions(refName) {
  return references.value[refName] || [];
}

function getIdField(refName) {
  const data = references.value[refName];
  if (!data || !data.length) return 'ID';
  const first = data[0];
  const keys = Object.keys(first);
  return keys.find(k => k.endsWith('ID')) || keys[1] || keys[0];
}

function getValueField(refName) {
  const data = references.value[refName];
  if (!data || !data.length) return refName;
  const first = data[0];
  const keys = Object.keys(first);
  return keys.find(k => !k.endsWith('ID')) || keys[0];
}

function handleTabsWheel(event) {
  // Only handle wheel events when not typing in a form field
  if (event.target.closest('.tabs')) {
    const container = tabsContainer.value;
    if (!container) return;

    // Prevent default scrolling behavior
    event.preventDefault();

    // Scroll horizontally based on wheel delta
    const scrollAmount = event.deltaY > 0 ? 100 : -100;
    container.scrollLeft += scrollAmount;
  }
}

watch(() => props.process, populateForm, { immediate: true });

onMounted(() => {
  loadReferences();

  // Add wheel event listener for horizontal scrolling
  if (tabsContainer.value) {
    tabsContainer.value.addEventListener('wheel', handleTabsWheel, { passive: false });
  }
});

onBeforeUnmount(() => {
  // Clean up event listener
  if (tabsContainer.value) {
    tabsContainer.value.removeEventListener('wheel', handleTabsWheel);
  }
});
</script>

<template>
  <div class="form-overlay" @click.self="$emit('close')">
    <div class="form-container">
      <div class="form-header">
        <h2>{{ isNew ? 'Новый процесс' : 'Редактирование процесса' }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div ref="tabsContainer" class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div v-if="loadingRefs" class="loading">Загрузка справочников...</div>

      <div v-else class="form-content">
        <!-- Общая информация -->
        <div v-show="activeTab === 'general'" class="tab-content">
          <div class="form-group">
            <label>Процесс *</label>
            <textarea v-model="form.t294" rows="3" placeholder="Название процесса"></textarea>
          </div>

          <div class="form-group">
            <label>Статус</label>
            <select v-model="form.t297">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Статус')"
                :key="item[getIdField('Статус')]"
                :value="item[getIdField('Статус')]"
              >
                {{ item[getValueField('Статус')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Группа</label>
            <select v-model="form.t300">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Группа')"
                :key="item[getIdField('Группа')]"
                :value="item[getIdField('Группа')]"
              >
                {{ item[getValueField('Группа')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Родительский процесс</label>
            <select v-model="form.t302">
              <option value="">— Выберите —</option>
              <option
                v-for="p in parentOptions"
                :key="p['ПроцессID']"
                :value="p['ПроцессID']"
              >
                {{ p['Процесс'] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Инициатор</label>
            <select v-model="form.t365">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Инициатор')"
                :key="item[getIdField('Инициатор')]"
                :value="item[getIdField('Инициатор')]"
              >
                {{ item[getValueField('Инициатор')] }}
              </option>
            </select>
          </div>
        </div>

        <!-- ИС -->
        <div v-show="activeTab === 'is'" class="tab-content">
          <div class="form-group">
            <label>Продукт</label>
            <select v-model="form.t305">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Продукт')"
                :key="item[getIdField('Продукт')]"
                :value="item[getIdField('Продукт')]"
              >
                {{ item[getValueField('Продукт')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Сервис</label>
            <select v-model="form.t313">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Сервис')"
                :key="item[getIdField('Сервис')]"
                :value="item[getIdField('Сервис')]"
              >
                {{ item[getValueField('Сервис')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>ИС</label>
            <select v-model="form.t319">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('ИС')"
                :key="item[getIdField('ИС')]"
                :value="item[getIdField('ИС')]"
              >
                {{ item[getValueField('ИС')] }}
              </option>
            </select>
          </div>
        </div>

        <!-- Цель обработки -->
        <div v-show="activeTab === 'purpose'" class="tab-content">
          <div class="form-group">
            <label>Цель обработки ПДн</label>
            <select v-model="form.t326">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Цель обработки ПДн')"
                :key="item[getIdField('Цель обработки ПДн')]"
                :value="item[getIdField('Цель обработки ПДн')]"
              >
                {{ item[getValueField('Цель обработки ПДн')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Микроцель обработки ПДн</label>
            <select v-model="form.t329">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Микроцель обработки ПДн')"
                :key="item[getIdField('Микроцель обработки ПДн')]"
                :value="item[getIdField('Микроцель обработки ПДн')]"
              >
                {{ item[getValueField('Микроцель обработки ПДн')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Категории субъектов ПДн</label>
            <select v-model="form.t392" multiple size="5">
              <option
                v-for="item in getRefOptions('Категории субъектов ПДн')"
                :key="item[getIdField('Категории субъектов ПДн')]"
                :value="item[getIdField('Категории субъектов ПДн')]"
              >
                {{ item[getValueField('Категории субъектов ПДн')] }}
              </option>
            </select>
            <small>Удерживайте Ctrl для выбора нескольких</small>
          </div>

          <div class="form-group">
            <label>Количество субъектов ПДн</label>
            <select v-model="form.t333">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Количество субъектов ПДн')"
                :key="item[getIdField('Количество субъектов ПДн')]"
                :value="item[getIdField('Количество субъектов ПДн')]"
              >
                {{ item[getValueField('Количество субъектов ПДн')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Основание обработки ПДн</label>
            <select v-model="form.t336">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Основание обработки ПДн')"
                :key="item[getIdField('Основание обработки ПДн')]"
                :value="item[getIdField('Основание обработки ПДн')]"
              >
                {{ item[getValueField('Основание обработки ПДн')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Реквизиты нормативного правового акта</label>
            <textarea v-model="form.t338" rows="3" placeholder="Введите реквизиты"></textarea>
          </div>
        </div>

        <!-- Способ обработки -->
        <div v-show="activeTab === 'method'" class="tab-content">
          <div class="form-group">
            <label>Способ обработки ПДн</label>
            <select v-model="form.t347">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Способ обработки ПДн')"
                :key="item[getIdField('Способ обработки ПДн')]"
                :value="item[getIdField('Способ обработки ПДн')]"
              >
                {{ item[getValueField('Способ обработки ПДн')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Срок обработки ПДн</label>
            <select v-model="form.t350">
              <option value="">— Выберите —</option>
              <option
                v-for="item in getRefOptions('Срок обработки ПДн')"
                :key="item[getIdField('Срок обработки ПДн')]"
                :value="item[getIdField('Срок обработки ПДн')]"
              >
                {{ item[getValueField('Срок обработки ПДн')] }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Порядок уничтожения ПДн</label>
            <textarea v-model="form.t352" rows="3" placeholder="Опишите порядок уничтожения"></textarea>
          </div>

          <div class="form-group">
            <label>Порядок уничтожения (файл)</label>
            <input type="file" @change="e => form.t354 = e.target.files[0]" />
            <small>Загрузка файлов в данной версии не поддерживается</small>
          </div>
        </div>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>

      <div class="form-footer">
        <button class="btn-cancel" @click="$emit('close')">Отмена</button>
        <button class="btn-save" :disabled="saving" @click="handleSave">
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.form-container {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.form-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 24px;
  gap: 8px;
  overflow-x: auto;
}

.tab-btn {
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #333;
}

.tab-btn.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
}

.loading {
  padding: 40px;
  text-align: center;
  color: #666;
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #333;
}

.form-group input[type="text"],
.form-group input[type="file"],
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #1976d2;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group small {
  font-size: 0.75rem;
  color: #999;
}

.error-message {
  color: #d32f2f;
  padding: 12px 24px;
  background: #ffebee;
  border-top: 1px solid #ffcdd2;
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel,
.btn-save {
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #333;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-save {
  background: #1976d2;
  border: none;
  color: #fff;
}

.btn-save:hover:not(:disabled) {
  background: #1565c0;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
