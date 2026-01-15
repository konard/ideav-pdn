/**
 * Process List - Personal Data Processing Management
 * Template for Integram Constructor
 */

// Global state
let allProcesses = [];
let filteredProcesses = [];
let currentPage = 1;
const itemsPerPage = 20;
let references = {};
let editingProcessId = null;
let referencesLoaded = false;

// Tab data state
let tabDataCache = {};
let tabPaginationState = {
    'ПДн': { page: 1, data: [], search: '' },
    'Экспертиза': { page: 1, data: [], search: '' },
    'Риски': { page: 1, data: [], search: '' },
    'Передача': { page: 1, data: [], search: '' }
};
const tabItemsPerPage = 10;

// Field mappings for API
const FIELD_IDS = {
    process: 't294',
    status: 't297',
    group: 't300',
    parent: 't302',
    initiator: 't365',
    product: 't305',
    service: 't313',
    is: 't319',
    purpose: 't326',
    microPurpose: 't329',
    subjectCategories: 't392',
    subjectsCount: 't333',
    legalBasis: 't336',
    legalBasisOther: 't600',
    legalAct: 't338',
    method: 't347',
    term: 't350',
    destruction: 't352',
    destructionFile: 't354'
};

// Special value for "Other" option in legal basis
const LEGAL_BASIS_OTHER_VALUE = '__OTHER__';

// Reference field names for API calls
const REFERENCE_NAMES = [
    'Статус',
    'Группа',
    'Инициатор',
    'Продукт',
    'Сервис',
    'ИС',
    'Цель обработки ПДн',
    'Микроцель обработки ПДн',
    'Категории субъектов ПДн',
    'Количество субъектов ПДн',
    'Основание обработки ПДн',
    'Способ обработки ПДн',
    'Срок обработки ПДн'
];

// Initialize on page load
$(document).ready(function() {
    // Check if user is guest and redirect to login
    if (typeof uid === 'undefined' || uid === '' || uid === 'guest') {
        window.location.href = '/' + db + '/login';
        return;
    }

    loadProcesses();
    setupSearchListener();
    setupDependentDropdowns();
    setupTabsHorizontalScroll();
    setupDataTabListeners();
});

/**
 * Setup horizontal scrolling for tabs using mouse wheel
 */
function setupTabsHorizontalScroll() {
    $(document).on('wheel', '#formTabs', function(event) {
        event.preventDefault();

        // Get scroll container
        const container = this;
        const scrollAmount = event.originalEvent.deltaY > 0 ? 100 : -100;

        // Apply horizontal scroll
        container.scrollLeft += scrollAmount;
    });
}

/**
 * Load processes from API
 */
function loadProcesses() {
    showLoadingState();

    $.ajax({
        url: '/' + db + '/report/480?JSON_KV',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            allProcesses = data || [];
            filteredProcesses = allProcesses;
            renderProcesses();
            hideLoadingState();
        },
        error: function(xhr, status, error) {
            console.error('Error loading processes:', error);
            showNotification('Ошибка загрузки процессов: ' + error, 'error');
            hideLoadingState();
            $('#emptyState').show();
        }
    });
}

/**
 * Render processes grid with pagination
 */
function renderProcesses() {
    const grid = $('#processGrid');
    const emptyState = $('#emptyState');
    const noResults = $('#noResultsState');
    const pagination = $('#paginationNav');
    const counter = $('#itemsCounter');

    grid.empty();

    if (filteredProcesses.length === 0) {
        grid.hide();
        pagination.hide();
        counter.hide();

        if ($('#searchInput').val().trim()) {
            $('#searchQuery').text($('#searchInput').val());
            noResults.show();
            emptyState.hide();
        } else {
            emptyState.show();
            noResults.hide();
        }
        return;
    }

    emptyState.hide();
    noResults.hide();
    grid.show();

    // Calculate pagination
    const totalPages = Math.ceil(filteredProcesses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredProcesses.length);
    const pageProcesses = filteredProcesses.slice(startIndex, endIndex);

    // Render cards
    const template = document.getElementById('processCardTemplate');
    pageProcesses.forEach(function(process) {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.process-card-col');

        // Set data
        const titleEl = card.querySelector('.process-title');
        titleEl.textContent = process['Процесс'] || 'Без названия';
        titleEl.setAttribute('data-process-id', process['ПроцессID']);

        card.querySelector('.process-id').textContent = 'ID: ' + process['ПроцессID'];
        card.querySelector('.process-group').textContent = getReferenceName('Группа', process['Группа']) || '—';
        card.querySelector('.process-subjects').textContent = getReferenceName('Количество субъектов ПДн', process['Количество субъектов ПДн']) || '—';
        card.querySelector('.process-date').textContent = process['Дата создания'] || '—';
        card.querySelector('.process-creator').textContent = process['Имя'] || '—';

        grid.append(card);
    });

    // Render pagination
    renderPagination(totalPages);

    // Show counter
    counter.text('Показано ' + pageProcesses.length + ' из ' + filteredProcesses.length).show();
}

