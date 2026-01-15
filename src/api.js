const API_BASE = '';

export async function fetchProcesses() {
  const response = await fetch(`${API_BASE}report/480?JSON_KV`);
  if (!response.ok) throw new Error('Failed to fetch processes');
  return response.json();
}

export async function fetchReferenceList(fieldName) {
  const response = await fetch(`${API_BASE}report/${fieldName}?JSON_KV`);
  if (!response.ok) throw new Error(`Failed to fetch ${fieldName}`);
  return response.json();
}

export async function createProcess(data) {
  const response = await fetch(`${API_BASE}_m_new/294?JSON&up=1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data)
  });
  if (!response.ok) throw new Error('Failed to create process');
  return response.json();
}

export async function saveProcess(processId, data) {
  const response = await fetch(`${API_BASE}_m_save/${processId}?JSON`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data)
  });
  if (!response.ok) throw new Error('Failed to save process');
  return response.json();
}

export const FIELD_MAPPING = {
  't294': 'Процесс',
  't297': 'Статус',
  't300': 'Группа',
  't302': 'Родительский',
  't365': 'Инициатор',
  't305': 'Продукт',
  't313': 'Сервис',
  't319': 'ИС',
  't326': 'Цель обработки ПДн',
  't329': 'Микроцель обработки ПДн',
  't392': 'Категории субъектов ПДн',
  't333': 'Количество субъектов ПДн',
  't336': 'Основание обработки ПДн',
  't338': 'Реквизиты нормативного правового акта',
  't347': 'Способ обработки ПДн',
  't350': 'Срок обработки ПДн',
  't352': 'Порядок уничтожения ПДн',
  't354': 'Порядок уничтожения (файл)'
};

export const REFERENCE_FIELDS = {
  'Статус': 't297',
  'Группа': 't300',
  'Инициатор': 't365',
  'Продукт': 't305',
  'Сервис': 't313',
  'ИС': 't319',
  'Цель обработки ПДн': 't326',
  'Микроцель обработки ПДн': 't329',
  'Категории субъектов ПДн': 't392',
  'Количество субъектов ПДн': 't333',
  'Основание обработки ПДн': 't336',
  'Способ обработки ПДн': 't347',
  'Срок обработки ПДн': 't350'
};