/**
 * Render pagination controls
 */
function renderPagination(totalPages) {
    const pagination = $('#pagination');
    const nav = $('#paginationNav');

    if (totalPages <= 1) {
        nav.hide();
        return;
    }

    pagination.empty();
    nav.show();

    // Previous button
    pagination.append(
        '<li class="page-item ' + (currentPage === 1 ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" onclick="goToPage(' + (currentPage - 1) + '); return false;">&laquo;</a></li>'
    );

    // Page numbers
    const pages = getVisiblePages(currentPage, totalPages);
    pages.forEach(function(page) {
        if (page === '...') {
            pagination.append('<li class="page-item disabled"><span class="page-link">...</span></li>');
        } else {
            pagination.append(
                '<li class="page-item ' + (page === currentPage ? 'active' : '') + '">' +
                '<a class="page-link" href="#" onclick="goToPage(' + page + '); return false;">' + page + '</a></li>'
            );
        }
    });

    // Next button
    pagination.append(
        '<li class="page-item ' + (currentPage === totalPages ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" onclick="goToPage(' + (currentPage + 1) + '); return false;">&raquo;</a></li>'
    );
}

/**
 * Calculate visible page numbers
 */
function getVisiblePages(current, total) {
    const pages = [];

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
}

/**
 * Navigate to specific page
 */
function goToPage(page) {
    const totalPages = Math.ceil(filteredProcesses.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderProcesses();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Setup search input listener
 */
function setupSearchListener() {
    let debounceTimer;
    $('#searchInput').on('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function() {
            performSearch();
        }, 300);
    });
}

/**
 * Setup dependent dropdown listeners
 * When "Цель обработки ПДн" changes, filter "Микроцель обработки ПДн"
 * When "Основание обработки ПДн" changes, show/hide "Иное" textarea
 */
function setupDependentDropdowns() {
    $(document).on('change', '#processPurpose', function() {
        filterMicroPurposeByPurpose();
    });

    $(document).on('change', '#processLegalBasis', function() {
        toggleLegalBasisOther();
    });
}

/**
 * Show/hide "Иное" textarea based on legal basis selection
 */
function toggleLegalBasisOther() {
    const legalBasisValue = $('#processLegalBasis').val();
    const otherGroup = $('#legalBasisOtherGroup');

    if (legalBasisValue === LEGAL_BASIS_OTHER_VALUE) {
        otherGroup.show();
    } else {
        otherGroup.hide();
        $('#processLegalBasisOther').val('');
    }
}

/**
 * Filter "Микроцель обработки ПДн" based on selected "Цель обработки ПДн"
 */
function filterMicroPurposeByPurpose() {
    const purposeSelect = $('#processPurpose');
    const microPurposeSelect = $('#processMicroPurpose');
    const selectedPurposeId = purposeSelect.val();
    const currentMicroPurposeValue = microPurposeSelect.val();

    // Get all micro-purposes from references
    const allMicroPurposes = references['Микроцель обработки ПДн'] || [];

    // Clear and repopulate micro-purpose select
    microPurposeSelect.empty();
    microPurposeSelect.append('<option value="">— Выберите —</option>');

    if (!selectedPurposeId) {
        // No purpose selected - show all micro-purposes
        allMicroPurposes.forEach(function(item) {
            const idField = getIdField(item);
            const valueField = getValueField(item);
            if (idField && valueField) {
                microPurposeSelect.append('<option value="' + item[idField] + '">' + escapeHtml(item[valueField]) + '</option>');
            }
        });
    } else {
        // Get the text value of the selected purpose
        const purposeData = references['Цель обработки ПДн'] || [];
        const selectedPurpose = purposeData.find(function(p) {
            const idField = getIdField(p);
            return p[idField] == selectedPurposeId;
        });

        if (selectedPurpose) {
            const purposeTextField = getValueField(selectedPurpose);
            const purposeText = selectedPurpose[purposeTextField];

            // Filter micro-purposes by matching "Цель обработки ПДн" field
            const filteredMicroPurposes = allMicroPurposes.filter(function(item) {
                return item['Цель обработки ПДн'] === purposeText;
            });

            filteredMicroPurposes.forEach(function(item) {
                const idField = getIdField(item);
                const valueField = getValueField(item);
                if (idField && valueField) {
                    microPurposeSelect.append('<option value="' + item[idField] + '">' + escapeHtml(item[valueField]) + '</option>');
                }
            });
        }
    }

    // Try to restore previous value if it's still valid
    if (currentMicroPurposeValue) {
        const optionExists = microPurposeSelect.find('option[value="' + currentMicroPurposeValue + '"]').length > 0;
        if (optionExists) {
            microPurposeSelect.val(currentMicroPurposeValue);
        }
    }
}

/**
 * Perform search across all fields
 */
function performSearch() {
    const query = $('#searchInput').val().toLowerCase().trim();

    if (!query) {
        filteredProcesses = allProcesses;
    } else {
        filteredProcesses = allProcesses.filter(function(process) {
            return Object.values(process).some(function(value) {
                return String(value).toLowerCase().includes(query);
            });
        });
    }

    currentPage = 1;
    renderProcesses();
}

/**
 * Open form for adding new process
 */
function openAddForm() {
    editingProcessId = null;
    $('#processFormModalLabel').text('Новый процесс');
    resetForm();
    loadReferencesIfNeeded(function() {
        populateFormSelects();
        // Set default status to "Проект" (372)
        $('#processStatus').val('372');
        // Set current user as initiator
        if (uid) {
            $('#processInitiator').val(uid);
        }
        $('#processFormModal').modal('show');
    });
}

/**
 * Open form for editing existing process
 */
function openEditForm(element) {
    const processId = $(element).attr('data-process-id');
    const process = allProcesses.find(function(p) {
        return p['ПроцессID'] === processId;
    });

    if (!process) {
        showNotification('Процесс не найден', 'error');
        return;
    }

    editingProcessId = processId;
    $('#processFormModalLabel').text('Редактирование процесса');
    resetForm();

    loadReferencesIfNeeded(function() {
        populateFormSelects(process);
        fillFormWithProcess(process);
        $('#processFormModal').modal('show');
    });
}

/**
 * Fill form fields with process data
 */
function fillFormWithProcess(process) {
    $('#processName').val(decodeHtmlEntities(process['Процесс'] || ''));
    $('#processStatus').val(process['Статус'] || '');
    $('#processGroup').val(process['Группа'] || '');
    $('#processParent').val(process['Родительский (Процесс)'] || '');
    $('#processInitiator').val(process['Инициатор (Пользователь)'] || '');
    $('#processProduct').val(process['Продукт'] || '');
    $('#processService').val(process['Сервис'] || '');
    $('#processIS').val(process['ИС'] || '');

    // Set purpose first, then filter micro-purposes, then set micro-purpose value
    $('#processPurpose').val(process['Цель обработки ПДн'] || '');
    filterMicroPurposeByPurpose();
    $('#processMicroPurpose').val(process['Микроцель обработки ПДн'] || '');

    // Handle multiselect for categories
    const categories = process['Категории субъектов ПДн'];
    if (categories) {
        const categoryIds = categories.split(',').map(function(s) { return s.trim(); });
        $('#processSubjectCategories').val(categoryIds);
    }

    $('#processSubjectsCount').val(process['Количество субъектов ПДн'] || '');

    // Handle legal basis with "Иное" option
    const legalBasisValue = process['Основание обработки ПДн'] || '';
    const legalBasisOtherValue = process['Иное основание'] || '';

    if (legalBasisOtherValue && !legalBasisValue) {
        // "Иное" was selected - show "other" field
        $('#processLegalBasis').val(LEGAL_BASIS_OTHER_VALUE);
        $('#processLegalBasisOther').val(decodeHtmlEntities(legalBasisOtherValue));
        toggleLegalBasisOther();
    } else {
        $('#processLegalBasis').val(legalBasisValue);
        toggleLegalBasisOther();
    }

    $('#processLegalAct').val(decodeHtmlEntities(process['Реквизиты нормативного правового акта'] || ''));
    $('#processMethod').val(process['Способ обработки ПДн'] || '');
    $('#processTerm').val(process['Срок обработки ПДн'] || '');
    $('#processDestruction').val(decodeHtmlEntities(process['Порядок уничтожения ПДн'] || ''));
}

/**
 * Reset form to initial state
 */
function resetForm() {
    $('#processName').val('');
    $('#processStatus').val('');
    $('#processGroup').val('');
    $('#processParent').val('');
    $('#processInitiator').val('');
    $('#processProduct').val('');
    $('#processService').val('');
    $('#processIS').val('');
    $('#processPurpose').val('');
    $('#processMicroPurpose').val('');
    $('#processSubjectCategories').val([]);
    $('#processSubjectsCount').val('');
    $('#processLegalBasis').val('');
    $('#processLegalBasisOther').val('');
    $('#legalBasisOtherGroup').hide();
    $('#processLegalAct').val('');
    $('#processMethod').val('');
    $('#processTerm').val('');
    $('#processDestruction').val('');
    $('#processDestructionFile').val('');
    $('#formError').hide();
    $('#general-tab').tab('show');
}

/**
 * Load references if not already loaded
 */
function loadReferencesIfNeeded(callback) {
    if (referencesLoaded) {
        callback();
        return;
    }

    const promises = REFERENCE_NAMES.map(function(name) {
        return $.ajax({
            url: '/' + db + '/report/' + encodeURIComponent(name) + '?JSON_KV',
            method: 'GET',
            dataType: 'json'
        }).then(function(data) {
            return { name: name, data: data || [] };
        }).catch(function() {
            return { name: name, data: [] };
        });
    });

    Promise.all(promises).then(function(results) {
        results.forEach(function(result) {
            references[result.name] = result.data;
        });
        referencesLoaded = true;
        callback();
    });
}

/**
 * Populate form select elements with reference data
 */
function populateFormSelects(excludeProcess) {
    populateSelect('#processStatus', 'Статус');
    populateSelect('#processGroup', 'Группа');
    populateSelect('#processInitiator', 'Инициатор');
    populateSelect('#processProduct', 'Продукт');
    populateSelect('#processService', 'Сервис');
    populateSelect('#processIS', 'ИС');
    populateSelect('#processPurpose', 'Цель обработки ПДн');
    populateSelect('#processMicroPurpose', 'Микроцель обработки ПДн');
    populateSelect('#processSubjectCategories', 'Категории субъектов ПДн');
    populateSelect('#processSubjectsCount', 'Количество субъектов ПДн');
    populateSelect('#processLegalBasis', 'Основание обработки ПДн');
    populateSelect('#processMethod', 'Способ обработки ПДн');
    populateSelect('#processTerm', 'Срок обработки ПДн');

    // Populate parent process select
    const parentSelect = $('#processParent');
    parentSelect.empty().append('<option value="">— Выберите —</option>');
    allProcesses.forEach(function(p) {
        if (!excludeProcess || p['ПроцессID'] !== excludeProcess['ПроцессID']) {
            parentSelect.append('<option value="' + p['ПроцессID'] + '">' + escapeHtml(p['Процесс']) + '</option>');
        }
    });
}

/**
 * Populate a single select element
 */
function populateSelect(selector, refName) {
    const select = $(selector);
    const data = references[refName] || [];
    const isMultiple = select.prop('multiple');

    select.empty();
    if (!isMultiple) {
        select.append('<option value="">— Выберите —</option>');
    }

    data.forEach(function(item) {
        const idField = getIdField(item);
        const valueField = getValueField(item);
        if (idField && valueField) {
            select.append('<option value="' + item[idField] + '">' + escapeHtml(item[valueField]) + '</option>');
        }
    });

    // Add "Иное" option at the end for legal basis
    if (refName === 'Основание обработки ПДн') {
        select.append('<option value="' + LEGAL_BASIS_OTHER_VALUE + '">Иное</option>');
    }
}

/**
 * Get ID field name from reference item
 */
function getIdField(item) {
    const keys = Object.keys(item);
    return keys.find(function(k) { return k.endsWith('ID'); }) || keys[1] || keys[0];
}

/**
 * Get value field name from reference item
 */
function getValueField(item) {
    const keys = Object.keys(item);
    return keys.find(function(k) { return !k.endsWith('ID'); }) || keys[0];
}

/**
 * Get reference display name by ID
 */
function getReferenceName(refName, id) {
    if (!id || !references[refName]) return null;
    const item = references[refName].find(function(r) {
        const idField = getIdField(r);
        return r[idField] == id;
    });
    if (!item) return null;
    return item[getValueField(item)];
}

/**
 * Save process (create or update)
 */
function saveProcess() {
    const btn = $('#saveProcessBtn');
    const spinner = btn.find('.spinner-border');
    const btnText = btn.find('.btn-text');

    // Validate process name
    const processName = $('#processName').val().trim();
    if (!processName) {
        $('#formError').text('Укажите название процесса').show();
        $('#general-tab').tab('show');
        return;
    }

    // Validate legal basis
    const legalBasisValue = $('#processLegalBasis').val();
    const legalBasisOtherValue = $('#processLegalBasisOther').val().trim();

    if (!legalBasisValue) {
        $('#formError').text('Укажите основание обработки ПДн').show();
        $('#purpose-tab').tab('show');
        return;
    }

    if (legalBasisValue === LEGAL_BASIS_OTHER_VALUE && !legalBasisOtherValue) {
        $('#formError').text('При выборе "Иное" необходимо указать альтернативное основание').show();
        $('#purpose-tab').tab('show');
        return;
    }

    // Show loading state
    btn.prop('disabled', true);
    spinner.removeClass('d-none');
    btnText.text('Сохранение...');
    $('#formError').hide();

    // Collect form data
    const formData = {
        _xsrf: xsrf
    };

    formData[FIELD_IDS.process] = processName;
    formData[FIELD_IDS.status] = $('#processStatus').val() || '';
    formData[FIELD_IDS.group] = $('#processGroup').val() || '';
    formData[FIELD_IDS.parent] = $('#processParent').val() || '';
    formData[FIELD_IDS.initiator] = $('#processInitiator').val() || '';
    formData[FIELD_IDS.product] = $('#processProduct').val() || '';
    formData[FIELD_IDS.service] = $('#processService').val() || '';
    formData[FIELD_IDS.is] = $('#processIS').val() || '';
    formData[FIELD_IDS.purpose] = $('#processPurpose').val() || '';
    formData[FIELD_IDS.microPurpose] = $('#processMicroPurpose').val() || '';

    // Handle multiselect
    const categories = $('#processSubjectCategories').val() || [];
    formData[FIELD_IDS.subjectCategories] = categories.join(',');

    formData[FIELD_IDS.subjectsCount] = $('#processSubjectsCount').val() || '';

    // Handle legal basis with "Иное" option
    if (legalBasisValue === LEGAL_BASIS_OTHER_VALUE) {
        // When "Иное" is selected, save to t600 instead of t336
        formData[FIELD_IDS.legalBasis] = '';
        formData[FIELD_IDS.legalBasisOther] = legalBasisOtherValue;
    } else {
        formData[FIELD_IDS.legalBasis] = legalBasisValue;
        formData[FIELD_IDS.legalBasisOther] = '';
    }

    formData[FIELD_IDS.legalAct] = $('#processLegalAct').val() || '';
    formData[FIELD_IDS.method] = $('#processMethod').val() || '';
    formData[FIELD_IDS.term] = $('#processTerm').val() || '';
    formData[FIELD_IDS.destruction] = $('#processDestruction').val() || '';

    // Determine URL
    let url;
    if (editingProcessId) {
        url = '/' + db + '/_m_save/' + editingProcessId + '?JSON';
    } else {
        url = '/' + db + '/_m_new/294?JSON&up=1';
    }

    $.ajax({
        url: url,
        method: 'POST',
        data: formData,
        dataType: 'json',
        success: function(response) {
            $('#processFormModal').modal('hide');
            showNotification(editingProcessId ? 'Процесс сохранен' : 'Процесс создан', 'success');
            loadProcesses();
        },
        error: function(xhr, status, error) {
            console.error('Error saving process:', error);
            $('#formError').text('Ошибка сохранения: ' + error).show();
        },
        complete: function() {
            btn.prop('disabled', false);
            spinner.addClass('d-none');
            btnText.text('Сохранить');
        }
    });
}

/**
 * Show notification message
 */
function showNotification(message, type) {
    const panel = $('#notificationPanel');
    const msgEl = $('#notificationMessage');

    panel.removeClass('error warning info success');
    if (type) {
        panel.addClass(type);
    }

    msgEl.text(message);
    panel.addClass('show');

    setTimeout(function() {
        panel.removeClass('show');
    }, 3000);
}

/**
 * Show loading state
 */
function showLoadingState() {
    $('#loadingState').show();
    $('#processGrid').hide();
    $('#emptyState').hide();
    $('#noResultsState').hide();
    $('#paginationNav').hide();
    $('#itemsCounter').hide();
}

/**
 * Hide loading state
 */
function hideLoadingState() {
    $('#loadingState').hide();
}

/**
 * Escape HTML entities
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent;
}

/**
 * Setup event listeners for data tabs
 */
function setupDataTabListeners() {
    $('#pdn-tab, #expertise-tab, #risks-tab, #transfer-tab').on('click', function(e) {
        e.preventDefault();
        const tabId = $(this).attr('id');
        let tabName = '';

        if (tabId === 'pdn-tab') tabName = 'ПДн';
        else if (tabId === 'expertise-tab') tabName = 'Экспертиза';
        else if (tabId === 'risks-tab') tabName = 'Риски';
        else if (tabId === 'transfer-tab') tabName = 'Передача';

        if (tabName && editingProcessId) {
            loadTabData(tabName, editingProcessId);
        }

        $(this).tab('show');
    });
}

/**
 * Load data for a specific tab
 */
function loadTabData(tabName, processId) {
    const cacheKey = processId + '_' + tabName;

    // If already cached, just render
    if (tabDataCache[cacheKey]) {
        renderTabData(tabName, tabDataCache[cacheKey], processId);
        return;
    }

    // Reset pagination and search for this tab
    tabPaginationState[tabName] = { page: 1, data: [], search: '' };

    const contentSelector = getTabContentSelector(tabName);
    $(contentSelector).html('<div class="text-center py-3"><div class="spinner-border spinner-border-sm" role="status"></div><p class="mt-2">Загрузка данных...</p></div>');

    $.ajax({
        url: '/' + db + '/report/proc%20' + encodeURIComponent(tabName) + '?JSON_KV&FR_procID=' + processId,
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            const items = Array.isArray(data) ? data : [];
            tabDataCache[cacheKey] = items;
            tabPaginationState[tabName].data = items;
            renderTabData(tabName, items, processId);
        },
        error: function(xhr, status, error) {
            console.error('Error loading tab data:', error);
            $(contentSelector).html('<div class="alert alert-danger mt-3">Ошибка загрузки данных: ' + escapeHtml(error) + '</div>');
        }
    });
}

/**
 * Get content selector for tab
 */
function getTabContentSelector(tabName) {
    const mapping = {
        'ПДн': '#pdnTabContent',
        'Экспертиза': '#expertiseTabContent',
        'Риски': '#risksTabContent',
        'Передача': '#transferTabContent'
    };
    return mapping[tabName] || '';
}

/**
 * Render tab data with appropriate view
 */
function renderTabData(tabName, items, processId) {
    const contentSelector = getTabContentSelector(tabName);
    const $content = $(contentSelector);

    if (!items || items.length === 0) {
        $content.html('<div class="alert alert-info mt-3">Нет данных для отображения</div>');
        return;
    }

    // Determine columns (exclude ID columns)
    const firstItem = items[0];
    const columns = Object.keys(firstItem).filter(key => !key.endsWith('ID'));
    const displayMode = columns.length <= 3 ? 'table' : 'cards';

    // Reset state
    tabPaginationState[tabName].page = 1;
    tabPaginationState[tabName].search = '';

    let html = '<div class="data-tab-wrapper">';

    // Toolbar
    html += '<div class="data-tab-toolbar mb-3">';
    html += '<button class="btn btn-sm btn-success mr-2" onclick="openAddRowDialog(\'' + escapeHtml(tabName) + '\')"><i class="bi bi-plus"></i> Добавить</button>';
    html += '<input type="text" class="form-control form-control-sm" style="flex: 1;" placeholder="Поиск и фильтрация..." onkeyup="filterTabData(\'' + escapeHtml(tabName) + '\', this.value)">';
    html += '</div>';

    // Render data
    if (displayMode === 'table') {
        html += renderTabDataAsTable(tabName, items, columns);
    } else {
        html += renderTabDataAsCards(tabName, items, columns);
    }

    html += '</div>';
    $content.html(html);
}

/**
 * Render tab data as table
 */
function renderTabDataAsTable(tabName, items, columns) {
    const state = tabPaginationState[tabName];
    const filteredItems = filterItems(items, state.search);
    const paginatedItems = getPaginatedItems(filteredItems, state.page);

    let html = '<div class="table-responsive">';
    html += '<table class="table table-sm table-hover mb-3">';
    html += '<thead class="thead-light">';
    html += '<tr>';
    columns.forEach(col => {
        html += '<th>' + escapeHtml(col) + '</th>';
    });
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';

    if (paginatedItems.length === 0) {
        html += '<tr><td colspan="' + columns.length + '" class="text-center text-muted py-3">Нет данных</td></tr>';
    } else {
        paginatedItems.forEach((item, idx) => {
            html += '<tr class="tab-row-clickable" onclick="openTabRowEditModal(\'' + escapeHtml(tabName) + '\', ' + JSON.stringify(item).replace(/"/g, '&quot;') + ')" style="cursor: pointer;">';
            columns.forEach(col => {
                const value = item[col];
                let cellHtml = formatTabCellValue(value, col);
                html += '<td>' + cellHtml + '</td>';
            });
            html += '</tr>';
        });
    }

    html += '</tbody>';
    html += '</table>';
    html += '</div>';

    // Pagination
    html += renderTabPagination(tabName, filteredItems.length);

    return html;
}

/**
 * Render tab data as cards
 */
function renderTabDataAsCards(tabName, items, columns) {
    const state = tabPaginationState[tabName];
    const filteredItems = filterItems(items, state.search);
    const paginatedItems = getPaginatedItems(filteredItems, state.page);

    let html = '<div class="row" style="margin: 0;">';

    if (paginatedItems.length === 0) {
        html += '<div class="col-12 text-center text-muted py-3">Нет данных</div>';
    } else {
        paginatedItems.forEach((item, idx) => {
            html += '<div class="col-md-6 col-lg-4 mb-3">';
            html += '<div class="card h-100" style="cursor: pointer;" onclick="openTabRowEditModal(\'' + escapeHtml(tabName) + '\', ' + JSON.stringify(item).replace(/"/g, '&quot;') + ')">';
            html += '<div class="card-body">';

            // First field as title (without label)
            let isFirst = true;
            columns.forEach(col => {
                if (isFirst) {
                    const value = item[col];
                    const cellHtml = formatTabCellValue(value, col);
                    html += '<h5 class="card-title mb-3">' + cellHtml + '</h5>';
                    isFirst = false;
                } else {
                    html += '<div class="mb-2">';
                    html += '<small class="text-muted d-block font-weight-bold">' + escapeHtml(col) + ':</small>';
                    const value = item[col];
                    const cellHtml = formatTabCellValue(value, col);
                    html += '<span>' + cellHtml + '</span>';
                    html += '</div>';
                }
            });

            html += '</div>';
            html += '</div>';
            html += '</div>';
        });
    }

    html += '</div>';

    // Pagination
    html += renderTabPagination(tabName, filteredItems.length);

    return html;
}

/**
 * Filter items by search query
 */
function filterItems(items, query) {
    if (!query || !query.trim()) return items;

    const q = query.toLowerCase();
    return items.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(q)
        )
    );
}

/**
 * Get paginated items
 */
function getPaginatedItems(items, page) {
    const start = (page - 1) * tabItemsPerPage;
    const end = start + tabItemsPerPage;
    return items.slice(start, end);
}

/**
 * Render pagination controls
 */
function renderTabPagination(tabName, totalItems) {
    const state = tabPaginationState[tabName];
    const totalPages = Math.ceil(totalItems / tabItemsPerPage);

    if (totalPages <= 1) {
        return '';
    }

    let html = '<nav class="mt-3">';
    html += '<div class="d-flex justify-content-between align-items-center">';
    html += '<span class="text-muted small">Показано ' + (Math.min(state.page * tabItemsPerPage, totalItems)) + ' из ' + totalItems + '</span>';

    if (state.page < totalPages) {
        html += '<button class="btn btn-sm btn-outline-secondary" onclick="nextTabPage(\'' + escapeHtml(tabName) + '\')">Загрузить еще (' + tabItemsPerPage + ' записей)</button>';
    }

    html += '</div>';
    html += '</nav>';

    return html;
}

/**
 * Filter tab data and re-render
 */
function filterTabData(tabName, query) {
    const state = tabPaginationState[tabName];
    state.search = query;
    state.page = 1;

    const contentSelector = getTabContentSelector(tabName);
    const items = state.data;
    const firstItem = items[0];
    const columns = Object.keys(firstItem).filter(key => !key.endsWith('ID'));
    const displayMode = columns.length <= 3 ? 'table' : 'cards';

    let html = '<div class="data-tab-wrapper">';

    // Toolbar
    html += '<div class="data-tab-toolbar mb-3">';
    html += '<button class="btn btn-sm btn-success mr-2" onclick="openAddRowDialog(\'' + escapeHtml(tabName) + '\')"><i class="bi bi-plus"></i> Добавить</button>';
    html += '<input type="text" class="form-control form-control-sm" style="flex: 1;" placeholder="Поиск и фильтрация..." value="' + escapeHtml(query) + '" onkeyup="filterTabData(\'' + escapeHtml(tabName) + '\', this.value)">';
    html += '</div>';

    // Render data
    if (displayMode === 'table') {
        html += renderTabDataAsTable(tabName, items, columns);
    } else {
        html += renderTabDataAsCards(tabName, items, columns);
    }

    html += '</div>';
    $(contentSelector).html(html);
}

/**
 * Load next page of tab data
 */
function nextTabPage(tabName) {
    const state = tabPaginationState[tabName];
    const filteredItems = filterItems(state.data, state.search);
    const totalPages = Math.ceil(filteredItems.length / tabItemsPerPage);

    if (state.page < totalPages) {
        state.page++;
        filterTabData(tabName, state.search);
        // Scroll to top of tab
        const contentSelector = getTabContentSelector(tabName);
        $(contentSelector).scrollTop(0);
    }
}

/**
 * Format cell value based on field type
 */
function formatTabCellValue(value, fieldName) {
    // Handle empty/null values
    if (value === null || value === undefined || value === '') {
        return '';
    }

    // Handle boolean fields (да/нет suffix)
    if (fieldName && fieldName.toLowerCase().includes('да/нет')) {
        const isChecked = value === true || value === '1' || value === 'да' || value === 'true';
        return '<input type="checkbox" disabled' + (isChecked ? ' checked' : '') + '>';
    }

    // Regular string value
    return escapeHtml(String(value));
}

/**
 * Open edit modal for tab row
 */
function openTabRowEditModal(tabName, itemData) {
    // Parse item data if it's a string
    let item = itemData;
    if (typeof itemData === 'string') {
        try {
            item = JSON.parse(itemData);
        } catch (e) {
            console.error('Error parsing item data:', e);
            showNotification('Ошибка открытия записи', 'error');
            return;
        }
    }

    // Get ID field from item
    const idField = Object.keys(item).find(key => key.endsWith('ID'));
    const itemId = idField ? item[idField] : null;

    if (!itemId) {
        showNotification('Не найден ID записи', 'error');
        return;
    }

    // TODO: Open edit modal with item data
    // For now, show placeholder
    showNotification('Функция редактирования в разработке. Tab: ' + tabName + ', ID: ' + itemId, 'info');
}

/**
 * Placeholder functions for row actions (to be implemented)
 */
function openAddRowDialog(tabName) {
    showNotification('Функция добавления в разработке', 'info');
}
