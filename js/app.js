var APP_INFO = {
  name: "工作管理平台",
  englishName: "Work Management Platform",
  version: "v2.2.0",
  poweredBy: "Campbell AI Office",
  description: "管理各類活動、任務、文件與預算，提升團隊工作效率。"
};

// Last Updated / App Meta

function applyAppInfo() {
  var metaDescription = document.querySelector("#app-meta-description");

  document.title = APP_INFO.name + "｜" + APP_INFO.englishName;
  setTextContent("#app-brand-name", APP_INFO.name);
  setTextContent("#app-brand-english-name", APP_INFO.englishName);
  setTextContent("#app-page-name", APP_INFO.name);
  setTextContent("#app-page-english-name", APP_INFO.englishName);
  setTextContent("#app-version", APP_INFO.version);
  setTextContent("#app-description", APP_INFO.description);
  setTextContent("#app-powered-by", "技術支援（Powered by " + APP_INFO.poweredBy + "）");

  if (metaDescription) {
    metaDescription.setAttribute("content", APP_INFO.description);
  }
}

function formatLastUpdated(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");
  var hour = String(date.getHours()).padStart(2, "0");
  var minute = String(date.getMinutes()).padStart(2, "0");

  return year + "/" + month + "/" + day + " " + hour + ":" + minute;
}

function updateLastUpdated() {
  var lastUpdated = document.querySelector("#last-updated");

  if (!lastUpdated) {
    return;
  }

  lastUpdated.textContent = "最後更新（Last Updated）: " + formatLastUpdated(new Date());
}

// Global State

var exhibitionData = [];

var selectedExhibitionId = null;

var taskData = [];

var documentData = [];

var budgetData = [];

var eventTemplateData = [];

var taskTemplateItemData = [];

var documentTemplateItemData = [];

var exhibitionDataLoaded = false;

var taskDataLoaded = false;

var documentDataLoaded = false;

var budgetDataLoaded = false;

var exhibitionDataReady = false;

var taskDataReady = false;

var documentDataReady = false;

var budgetDataReady = false;

var eventTemplateDataLoaded = false;

var taskTemplateItemDataLoaded = false;

var documentTemplateItemDataLoaded = false;

var templateDataReady = false;

var localStorageAvailable = null;

var templateNormalizationIdCounter = 0;

var taskEditOriginalDueDate = null;

// Mapping Constants

var statusTextMap = {
  planning: "規劃中",
  active: "進行中",
  done: "已完成"
};

var taskStatusTextMap = {
  todo: "待辦（To Do）",
  in_progress: "進行中（In Progress）",
  done: "已完成（Completed）",
  blocked: "封鎖（Blocked）"
};

var taskPriorityTextMap = {
  high: "高（High）",
  medium: "中（Medium）",
  low: "低（Low）"
};

var documentStatusTextMap = {
  draft: "草稿",
  review: "審核中",
  approved: "已核准",
  archived: "已封存"
};

var documentTypeTextMap = {
  market_research: "市場研究",
  budget: "預算",
  sales_list: "銷售名單",
  catalog: "型錄",
  follow_up: "後續追蹤",
  logistics: "物流文件"
};

var budgetCategoryTextMap = {
  booth: "展位與報名",
  travel: "交通與住宿",
  logistics: "物流與報關",
  marketing: "設計與行銷物料",
  other: "其他"
};

var budgetStatusTextMap = {
  planned: "已規劃",
  paid: "已支出",
  cancelled: "已取消"
};

var navigationSectionIds = [
  "dashboard-home",
  "exhibition-module",
  "template-module",
  "task-module",
  "document-module"
];

var localStorageKeys = {
  exhibitions: "eventManagement_exhibitions",
  tasks: "eventManagement_tasks",
  documents: "eventManagement_documents",
  budgets: "eventManagement_budgets",
  eventTemplates: "eventManagement_eventTemplates",
  taskTemplateItems: "eventManagement_taskTemplateItems",
  documentTemplateItems: "eventManagement_documentTemplateItems"
};

// Shared Utilities

function setTextContent(selector, text) {
  var element = document.querySelector(selector);

  if (element) {
    element.textContent = text;
  }
}

function countByStatus(items, status) {
  return items.filter(function(item) {
    return item.status === status;
  }).length;
}

function canUseLocalStorage() {
  var testKey = "eventManagement_storage_test";

  if (localStorageAvailable !== null) {
    return localStorageAvailable;
  }

  try {
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    localStorageAvailable = true;
  } catch (error) {
    console.warn("Local Storage is unavailable.", error);
    localStorageAvailable = false;
  }

  return localStorageAvailable;
}

function readDataFromLocalStorage(storageKey) {
  var storedValue;
  var parsedValue;

  if (!canUseLocalStorage()) {
    return null;
  }

  storedValue = window.localStorage.getItem(storageKey);

  if (storedValue === null) {
    return null;
  }

  try {
    parsedValue = JSON.parse(storedValue);
  } catch (error) {
    console.error("Failed to parse Local Storage data: " + storageKey, error);
    return null;
  }

  if (!Array.isArray(parsedValue)) {
    console.warn("Local Storage data is not an array: " + storageKey);
    return null;
  }

  return parsedValue;
}

function hasLocalStorageData(storageKey) {
  if (!canUseLocalStorage()) {
    return false;
  }

  return window.localStorage.getItem(storageKey) !== null;
}

function writeDataToLocalStorage(storageKey, data) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to write Local Storage data: " + storageKey, error);
  }
}

function getRawLocalStorageValue(storageKey) {
  if (!canUseLocalStorage()) {
    throw new Error("Local Storage is unavailable.");
  }

  return window.localStorage.getItem(storageKey);
}

function setRawLocalStorageValue(storageKey, value) {
  if (!canUseLocalStorage()) {
    throw new Error("Local Storage is unavailable.");
  }

  window.localStorage.setItem(storageKey, value);
}

function restoreRawLocalStorageValue(storageKey, value) {
  if (!canUseLocalStorage()) {
    return;
  }

  if (value === null) {
    window.localStorage.removeItem(storageKey);
    return;
  }

  window.localStorage.setItem(storageKey, value);
}

function fetchJsonData(jsonPath) {
  return fetch(jsonPath, { cache: "no-store" })
    .then(function(response) {
      if (!response.ok) {
        throw new Error("Failed to load data: " + jsonPath);
      }

      return response.json();
    });
}

function loadDataFromStorageOrJson(storageKey, jsonPath) {
  var storedData = readDataFromLocalStorage(storageKey);

  if (storedData) {
    return Promise.resolve(storedData);
  }

  return fetchJsonData(jsonPath)
    .then(function(data) {
      writeDataToLocalStorage(storageKey, data);
      return data;
    });
}

function loadValidatedTemplateDataFromStorageOrJson(storageKey, jsonPath, validateData, dataLabel, useSampleWhenStoredDataInvalid) {
  var storageHasData = hasLocalStorageData(storageKey);
  var storedData = readDataFromLocalStorage(storageKey);

  if (storageHasData) {
    if (storedData && validateData(storedData)) {
      return Promise.resolve(storedData);
    }

    if (useSampleWhenStoredDataInvalid === false) {
      console.warn(dataLabel + " Local Storage validation failed. Existing Local Storage will not be overwritten.");
      return Promise.reject(new Error(dataLabel + " Local Storage validation failed."));
    }

    console.warn(dataLabel + " Local Storage validation failed. Sample data will be used in memory without overwriting Local Storage.");

    return fetchJsonData(jsonPath)
      .then(function(data) {
        if (!validateData(data)) {
          throw new Error(dataLabel + " sample data validation failed.");
        }

        return data;
      });
  }

  return fetchJsonData(jsonPath)
    .then(function(data) {
      if (!validateData(data)) {
        throw new Error(dataLabel + " sample data validation failed.");
      }

      writeDataToLocalStorage(storageKey, data);
      return data;
    });
}

function saveExhibitionDataToStorage() {
  writeDataToLocalStorage(localStorageKeys.exhibitions, exhibitionData);
}

function saveTaskDataToStorage() {
  writeDataToLocalStorage(localStorageKeys.tasks, taskData);
}

function saveDocumentDataToStorage() {
  writeDataToLocalStorage(localStorageKeys.documents, documentData);
}

function saveBudgetDataToStorage() {
  if (validateBudgetItems(budgetData, exhibitionData)) {
    writeDataToLocalStorage(localStorageKeys.budgets, budgetData);
  }
}

function saveEventTemplateDataToStorage() {
  if (validateEventTemplates(eventTemplateData)) {
    writeDataToLocalStorage(localStorageKeys.eventTemplates, eventTemplateData);
  }
}

function clearLocalStorageData() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(localStorageKeys.exhibitions);
  window.localStorage.removeItem(localStorageKeys.tasks);
  window.localStorage.removeItem(localStorageKeys.documents);
  window.localStorage.removeItem(localStorageKeys.budgets);
  window.localStorage.removeItem(localStorageKeys.eventTemplates);
  window.localStorage.removeItem(localStorageKeys.taskTemplateItems);
  window.localStorage.removeItem(localStorageKeys.documentTemplateItems);
}

function isBlankTemplateValue(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function isValidRelativeDueDays(value) {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function isValidTemplateSortOrder(value) {
  return Number.isInteger(value) && value >= 1;
}

function isValidTemplateDateString(value) {
  return typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

function isValidRuntimeTaskDateBasis(value) {
  return value === "startDate" || value === "endDate";
}

function normalizeRuntimeTaskMetadata(task) {
  var sourceTask = task && typeof task === "object" && !Array.isArray(task) ? task : {};
  var normalizedTask = Object.assign({}, sourceTask);
  var sourceTemplateId = isBlankTemplateValue(sourceTask.sourceTemplateId) ? null : sourceTask.sourceTemplateId;
  var sourceTemplateItemId = isBlankTemplateValue(sourceTask.sourceTemplateItemId) ? null : sourceTask.sourceTemplateItemId;
  var hasRelativeDueDays = Object.prototype.hasOwnProperty.call(sourceTask, "relativeDueDays") &&
    isValidRelativeDueDays(sourceTask.relativeDueDays);
  var relativeDueDays = hasRelativeDueDays ? sourceTask.relativeDueDays : null;
  var dateBasis = isValidRuntimeTaskDateBasis(sourceTask.dateBasis) ? sourceTask.dateBasis : null;
  var hasCompleteRelativeMetadata = sourceTask.dueDateMode === "relative" &&
    sourceTemplateId !== null &&
    sourceTemplateItemId !== null &&
    hasRelativeDueDays &&
    dateBasis !== null;

  normalizedTask.sourceTemplateId = sourceTemplateId;
  normalizedTask.sourceTemplateItemId = sourceTemplateItemId;
  normalizedTask.dueDateMode = hasCompleteRelativeMetadata ? "relative" : "manual";
  normalizedTask.relativeDueDays = relativeDueDays;
  normalizedTask.dateBasis = dateBasis;

  return normalizedTask;
}

function normalizeRuntimeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error("Task data must be an array.");
  }

  return tasks.map(normalizeRuntimeTaskMetadata);
}

function warnTemplateValidation(dataLabel, message, item) {
  if (item === undefined) {
    console.warn(dataLabel + " validation failed: " + message);
    return;
  }

  console.warn(dataLabel + " validation failed: " + message, item);
}

function deepCopyTemplateData(value) {
  return JSON.parse(JSON.stringify(value));
}

function createUniqueTemplateEntityId(prefix, usedIds) {
  var candidate;

  do {
    templateNormalizationIdCounter += 1;

    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      candidate = prefix + "-" + window.crypto.randomUUID();
    } else {
      candidate = prefix + "-" + Date.now().toString(36) + "-" + templateNormalizationIdCounter.toString(36);
    }
  } while (usedIds[candidate]);

  usedIds[candidate] = true;
  return candidate;
}

function normalizeTemplateEntityId(value, prefix, usedIds) {
  var id = isBlankTemplateValue(value) ? "" : String(value);

  if (id && !usedIds[id]) {
    usedIds[id] = true;
    return id;
  }

  if (id) {
    console.warn("Duplicate Template entity ID was replaced during normalization: " + id);
  }

  return createUniqueTemplateEntityId(prefix, usedIds);
}

function normalizeTemplateIsoDate(value, fallbackValue) {
  return isValidTemplateDateString(value) ? value : fallbackValue;
}

function normalizeTaskTemplatePriority(value) {
  var normalizedValue = String(value || "").toLowerCase();

  return taskPriorityTextMap[normalizedValue] ? normalizedValue : "medium";
}

function getLegacyItemsForTemplate(legacyItems, originalTemplateId, templateCount) {
  if (!Array.isArray(legacyItems)) {
    return [];
  }

  if (!isBlankTemplateValue(originalTemplateId)) {
    return legacyItems.filter(function(item) {
      return item && String(item.templateId) === String(originalTemplateId);
    });
  }

  return templateCount === 1 ? legacyItems.slice() : [];
}

function getTemplateItemSource(template, fieldName, legacyItems, originalTemplateId, templateCount, options) {
  var hasEmbeddedCollection = Object.prototype.hasOwnProperty.call(template, fieldName);
  var embeddedItems = template[fieldName];
  var shouldUseLegacyWhenEmpty = options && options.useLegacyItemsForEmptyCollections === true;

  if (
    Array.isArray(embeddedItems) &&
    (!shouldUseLegacyWhenEmpty || embeddedItems.length > 0)
  ) {
    return embeddedItems;
  }

  if (!hasEmbeddedCollection || shouldUseLegacyWhenEmpty || !Array.isArray(embeddedItems)) {
    return getLegacyItemsForTemplate(legacyItems, originalTemplateId, templateCount);
  }

  return [];
}

function normalizeTaskTemplateItem(item, templateId, index, usedIds, fallbackDateBasis) {
  var sourceItem = item && typeof item === "object" && !Array.isArray(item) ? item : {};
  var normalizedItem = Object.assign({}, sourceItem);
  var relativeDueDays = isValidRelativeDueDays(sourceItem.relativeDueDays)
    ? sourceItem.relativeDueDays
    : sourceItem.relativeDays;
  var status = String(sourceItem.defaultStatus || "").toLowerCase();

  normalizedItem.id = normalizeTemplateEntityId(sourceItem.id, "task-template", usedIds);
  normalizedItem.templateId = templateId;
  normalizedItem.title = sourceItem.title === undefined || sourceItem.title === null ? "" : String(sourceItem.title);
  normalizedItem.description = typeof sourceItem.description === "string" ? sourceItem.description : "";
  normalizedItem.owner = isBlankTemplateValue(sourceItem.owner) ? "行銷" : sourceItem.owner;
  normalizedItem.priority = normalizeTaskTemplatePriority(sourceItem.priority);
  normalizedItem.defaultStatus = taskStatusTextMap[status] ? status : "todo";
  normalizedItem.relativeDueDays = isValidRelativeDueDays(relativeDueDays) ? relativeDueDays : null;
  normalizedItem.dateBasis = sourceItem.dateBasis === "startDate" || sourceItem.dateBasis === "endDate"
    ? sourceItem.dateBasis
    : fallbackDateBasis;
  normalizedItem.sortOrder = isValidTemplateSortOrder(sourceItem.sortOrder) ? sourceItem.sortOrder : index + 1;

  return normalizedItem;
}

function normalizeDocumentTemplateItem(item, templateId, index, usedIds, fallbackDateBasis) {
  var sourceItem = item && typeof item === "object" && !Array.isArray(item) ? item : {};
  var normalizedItem = Object.assign({}, sourceItem);
  var relativeDueDays = isValidRelativeDueDays(sourceItem.relativeDueDays)
    ? sourceItem.relativeDueDays
    : sourceItem.relativeDays;
  var status = String(sourceItem.defaultStatus || "").toLowerCase();
  var type = String(sourceItem.type || "").toLowerCase();

  normalizedItem.id = normalizeTemplateEntityId(sourceItem.id, "document-template", usedIds);
  normalizedItem.templateId = templateId;
  normalizedItem.title = sourceItem.title === undefined || sourceItem.title === null ? "" : String(sourceItem.title);
  normalizedItem.type = documentTypeTextMap[type] ? type : "logistics";
  normalizedItem.owner = isBlankTemplateValue(sourceItem.owner) ? "Marketing Team" : sourceItem.owner;
  normalizedItem.defaultStatus = documentStatusTextMap[status] ? status : "draft";
  normalizedItem.relativeDueDays = isValidRelativeDueDays(relativeDueDays) ? relativeDueDays : null;
  normalizedItem.dateBasis = sourceItem.dateBasis === "startDate" || sourceItem.dateBasis === "endDate"
    ? sourceItem.dateBasis
    : fallbackDateBasis;
  normalizedItem.sortOrder = isValidTemplateSortOrder(sourceItem.sortOrder) ? sourceItem.sortOrder : index + 1;

  return normalizedItem;
}

function normalizeEventTemplates(templates, legacyTaskItems, legacyDocumentItems, options) {
  var usedTemplateIds = {};
  var usedTaskTemplateIds = {};
  var usedDocumentTemplateIds = {};
  var normalizationTimestamp = new Date().toISOString();

  if (!Array.isArray(templates)) {
    throw new Error("Event Templates data must be an array.");
  }

  return templates.map(function(template) {
    var sourceTemplate = template && typeof template === "object" && !Array.isArray(template) ? template : {};
    var normalizedTemplate = Object.assign({}, sourceTemplate);
    var originalTemplateId = sourceTemplate.id;
    var templateId = normalizeTemplateEntityId(originalTemplateId, "event-template", usedTemplateIds);
    var taskItems = getTemplateItemSource(
      sourceTemplate,
      "taskTemplates",
      legacyTaskItems,
      originalTemplateId,
      templates.length,
      options
    );
    var documentItems = getTemplateItemSource(
      sourceTemplate,
      "documentTemplates",
      legacyDocumentItems,
      originalTemplateId,
      templates.length,
      options
    );
    var createdAt = normalizeTemplateIsoDate(sourceTemplate.createdAt, normalizationTimestamp);

    normalizedTemplate.id = templateId;
    normalizedTemplate.name = sourceTemplate.name === undefined || sourceTemplate.name === null ? "" : String(sourceTemplate.name);
    normalizedTemplate.description = typeof sourceTemplate.description === "string" ? sourceTemplate.description : "";
    normalizedTemplate.eventType = !isBlankTemplateValue(sourceTemplate.eventType)
      ? String(sourceTemplate.eventType)
      : (!isBlankTemplateValue(sourceTemplate.type) ? String(sourceTemplate.type) : "Exhibition");
    normalizedTemplate.dateBasis = sourceTemplate.dateBasis === "endDate" ? "endDate" : "startDate";
    normalizedTemplate.isActive = typeof sourceTemplate.isActive === "boolean" ? sourceTemplate.isActive : true;
    normalizedTemplate.taskTemplates = taskItems.map(function(item, index) {
      return normalizeTaskTemplateItem(item, templateId, index, usedTaskTemplateIds, normalizedTemplate.dateBasis);
    });
    normalizedTemplate.documentTemplates = documentItems.map(function(item, index) {
      return normalizeDocumentTemplateItem(item, templateId, index, usedDocumentTemplateIds, normalizedTemplate.dateBasis);
    });
    normalizedTemplate.createdAt = createdAt;
    normalizedTemplate.updatedAt = normalizeTemplateIsoDate(sourceTemplate.updatedAt, createdAt);

    return normalizedTemplate;
  });
}

function getTaskTemplateItemsFromEventTemplates(templates) {
  return (Array.isArray(templates) ? templates : []).reduce(function(items, template) {
    var templateItems = Array.isArray(template.taskTemplates) ? template.taskTemplates : [];

    return items.concat(templateItems.map(function(item) {
      return Object.assign({}, item, { templateId: template.id });
    }));
  }, []);
}

function getDocumentTemplateItemsFromEventTemplates(templates) {
  return (Array.isArray(templates) ? templates : []).reduce(function(items, template) {
    var templateItems = Array.isArray(template.documentTemplates) ? template.documentTemplates : [];

    return items.concat(templateItems.map(function(item) {
      return Object.assign({}, item, { templateId: template.id });
    }));
  }, []);
}

function applyNormalizedEventTemplateData(templates) {
  eventTemplateData = templates;
  taskTemplateItemData = getTaskTemplateItemsFromEventTemplates(templates);
  documentTemplateItemData = getDocumentTemplateItemsFromEventTemplates(templates);
}

function getEventTemplateIdLookup(templates) {
  var lookup = {};

  if (!Array.isArray(templates)) {
    return lookup;
  }

  templates.forEach(function(template) {
    if (template && !isBlankTemplateValue(template.id)) {
      lookup[String(template.id)] = true;
    }
  });

  return lookup;
}

function validateTemplateCollection(items, options) {
  var isValid = true;
  var ids = {};

  if (!Array.isArray(items)) {
    warnTemplateValidation(options.dataLabel, "data must be an array.");
    return false;
  }

  items.forEach(function(item, index) {
    var idKey;
    var templateIdKey;
    var statusValue;
    var priorityValue;
    var typeValue;

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      warnTemplateValidation(options.dataLabel, "item #" + (index + 1) + " must be an object.", item);
      isValid = false;
      return;
    }

    if (isBlankTemplateValue(item.id)) {
      warnTemplateValidation(options.dataLabel, "item #" + (index + 1) + " id must not be blank.", item);
      isValid = false;
    } else {
      idKey = String(item.id);

      if (ids[idKey]) {
        warnTemplateValidation(options.dataLabel, "duplicate id: " + idKey, item);
        isValid = false;
      }

      ids[idKey] = true;
    }

    if (options.titleField && isBlankTemplateValue(item[options.titleField])) {
      warnTemplateValidation(options.dataLabel, options.titleField + " must not be blank.", item);
      isValid = false;
    }

    if (options.requireIsActive && typeof item.isActive !== "boolean") {
      warnTemplateValidation(options.dataLabel, "isActive must be boolean.", item);
      isValid = false;
    }

    if (options.requiredFields) {
      options.requiredFields.forEach(function(fieldName) {
        if (isBlankTemplateValue(item[fieldName])) {
          warnTemplateValidation(options.dataLabel, fieldName + " must not be blank.", item);
          isValid = false;
        }
      });
    }

    if (options.dateFields) {
      options.dateFields.forEach(function(fieldName) {
        if (!isValidTemplateDateString(item[fieldName])) {
          warnTemplateValidation(options.dataLabel, fieldName + " must be a valid date string.", item);
          isValid = false;
        }
      });
    }

    if (options.templateIdLookup) {
      if (isBlankTemplateValue(item.templateId)) {
        warnTemplateValidation(options.dataLabel, "templateId must not be blank.", item);
        isValid = false;
      } else {
        templateIdKey = String(item.templateId);

        if (!options.templateIdLookup[templateIdKey]) {
          warnTemplateValidation(options.dataLabel, "templateId does not match an existing Event Template: " + templateIdKey, item);
          isValid = false;
        }
      }
    }

    if (options.requireRelativeDueDays && !isValidRelativeDueDays(item.relativeDueDays)) {
      warnTemplateValidation(options.dataLabel, "relativeDueDays must be a number or null.", item);
      isValid = false;
    }

    if (options.requireSortOrder && !isValidTemplateSortOrder(item.sortOrder)) {
      warnTemplateValidation(options.dataLabel, "sortOrder must be an integer greater than or equal to 1.", item);
      isValid = false;
    }

    if (options.statusField && options.statusMap) {
      statusValue = item[options.statusField];

      if (!options.statusMap[statusValue]) {
        warnTemplateValidation(options.dataLabel, options.statusField + " must use an existing status value.", item);
        isValid = false;
      }
    }

    if (options.priorityField && options.priorityMap) {
      priorityValue = item[options.priorityField];

      if (!options.priorityMap[priorityValue]) {
        warnTemplateValidation(options.dataLabel, options.priorityField + " must use an existing priority value.", item);
        isValid = false;
      }
    }

    if (options.typeField && options.typeMap) {
      typeValue = item[options.typeField];

      if (!options.typeMap[typeValue]) {
        warnTemplateValidation(options.dataLabel, options.typeField + " must use an existing document type value.", item);
        isValid = false;
      }
    }
  });

  return isValid;
}

function validateEventTemplates(templates) {
  var isValid = validateTemplateCollection(templates, {
    dataLabel: "Event Templates",
    titleField: "name",
    requireIsActive: true,
    requiredFields: ["eventType"],
    dateFields: ["createdAt", "updatedAt"]
  });

  if (!Array.isArray(templates)) {
    return false;
  }

  templates.forEach(function(template) {
    if (!template || typeof template !== "object" || Array.isArray(template)) {
      return;
    }

    if (typeof template.description !== "string") {
      warnTemplateValidation("Event Templates", "description must be a string.", template);
      isValid = false;
    }

    if (template.dateBasis !== "startDate" && template.dateBasis !== "endDate") {
      warnTemplateValidation("Event Templates", "dateBasis must be startDate or endDate.", template);
      isValid = false;
    }

    if (!Array.isArray(template.taskTemplates)) {
      warnTemplateValidation("Event Templates", "taskTemplates must be an array.", template);
      isValid = false;
    }

    if (!Array.isArray(template.documentTemplates)) {
      warnTemplateValidation("Event Templates", "documentTemplates must be an array.", template);
      isValid = false;
    }
  });

  if (!validateTaskTemplateItems(getTaskTemplateItemsFromEventTemplates(templates), templates)) {
    isValid = false;
  }

  if (!validateDocumentTemplateItems(getDocumentTemplateItemsFromEventTemplates(templates), templates)) {
    isValid = false;
  }

  return isValid;
}

function validateTaskTemplateItems(items, templates) {
  var isValid = validateTemplateCollection(items, {
    dataLabel: "Task Template Items",
    titleField: "title",
    templateIdLookup: getEventTemplateIdLookup(templates),
    requireRelativeDueDays: true,
    requireSortOrder: true,
    statusField: "defaultStatus",
    statusMap: taskStatusTextMap,
    priorityField: "priority",
    priorityMap: taskPriorityTextMap
  });

  (Array.isArray(items) ? items : []).forEach(function(item) {
    if (item && item.dateBasis !== "startDate" && item.dateBasis !== "endDate") {
      warnTemplateValidation("Task Template Items", "dateBasis must be startDate or endDate.", item);
      isValid = false;
    }
  });

  return isValid;
}

function validateDocumentTemplateItems(items, templates) {
  var isValid = validateTemplateCollection(items, {
    dataLabel: "Document Template Items",
    titleField: "title",
    templateIdLookup: getEventTemplateIdLookup(templates),
    requireRelativeDueDays: true,
    requireSortOrder: true,
    statusField: "defaultStatus",
    statusMap: documentStatusTextMap,
    typeField: "type",
    typeMap: documentTypeTextMap
  });

  (Array.isArray(items) ? items : []).forEach(function(item) {
    if (item && item.dateBasis !== "startDate" && item.dateBasis !== "endDate") {
      warnTemplateValidation("Document Template Items", "dateBasis must be startDate or endDate.", item);
      isValid = false;
    }
  });

  return isValid;
}

function validateBudgetItems(items, exhibitions) {
  var isValid = true;
  var ids = {};
  var exhibitionIds = {};

  if (!Array.isArray(items)) {
    warnTemplateValidation("Budget Items", "data must be an array.");
    return false;
  }

  if (!Array.isArray(exhibitions)) {
    warnTemplateValidation("Budget Items", "exhibitions must be an array.");
    return false;
  }

  exhibitions.forEach(function(exhibition) {
    if (exhibition && !isBlankTemplateValue(exhibition.id)) {
      exhibitionIds[String(exhibition.id)] = true;
    }
  });

  items.forEach(function(item, index) {
    var idKey;
    var exhibitionIdKey;

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      warnTemplateValidation("Budget Items", "item #" + (index + 1) + " must be an object.", item);
      isValid = false;
      return;
    }

    if (isBlankTemplateValue(item.id)) {
      warnTemplateValidation("Budget Items", "item #" + (index + 1) + " id must not be blank.", item);
      isValid = false;
    } else {
      idKey = String(item.id);

      if (Object.prototype.hasOwnProperty.call(ids, idKey)) {
        warnTemplateValidation("Budget Items", "duplicate id: " + idKey, item);
        isValid = false;
      }

      ids[idKey] = true;
    }

    if (isBlankTemplateValue(item.exhibitionId)) {
      warnTemplateValidation("Budget Items", "exhibitionId must not be blank.", item);
      isValid = false;
    } else {
      exhibitionIdKey = String(item.exhibitionId);

      if (!Object.prototype.hasOwnProperty.call(exhibitionIds, exhibitionIdKey)) {
        warnTemplateValidation("Budget Items", "exhibitionId does not match an existing Event: " + exhibitionIdKey, item);
        isValid = false;
      }
    }

    if (isBlankTemplateValue(item.title)) {
      warnTemplateValidation("Budget Items", "title must not be blank.", item);
      isValid = false;
    }

    if (!Object.prototype.hasOwnProperty.call(budgetCategoryTextMap, item.category)) {
      warnTemplateValidation("Budget Items", "category must use an existing Budget category value.", item);
      isValid = false;
    }

    if (!Object.prototype.hasOwnProperty.call(budgetStatusTextMap, item.status)) {
      warnTemplateValidation("Budget Items", "status must use an existing Budget status value.", item);
      isValid = false;
    }

    if (typeof item.estimatedAmount !== "number" || !Number.isFinite(item.estimatedAmount) || item.estimatedAmount < 0) {
      warnTemplateValidation("Budget Items", "estimatedAmount must be a finite number greater than or equal to 0.", item);
      isValid = false;
    }

    if (typeof item.actualAmount !== "number" || !Number.isFinite(item.actualAmount) || item.actualAmount < 0) {
      warnTemplateValidation("Budget Items", "actualAmount must be a finite number greater than or equal to 0.", item);
      isValid = false;
    }

    if (
      typeof item.updatedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(item.updatedAt) ||
      !isValidInputDate(item.updatedAt)
    ) {
      warnTemplateValidation("Budget Items", "updatedAt must be a valid date string.", item);
      isValid = false;
    }
  });

  return isValid;
}

function getNextNumericId(items, getId) {
  return items.reduce(function(maxId, item) {
    var numericId = Number(getId(item));

    if (!Number.isFinite(numericId)) {
      return maxId;
    }

    return Math.max(maxId, numericId);
  }, 0) + 1;
}

function scrollToFormElement(formElement) {
  var formTop;
  var scrollTarget;

  if (!formElement) {
    return;
  }

  formTop = formElement.getBoundingClientRect().top + window.scrollY;
  scrollTarget = Math.max(formTop - 120, 0);

  window.requestAnimationFrame(function() {
    window.scrollTo({
      top: scrollTarget,
      behavior: "smooth"
    });
    applyTemporaryHighlight(formElement);
  });
}

function clearEditId(editIdInput) {
  if (editIdInput) {
    editIdInput.value = "";
  }
}

function setSubmitButtonText(button, text) {
  if (button) {
    button.textContent = text;
  }
}

function setCancelButtonVisible(button, visible) {
  if (button) {
    button.hidden = !visible;
  }
}

function resetFormEditState(elements, submitText) {
  if (!elements.form) {
    return false;
  }

  elements.form.reset();
  clearEditId(elements.editIdInput);
  setSubmitButtonText(elements.submitButton, submitText);
  setCancelButtonVisible(elements.cancelButton, false);

  return true;
}

function setFormEditState(elements, editId, submitText) {
  if (elements.editIdInput) {
    elements.editIdInput.value = editId;
  }

  setSubmitButtonText(elements.submitButton, submitText);
  setCancelButtonVisible(elements.cancelButton, true);
}

function formatDisplayDate(dateText) {
  if (!dateText) {
    return "待確認";
  }

  return String(dateText).replaceAll("-", "/");
}

function getDisplayValue(value) {
  if (value === undefined || value === null || value === "") {
    return "待確認";
  }

  return value;
}

function getDateRange(exhibition) {
  if (!exhibition.startDate && !exhibition.endDate) {
    return "待確認";
  }

  return formatDisplayDate(exhibition.startDate) + " - " + formatDisplayDate(exhibition.endDate);
}

function getStatusText(status) {
  return statusTextMap[status] || "待確認";
}

function getStatusClass(status) {
  if (!statusTextMap[status]) {
    return "status-badge--planning";
  }

  return "status-badge--" + status;
}

function createEmptyStateMarkup(title, description, modifierClass) {
  var className = "empty-state";
  var descriptionMarkup = "";

  if (modifierClass) {
    className += " " + modifierClass;
  }

  if (description) {
    descriptionMarkup = "<p class=\"empty-state__description\">" + escapeHtml(description) + "</p>";
  }

  return "" +
    "<div class=\"" + escapeHtml(className) + "\">" +
      "<p class=\"empty-state__title\">" + escapeHtml(title) + "</p>" +
      descriptionMarkup +
    "</div>";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function getExhibitionById(exhibitionId) {
  return exhibitionData.find(function(exhibition) {
    return String(exhibition.id) === String(exhibitionId);
  }) || null;
}

function getDocumentById(documentId) {
  return documentData.find(function(documentItem) {
    return String(documentItem.id) === String(documentId);
  }) || null;
}

function setControlValue(selector, value) {
  var control = document.querySelector(selector);

  if (control) {
    control.value = value;
  }
}

function getRenderedDataElement(selector, dataKey, itemId) {
  var matchedElement = null;

  document.querySelectorAll(selector).forEach(function(element) {
    if (element.dataset[dataKey] === String(itemId)) {
      matchedElement = element;
    }
  });

  return matchedElement;
}

function applyTemporaryHighlight(element) {
  if (!element) {
    return;
  }

  element.classList.remove("deep-link-highlight");
  void element.offsetWidth;
  element.classList.add("deep-link-highlight");

  window.setTimeout(function() {
    element.classList.remove("deep-link-highlight");
  }, 2200);
}

function scrollToAndHighlightElement(element) {
  if (!element) {
    return;
  }

  element.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
  applyTemporaryHighlight(element);
}

// Dashboard / Current Exhibition

function updateDashboardHomeSummary() {
  var exhibitionPlanningCount = countByStatus(exhibitionData, "planning");
  var exhibitionActiveCount = countByStatus(exhibitionData, "active");
  var exhibitionDoneCount = countByStatus(exhibitionData, "done");
  var taskTodoCount = countByStatus(taskData, "todo");
  var taskInProgressCount = countByStatus(taskData, "in_progress");
  var taskDoneCount = countByStatus(taskData, "done");
  var taskBlockedCount = countByStatus(taskData, "blocked");
  var documentDraftCount = countByStatus(documentData, "draft");
  var documentReviewCount = countByStatus(documentData, "review");
  var documentApprovedCount = countByStatus(documentData, "approved");
  var documentArchivedCount = countByStatus(documentData, "archived");

  setTextContent("#home-exhibition-total", exhibitionData.length);
  setTextContent(
    "#home-exhibition-status",
    "規劃中 " + exhibitionPlanningCount + "｜進行中 " + exhibitionActiveCount + "｜已完成 " + exhibitionDoneCount
  );
  setTextContent("#home-task-total", taskData.length);
  setTextContent(
    "#home-task-status",
    "待辦 " + taskTodoCount + "｜進行中 " + taskInProgressCount + "｜已完成 " + taskDoneCount + "｜封鎖 " + taskBlockedCount
  );
  setTextContent("#home-document-total", documentData.length);
  setTextContent(
    "#home-document-status",
    "草稿 " + documentDraftCount + "｜審核中 " + documentReviewCount + "｜已核准 " + documentApprovedCount + "｜已封存 " + documentArchivedCount
  );
}

function getDueTodayTasks(tasks) {
  return tasks.filter(function(task) {
    return getDaysUntilDue(task.dueDate) === 0 && !isTaskDone(task);
  });
}

function getDueTodayTaskCount(tasks) {
  return getDueTodayTasks(tasks).length;
}

function getUpcomingTasks(tasks) {
  return tasks.filter(function(task) {
    var daysUntilDue = getDaysUntilDue(task.dueDate);

    return daysUntilDue !== null && daysUntilDue >= 1 && daysUntilDue <= 3 && !isTaskDone(task);
  });
}

function getUpcomingTaskCount(tasks) {
  return getUpcomingTasks(tasks).length;
}

function getDocumentsInReview(documents) {
  return documents.filter(function(documentItem) {
    return documentItem.status === "review";
  });
}

function getExhibitionNameById(exhibitionId) {
  var exhibition = getExhibitionById(exhibitionId);

  if (!exhibition) {
    return "未對應活動（Unknown Event）";
  }

  return getDisplayValue(exhibition.name);
}

function getUniqueExhibitionNamesFromItems(items) {
  var uniqueNames = [];
  var existingNames = {};

  items.forEach(function(item) {
    var exhibitionName = getExhibitionNameById(item.exhibitionId);

    if (!existingNames[exhibitionName]) {
      uniqueNames.push(exhibitionName);
      existingNames[exhibitionName] = true;
    }
  });

  return uniqueNames;
}

function renderTodayFocusSources(targetSelector, items) {
  var target = document.querySelector(targetSelector);
  var exhibitionNames;
  var visibleNames;
  var moreCount;

  if (!target) {
    return;
  }

  if (!items.length) {
    target.innerHTML = "" +
      "<p class=\"today-focus-card__empty\">" +
        "目前無需處理" +
        "<span>No items</span>" +
      "</p>";
    return;
  }

  exhibitionNames = getUniqueExhibitionNamesFromItems(items);
  visibleNames = exhibitionNames.slice(0, 3);
  moreCount = exhibitionNames.length - visibleNames.length;

  target.innerHTML = "" +
    "<p class=\"today-focus-card__source-title\">來源活動（Source Events）：</p>" +
    "<ul class=\"today-focus-card__source-list\">" +
      visibleNames.map(function(exhibitionName) {
        return "<li>" + escapeHtml(exhibitionName) + "</li>";
      }).join("") +
    "</ul>" +
    (moreCount > 0 ? "<p class=\"today-focus-card__more\">+ " + escapeHtml(moreCount) + " more</p>" : "");
}

function updateTodayFocusSummary() {
  var messageElement = document.querySelector("#today-focus-message");
  var overdueTasks;
  var dueTodayTasks;
  var dueSoonTasks;
  var documentsInReview;

  overdueTasks = taskData.filter(isTaskOverdue);
  dueTodayTasks = getDueTodayTasks(taskData);
  dueSoonTasks = getUpcomingTasks(taskData);
  documentsInReview = getDocumentsInReview(documentData);

  setTextContent("#focus-overdue-tasks", overdueTasks.length);
  setTextContent("#focus-due-today", dueTodayTasks.length);
  setTextContent("#focus-due-soon", dueSoonTasks.length);
  setTextContent("#focus-documents-review", documentsInReview.length);

  renderTodayFocusSources("#focus-overdue-sources", overdueTasks);
  renderTodayFocusSources("#focus-due-today-sources", dueTodayTasks);
  renderTodayFocusSources("#focus-due-soon-sources", dueSoonTasks);
  renderTodayFocusSources("#focus-documents-review-sources", documentsInReview);

  if (messageElement) {
    messageElement.hidden = true;
    messageElement.textContent = "";
  }
}

function getSelectedExhibition() {
  if (!selectedExhibitionId) {
    return null;
  }

  return exhibitionData.find(function(exhibition) {
    return String(exhibition.id) === selectedExhibitionId;
  }) || null;
}

function isRelatedToSelectedExhibition(item) {
  return selectedExhibitionId && String(item.exhibitionId) === selectedExhibitionId;
}

function getTasksForSelectedExhibition() {
  return taskData.filter(isRelatedToSelectedExhibition);
}

function getDocumentsForSelectedExhibition() {
  return documentData.filter(isRelatedToSelectedExhibition);
}

function getBudgetsForSelectedExhibition() {
  return budgetData.filter(isRelatedToSelectedExhibition);
}

function updateSelectedExhibitionIndicator() {
  var selectedExhibition = getSelectedExhibition();
  var statusElement = document.querySelector("#current-exhibition-status");

  if (!selectedExhibition) {
    setTextContent("#current-exhibition-name", "尚未選擇活動（No Event Selected）");
    setTextContent("#current-exhibition-meta", "請從活動清單選擇一筆活動。");

    if (statusElement) {
      statusElement.className = "status-badge current-exhibition__badge status-badge--planning";
      statusElement.textContent = "待確認";
    }

    return;
  }

  setTextContent("#current-exhibition-name", getDisplayValue(selectedExhibition.name));
  setTextContent(
    "#current-exhibition-meta",
    getDisplayValue(selectedExhibition.country) + " / " +
      getDisplayValue(selectedExhibition.city) + "｜" +
      getDateRange(selectedExhibition)
  );

  if (statusElement) {
    statusElement.className = "status-badge current-exhibition__badge " + getStatusClass(selectedExhibition.status);
    statusElement.textContent = getStatusText(selectedExhibition.status);
  }
}

function renderFilteredTasks() {
  var selectedTasks = getTasksForSelectedExhibition();
  var filteredTasks = getFilteredTasks();

  if (!selectedExhibitionId) {
    renderTaskEmptyState("尚未選擇活動（No Event Selected）", "請先從活動清單選擇一筆活動查看相關任務。");
    return;
  }

  if (!selectedTasks.length) {
    renderTaskEmptyState("目前選取活動沒有任務", "此活動尚未建立準備事項，可先確認是否需要新增任務資料。");
    return;
  }

  if (!filteredTasks.length) {
    renderTaskEmptyState("找不到符合條件的任務（No matching task found）", "請改用其他關鍵字。");
    return;
  }

  renderTasks(filteredTasks);
}

function renderFilteredDocuments() {
  var selectedDocuments = getDocumentsForSelectedExhibition();
  var filteredDocuments = getFilteredDocuments();

  if (!selectedExhibitionId) {
    renderDocumentEmptyState("尚未選擇活動（No Event Selected）", "請先從活動清單選擇一筆活動查看相關文件。");
    return;
  }

  if (!selectedDocuments.length) {
    renderDocumentEmptyState("目前選取活動沒有文件", "此活動尚未建立文件資料，可先確認是否需要補上活動文件。");
    return;
  }

  if (!filteredDocuments.length) {
    renderDocumentEmptyState("沒有符合條件的文件", "請調整文件搜尋、狀態或類型篩選條件。");
    return;
  }

  renderDocuments(filteredDocuments);
}

function refreshDashboardViews() {
  updateTodayFocusSummary();
  updateDashboardHomeSummary();
  updateRecentUpdatesSummary();
}

function refreshSelectedModuleSummaries() {
  updateTaskSummaryCards(getTasksForSelectedExhibition());
  updateDocumentSummaryCards(getDocumentsForSelectedExhibition());
}

function refreshTaskDependentViews() {
  updateTaskSummaryCards(getTasksForSelectedExhibition());
  refreshDashboardViews();
}

function refreshDocumentDependentViews() {
  updateDocumentSummaryCards(getDocumentsForSelectedExhibition());
  refreshDashboardViews();
}

function refreshSelectedExhibitionViews() {
  updateSelectedExhibitionIndicator();
  refreshDashboardViews();
  refreshSelectedModuleSummaries();

  if (taskDataLoaded) {
    renderFilteredTasks();
  }

  if (documentDataLoaded) {
    renderFilteredDocuments();
  }

  if (budgetDataLoaded) {
    renderBudgetModuleViews();
  }
}

function resetDashboardControlsAfterDataReset() {
  setControlValue("#exhibition-search", "");
  setControlValue("#exhibition-status-filter", "");
  setControlValue("#task-search", "");
  setControlValue("#task-status-filter", "");
  setControlValue("#document-search", "");
  setControlValue("#document-status-filter", "");
  setControlValue("#document-type-filter", "");
  resetExhibitionForm();
  resetTaskForm();
  resetDocumentForm();
  resetBudgetForm();
}

function refreshAllViewsAfterReset() {
  resetDashboardControlsAfterDataReset();
  renderExhibitions(getFilteredExhibitions());
  updateSummaryCards(exhibitionData);
  selectedExhibitionId = null;

  if (exhibitionData.length) {
    selectExhibition(exhibitionData[0], false);
    return;
  }

  resetExhibitionDetail();
}

function scrollToCurrentExhibition() {
  var currentExhibitionPanel = document.querySelector("#current-exhibition-panel");
  var panelTop;
  var scrollTarget;

  if (!currentExhibitionPanel) {
    return;
  }

  panelTop = currentExhibitionPanel.getBoundingClientRect().top + window.scrollY;
  scrollTarget = Math.max(panelTop - 96, 0);

  window.requestAnimationFrame(function() {
    window.scrollTo({
      top: scrollTarget,
      behavior: "smooth"
    });
  });
}

function selectExhibition(exhibition, shouldScroll) {
  if (!exhibition) {
    return;
  }

  selectedExhibitionId = String(exhibition.id);
  setActiveTableRow(selectedExhibitionId);
  renderExhibitionDetail(exhibition);
  resetExhibitionForm();
  resetTaskForm();
  resetDocumentForm();
  resetBudgetForm();
  refreshSelectedExhibitionViews();

  if (shouldScroll) {
    scrollToCurrentExhibition();
  }
}

// Recent Updates / Deep Links

function getSortableDateValue(dateText, fallbackIndex) {
  var timestamp = Date.parse(dateText);

  if (Number.isNaN(timestamp)) {
    return fallbackIndex;
  }

  return timestamp;
}

function getRecentItems(items, getDateValue) {
  return items.map(function(item, index) {
    return {
      item: item,
      sortValue: getSortableDateValue(getDateValue(item), index)
    };
  }).sort(function(first, second) {
    return second.sortValue - first.sortValue;
  }).slice(0, 3).map(function(entry) {
    return entry.item;
  });
}

function renderRecentMessage(selector, message) {
  var list = document.querySelector(selector);

  if (!list) {
    return;
  }

  list.innerHTML = "<p class=\"dashboard-recent-empty\">" + escapeHtml(message) + "</p>";
}

function renderRecentList(selector, items, options) {
  var list = document.querySelector(selector);

  if (!list) {
    return;
  }

  if (!options.isLoaded) {
    renderRecentMessage(selector, "資料載入中");
    return;
  }

  if (!items.length) {
    renderRecentMessage(selector, options.emptyMessage);
    return;
  }

  list.innerHTML = items.map(function(item) {
    var itemId = options.getItemId ? options.getItemId(item) : "";
    var itemType = options.itemType || "";

    return "" +
      "<a class=\"dashboard-recent-item\" href=\"" + escapeHtml(options.href) + "\" data-section=\"" + escapeHtml(options.sectionId) + "\" data-recent-type=\"" + escapeHtml(itemType) + "\" data-recent-id=\"" + escapeHtml(itemId) + "\">" +
        "<span class=\"dashboard-recent-item__title\">" + escapeHtml(options.getTitle(item)) + "</span>" +
        "<span class=\"dashboard-recent-item__meta\">" +
          "<span>" + escapeHtml(options.getStatus(item)) + "</span>" +
          "<span>" + escapeHtml(options.getDate(item)) + "</span>" +
        "</span>" +
      "</a>";
  }).join("");
}

function clearExhibitionFiltersForDeepLink() {
  setControlValue("#exhibition-search", "");
  setControlValue("#exhibition-status-filter", "");
  renderExhibitions(getFilteredExhibitions());
}

function clearTaskFilterForDeepLink() {
  setControlValue("#task-search", "");
  setControlValue("#task-status-filter", "");
}

function clearDocumentFiltersForDeepLink() {
  setControlValue("#document-search", "");
  setControlValue("#document-status-filter", "");
  setControlValue("#document-type-filter", "");
}

function selectExhibitionById(exhibitionId) {
  var exhibition = getExhibitionById(exhibitionId);

  if (!exhibition) {
    return null;
  }

  selectExhibition(exhibition, false);
  return exhibition;
}

function navigateToRecentExhibition(exhibitionId) {
  var exhibition = getExhibitionById(exhibitionId);

  if (!exhibition) {
    return;
  }

  clearExhibitionFiltersForDeepLink();
  selectExhibition(exhibition, false);
  setActiveSidebarLink("exhibition-module");

  window.requestAnimationFrame(function() {
    var row = getRenderedDataElement(".table-row", "exhibitionId", exhibitionId);
    var detailPanel = document.querySelector("#exhibition-detail");

    scrollToAndHighlightElement(row || detailPanel);
    applyTemporaryHighlight(detailPanel);
  });
}

function navigateToRecentTask(taskId) {
  var task = findTaskById(taskId);

  if (!task) {
    return;
  }

  if (String(task.exhibitionId) !== selectedExhibitionId) {
    selectExhibitionById(task.exhibitionId);
  }

  clearTaskFilterForDeepLink();
  renderFilteredTasks();
  setActiveSidebarLink("task-module");

  window.requestAnimationFrame(function() {
    scrollToAndHighlightElement(getRenderedDataElement(".task-item", "taskId", taskId));
  });
}

function navigateToRecentDocument(documentId) {
  var documentItem = getDocumentById(documentId);

  if (!documentItem) {
    return;
  }

  if (String(documentItem.exhibitionId) !== selectedExhibitionId) {
    selectExhibitionById(documentItem.exhibitionId);
  }

  clearDocumentFiltersForDeepLink();
  renderFilteredDocuments();
  setActiveSidebarLink("document-module");

  window.requestAnimationFrame(function() {
    scrollToAndHighlightElement(getRenderedDataElement(".document-item", "documentId", documentId));
  });
}

function setupRecentUpdatesDeepLinks() {
  document.addEventListener("click", function(event) {
    var recentItem;

    if (!event.target.closest) {
      return;
    }

    recentItem = event.target.closest(".dashboard-recent-item[data-recent-type]");

    if (!recentItem) {
      return;
    }

    event.preventDefault();

    if (recentItem.dataset.recentType === "exhibition") {
      navigateToRecentExhibition(recentItem.dataset.recentId);
    }

    if (recentItem.dataset.recentType === "task") {
      navigateToRecentTask(recentItem.dataset.recentId);
    }

    if (recentItem.dataset.recentType === "document") {
      navigateToRecentDocument(recentItem.dataset.recentId);
    }
  });
}

function updateRecentUpdatesSummary() {
  renderRecentList(
    "#recent-exhibitions-list",
    getRecentItems(exhibitionData, function(exhibition) {
      return exhibition.startDate;
    }),
    {
      isLoaded: exhibitionDataLoaded,
      emptyMessage: "目前沒有活動資料",
      href: "#exhibition-module",
      sectionId: "exhibition-module",
      itemType: "exhibition",
      getItemId: function(exhibition) {
        return exhibition.id;
      },
      getTitle: function(exhibition) {
        return getDisplayValue(exhibition.name);
      },
      getStatus: function(exhibition) {
        return getStatusText(exhibition.status);
      },
      getDate: function(exhibition) {
        return formatDisplayDate(exhibition.startDate);
      }
    }
  );

  renderRecentList(
    "#recent-tasks-list",
    getRecentItems(getTasksForSelectedExhibition(), function(task) {
      return task.dueDate;
    }),
    {
      isLoaded: taskDataLoaded,
      emptyMessage: "目前選取活動沒有任務資料",
      href: "#task-module",
      sectionId: "task-module",
      itemType: "task",
      getItemId: function(task) {
        return getTaskId(task);
      },
      getTitle: function(task) {
        return getDisplayValue(task.title);
      },
      getStatus: function(task) {
        return getTaskStatusText(task.status);
      },
      getDate: function(task) {
        return formatDisplayDate(task.dueDate);
      }
    }
  );

  renderRecentList(
    "#recent-documents-list",
    getRecentItems(getDocumentsForSelectedExhibition(), function(documentItem) {
      return documentItem.updatedAt;
    }),
    {
      isLoaded: documentDataLoaded,
      emptyMessage: "目前選取活動沒有文件資料",
      href: "#document-module",
      sectionId: "document-module",
      itemType: "document",
      getItemId: function(documentItem) {
        return documentItem.id;
      },
      getTitle: function(documentItem) {
        return getDisplayValue(documentItem.title);
      },
      getStatus: function(documentItem) {
        return getDocumentStatusText(documentItem.status);
      },
      getDate: function(documentItem) {
        return formatDisplayDate(documentItem.updatedAt);
      }
    }
  );
}

// Navigation / Back to Top

function getNavigationSectionId(target) {
  var sectionId = String(target || "").replace("#", "");

  if (navigationSectionIds.indexOf(sectionId) === -1) {
    return "";
  }

  return sectionId;
}

function setActiveSidebarLink(sectionId) {
  if (!sectionId) {
    return;
  }

  document.querySelectorAll(".sidebar__link[data-section]").forEach(function(link) {
    link.classList.toggle("sidebar__link--active", link.dataset.section === sectionId);
  });
}

function updateActiveSidebarFromHash() {
  var sectionId = getNavigationSectionId(window.location.hash);

  if (sectionId) {
    setActiveSidebarLink(sectionId);
  }
}

function updateActiveSidebarFromScroll() {
  var currentSectionId = "dashboard-home";
  var activationPoint = window.innerHeight * 0.35;

  navigationSectionIds.forEach(function(sectionId) {
    var section = document.getElementById(sectionId);

    if (section && section.getBoundingClientRect().top <= activationPoint) {
      currentSectionId = sectionId;
    }
  });

  setActiveSidebarLink(currentSectionId);
}

function setupSidebarNavigation() {
  var scrollTicking = false;

  document.addEventListener("click", function(event) {
    if (!event.target.closest) {
      return;
    }

    var target = event.target.closest("a[data-section]");

    if (target) {
      setActiveSidebarLink(getNavigationSectionId(target.getAttribute("href")));
    }
  });

  window.addEventListener("hashchange", updateActiveSidebarFromHash);
  window.addEventListener("scroll", function() {
    if (scrollTicking) {
      return;
    }

    scrollTicking = true;

    window.requestAnimationFrame(function() {
      updateActiveSidebarFromScroll();
      scrollTicking = false;
    });
  }, { passive: true });

  if (getNavigationSectionId(window.location.hash)) {
    updateActiveSidebarFromHash();
    return;
  }

  updateActiveSidebarFromScroll();
}

function setupBackToTopButton() {
  var backToTopButton = document.querySelector("#back-to-top");

  if (!backToTopButton) {
    return;
  }

  function updateBackToTopVisibility() {
    backToTopButton.classList.toggle("back-to-top-button--visible", window.scrollY > 420);
  }

  backToTopButton.addEventListener("click", function() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
  updateBackToTopVisibility();
}

// Template Management Module

function getTemplateTaskCount(template) {
  return template && Array.isArray(template.taskTemplates) ? template.taskTemplates.length : 0;
}

function getTemplateDocumentCount(template) {
  return template && Array.isArray(template.documentTemplates) ? template.documentTemplates.length : 0;
}

function getSortedTemplatesForDisplay(templates) {
  var safeTemplates = Array.isArray(templates) ? templates : [];

  return safeTemplates.slice().sort(function(firstTemplate, secondTemplate) {
    var firstActiveRank = firstTemplate && firstTemplate.isActive === true ? 0 : 1;
    var secondActiveRank = secondTemplate && secondTemplate.isActive === true ? 0 : 1;
    var firstName = String(firstTemplate && firstTemplate.name ? firstTemplate.name : "");
    var secondName = String(secondTemplate && secondTemplate.name ? secondTemplate.name : "");

    if (firstActiveRank !== secondActiveRank) {
      return firstActiveRank - secondActiveRank;
    }

    return firstName.localeCompare(secondName, "zh-Hant");
  });
}

function getTemplateUsedByEventCount(templateId) {
  if (!exhibitionDataReady || !Array.isArray(exhibitionData)) {
    return 0;
  }

  return exhibitionData.filter(function(exhibition) {
    return exhibition && String(exhibition.sourceTemplateId || "") === String(templateId || "");
  }).length;
}

function getTemplateStatusText(template) {
  return template && template.isActive === true ? "啟用中（Active）" : "已停用（Disabled）";
}

function getTemplateDateBasisText(dateBasis) {
  if (dateBasis === "startDate") {
    return "開始日期（Start Date）";
  }

  if (dateBasis === "endDate") {
    return "結束日期（End Date）";
  }

  return "待確認";
}

function formatTemplateUpdatedAt(updatedAt) {
  var parsedDate;

  if (typeof updatedAt !== "string" || !updatedAt.trim()) {
    return "待確認";
  }

  parsedDate = new Date(updatedAt);

  if (!Number.isFinite(parsedDate.getTime())) {
    return "待確認";
  }

  return formatLastUpdated(parsedDate);
}

function getSortedTemplateItems(items) {
  return (Array.isArray(items) ? items : []).slice().sort(function(firstItem, secondItem) {
    return firstItem.sortOrder - secondItem.sortOrder;
  });
}

function getTemplateItemDateBasis(item, template) {
  if (item && (item.dateBasis === "startDate" || item.dateBasis === "endDate")) {
    return item.dateBasis;
  }

  return getEventTemplateDateBasis(template);
}

function createTemplateItemId(prefix, items) {
  var usedIds = {};

  (Array.isArray(items) ? items : []).forEach(function(item) {
    if (item && !isBlankTemplateValue(item.id)) {
      usedIds[String(item.id)] = true;
    }
  });

  return createUniqueTemplateEntityId(prefix, usedIds);
}

function getOpenTemplateForItemManagement() {
  var editIdInput = document.querySelector("#template-edit-id");

  return editIdInput && editIdInput.value ? getEventTemplateById(editIdInput.value) : null;
}

function createTemplateTaskItemTableMarkup(template) {
  var items = getSortedTemplateItems(template.taskTemplates);

  if (!items.length) {
    return "<p class=\"template-item-empty\">目前沒有範本任務（No Template Tasks）</p>";
  }

  return "" +
    "<div class=\"template-item-table-wrapper\">" +
      "<table class=\"template-item-table\">" +
        "<thead><tr>" +
          "<th>任務名稱（Title）</th>" +
          "<th>負責單位（Owner）</th>" +
          "<th>優先順序（Priority）</th>" +
          "<th>相對到期日（Relative Due Days）</th>" +
          "<th>日期基準（Date Basis）</th>" +
          "<th>預設狀態（Default Status）</th>" +
          "<th>操作（Actions）</th>" +
        "</tr></thead>" +
        "<tbody>" + items.map(function(item) {
          return "<tr>" +
            "<td class=\"template-item-table__title\">" + escapeHtml(getDisplayValue(item.title)) + "</td>" +
            "<td>" + escapeHtml(getDisplayValue(item.owner)) + "</td>" +
            "<td>" + escapeHtml(taskPriorityTextMap[item.priority] || item.priority) + "</td>" +
            "<td class=\"template-item-table__number\">" + escapeHtml(item.relativeDueDays === null ? "—" : item.relativeDueDays) + "</td>" +
            "<td>" + escapeHtml(getTemplateDateBasisText(getTemplateItemDateBasis(item, template))) + "</td>" +
            "<td>" + escapeHtml(taskStatusTextMap[item.defaultStatus] || item.defaultStatus) + "</td>" +
            "<td><div class=\"template-item-row-actions\">" +
              "<button class=\"template-action-button\" type=\"button\" data-template-item-action=\"edit-task\" data-template-item-id=\"" + escapeHtml(item.id) + "\">編輯（Edit）</button>" +
              "<button class=\"template-action-button template-action-button--danger\" type=\"button\" data-template-item-action=\"delete-task\" data-template-item-id=\"" + escapeHtml(item.id) + "\">刪除（Delete）</button>" +
            "</div></td>" +
          "</tr>";
        }).join("") + "</tbody>" +
      "</table>" +
    "</div>";
}

function createTemplateDocumentItemTableMarkup(template) {
  var items = getSortedTemplateItems(template.documentTemplates);

  if (!items.length) {
    return "<p class=\"template-item-empty\">目前沒有範本文件（No Template Documents）</p>";
  }

  return "" +
    "<div class=\"template-item-table-wrapper\">" +
      "<table class=\"template-item-table\">" +
        "<thead><tr>" +
          "<th>文件名稱（Title）</th>" +
          "<th>類型（Type）</th>" +
          "<th>負責人（Owner）</th>" +
          "<th>相對到期日（Relative Due Days）</th>" +
          "<th>日期基準（Date Basis）</th>" +
          "<th>預設狀態（Status）</th>" +
          "<th>操作（Actions）</th>" +
        "</tr></thead>" +
        "<tbody>" + items.map(function(item) {
          return "<tr>" +
            "<td class=\"template-item-table__title\">" + escapeHtml(getDisplayValue(item.title)) + "</td>" +
            "<td>" + escapeHtml(documentTypeTextMap[item.type] || item.type) + "</td>" +
            "<td>" + escapeHtml(getDisplayValue(item.owner)) + "</td>" +
            "<td class=\"template-item-table__number\">" + escapeHtml(item.relativeDueDays === null ? "—" : item.relativeDueDays) + "</td>" +
            "<td>" + escapeHtml(getTemplateDateBasisText(getTemplateItemDateBasis(item, template))) + "</td>" +
            "<td>" + escapeHtml(documentStatusTextMap[item.defaultStatus] || item.defaultStatus) + "</td>" +
            "<td><div class=\"template-item-row-actions\">" +
              "<button class=\"template-action-button\" type=\"button\" data-template-item-action=\"edit-document\" data-template-item-id=\"" + escapeHtml(item.id) + "\">編輯（Edit）</button>" +
              "<button class=\"template-action-button template-action-button--danger\" type=\"button\" data-template-item-action=\"delete-document\" data-template-item-id=\"" + escapeHtml(item.id) + "\">刪除（Delete）</button>" +
            "</div></td>" +
          "</tr>";
        }).join("") + "</tbody>" +
      "</table>" +
    "</div>";
}

function createTemplateTaskItemFormMarkup() {
  return "" +
    "<form class=\"template-item-form\" id=\"template-task-item-form\" hidden>" +
      "<input type=\"hidden\" id=\"template-task-item-edit-id\" value=\"\">" +
      "<div class=\"template-item-form__grid\">" +
        "<div class=\"template-item-form__field template-item-form__field--wide\"><label for=\"template-task-title-input\">任務名稱（Task Title）*</label><input id=\"template-task-title-input\" type=\"text\" required></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-task-owner-input\">負責單位（Owner）</label><select id=\"template-task-owner-input\"><option value=\"行銷\">行銷</option><option value=\"業務\">業務</option><option value=\"研發\">研發</option><option value=\"生產\">生產</option><option value=\"品保\">品保</option></select></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-task-priority-input\">優先順序（Priority）</label><select id=\"template-task-priority-input\"><option value=\"high\">高（High）</option><option value=\"medium\">中（Medium）</option><option value=\"low\">低（Low）</option></select></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-task-status-input\">預設狀態（Default Status）</label><select id=\"template-task-status-input\"><option value=\"todo\">待辦（To Do）</option><option value=\"in_progress\">進行中（In Progress）</option><option value=\"done\">已完成（Completed）</option><option value=\"blocked\">封鎖（Blocked）</option></select></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-task-relative-days-input\">相對到期日（Relative Due Days）*</label><input id=\"template-task-relative-days-input\" type=\"number\" step=\"1\" required></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-task-date-basis-input\">日期基準（Date Basis）*</label><select id=\"template-task-date-basis-input\"><option value=\"startDate\">開始日期（Start Date）</option><option value=\"endDate\">結束日期（End Date）</option></select></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-task-sort-order-input\">排序（Sort Order）</label><input id=\"template-task-sort-order-input\" type=\"number\" min=\"1\" step=\"1\"></div>" +
        "<div class=\"template-item-form__field template-item-form__field--wide\"><label for=\"template-task-description-input\">說明（Description）</label><textarea id=\"template-task-description-input\" rows=\"2\"></textarea></div>" +
      "</div>" +
      "<p class=\"template-item-form__message\" id=\"template-task-item-message\" role=\"alert\" hidden></p>" +
      "<div class=\"template-item-form__actions\"><button class=\"template-form-button template-form-button--primary\" type=\"submit\">儲存任務（Save Task）</button><button class=\"template-form-button template-form-button--secondary\" type=\"button\" data-template-item-action=\"cancel-task\">取消（Cancel）</button></div>" +
    "</form>";
}

function createTemplateDocumentItemFormMarkup() {
  return "" +
    "<form class=\"template-item-form\" id=\"template-document-item-form\" hidden>" +
      "<input type=\"hidden\" id=\"template-document-item-edit-id\" value=\"\">" +
      "<div class=\"template-item-form__grid\">" +
        "<div class=\"template-item-form__field template-item-form__field--wide\"><label for=\"template-document-title-input\">文件名稱（Title）*</label><input id=\"template-document-title-input\" type=\"text\" required></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-document-type-input\">類型（Type）</label><select id=\"template-document-type-input\"><option value=\"market_research\">市場研究</option><option value=\"budget\">預算</option><option value=\"sales_list\">銷售名單</option><option value=\"catalog\">型錄</option><option value=\"follow_up\">後續追蹤</option><option value=\"logistics\">物流文件</option></select></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-document-owner-input\">負責人（Owner）</label><input id=\"template-document-owner-input\" type=\"text\"></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-document-status-input\">預設狀態（Default Status）</label><select id=\"template-document-status-input\"><option value=\"draft\">草稿</option><option value=\"review\">審核中</option><option value=\"approved\">已核准</option><option value=\"archived\">已封存</option></select></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-document-relative-days-input\">相對到期日（Relative Due Days）</label><input id=\"template-document-relative-days-input\" type=\"number\" step=\"1\"></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-document-date-basis-input\">日期基準（Date Basis）</label><select id=\"template-document-date-basis-input\"><option value=\"startDate\">開始日期（Start Date）</option><option value=\"endDate\">結束日期（End Date）</option></select></div>" +
        "<div class=\"template-item-form__field\"><label for=\"template-document-sort-order-input\">排序（Sort Order）</label><input id=\"template-document-sort-order-input\" type=\"number\" min=\"1\" step=\"1\"></div>" +
      "</div>" +
      "<p class=\"template-item-form__message\" id=\"template-document-item-message\" role=\"alert\" hidden></p>" +
      "<div class=\"template-item-form__actions\"><button class=\"template-form-button template-form-button--primary\" type=\"submit\">儲存文件（Save Document）</button><button class=\"template-form-button template-form-button--secondary\" type=\"button\" data-template-item-action=\"cancel-document\">取消（Cancel）</button></div>" +
    "</form>";
}

function hideTemplateItemsManagement() {
  var container = document.querySelector("#template-items-management");

  if (container) {
    container.hidden = true;
    container.innerHTML = "";
  }
}

function renderTemplateItemsManagement(template) {
  var container = document.querySelector("#template-items-management");

  if (!container || !template) {
    hideTemplateItemsManagement();
    return;
  }

  container.hidden = false;
  container.innerHTML = "" +
    "<section class=\"template-item-manager\" aria-labelledby=\"template-task-items-title\">" +
      "<div class=\"template-item-manager__header\"><h4 id=\"template-task-items-title\">範本任務（Template Task Items）<span class=\"template-item-manager__count\">" + escapeHtml(getTemplateTaskCount(template)) + " 筆</span></h4><button class=\"template-item-add-button\" type=\"button\" data-template-item-action=\"add-task\">新增任務（Add Task）</button></div>" +
      createTemplateTaskItemFormMarkup() +
      "<div id=\"template-task-item-list\">" + createTemplateTaskItemTableMarkup(template) + "</div>" +
    "</section>" +
    "<section class=\"template-item-manager\" aria-labelledby=\"template-document-items-title\">" +
      "<div class=\"template-item-manager__header\"><h4 id=\"template-document-items-title\">範本文件（Template Document Items）<span class=\"template-item-manager__count\">" + escapeHtml(getTemplateDocumentCount(template)) + " 筆</span></h4><button class=\"template-item-add-button\" type=\"button\" data-template-item-action=\"add-document\">新增文件（Add Document）</button></div>" +
      createTemplateDocumentItemFormMarkup() +
      "<div id=\"template-document-item-list\">" + createTemplateDocumentItemTableMarkup(template) + "</div>" +
    "</section>";
}

function setTemplateItemFormMessage(selector, message) {
  var messageElement = document.querySelector(selector);

  if (!messageElement) {
    return;
  }

  messageElement.textContent = message || "";
  messageElement.hidden = !message;
}

function setSelectValueWithFallback(selectElement, value) {
  var optionExists;
  var option;

  if (!selectElement) {
    return;
  }

  optionExists = Array.prototype.some.call(selectElement.options, function(item) {
    return item.value === value;
  });

  if (!optionExists && value) {
    option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  }

  selectElement.value = value;
}

function getTemplateTaskItemFormElements() {
  return {
    form: document.querySelector("#template-task-item-form"),
    editIdInput: document.querySelector("#template-task-item-edit-id"),
    titleInput: document.querySelector("#template-task-title-input"),
    descriptionInput: document.querySelector("#template-task-description-input"),
    ownerInput: document.querySelector("#template-task-owner-input"),
    priorityInput: document.querySelector("#template-task-priority-input"),
    statusInput: document.querySelector("#template-task-status-input"),
    relativeDueDaysInput: document.querySelector("#template-task-relative-days-input"),
    dateBasisInput: document.querySelector("#template-task-date-basis-input"),
    sortOrderInput: document.querySelector("#template-task-sort-order-input")
  };
}

function getTemplateDocumentItemFormElements() {
  return {
    form: document.querySelector("#template-document-item-form"),
    editIdInput: document.querySelector("#template-document-item-edit-id"),
    titleInput: document.querySelector("#template-document-title-input"),
    typeInput: document.querySelector("#template-document-type-input"),
    ownerInput: document.querySelector("#template-document-owner-input"),
    statusInput: document.querySelector("#template-document-status-input"),
    relativeDueDaysInput: document.querySelector("#template-document-relative-days-input"),
    dateBasisInput: document.querySelector("#template-document-date-basis-input"),
    sortOrderInput: document.querySelector("#template-document-sort-order-input")
  };
}

function closeTemplateTaskItemForm() {
  var elements = getTemplateTaskItemFormElements();

  if (elements.form) {
    elements.form.reset();
    elements.form.hidden = true;
  }

  setTemplateItemFormMessage("#template-task-item-message", "");
}

function closeTemplateDocumentItemForm() {
  var elements = getTemplateDocumentItemFormElements();

  if (elements.form) {
    elements.form.reset();
    elements.form.hidden = true;
  }

  setTemplateItemFormMessage("#template-document-item-message", "");
}

function openTemplateTaskItemForm(itemId) {
  var template = getOpenTemplateForItemManagement();
  var elements = getTemplateTaskItemFormElements();
  var items = template && Array.isArray(template.taskTemplates) ? template.taskTemplates : [];
  var item = itemId ? items.find(function(candidate) {
    return String(candidate.id) === String(itemId);
  }) : null;

  if (!template || !elements.form || (itemId && !item)) {
    return;
  }

  elements.form.reset();
  elements.form.hidden = false;
  elements.editIdInput.value = item ? item.id : "";
  elements.titleInput.value = item ? item.title : "";
  elements.descriptionInput.value = item ? item.description || "" : "";
  setSelectValueWithFallback(elements.ownerInput, item ? item.owner : "行銷");
  elements.priorityInput.value = item ? item.priority : "medium";
  elements.statusInput.value = item ? item.defaultStatus : "todo";
  elements.relativeDueDaysInput.value = item && item.relativeDueDays !== null ? item.relativeDueDays : (item ? "" : 0);
  elements.dateBasisInput.value = getTemplateItemDateBasis(item, template);
  elements.sortOrderInput.value = item ? item.sortOrder : items.length + 1;
  setTemplateItemFormMessage("#template-task-item-message", "");

  elements.form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openTemplateDocumentItemForm(itemId) {
  var template = getOpenTemplateForItemManagement();
  var elements = getTemplateDocumentItemFormElements();
  var items = template && Array.isArray(template.documentTemplates) ? template.documentTemplates : [];
  var item = itemId ? items.find(function(candidate) {
    return String(candidate.id) === String(itemId);
  }) : null;

  if (!template || !elements.form || (itemId && !item)) {
    return;
  }

  elements.form.reset();
  elements.form.hidden = false;
  elements.editIdInput.value = item ? item.id : "";
  elements.titleInput.value = item ? item.title : "";
  elements.typeInput.value = item ? item.type : "logistics";
  elements.ownerInput.value = item ? item.owner : "Marketing Team";
  elements.statusInput.value = item ? item.defaultStatus : "draft";
  elements.relativeDueDaysInput.value = item && item.relativeDueDays !== null ? item.relativeDueDays : "";
  elements.dateBasisInput.value = getTemplateItemDateBasis(item, template);
  elements.sortOrderInput.value = item ? item.sortOrder : items.length + 1;
  setTemplateItemFormMessage("#template-document-item-message", "");

  elements.form.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function getTemplateTaskItemFormValues(itemCount) {
  var elements = getTemplateTaskItemFormElements();
  var relativeDueDays = Number(elements.relativeDueDaysInput.value);
  var sortOrder = elements.sortOrderInput.value === "" ? itemCount + 1 : Number(elements.sortOrderInput.value);

  return {
    title: elements.titleInput.value.trim(),
    description: elements.descriptionInput.value.trim(),
    owner: elements.ownerInput.value || "行銷",
    priority: elements.priorityInput.value,
    defaultStatus: elements.statusInput.value,
    relativeDueDays: relativeDueDays,
    dateBasis: elements.dateBasisInput.value,
    sortOrder: sortOrder
  };
}

function getTemplateDocumentItemFormValues(itemCount) {
  var elements = getTemplateDocumentItemFormElements();
  var relativeDueDays = elements.relativeDueDaysInput.value === ""
    ? null
    : Number(elements.relativeDueDaysInput.value);
  var sortOrder = elements.sortOrderInput.value === "" ? itemCount + 1 : Number(elements.sortOrderInput.value);

  return {
    title: elements.titleInput.value.trim(),
    type: elements.typeInput.value,
    owner: elements.ownerInput.value.trim() || "Marketing Team",
    defaultStatus: elements.statusInput.value,
    relativeDueDays: relativeDueDays,
    dateBasis: elements.dateBasisInput.value,
    sortOrder: sortOrder
  };
}

function validateTemplateTaskItemValues(values) {
  if (!values.title) {
    return "Task Title is required.";
  }

  if (!Number.isInteger(values.relativeDueDays)) {
    return "Relative Due Days must be an integer.";
  }

  if (!isValidTemplateSortOrder(values.sortOrder)) {
    return "Sort Order must be an integer greater than or equal to 1.";
  }

  if (!taskPriorityTextMap[values.priority] || !taskStatusTextMap[values.defaultStatus]) {
    return "Priority or Default Status is invalid.";
  }

  if (values.dateBasis !== "startDate" && values.dateBasis !== "endDate") {
    return "Date Basis is invalid.";
  }

  return "";
}

function validateTemplateDocumentItemValues(values) {
  if (!values.title) {
    return "Document Title is required.";
  }

  if (values.relativeDueDays !== null && !Number.isInteger(values.relativeDueDays)) {
    return "Relative Due Days must be an integer or blank.";
  }

  if (!isValidTemplateSortOrder(values.sortOrder)) {
    return "Sort Order must be an integer greater than or equal to 1.";
  }

  if (!documentTypeTextMap[values.type] || !documentStatusTextMap[values.defaultStatus]) {
    return "Document Type or Default Status is invalid.";
  }

  if (values.dateBasis !== "startDate" && values.dateBasis !== "endDate") {
    return "Date Basis is invalid.";
  }

  return "";
}

function commitTemplateItemCollection(templateId, collectionName, nextItems) {
  var template = getEventTemplateById(templateId);
  var nextTemplates;

  if (!templateDataReady || !template || !Array.isArray(nextItems)) {
    throw new Error("Template item data is not ready.");
  }

  nextTemplates = eventTemplateData.map(function(item) {
    var updates;

    if (String(item.id) !== String(templateId)) {
      return item;
    }

    updates = { updatedAt: new Date().toISOString() };
    updates[collectionName] = nextItems.map(function(templateItem) {
      return Object.assign({}, templateItem, { templateId: template.id });
    });

    return Object.assign({}, item, updates);
  });

  commitTemplateData(nextTemplates);
  refreshTemplateManagement();
  return getEventTemplateById(templateId);
}

function saveTemplateTaskItem() {
  var template = getOpenTemplateForItemManagement();
  var elements = getTemplateTaskItemFormElements();
  var items;
  var editItem;
  var values;
  var validationMessage;
  var savedItem;
  var nextItems;

  if (!template || !elements.form) {
    return null;
  }

  items = Array.isArray(template.taskTemplates) ? template.taskTemplates : [];
  editItem = elements.editIdInput.value ? items.find(function(item) {
    return String(item.id) === String(elements.editIdInput.value);
  }) : null;
  values = getTemplateTaskItemFormValues(items.length);
  validationMessage = validateTemplateTaskItemValues(values);

  if (validationMessage) {
    setTemplateItemFormMessage("#template-task-item-message", validationMessage);
    return null;
  }

  savedItem = Object.assign({}, editItem || {}, values, {
    id: editItem ? editItem.id : createTemplateItemId("task-template", taskTemplateItemData),
    templateId: template.id
  });
  nextItems = editItem ? items.map(function(item) {
    return String(item.id) === String(editItem.id) ? savedItem : item;
  }) : items.concat([savedItem]);

  try {
    commitTemplateItemCollection(template.id, "taskTemplates", nextItems);
  } catch (error) {
    console.error("Failed to save Task Template Item.", error);
    setTemplateItemFormMessage("#template-task-item-message", "Task Template could not be saved.");
    return null;
  }

  return savedItem;
}

function saveTemplateDocumentItem() {
  var template = getOpenTemplateForItemManagement();
  var elements = getTemplateDocumentItemFormElements();
  var items;
  var editItem;
  var values;
  var validationMessage;
  var savedItem;
  var nextItems;

  if (!template || !elements.form) {
    return null;
  }

  items = Array.isArray(template.documentTemplates) ? template.documentTemplates : [];
  editItem = elements.editIdInput.value ? items.find(function(item) {
    return String(item.id) === String(elements.editIdInput.value);
  }) : null;
  values = getTemplateDocumentItemFormValues(items.length);
  validationMessage = validateTemplateDocumentItemValues(values);

  if (validationMessage) {
    setTemplateItemFormMessage("#template-document-item-message", validationMessage);
    return null;
  }

  savedItem = Object.assign({}, editItem || {}, values, {
    id: editItem ? editItem.id : createTemplateItemId("document-template", documentTemplateItemData),
    templateId: template.id
  });
  nextItems = editItem ? items.map(function(item) {
    return String(item.id) === String(editItem.id) ? savedItem : item;
  }) : items.concat([savedItem]);

  try {
    commitTemplateItemCollection(template.id, "documentTemplates", nextItems);
  } catch (error) {
    console.error("Failed to save Document Template Item.", error);
    setTemplateItemFormMessage("#template-document-item-message", "Document Template could not be saved.");
    return null;
  }

  return savedItem;
}

function deleteTemplateTaskItem(itemId) {
  var template = getOpenTemplateForItemManagement();
  var items = template && Array.isArray(template.taskTemplates) ? template.taskTemplates : [];
  var item = items.find(function(candidate) {
    return String(candidate.id) === String(itemId);
  });

  if (!template || !item || !window.confirm("確定要刪除此範本任務嗎？\n\n既有活動中的任務不會受到影響。")) {
    return false;
  }

  try {
    commitTemplateItemCollection(template.id, "taskTemplates", items.filter(function(candidate) {
      return String(candidate.id) !== String(itemId);
    }));
  } catch (error) {
    console.error("Failed to delete Task Template Item.", error);
    window.alert("範本任務刪除失敗，請稍後再試。");
    return false;
  }

  return true;
}

function deleteTemplateDocumentItem(itemId) {
  var template = getOpenTemplateForItemManagement();
  var items = template && Array.isArray(template.documentTemplates) ? template.documentTemplates : [];
  var item = items.find(function(candidate) {
    return String(candidate.id) === String(itemId);
  });

  if (!template || !item || !window.confirm("確定要刪除此範本文件嗎？\n\n既有活動中的文件不會受到影響。")) {
    return false;
  }

  try {
    commitTemplateItemCollection(template.id, "documentTemplates", items.filter(function(candidate) {
      return String(candidate.id) !== String(itemId);
    }));
  } catch (error) {
    console.error("Failed to delete Document Template Item.", error);
    window.alert("範本文件刪除失敗，請稍後再試。");
    return false;
  }

  return true;
}

function getTemplateFormElements() {
  return {
    form: document.querySelector("#template-form"),
    editIdInput: document.querySelector("#template-edit-id"),
    formTitle: document.querySelector("#template-form-title"),
    nameInput: document.querySelector("#template-name-input"),
    descriptionInput: document.querySelector("#template-description-input"),
    eventTypeInput: document.querySelector("#template-event-type-input"),
    dateBasisInput: document.querySelector("#template-date-basis-input"),
    statusInput: document.querySelector("#template-status-input"),
    message: document.querySelector("#template-form-message"),
    submitButton: document.querySelector("#template-submit-button"),
    cancelButton: document.querySelector("#template-cancel-button"),
    createButton: document.querySelector("#template-create-button")
  };
}

function setTemplateFormMessage(message) {
  var messageElement = getTemplateFormElements().message;

  if (!messageElement) {
    return;
  }

  messageElement.textContent = message || "";
  messageElement.hidden = !message;
}

function getTemplateFormValues() {
  var elements = getTemplateFormElements();
  var status = elements.statusInput ? elements.statusInput.value : "active";

  return {
    name: elements.nameInput ? elements.nameInput.value.trim() : "",
    description: elements.descriptionInput ? elements.descriptionInput.value.trim() : "",
    eventType: elements.eventTypeInput ? elements.eventTypeInput.value : "",
    dateBasis: elements.dateBasisInput ? elements.dateBasisInput.value : "",
    status: status,
    isActive: status === "active"
  };
}

function normalizeTemplateNameForComparison(name) {
  return String(name || "").trim().toLowerCase();
}

function validateTemplate(values, editTemplateId) {
  var allowedEventTypes = ["Exhibition", "Education", "Annual Meeting"];
  var allowedDateBases = ["startDate", "endDate"];
  var allowedStatuses = ["active", "disabled"];
  var normalizedName = normalizeTemplateNameForComparison(values && values.name);
  var duplicateExists;

  if (!values || !normalizedName) {
    return { isValid: false, message: "Template Name is required." };
  }

  duplicateExists = eventTemplateData.some(function(template) {
    return template &&
      String(template.id) !== String(editTemplateId || "") &&
      normalizeTemplateNameForComparison(template.name) === normalizedName;
  });

  if (duplicateExists) {
    return { isValid: false, message: "Template Name already exists." };
  }

  if (allowedEventTypes.indexOf(values.eventType) === -1) {
    return { isValid: false, message: "Event Type is invalid." };
  }

  if (allowedDateBases.indexOf(values.dateBasis) === -1) {
    return { isValid: false, message: "Date Basis is invalid." };
  }

  if (allowedStatuses.indexOf(values.status) === -1) {
    return { isValid: false, message: "Status is invalid." };
  }

  return { isValid: true, message: "" };
}

function createEventTemplateId() {
  return createUniqueTemplateEntityId(
    "event-template",
    getEventTemplateIdLookup(eventTemplateData)
  );
}

function commitTemplateData(nextTemplates) {
  var serializedTemplates;
  var originalTemplates;

  if (!validateEventTemplates(nextTemplates)) {
    throw new Error("Event Template data validation failed before save.");
  }

  serializedTemplates = JSON.stringify(nextTemplates);
  originalTemplates = getRawLocalStorageValue(localStorageKeys.eventTemplates);

  try {
    setRawLocalStorageValue(localStorageKeys.eventTemplates, serializedTemplates);
  } catch (error) {
    try {
      restoreRawLocalStorageValue(localStorageKeys.eventTemplates, originalTemplates);
    } catch (rollbackError) {
      console.error("Failed to rollback Event Template Local Storage.", rollbackError);
    }

    throw error;
  }

  applyNormalizedEventTemplateData(nextTemplates);
  eventTemplateDataLoaded = true;
  taskTemplateItemDataLoaded = true;
  documentTemplateItemDataLoaded = true;
  templateDataReady = true;
}

function refreshTemplateManagement() {
  var openTemplate = getOpenTemplateForItemManagement();

  renderTemplateManagement();
  renderEventTemplateOptions();

  if (openTemplate) {
    renderTemplateItemsManagement(getEventTemplateById(openTemplate.id));
  }
}

function closeTemplateForm() {
  var elements = getTemplateFormElements();

  if (!elements.form) {
    return;
  }

  elements.form.reset();
  elements.form.hidden = true;

  if (elements.editIdInput) {
    elements.editIdInput.value = "";
  }

  setTemplateFormMessage("");
  hideTemplateItemsManagement();
}

function openTemplateForm(templateId) {
  var elements = getTemplateFormElements();
  var template = templateId ? getEventTemplateById(templateId) : null;
  var isEditing = Boolean(template);

  if (!elements.form || !templateDataReady || (templateId && !template)) {
    return;
  }

  elements.form.reset();
  elements.form.hidden = false;

  if (elements.editIdInput) {
    elements.editIdInput.value = isEditing ? template.id : "";
  }

  if (elements.formTitle) {
    elements.formTitle.textContent = isEditing ? "編輯範本（Edit Template）" : "新增範本（Create Template）";
  }

  if (elements.submitButton) {
    elements.submitButton.textContent = isEditing ? "儲存變更（Save Changes）" : "建立範本（Create Template）";
  }

  if (elements.nameInput) {
    elements.nameInput.value = isEditing ? template.name : "";
  }

  if (elements.descriptionInput) {
    elements.descriptionInput.value = isEditing ? template.description : "";
  }

  if (elements.eventTypeInput) {
    elements.eventTypeInput.value = isEditing ? template.eventType : "Exhibition";
  }

  if (elements.dateBasisInput) {
    elements.dateBasisInput.value = isEditing ? template.dateBasis : "startDate";
  }

  if (elements.statusInput) {
    elements.statusInput.value = isEditing && template.isActive === false ? "disabled" : "active";
  }

  setTemplateFormMessage("");

  if (isEditing) {
    renderTemplateItemsManagement(template);
  } else {
    hideTemplateItemsManagement();
  }

  if (typeof elements.form.scrollIntoView === "function") {
    elements.form.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function saveTemplate() {
  var elements = getTemplateFormElements();
  var values = getTemplateFormValues();
  var editTemplateId = elements.editIdInput ? elements.editIdInput.value : "";
  var validationResult;
  var timestamp;
  var savedTemplate;
  var nextTemplates;

  if (!templateDataReady) {
    setTemplateFormMessage("Template data is not ready.");
    return null;
  }

  validationResult = validateTemplate(values, editTemplateId);

  if (!validationResult.isValid) {
    setTemplateFormMessage(validationResult.message);
    return null;
  }

  timestamp = new Date().toISOString();

  if (editTemplateId) {
    if (!getEventTemplateById(editTemplateId)) {
      setTemplateFormMessage("Template no longer exists.");
      return null;
    }

    nextTemplates = eventTemplateData.map(function(template) {
      if (String(template.id) !== String(editTemplateId)) {
        return template;
      }

      savedTemplate = Object.assign({}, template, {
        name: values.name,
        description: values.description,
        eventType: values.eventType,
        dateBasis: values.dateBasis,
        isActive: values.isActive,
        updatedAt: timestamp
      });

      return savedTemplate;
    });
  } else {
    savedTemplate = {
      id: createEventTemplateId(),
      name: values.name,
      description: values.description,
      eventType: values.eventType,
      dateBasis: values.dateBasis,
      isActive: values.isActive,
      taskTemplates: [],
      documentTemplates: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    nextTemplates = eventTemplateData.concat([savedTemplate]);
  }

  try {
    commitTemplateData(nextTemplates);
  } catch (error) {
    console.error("Failed to save Event Template.", error);
    setTemplateFormMessage("Template could not be saved.");
    return null;
  }

  closeTemplateForm();
  refreshTemplateManagement();
  return savedTemplate;
}

function syncOpenTemplateFormStatus(templateId, isActive) {
  var elements = getTemplateFormElements();

  if (
    elements.editIdInput &&
    elements.statusInput &&
    String(elements.editIdInput.value) === String(templateId)
  ) {
    elements.statusInput.value = isActive ? "active" : "disabled";
  }
}

function updateTemplateStatus(templateId, isActive) {
  var template = getEventTemplateById(templateId);
  var nextTemplates;

  if (!templateDataReady || !template || typeof isActive !== "boolean") {
    return false;
  }

  nextTemplates = eventTemplateData.map(function(item) {
    if (String(item.id) !== String(templateId)) {
      return item;
    }

    return Object.assign({}, item, {
      isActive: isActive,
      updatedAt: new Date().toISOString()
    });
  });

  try {
    commitTemplateData(nextTemplates);
  } catch (error) {
    console.error("Failed to update Event Template status.", error);
    window.alert("範本狀態更新失敗，請稍後再試。");
    return false;
  }

  syncOpenTemplateFormStatus(templateId, isActive);
  refreshTemplateManagement();
  return true;
}

function getTemplateDeleteConfirmationMessage(templateId) {
  var usedByCount = getTemplateUsedByEventCount(templateId);

  if (usedByCount > 0) {
    return "確定要刪除此範本嗎？\n\n" +
      "目前已有 " + usedByCount + " 個活動由此範本建立。\n\n" +
      "刪除範本不會影響既有活動、任務、文件或預算。\n\n" +
      "刪除後，只會無法再使用此範本建立新活動。\n\n" +
      "此動作無法復原。";
  }

  return "確定要刪除此範本嗎？\n\n" +
    "此動作無法復原。\n\n" +
    "刪除後，將無法再使用此範本建立新活動。";
}

function deleteTemplate(templateId) {
  var elements = getTemplateFormElements();
  var template = getEventTemplateById(templateId);
  var nextTemplates;

  if (!templateDataReady || !template) {
    return false;
  }

  if (!exhibitionDataReady) {
    window.alert("活動資料尚未準備完成，請稍後再試。");
    return false;
  }

  if (!window.confirm(getTemplateDeleteConfirmationMessage(templateId))) {
    return false;
  }

  nextTemplates = eventTemplateData.filter(function(item) {
    return String(item.id) !== String(templateId);
  });

  try {
    commitTemplateData(nextTemplates);
  } catch (error) {
    console.error("Failed to delete Event Template.", error);
    window.alert("範本刪除失敗，請稍後再試。");
    return false;
  }

  if (elements.editIdInput && String(elements.editIdInput.value) === String(templateId)) {
    closeTemplateForm();
  }

  refreshTemplateManagement();
  return true;
}

function handleTemplateFormSubmit(event) {
  event.preventDefault();
  saveTemplate();
}

function setupTemplateManagementControls() {
  var elements = getTemplateFormElements();
  var templateList = document.querySelector("#template-list");
  var templateItemsManagement = document.querySelector("#template-items-management");

  if (elements.form) {
    elements.form.addEventListener("submit", handleTemplateFormSubmit);
  }

  if (elements.createButton) {
    elements.createButton.addEventListener("click", function() {
      openTemplateForm("");
    });
  }

  if (elements.cancelButton) {
    elements.cancelButton.addEventListener("click", closeTemplateForm);
  }

  if (templateList) {
    templateList.addEventListener("click", function(event) {
      var actionButton;

      if (!event.target.closest) {
        return;
      }

      actionButton = event.target.closest("[data-template-action]");

      if (!actionButton || !templateList.contains(actionButton)) {
        return;
      }

      if (actionButton.dataset.templateAction === "edit") {
        openTemplateForm(actionButton.dataset.templateId);
      }

      if (actionButton.dataset.templateAction === "enable") {
        updateTemplateStatus(actionButton.dataset.templateId, true);
      }

      if (actionButton.dataset.templateAction === "disable") {
        updateTemplateStatus(actionButton.dataset.templateId, false);
      }

      if (actionButton.dataset.templateAction === "delete") {
        deleteTemplate(actionButton.dataset.templateId);
      }
    });
  }

  if (templateItemsManagement) {
    templateItemsManagement.addEventListener("submit", function(event) {
      if (event.target.id === "template-task-item-form") {
        event.preventDefault();
        saveTemplateTaskItem();
      }

      if (event.target.id === "template-document-item-form") {
        event.preventDefault();
        saveTemplateDocumentItem();
      }
    });

    templateItemsManagement.addEventListener("click", function(event) {
      var actionButton;
      var action;
      var itemId;

      if (!event.target.closest) {
        return;
      }

      actionButton = event.target.closest("[data-template-item-action]");

      if (!actionButton || !templateItemsManagement.contains(actionButton)) {
        return;
      }

      action = actionButton.dataset.templateItemAction;
      itemId = actionButton.dataset.templateItemId || "";

      if (action === "add-task" || action === "edit-task") {
        openTemplateTaskItemForm(itemId);
      }

      if (action === "cancel-task") {
        closeTemplateTaskItemForm();
      }

      if (action === "delete-task") {
        deleteTemplateTaskItem(itemId);
      }

      if (action === "add-document" || action === "edit-document") {
        openTemplateDocumentItemForm(itemId);
      }

      if (action === "cancel-document") {
        closeTemplateDocumentItemForm();
      }

      if (action === "delete-document") {
        deleteTemplateDocumentItem(itemId);
      }
    });
  }

  closeTemplateForm();
}

function updateTemplateManagementAvailability() {
  var createButton = getTemplateFormElements().createButton;

  if (!createButton) {
    return;
  }

  createButton.disabled = !templateDataReady;
  createButton.title = templateDataReady ? "" : "範本資料載入中";
}

function renderTemplateSummary(templates) {
  var safeTemplates = Array.isArray(templates) ? templates : [];
  var activeCount = safeTemplates.filter(function(template) {
    return template && template.isActive === true;
  }).length;
  var disabledCount = safeTemplates.filter(function(template) {
    return template && template.isActive === false;
  }).length;
  var taskCount = safeTemplates.reduce(function(total, template) {
    return total + getTemplateTaskCount(template);
  }, 0);
  var documentCount = safeTemplates.reduce(function(total, template) {
    return total + getTemplateDocumentCount(template);
  }, 0);

  setTextContent("#template-summary-total", safeTemplates.length);
  setTextContent("#template-summary-active", activeCount);
  setTextContent("#template-summary-disabled", disabledCount);
  setTextContent("#template-summary-tasks", taskCount);
  setTextContent("#template-summary-documents", documentCount);
}

function renderTemplateEmptyState() {
  var templateList = document.querySelector("#template-list");

  if (templateList) {
    templateList.innerHTML = createEmptyStateMarkup(
      "目前沒有活動範本（No Templates Available）",
      "目前沒有可顯示的活動範本資料。"
    );
  }
}

function renderTemplateCards(templates) {
  var templateList = document.querySelector("#template-list");

  if (!templateList) {
    return;
  }

  if (!Array.isArray(templates) || !templates.length) {
    renderTemplateEmptyState();
    return;
  }

  templateList.innerHTML = templates.map(function(template) {
    var isActive = template && template.isActive === true;
    var statusClass = isActive ? "template-status-badge--active" : "template-status-badge--disabled";
    var toggleText = isActive ? "停用（Disable）" : "啟用（Enable）";
    var toggleAction = isActive ? "disable" : "enable";
    var description = template && template.description ? template.description : "無說明（No Description）";

    return "" +
      "<article class=\"template-card\" data-template-id=\"" + escapeHtml(template.id) + "\">" +
        "<div class=\"template-card__header\">" +
          "<h3 class=\"template-card__title\">" + escapeHtml(getDisplayValue(template.name)) + "</h3>" +
          "<span class=\"template-status-badge " + escapeHtml(statusClass) + "\">" + escapeHtml(getTemplateStatusText(template)) + "</span>" +
        "</div>" +
        "<p class=\"template-card__description\">" + escapeHtml(description) + "</p>" +
        "<dl class=\"template-card__meta\">" +
          "<div><dt>活動類型（Event Type）</dt><dd>" + escapeHtml(getDisplayValue(template.eventType)) + "</dd></div>" +
          "<div><dt>日期基準（Date Basis）</dt><dd>" + escapeHtml(getTemplateDateBasisText(template.dateBasis)) + "</dd></div>" +
          "<div><dt>任務數（Tasks）</dt><dd>" + escapeHtml(getTemplateTaskCount(template)) + "</dd></div>" +
          "<div><dt>文件數（Documents）</dt><dd>" + escapeHtml(getTemplateDocumentCount(template)) + "</dd></div>" +
          "<div><dt>更新時間（Updated At）</dt><dd>" + escapeHtml(formatTemplateUpdatedAt(template.updatedAt)) + "</dd></div>" +
          "<div><dt>使用活動數（Used By）</dt><dd>" + escapeHtml(getTemplateUsedByEventCount(template.id)) + "</dd></div>" +
        "</dl>" +
        "<div class=\"template-card__actions\" aria-label=\"範本操作（Template actions）\">" +
          "<button class=\"template-action-button\" type=\"button\" data-template-action=\"edit\" data-template-id=\"" + escapeHtml(template.id) + "\">編輯（Edit）</button>" +
          "<button class=\"template-action-button\" type=\"button\" data-template-action=\"" + escapeHtml(toggleAction) + "\" data-template-id=\"" + escapeHtml(template.id) + "\">" + escapeHtml(toggleText) + "</button>" +
          "<button class=\"template-action-button template-action-button--danger\" type=\"button\" data-template-action=\"delete\" data-template-id=\"" + escapeHtml(template.id) + "\">刪除（Delete）</button>" +
        "</div>" +
      "</article>";
  }).join("");
}

function renderTemplateManagement() {
  var templates = Array.isArray(eventTemplateData) ? eventTemplateData : [];

  renderTemplateSummary(templates);
  renderTemplateCards(getSortedTemplatesForDisplay(templates));
  updateTemplateManagementAvailability();
}

// Exhibition Module

function renderTableMessage(title, description) {
  var tableBody = document.querySelector("#exhibition-table-body");

  if (!tableBody) {
    return;
  }

  var modifierClass = title === "資料載入失敗" ? "empty-state--error" : "";

  tableBody.innerHTML = "" +
    "<tr>" +
      "<td colspan=\"6\">" +
        createEmptyStateMarkup(title, description, modifierClass) +
      "</td>" +
    "</tr>";
}

function getNextExhibitionId() {
  return getNextNumericId(exhibitionData, function(exhibition) {
    return exhibition.id;
  });
}

function getActiveEventTemplates() {
  if (!templateDataReady) {
    return [];
  }

  return eventTemplateData.filter(function(template) {
    return template && template.isActive === true;
  });
}

function getEventTemplateById(templateId) {
  if (!templateId) {
    return null;
  }

  return eventTemplateData.find(function(template) {
    return String(template.id) === String(templateId);
  }) || null;
}

function getEventTemplateOptionLabel(template) {
  return template && template.name ? template.name : "Template";
}

function getTaskTemplateItemCount(templateId) {
  return taskTemplateItemData.filter(function(item) {
    return String(item.templateId) === String(templateId);
  }).length;
}

function getDocumentTemplateItemCount(templateId) {
  return documentTemplateItemData.filter(function(item) {
    return String(item.templateId) === String(templateId);
  }).length;
}

function getSelectedEventTemplateId(elements) {
  return elements && elements.templateInput ? elements.templateInput.value : "";
}

function getSortedTaskTemplateItems(templateId) {
  return taskTemplateItemData.filter(function(item) {
    return String(item.templateId) === String(templateId);
  }).slice().sort(function(firstItem, secondItem) {
    return firstItem.sortOrder - secondItem.sortOrder;
  });
}

function getSortedDocumentTemplateItems(templateId) {
  return documentTemplateItemData.filter(function(item) {
    return String(item.templateId) === String(templateId);
  }).slice().sort(function(firstItem, secondItem) {
    return firstItem.sortOrder - secondItem.sortOrder;
  });
}

function parseInputDateLocal(dateText) {
  var dateParts = String(dateText || "").split("-");
  var year;
  var month;
  var day;
  var parsedDate;

  if (dateParts.length !== 3) {
    return null;
  }

  year = Number(dateParts[0]);
  month = Number(dateParts[1]);
  day = Number(dateParts[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function formatInputDateLocal(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

function isValidInputDate(dateText) {
  return parseInputDateLocal(dateText) !== null;
}

function calculateRelativeDueDate(startDate, relativeDueDays) {
  var dueDate;

  if (relativeDueDays === null) {
    return "";
  }

  if (typeof relativeDueDays !== "number" || !Number.isFinite(relativeDueDays)) {
    throw new Error("Invalid relativeDueDays value.");
  }

  dueDate = parseInputDateLocal(startDate);

  if (!dueDate) {
    throw new Error("Invalid startDate value.");
  }

  dueDate.setDate(dueDate.getDate() + relativeDueDays);

  return formatInputDateLocal(dueDate);
}

function createEventTemplateAlertError(userMessage, detailMessage) {
  var error = new Error(detailMessage || userMessage);

  error.userMessage = userMessage;

  return error;
}

function validateBaseDataReadyForEventCreate(templateId) {
  if (!templateId) {
    if (!exhibitionDataReady) {
      throw createEventTemplateAlertError(
        "活動、任務或文件資料尚未成功載入，請重新整理後再試。",
        "Exhibition data is not ready."
      );
    }

    return;
  }

  if (!exhibitionDataReady || !taskDataReady || !documentDataReady) {
    throw createEventTemplateAlertError(
      "活動、任務或文件資料尚未成功載入，請重新整理後再試。",
      "Base event, task, or document data is not ready."
    );
  }
}

function validateEventTemplateInstantiation(templateId, values) {
  var selectedTemplate;
  var dateBasis;

  if (!templateId) {
    return null;
  }

  if (!templateDataReady) {
    throw createEventTemplateAlertError(
      "活動範本資料尚未準備完成，請稍後再試。",
      "Template data is not ready."
    );
  }

  selectedTemplate = getEventTemplateById(templateId);

  if (!selectedTemplate || selectedTemplate.isActive !== true) {
    throw createEventTemplateAlertError(
      "選取的活動範本無效，請重新選擇。",
      "Selected event template is invalid: " + templateId
    );
  }

  dateBasis = getEventTemplateDateBasis(selectedTemplate);

  if (!isValidInputDate(values[dateBasis])) {
    throw createEventTemplateAlertError(
      dateBasis === "endDate"
        ? "使用活動範本時，請先輸入結束日期。"
        : "使用活動範本時，請先輸入開始日期。",
      "Template event requires a valid " + dateBasis + "."
    );
  }

  return deepCopyTemplateData(selectedTemplate);
}

function getEventTemplateDateBasis(template) {
  return template && template.dateBasis === "endDate" ? "endDate" : "startDate";
}

function createRuntimeTasksFromTemplate(template, exhibition) {
  var nextTaskId = getNextTaskId();
  var templateItems = Array.isArray(template.taskTemplates) ? template.taskTemplates : [];

  return templateItems.slice().sort(function(firstItem, secondItem) {
    return firstItem.sortOrder - secondItem.sortOrder;
  }).map(function(templateItem, index) {
    var dateBasis = templateItem.dateBasis === "startDate" || templateItem.dateBasis === "endDate"
      ? templateItem.dateBasis
      : getEventTemplateDateBasis(template);
    var basisDate = exhibition[dateBasis];

    return {
      taskId: nextTaskId + index,
      exhibitionId: exhibition.id,
      title: templateItem.title,
      category: "general",
      owner: templateItem.owner,
      status: templateItem.defaultStatus,
      priority: templateItem.priority,
      dueDate: calculateRelativeDueDate(basisDate, templateItem.relativeDueDays),
      note: templateItem.description || "",
      sourceTemplateId: template.id,
      sourceTemplateItemId: templateItem.id,
      dueDateMode: "relative",
      relativeDueDays: templateItem.relativeDueDays,
      dateBasis: dateBasis
    };
  });
}

function createRuntimeDocumentsFromTemplate(template, exhibitionId) {
  var nextDocumentId = getNextDocumentId();
  var updatedAt = getTodayInputDate();
  var templateItems = Array.isArray(template.documentTemplates) ? template.documentTemplates : [];

  return templateItems.slice().sort(function(firstItem, secondItem) {
    return firstItem.sortOrder - secondItem.sortOrder;
  }).map(function(templateItem, index) {
    return {
      id: nextDocumentId + index,
      exhibitionId: exhibitionId,
      title: templateItem.title,
      type: templateItem.type,
      status: templateItem.defaultStatus,
      owner: templateItem.owner,
      updatedAt: updatedAt,
      description: "",
      url: ""
    };
  });
}

function createEventInstantiationPayload(values, templateId) {
  var selectedTemplate;
  var exhibition;
  var runtimeTasks = [];
  var runtimeDocuments = [];

  validateBaseDataReadyForEventCreate(templateId);

  selectedTemplate = validateEventTemplateInstantiation(templateId, values);
  exhibition = createRuntimeExhibition(values, selectedTemplate ? selectedTemplate.id : null);

  if (selectedTemplate) {
    runtimeTasks = createRuntimeTasksFromTemplate(selectedTemplate, exhibition);
    runtimeDocuments = createRuntimeDocumentsFromTemplate(selectedTemplate, exhibition.id);
  }

  return {
    exhibition: exhibition,
    tasks: runtimeTasks,
    documents: runtimeDocuments,
    isTemplateEvent: !!selectedTemplate
  };
}

function rollbackEventInstantiationStorage(originalValues) {
  restoreRawLocalStorageValue(localStorageKeys.exhibitions, originalValues.exhibitions);
  restoreRawLocalStorageValue(localStorageKeys.tasks, originalValues.tasks);
  restoreRawLocalStorageValue(localStorageKeys.documents, originalValues.documents);
}

function commitEventInstantiation(payload) {
  var nextExhibitionData = exhibitionData.concat([payload.exhibition]);
  var nextTaskData = payload.isTemplateEvent ? taskData.concat(payload.tasks) : taskData;
  var nextDocumentData = payload.isTemplateEvent ? documentData.concat(payload.documents) : documentData;
  var serializedExhibitions = JSON.stringify(nextExhibitionData);
  var serializedTasks = JSON.stringify(nextTaskData);
  var serializedDocuments = JSON.stringify(nextDocumentData);
  var originalValues = {
    exhibitions: getRawLocalStorageValue(localStorageKeys.exhibitions),
    tasks: getRawLocalStorageValue(localStorageKeys.tasks),
    documents: getRawLocalStorageValue(localStorageKeys.documents)
  };

  try {
    setRawLocalStorageValue(localStorageKeys.exhibitions, serializedExhibitions);

    if (payload.isTemplateEvent) {
      setRawLocalStorageValue(localStorageKeys.tasks, serializedTasks);
      setRawLocalStorageValue(localStorageKeys.documents, serializedDocuments);
    }
  } catch (error) {
    try {
      rollbackEventInstantiationStorage(originalValues);
    } catch (rollbackError) {
      console.error("Failed to rollback Event Instantiation Local Storage.", rollbackError);
    }

    throw error;
  }

  exhibitionData = nextExhibitionData;

  if (payload.isTemplateEvent) {
    taskData = nextTaskData;
    documentData = nextDocumentData;
  }
}

function updateEventTemplatePreview() {
  var elements = getExhibitionFormElements();
  var selectedTemplateId = elements.templateInput ? elements.templateInput.value : "";
  var selectedTemplate = getEventTemplateById(selectedTemplateId);
  var previewName = document.querySelector("#event-template-preview-name");
  var previewDescription = document.querySelector("#event-template-preview-description");
  var previewTaskCount = document.querySelector("#event-template-preview-task-count");
  var previewDocumentCount = document.querySelector("#event-template-preview-document-count");

  if (!selectedTemplate) {
    if (previewName) {
      previewName.textContent = "未選擇範本（No Template Selected）";
    }

    if (previewDescription) {
      previewDescription.textContent = "";
    }

    if (previewTaskCount) {
      previewTaskCount.textContent = "0";
    }

    if (previewDocumentCount) {
      previewDocumentCount.textContent = "0";
    }

    return;
  }

  if (previewName) {
    previewName.textContent = getDisplayValue(selectedTemplate.name);
  }

  if (previewDescription) {
    previewDescription.textContent = getDisplayValue(selectedTemplate.description);
  }

  if (previewTaskCount) {
    previewTaskCount.textContent = getTaskTemplateItemCount(selectedTemplate.id);
  }

  if (previewDocumentCount) {
    previewDocumentCount.textContent = getDocumentTemplateItemCount(selectedTemplate.id);
  }
}

function renderEventTemplateOptions() {
  var elements = getExhibitionFormElements();
  var selectedTemplateId = elements.templateInput ? elements.templateInput.value : "";
  var activeTemplates = getActiveEventTemplates();

  if (!elements.templateInput) {
    return;
  }

  elements.templateInput.innerHTML = "<option value=\"\">空白活動（Blank Event）</option>" + activeTemplates.map(function(template) {
    return "<option value=\"" + escapeHtml(template.id) + "\">" + escapeHtml(getEventTemplateOptionLabel(template)) + "</option>";
  }).join("");

  elements.templateInput.value = getEventTemplateById(selectedTemplateId) ? selectedTemplateId : "";
  updateEventTemplatePreview();
}

function getExhibitionFormElements() {
  return {
    form: document.querySelector("#exhibition-form"),
    editIdInput: document.querySelector("#exhibition-edit-id"),
    templateInput: document.querySelector("#event-template-input"),
    nameInput: document.querySelector("#exhibition-name-input"),
    countryInput: document.querySelector("#exhibition-country-input"),
    cityInput: document.querySelector("#exhibition-city-input"),
    startDateInput: document.querySelector("#exhibition-start-date-input"),
    endDateInput: document.querySelector("#exhibition-end-date-input"),
    statusInput: document.querySelector("#exhibition-status-input"),
    ownerInput: document.querySelector("#exhibition-owner-input"),
    venueInput: document.querySelector("#exhibition-venue-input"),
    boothInput: document.querySelector("#exhibition-booth-input"),
    objectiveInput: document.querySelector("#exhibition-objective-input"),
    submitButton: document.querySelector("#exhibition-submit-button"),
    cancelButton: document.querySelector("#exhibition-cancel-edit-button")
  };
}

function resetExhibitionForm() {
  var elements = getExhibitionFormElements();

  if (!resetFormEditState(elements, "新增活動（Add Event）")) {
    return;
  }

  if (elements.statusInput) {
    elements.statusInput.value = "planning";
  }

  if (elements.ownerInput) {
    elements.ownerInput.value = "Campbell";
  }

  if (elements.templateInput) {
    elements.templateInput.value = "";
  }

  updateEventTemplatePreview();
}

function getExhibitionFormValues() {
  var elements = getExhibitionFormElements();

  return {
    name: elements.nameInput ? elements.nameInput.value.trim() : "",
    country: elements.countryInput ? elements.countryInput.value.trim() : "",
    city: elements.cityInput ? elements.cityInput.value.trim() : "",
    startDate: elements.startDateInput ? elements.startDateInput.value : "",
    endDate: elements.endDateInput ? elements.endDateInput.value : "",
    status: elements.statusInput ? elements.statusInput.value : "planning",
    owner: elements.ownerInput ? elements.ownerInput.value.trim() : "Campbell",
    venue: elements.venueInput ? elements.venueInput.value.trim() : "",
    booth: elements.boothInput ? elements.boothInput.value.trim() : "",
    objective: elements.objectiveInput ? elements.objectiveInput.value.trim() : ""
  };
}

function populateExhibitionForm(exhibition) {
  var elements = getExhibitionFormElements();

  if (!elements.form || !exhibition) {
    return;
  }

  if (elements.nameInput) {
    elements.nameInput.value = exhibition.name || "";
  }

  if (elements.countryInput) {
    elements.countryInput.value = exhibition.country || "";
  }

  if (elements.cityInput) {
    elements.cityInput.value = exhibition.city || "";
  }

  if (elements.startDateInput) {
    elements.startDateInput.value = exhibition.startDate || "";
  }

  if (elements.endDateInput) {
    elements.endDateInput.value = exhibition.endDate || "";
  }

  if (elements.statusInput) {
    elements.statusInput.value = statusTextMap[exhibition.status] ? exhibition.status : "planning";
  }

  if (elements.ownerInput) {
    elements.ownerInput.value = exhibition.owner || "Campbell";
  }

  if (elements.venueInput) {
    elements.venueInput.value = exhibition.venue || "";
  }

  if (elements.boothInput) {
    elements.boothInput.value = exhibition.booth || "";
  }

  if (elements.objectiveInput) {
    elements.objectiveInput.value = exhibition.objective || "";
  }

  if (elements.templateInput) {
    elements.templateInput.value = "";
  }

  updateEventTemplatePreview();

  setFormEditState(elements, exhibition.id, "儲存活動（Save Event）");

  scrollToExhibitionForm();
}

function scrollToExhibitionForm() {
  var elements = getExhibitionFormElements();

  scrollToFormElement(elements.form);
}

function createRuntimeExhibition(values, sourceTemplateId) {
  return {
    id: getNextExhibitionId(),
    name: values.name,
    country: values.country,
    city: values.city,
    startDate: values.startDate,
    endDate: values.endDate,
    status: values.status || "planning",
    owner: values.owner || "Campbell",
    venue: values.venue,
    booth: values.booth,
    objective: values.objective,
    sourceTemplateId: sourceTemplateId || null
  };
}

function updateExhibitionFromValues(exhibition, values) {
  exhibition.name = values.name;
  exhibition.country = values.country;
  exhibition.city = values.city;
  exhibition.startDate = values.startDate;
  exhibition.endDate = values.endDate;
  exhibition.status = values.status;
  exhibition.owner = values.owner;
  exhibition.venue = values.venue;
  exhibition.booth = values.booth;
  exhibition.objective = values.objective;
}

function haveExhibitionDatesChanged(originalExhibition, updatedExhibition) {
  return originalExhibition.startDate !== updatedExhibition.startDate ||
    originalExhibition.endDate !== updatedExhibition.endDate;
}

function recalculateRelativeTasksForExhibition(tasks, exhibition) {
  return tasks.map(function(task) {
    var basisDate;

    if (
      String(task.exhibitionId) !== String(exhibition.id) ||
      task.dueDateMode !== "relative"
    ) {
      return task;
    }

    if (!isValidRuntimeTaskDateBasis(task.dateBasis) || !isValidRelativeDueDays(task.relativeDueDays)) {
      throw createEventTemplateAlertError(
        "相對到期日任務資料不完整，請重新整理後再試。",
        "Relative Task metadata is invalid: " + getTaskId(task)
      );
    }

    basisDate = exhibition[task.dateBasis];

    if (!isValidInputDate(basisDate)) {
      throw createEventTemplateAlertError(
        task.dateBasis === "endDate"
          ? "相對到期日任務需要有效的活動結束日期。"
          : "相對到期日任務需要有效的活動開始日期。",
        "Relative Task requires a valid Event " + task.dateBasis + "."
      );
    }

    return Object.assign({}, task, {
      dueDate: calculateRelativeDueDate(basisDate, task.relativeDueDays)
    });
  });
}

function rollbackExhibitionUpdateStorage(originalValues, includeTasks) {
  restoreRawLocalStorageValue(localStorageKeys.exhibitions, originalValues.exhibitions);

  if (includeTasks) {
    restoreRawLocalStorageValue(localStorageKeys.tasks, originalValues.tasks);
  }
}

function commitExhibitionUpdate(exhibition, values) {
  var updatedExhibition = Object.assign({}, exhibition);
  var datesChanged;
  var nextExhibitionData;
  var nextTaskData;
  var serializedExhibitions;
  var serializedTasks;
  var originalValues;

  updateExhibitionFromValues(updatedExhibition, values);
  datesChanged = haveExhibitionDatesChanged(exhibition, updatedExhibition);

  if (datesChanged && !taskDataReady) {
    throw createEventTemplateAlertError(
      "任務資料尚未成功載入，請重新整理後再試。",
      "Task data is not ready for Relative Due Date recalculation."
    );
  }

  nextExhibitionData = exhibitionData.map(function(item) {
    return String(item.id) === String(exhibition.id) ? updatedExhibition : item;
  });
  nextTaskData = datesChanged
    ? recalculateRelativeTasksForExhibition(taskData, updatedExhibition)
    : taskData;

  if (canUseLocalStorage()) {
    serializedExhibitions = JSON.stringify(nextExhibitionData);
    serializedTasks = datesChanged ? JSON.stringify(nextTaskData) : null;
    originalValues = {
      exhibitions: getRawLocalStorageValue(localStorageKeys.exhibitions),
      tasks: datesChanged ? getRawLocalStorageValue(localStorageKeys.tasks) : null
    };

    try {
      setRawLocalStorageValue(localStorageKeys.exhibitions, serializedExhibitions);

      if (datesChanged) {
        setRawLocalStorageValue(localStorageKeys.tasks, serializedTasks);
      }
    } catch (error) {
      try {
        rollbackExhibitionUpdateStorage(originalValues, datesChanged);
      } catch (rollbackError) {
        console.error("Failed to rollback Event date update Local Storage.", rollbackError);
      }

      throw error;
    }
  }

  exhibitionData = nextExhibitionData;

  if (datesChanged) {
    taskData = nextTaskData;
  }

  return updatedExhibition;
}

function refreshExhibitionModuleViews(exhibition) {
  renderExhibitions(getFilteredExhibitions());
  updateSummaryCards(exhibitionData);
  renderTemplateManagement();

  if (exhibition) {
    selectExhibition(exhibition, false);
    return;
  }

  if (getSelectedExhibition()) {
    selectExhibition(getSelectedExhibition(), false);
    return;
  }

  resetExhibitionDetail();
}

function handleExhibitionFormSubmit(event) {
  var elements = getExhibitionFormElements();
  var values;
  var editId;
  var exhibition;
  var selectedTemplateId;
  var instantiationPayload;

  event.preventDefault();

  values = getExhibitionFormValues();

  if (!values.name) {
    return;
  }

  editId = elements.editIdInput ? elements.editIdInput.value : "";

  if (editId) {
    exhibition = getExhibitionById(editId);

    if (!exhibition) {
      resetExhibitionForm();
      return;
    }

    try {
      exhibition = commitExhibitionUpdate(exhibition, values);
    } catch (error) {
      console.error(error);
      window.alert(error.userMessage || "活動更新失敗，請稍後再試。");
      return;
    }
  } else {
    selectedTemplateId = getSelectedEventTemplateId(elements);

    try {
      instantiationPayload = createEventInstantiationPayload(values, selectedTemplateId);
    } catch (error) {
      console.error(error);
      window.alert(error.userMessage || "活動建立失敗，請稍後再試。");
      return;
    }

    exhibition = instantiationPayload.exhibition;

    try {
      commitEventInstantiation(instantiationPayload);
    } catch (error) {
      console.error(error);
      window.alert("活動建立失敗，請稍後再試。");
      return;
    }

    setControlValue("#exhibition-search", "");
    setControlValue("#exhibition-status-filter", "");
  }

  resetExhibitionForm();
  refreshExhibitionModuleViews(exhibition);
}

function startEditExhibition(exhibitionId) {
  var exhibition = getExhibitionById(exhibitionId);

  if (!exhibition) {
    return;
  }

  selectExhibition(exhibition, false);
  populateExhibitionForm(exhibition);
}

function getRelatedTaskCount(exhibitionId) {
  return taskData.filter(function(task) {
    return String(task.exhibitionId) === String(exhibitionId);
  }).length;
}

function getRelatedDocumentCount(exhibitionId) {
  return documentData.filter(function(documentItem) {
    return String(documentItem.exhibitionId) === String(exhibitionId);
  }).length;
}

function getExhibitionDeleteBlockMessage(taskCount, documentCount) {
  return "無法刪除活動（Cannot delete event）。\n\n" +
    "此活動仍包含：\n\n" +
    "- " + taskCount + " 任務（Tasks）\n" +
    "- " + documentCount + " 文件（Documents）\n\n" +
    "請先刪除或移動相關任務與文件。";
}

function getFallbackExhibitionAfterDelete(exhibitionId) {
  var deletedIndex = exhibitionData.findIndex(function(exhibition) {
    return String(exhibition.id) === String(exhibitionId);
  });
  var remainingExhibitions;

  if (deletedIndex === -1) {
    return null;
  }

  remainingExhibitions = exhibitionData.filter(function(exhibition) {
    return String(exhibition.id) !== String(exhibitionId);
  });

  return remainingExhibitions[deletedIndex] || remainingExhibitions[deletedIndex - 1] || null;
}

function refreshAfterExhibitionDelete(deletedExhibitionId, fallbackExhibition) {
  var deletedCurrentExhibition = String(deletedExhibitionId) === selectedExhibitionId;

  renderExhibitions(getFilteredExhibitions());
  updateSummaryCards(exhibitionData);
  renderTemplateManagement();

  if (deletedCurrentExhibition) {
    if (fallbackExhibition) {
      selectExhibition(fallbackExhibition, false);
      return;
    }

    resetExhibitionDetail();
    return;
  }

  refreshDashboardViews();
  setActiveTableRow(selectedExhibitionId);
}

function deleteExhibition(exhibitionId) {
  var elements = getExhibitionFormElements();
  var taskCount;
  var documentCount;
  var fallbackExhibition;

  if (!getExhibitionById(exhibitionId)) {
    return;
  }

  if (!taskDataLoaded || !documentDataLoaded) {
    window.alert("無法刪除活動（Cannot delete event）。\n\n相關任務與文件資料仍在載入中，請稍後再試。");
    return;
  }

  taskCount = getRelatedTaskCount(exhibitionId);
  documentCount = getRelatedDocumentCount(exhibitionId);

  if (taskCount || documentCount) {
    window.alert(getExhibitionDeleteBlockMessage(taskCount, documentCount));
    return;
  }

  if (!window.confirm("確定要刪除此活動嗎？（Delete this event?）")) {
    return;
  }

  fallbackExhibition = getFallbackExhibitionAfterDelete(exhibitionId);
  exhibitionData = exhibitionData.filter(function(exhibition) {
    return String(exhibition.id) !== String(exhibitionId);
  });

  saveExhibitionDataToStorage();

  if (elements.editIdInput && elements.editIdInput.value === String(exhibitionId)) {
    resetExhibitionForm();
  }

  refreshAfterExhibitionDelete(exhibitionId, fallbackExhibition);
}

function setupExhibitionManagementControls() {
  var elements = getExhibitionFormElements();

  if (elements.form) {
    elements.form.addEventListener("submit", handleExhibitionFormSubmit);
  }

  if (elements.cancelButton) {
    elements.cancelButton.addEventListener("click", resetExhibitionForm);
  }

  if (elements.templateInput) {
    elements.templateInput.addEventListener("change", updateEventTemplatePreview);
  }

  renderEventTemplateOptions();
  resetExhibitionForm();
}

function renderErrorRow() {
  renderTableMessage(
    "資料載入失敗",
    "請確認 data/exhibitions.json 是否存在，或使用 Live Server 開啟專案。"
  );
}

function renderExhibitions(exhibitions) {
  var tableBody = document.querySelector("#exhibition-table-body");

  if (!tableBody) {
    return;
  }

  if (!exhibitions.length) {
    renderTableMessage(
      "沒有符合條件的活動資料",
      "請調整關鍵字或狀態篩選條件。"
    );
    return;
  }

  tableBody.innerHTML = exhibitions.map(function(exhibition) {
    var statusText = getStatusText(exhibition.status);
    var statusClass = getStatusClass(exhibition.status);
    var dateRange = getDateRange(exhibition);

    return "" +
      "<tr class=\"table-row\" data-exhibition-id=\"" + escapeHtml(exhibition.id) + "\">" +
        "<td>" + escapeHtml(getDisplayValue(exhibition.name)) + "</td>" +
        "<td>" + escapeHtml(getDisplayValue(exhibition.country)) + " / " + escapeHtml(getDisplayValue(exhibition.city)) + "</td>" +
        "<td>" + escapeHtml(dateRange) + "</td>" +
        "<td><span class=\"status-badge " + escapeHtml(statusClass) + "\">" + escapeHtml(statusText) + "</span></td>" +
        "<td>" + escapeHtml(getDisplayValue(exhibition.owner)) + "</td>" +
        "<td>" +
          "<div class=\"exhibition-row-actions\">" +
            "<button class=\"exhibition-action-button\" type=\"button\" data-exhibition-action=\"edit\" data-exhibition-id=\"" + escapeHtml(exhibition.id) + "\">編輯（Edit）</button>" +
            "<button class=\"exhibition-action-button exhibition-action-button--danger\" type=\"button\" data-exhibition-action=\"delete\" data-exhibition-id=\"" + escapeHtml(exhibition.id) + "\">刪除（Delete）</button>" +
          "</div>" +
        "</td>" +
      "</tr>";
  }).join("");

  tableBody.querySelectorAll(".table-row").forEach(function(row) {
    row.addEventListener("click", function(event) {
      if (event.target.closest("[data-exhibition-action]")) {
        return;
      }

      var exhibitionId = row.dataset.exhibitionId;
      var selectedExhibition = exhibitions.find(function(exhibition) {
        return String(exhibition.id) === exhibitionId;
      });

      if (!selectedExhibition) {
        return;
      }

      selectExhibition(selectedExhibition, true);
    });
  });

  tableBody.querySelectorAll("[data-exhibition-action=\"edit\"]").forEach(function(button) {
    button.addEventListener("click", function(event) {
      event.stopPropagation();
      startEditExhibition(button.dataset.exhibitionId);
    });
  });

  tableBody.querySelectorAll("[data-exhibition-action=\"delete\"]").forEach(function(button) {
    button.addEventListener("click", function(event) {
      event.stopPropagation();
      deleteExhibition(button.dataset.exhibitionId);
    });
  });

  if (selectedExhibitionId) {
    setActiveTableRow(selectedExhibitionId);
  }
}

function updateSummaryCards(exhibitions) {
  var summaryTotal = document.querySelector("#summary-total");
  var summaryPlanning = document.querySelector("#summary-planning");
  var summaryActive = document.querySelector("#summary-active");
  var summaryDone = document.querySelector("#summary-done");

  var planningCount = countByStatus(exhibitions, "planning");
  var activeCount = countByStatus(exhibitions, "active");
  var doneCount = countByStatus(exhibitions, "done");

  if (summaryTotal) {
    summaryTotal.textContent = exhibitions.length;
  }

  if (summaryPlanning) {
    summaryPlanning.textContent = planningCount;
  }

  if (summaryActive) {
    summaryActive.textContent = activeCount;
  }

  if (summaryDone) {
    summaryDone.textContent = doneCount;
  }
}

function setActiveTableRow(exhibitionId) {
  document.querySelectorAll(".table-row").forEach(function(row) {
    row.classList.toggle("table-row--active", row.dataset.exhibitionId === exhibitionId);
  });
}

function renderDetailEmptyState() {
  var detailPanel = document.querySelector("#exhibition-detail");

  if (!detailPanel) {
    return;
  }

  detailPanel.innerHTML = createEmptyStateMarkup(
    "尚未選擇活動（No Event Selected）",
    "請從上方活動清單選擇一筆活動查看詳細資訊。"
  );
}

function resetExhibitionDetail() {
  selectedExhibitionId = null;
  setActiveTableRow("");
  renderDetailEmptyState();
  resetExhibitionForm();
  resetTaskForm();
  resetDocumentForm();
  refreshSelectedExhibitionViews();
}

function renderExhibitionDetail(exhibition) {
  var detailPanel = document.querySelector("#exhibition-detail");

  if (!detailPanel) {
    return;
  }

  selectedExhibitionId = String(exhibition.id);

  var statusText = getStatusText(exhibition.status);
  var statusClass = getStatusClass(exhibition.status);
  var dateRange = getDateRange(exhibition);

  detailPanel.innerHTML = "" +
    "<div class=\"detail-panel__header\">" +
      "<div>" +
        "<h3>" + escapeHtml(getDisplayValue(exhibition.name)) + "</h3>" +
      "</div>" +
      "<span class=\"status-badge " + escapeHtml(statusClass) + "\">" + escapeHtml(statusText) + "</span>" +
    "</div>" +
    "<dl class=\"detail-panel__meta\">" +
      "<div>" +
        "<dt>國家/城市</dt>" +
        "<dd>" + escapeHtml(getDisplayValue(exhibition.country)) + " / " + escapeHtml(getDisplayValue(exhibition.city)) + "</dd>" +
      "</div>" +
      "<div>" +
        "<dt>活動日期（Event Date）</dt>" +
        "<dd>" + escapeHtml(dateRange) + "</dd>" +
      "</div>" +
      "<div>" +
        "<dt>負責人（Owner）</dt>" +
        "<dd>" + escapeHtml(getDisplayValue(exhibition.owner)) + "</dd>" +
      "</div>" +
      "<div>" +
        "<dt>狀態（Status）</dt>" +
        "<dd><span class=\"status-badge " + escapeHtml(statusClass) + "\">" + escapeHtml(statusText) + "</span></dd>" +
      "</div>" +
      "<div>" +
        "<dt>地點（Venue）</dt>" +
        "<dd>" + escapeHtml(getDisplayValue(exhibition.venue)) + "</dd>" +
      "</div>" +
      "<div>" +
        "<dt>攤位（Booth）</dt>" +
        "<dd>" + escapeHtml(getDisplayValue(exhibition.booth)) + "</dd>" +
      "</div>" +
      "<div class=\"detail-panel__objective\">" +
        "<dt>活動目的（Event Objective）</dt>" +
        "<dd>" + escapeHtml(getDisplayValue(exhibition.objective)) + "</dd>" +
      "</div>" +
    "</dl>";
}

function getFilteredExhibitions() {
  var searchInput = document.querySelector("#exhibition-search");
  var statusFilter = document.querySelector("#exhibition-status-filter");
  var keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
  var status = statusFilter ? statusFilter.value : "";

  return exhibitionData.filter(function(exhibition) {
    var matchesStatus = !status || exhibition.status === status;
    var searchableText = [
      exhibition.name,
      exhibition.country,
      exhibition.city,
      exhibition.owner
    ].map(function(value) {
      return String(getDisplayValue(value)).toLowerCase();
    }).join(" ");
    var matchesKeyword = !keyword || searchableText.includes(keyword);

    return matchesStatus && matchesKeyword;
  });
}

function applyFilters() {
  var filteredExhibitions = getFilteredExhibitions();

  renderExhibitions(filteredExhibitions);
}

function setupFilterControls() {
  var searchInput = document.querySelector("#exhibition-search");
  var statusFilter = document.querySelector("#exhibition-status-filter");

  if (searchInput) {
    searchInput.addEventListener("input", applyFilters);
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", applyFilters);
  }
}

// Task Module

function getLocalDate(dateText) {
  var dateParts;
  var parsedDate;

  if (!dateText) {
    return null;
  }

  dateParts = String(dateText).split("-");

  if (dateParts.length === 3) {
    parsedDate = new Date(
      Number(dateParts[0]),
      Number(dateParts[1]) - 1,
      Number(dateParts[2])
    );
  } else {
    parsedDate = new Date(dateText);
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
}

function getTodayDate() {
  var today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getDaysUntilDue(dueDate) {
  var dueDateValue = getLocalDate(dueDate);
  var millisecondsPerDay = 24 * 60 * 60 * 1000;

  if (!dueDateValue) {
    return null;
  }

  return Math.round((dueDateValue.getTime() - getTodayDate().getTime()) / millisecondsPerDay);
}

function getTaskDueCountdownText(dueDate) {
  var daysUntilDue = getDaysUntilDue(dueDate);

  if (daysUntilDue === null) {
    return "無到期日（No Due Date）";
  }

  if (daysUntilDue < 0) {
    return "逾期（Overdue）";
  }

  if (daysUntilDue === 0) {
    return "🔥 今日到期（Due Today）";
  }

  if (daysUntilDue === 1) {
    return "⚠ 明天到期（Tomorrow）";
  }

  return "⏳ 剩餘 " + daysUntilDue + " 天（" + daysUntilDue + " Days Left）";
}

function getTaskDueCountdownClass(dueDate) {
  var daysUntilDue = getDaysUntilDue(dueDate);

  if (daysUntilDue === null) {
    return "task-countdown-badge--none";
  }

  if (daysUntilDue < 0) {
    return "task-countdown-badge--overdue";
  }

  if (daysUntilDue === 0) {
    return "task-countdown-badge--today";
  }

  if (daysUntilDue === 1) {
    return "task-countdown-badge--tomorrow";
  }

  return "task-countdown-badge--upcoming";
}

function getMillisecondsUntilNextTaskCountdownRefresh() {
  var now = new Date();
  var nextRefresh = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0);

  return nextRefresh.getTime() - now.getTime();
}

function refreshTaskCountdownDisplay() {
  if (taskDataLoaded) {
    renderFilteredTasks();
  }
}

function setupTaskCountdownAutoRefresh() {
  window.setTimeout(function refreshDailyTaskCountdown() {
    refreshTaskCountdownDisplay();
    window.setTimeout(refreshDailyTaskCountdown, getMillisecondsUntilNextTaskCountdownRefresh());
  }, getMillisecondsUntilNextTaskCountdownRefresh());
}

function isTaskDone(task) {
  return task.status === "done";
}

function isTaskOverdue(task) {
  var daysUntilDue = getDaysUntilDue(task.dueDate);

  return daysUntilDue !== null && daysUntilDue < 0 && !isTaskDone(task);
}

function isTaskDueSoon(task) {
  var daysUntilDue = getDaysUntilDue(task.dueDate);

  return daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3 && !isTaskDone(task);
}

function getTaskStatusText(status) {
  return taskStatusTextMap[status] || getDisplayValue(status);
}

function getTaskStatusClass(status) {
  var normalizedStatus = String(getDisplayValue(status)).replaceAll("_", "-");

  if (!taskStatusTextMap[status]) {
    return "task-status-badge--todo";
  }

  return "task-status-badge--" + normalizedStatus;
}

function getTaskPriorityText(priority) {
  return taskPriorityTextMap[priority] || getDisplayValue(priority);
}

function getTaskPriorityClass(priority) {
  if (!taskPriorityTextMap[priority]) {
    return "task-priority-badge--low";
  }

  return "task-priority-badge--" + priority;
}

function getTaskId(task) {
  if (Object.prototype.hasOwnProperty.call(task, "taskId")) {
    return task.taskId;
  }

  return task.id;
}

function getNextTaskId() {
  return getNextNumericId(taskData, getTaskId);
}

function findTaskById(taskId) {
  return taskData.find(function(task) {
    return String(getTaskId(task)) === String(taskId);
  }) || null;
}

function getTaskFormElements() {
  return {
    form: document.querySelector("#task-form"),
    editIdInput: document.querySelector("#task-edit-id"),
    titleInput: document.querySelector("#task-title-input"),
    dueDateInput: document.querySelector("#task-due-date-input"),
    priorityInput: document.querySelector("#task-priority-input"),
    ownerInput: document.querySelector("#task-owner-input"),
    statusInput: document.querySelector("#task-status-input"),
    submitButton: document.querySelector("#task-submit-button"),
    cancelButton: document.querySelector("#task-cancel-edit-button")
  };
}

function syncTaskOwnerOption(owner) {
  var elements = getTaskFormElements();
  var ownerValue = getDisplayValue(owner);
  var existingOption;

  if (!elements.ownerInput) {
    return;
  }

  elements.ownerInput.querySelectorAll("[data-runtime-owner-option]").forEach(function(option) {
    option.remove();
  });

  existingOption = Array.prototype.find.call(elements.ownerInput.options, function(option) {
    return option.value === ownerValue;
  });

  if (!existingOption && ownerValue !== "待確認") {
    existingOption = new Option(ownerValue, ownerValue);
    existingOption.dataset.runtimeOwnerOption = "true";
    elements.ownerInput.appendChild(existingOption);
  }

  elements.ownerInput.value = existingOption ? ownerValue : "行銷";
}

function resetTaskForm() {
  var elements = getTaskFormElements();

  taskEditOriginalDueDate = null;

  if (!resetFormEditState(elements, "新增任務（Add Task）")) {
    return;
  }

  if (elements.priorityInput) {
    elements.priorityInput.value = "medium";
  }

  syncTaskOwnerOption("行銷");

  if (elements.statusInput) {
    elements.statusInput.value = "todo";
  }
}

function getTaskFormValues() {
  var elements = getTaskFormElements();

  return {
    title: elements.titleInput ? elements.titleInput.value.trim() : "",
    dueDate: elements.dueDateInput ? elements.dueDateInput.value : "",
    priority: elements.priorityInput ? elements.priorityInput.value : "medium",
    owner: elements.ownerInput ? elements.ownerInput.value : "行銷",
    status: elements.statusInput ? elements.statusInput.value : "todo"
  };
}

function populateTaskForm(task) {
  var elements = getTaskFormElements();

  if (!elements.form || !task) {
    return;
  }

  taskEditOriginalDueDate = task.dueDate || "";

  if (elements.titleInput) {
    elements.titleInput.value = getDisplayValue(task.title);
  }

  if (elements.dueDateInput) {
    elements.dueDateInput.value = getDisplayValue(task.dueDate);
  }

  if (elements.priorityInput) {
    elements.priorityInput.value = taskPriorityTextMap[task.priority] ? task.priority : "medium";
  }

  syncTaskOwnerOption(task.owner);

  if (elements.statusInput) {
    elements.statusInput.value = taskStatusTextMap[task.status] ? task.status : "todo";
  }

  setFormEditState(elements, getTaskId(task), "儲存任務（Save Task）");

  scrollToTaskForm();
}

function scrollToTaskForm() {
  var elements = getTaskFormElements();

  scrollToFormElement(elements.form);
}

function refreshTaskModuleViews() {
  renderFilteredTasks();
  refreshTaskDependentViews();
}

function createRuntimeTask(values) {
  var selectedExhibition = getSelectedExhibition();

  return {
    taskId: getNextTaskId(),
    exhibitionId: selectedExhibition ? selectedExhibition.id : selectedExhibitionId,
    title: values.title,
    category: "general",
    owner: values.owner || "行銷",
    status: values.status || "todo",
    priority: values.priority || "medium",
    dueDate: values.dueDate,
    note: "此任務為目前瀏覽器工作階段新增。",
    sourceTemplateId: null,
    sourceTemplateItemId: null,
    dueDateMode: "manual",
    relativeDueDays: null,
    dateBasis: null
  };
}

function handleTaskFormSubmit(event) {
  var elements = getTaskFormElements();
  var values;
  var editId;
  var task;
  var originalDueDate;

  event.preventDefault();

  if (!selectedExhibitionId) {
    window.alert("請先選擇活動後再新增任務。");
    return;
  }

  values = getTaskFormValues();

  if (!values.title) {
    return;
  }

  editId = elements.editIdInput ? elements.editIdInput.value : "";

  if (editId) {
    task = findTaskById(editId);

    if (!task) {
      resetTaskForm();
      return;
    }

    originalDueDate = taskEditOriginalDueDate === null ? (task.dueDate || "") : taskEditOriginalDueDate;

    task.title = values.title;
    task.dueDate = values.dueDate;
    task.priority = values.priority;
    task.owner = values.owner;
    task.status = values.status;

    if (String(values.dueDate || "") !== String(originalDueDate)) {
      task.dueDateMode = "manual";
    }
  } else {
    taskData.push(createRuntimeTask(values));
  }

  saveTaskDataToStorage();
  resetTaskForm();
  refreshTaskModuleViews();
}

function startEditTask(taskId) {
  var task = findTaskById(taskId);

  if (!task) {
    return;
  }

  populateTaskForm(task);
}

function markTaskComplete(taskId) {
  var task = findTaskById(taskId);
  var elements = getTaskFormElements();

  if (!task) {
    return;
  }

  task.status = "done";
  saveTaskDataToStorage();

  if (elements.editIdInput && elements.editIdInput.value === String(taskId)) {
    resetTaskForm();
  }

  refreshTaskModuleViews();
}

function deleteTask(taskId) {
  var elements = getTaskFormElements();

  if (!window.confirm("確定要刪除此任務嗎？")) {
    return;
  }

  taskData = taskData.filter(function(task) {
    return String(getTaskId(task)) !== String(taskId);
  });

  saveTaskDataToStorage();

  if (elements.editIdInput && elements.editIdInput.value === String(taskId)) {
    resetTaskForm();
  }

  refreshTaskModuleViews();
}

function setupTaskManagementControls() {
  var elements = getTaskFormElements();
  var taskList = document.querySelector("#task-list");

  if (elements.form) {
    elements.form.addEventListener("submit", handleTaskFormSubmit);
  }

  if (elements.cancelButton) {
    elements.cancelButton.addEventListener("click", resetTaskForm);
  }

  if (taskList) {
    taskList.addEventListener("click", function(event) {
      var actionButton = event.target.closest("[data-task-action]");
      var taskId;

      if (!actionButton || !taskList.contains(actionButton)) {
        return;
      }

      taskId = actionButton.dataset.taskId;

      if (actionButton.dataset.taskAction === "edit") {
        startEditTask(taskId);
      }

      if (actionButton.dataset.taskAction === "complete") {
        markTaskComplete(taskId);
      }

      if (actionButton.dataset.taskAction === "delete") {
        deleteTask(taskId);
      }
    });
  }

  resetTaskForm();
}

function renderTaskMessage(message) {
  var taskList = document.querySelector("#task-list");

  if (!taskList) {
    return;
  }

  taskList.innerHTML = createEmptyStateMarkup(message, "");
}

function renderTaskEmptyState(title, description) {
  var taskList = document.querySelector("#task-list");

  if (!taskList) {
    return;
  }

  taskList.innerHTML = createEmptyStateMarkup(title, description);
}

function renderTasks(tasks) {
  var taskList = document.querySelector("#task-list");

  if (!taskList) {
    return;
  }

  if (!tasks.length) {
    renderTaskEmptyState("目前沒有任務資料", "請確認目前選取活動是否已有待辦事項。");
    return;
  }

  taskList.innerHTML = tasks.map(function(task) {
    var taskId = getTaskId(task);
    var statusText = getTaskStatusText(task.status);
    var statusClass = getTaskStatusClass(task.status);
    var priorityText = getTaskPriorityText(task.priority);
    var priorityClass = getTaskPriorityClass(task.priority);
    var countdownText = getTaskDueCountdownText(task.dueDate);
    var countdownClass = getTaskDueCountdownClass(task.dueDate);
    var taskItemClass = "task-item";
    var countdownBadgeMarkup = "";
    var alertBadgeMarkup = "";

    if (!isTaskDone(task)) {
      countdownBadgeMarkup =
        "<span class=\"task-countdown-badge " + escapeHtml(countdownClass) + "\">" +
          escapeHtml(countdownText) +
        "</span>";
    }

    if (isTaskOverdue(task)) {
      taskItemClass += " task-item--overdue";
      alertBadgeMarkup = "<span class=\"task-alert-badge task-alert-badge--overdue\">⚠ 逾期（Overdue）</span>";
    } else if (isTaskDueSoon(task)) {
      taskItemClass += " task-item--due-soon";
      alertBadgeMarkup = "<span class=\"task-alert-badge task-alert-badge--due-soon\">即將到期（Due Soon）</span>";
    }

    return "" +
      "<article class=\"" + escapeHtml(taskItemClass) + "\" data-task-id=\"" + escapeHtml(taskId) + "\">" +
        "<div class=\"task-item__header\">" +
          "<div class=\"task-item__title-group\">" +
            "<h3 class=\"task-item__title\">" + escapeHtml(getDisplayValue(task.title)) + "</h3>" +
            "<span class=\"task-priority-badge " + escapeHtml(priorityClass) + "\">" + escapeHtml(priorityText) + "</span>" +
            countdownBadgeMarkup +
            alertBadgeMarkup +
          "</div>" +
          "<span class=\"status-badge " + escapeHtml(statusClass) + "\">" + escapeHtml(statusText) + "</span>" +
        "</div>" +
        "<dl class=\"task-item__meta\">" +
          "<div>" +
            "<dt>活動 ID（Event ID）</dt>" +
            "<dd>" + escapeHtml(getDisplayValue(task.exhibitionId)) + "</dd>" +
          "</div>" +
          "<div>" +
            "<dt>類別（Category）</dt>" +
            "<dd>" + escapeHtml(getDisplayValue(task.category)) + "</dd>" +
          "</div>" +
          "<div>" +
            "<dt>負責單位（Owner）</dt>" +
            "<dd>" + escapeHtml(getDisplayValue(task.owner)) + "</dd>" +
          "</div>" +
          "<div>" +
            "<dt>優先順序（Priority）</dt>" +
            "<dd>" + escapeHtml(priorityText) + "</dd>" +
          "</div>" +
          "<div>" +
            "<dt>到期日（Due Date）</dt>" +
            "<dd>" + escapeHtml(formatDisplayDate(task.dueDate)) + "</dd>" +
          "</div>" +
          "<div class=\"task-item__note\">" +
            "<dt>備註（Note）</dt>" +
            "<dd>" + escapeHtml(getDisplayValue(task.note)) + "</dd>" +
          "</div>" +
        "</dl>" +
        "<div class=\"task-item__actions\">" +
          "<button class=\"task-action-button\" type=\"button\" data-task-action=\"edit\" data-task-id=\"" + escapeHtml(taskId) + "\">編輯（Edit）</button>" +
          "<button class=\"task-action-button task-action-button--complete\" type=\"button\" data-task-action=\"complete\" data-task-id=\"" + escapeHtml(taskId) + "\"" + (isTaskDone(task) ? " disabled" : "") + ">" + (isTaskDone(task) ? "已完成（Completed）" : "標記完成（Mark Complete）") + "</button>" +
          "<button class=\"task-action-button task-action-button--danger\" type=\"button\" data-task-action=\"delete\" data-task-id=\"" + escapeHtml(taskId) + "\">刪除（Delete）</button>" +
        "</div>" +
      "</article>";
  }).join("");
}

function updateTaskHeaderSummary(tasks) {
  var totalCount = tasks.length;
  var doneCount = tasks.filter(function(task) {
    return isTaskDone(task);
  }).length;
  var pendingCount = totalCount - doneCount;

  setTextContent("#task-header-total", "任務 " + totalCount);
  setTextContent("#task-header-done", "已完成 " + doneCount);
  setTextContent("#task-header-pending", "待處理 " + pendingCount);
}

function updateTaskSummaryCards(tasks) {
  var summaryTotal = document.querySelector("#task-summary-total");
  var summaryTodo = document.querySelector("#task-summary-todo");
  var summaryInProgress = document.querySelector("#task-summary-in-progress");
  var summaryDone = document.querySelector("#task-summary-done");
  var summaryBlocked = document.querySelector("#task-summary-blocked");

  var todoCount = countByStatus(tasks, "todo");
  var inProgressCount = countByStatus(tasks, "in_progress");
  var doneCount = countByStatus(tasks, "done");
  var blockedCount = countByStatus(tasks, "blocked");

  updateTaskHeaderSummary(tasks);

  if (summaryTotal) {
    summaryTotal.textContent = tasks.length;
  }

  if (summaryTodo) {
    summaryTodo.textContent = todoCount;
  }

  if (summaryInProgress) {
    summaryInProgress.textContent = inProgressCount;
  }

  if (summaryDone) {
    summaryDone.textContent = doneCount;
  }

  if (summaryBlocked) {
    summaryBlocked.textContent = blockedCount;
  }
}

function getFilteredTasks() {
  var taskSearch = document.querySelector("#task-search");
  var taskStatusFilter = document.querySelector("#task-status-filter");
  var keyword = taskSearch ? taskSearch.value.trim().toLowerCase() : "";
  var status = taskStatusFilter ? taskStatusFilter.value : "";

  return getTasksForSelectedExhibition().filter(function(task) {
    var title = getDisplayValue(task.title).toLowerCase();
    var matchesKeyword = !keyword || title.includes(keyword);
    var matchesStatus = !status || task.status === status;

    return matchesKeyword && matchesStatus;
  });
}

function applyTaskFilters() {
  renderFilteredTasks();
}

function applyTaskStatusFilter() {
  applyTaskFilters();
}

function setupTaskFilterControls() {
  var taskSearch = document.querySelector("#task-search");
  var taskStatusFilter = document.querySelector("#task-status-filter");

  if (taskSearch) {
    taskSearch.addEventListener("input", applyTaskFilters);
  }

  if (taskStatusFilter) {
    taskStatusFilter.addEventListener("change", applyTaskStatusFilter);
  }
}

// Document Module

function getDocumentStatusText(status) {
  return documentStatusTextMap[status] || getDisplayValue(status);
}

function getDocumentStatusClass(status) {
  if (!documentStatusTextMap[status]) {
    return "document-status-badge--draft";
  }

  return "document-status-badge--" + status;
}

function getDocumentTypeText(type) {
  return documentTypeTextMap[type] || getDisplayValue(type);
}

function getDocumentTypeClass(type) {
  var normalizedType = String(getDisplayValue(type)).replaceAll("_", "-");

  if (!documentTypeTextMap[type]) {
    return "document-type-badge--default";
  }

  return "document-type-badge--" + normalizedType;
}

function getNextDocumentId() {
  return getNextNumericId(documentData, function(documentItem) {
    return documentItem.id;
  });
}

function findDocumentById(documentId) {
  return documentData.find(function(documentItem) {
    return String(documentItem.id) === String(documentId);
  }) || null;
}

function getTodayInputDate() {
  var today = new Date();
  var month = String(today.getMonth() + 1).padStart(2, "0");
  var day = String(today.getDate()).padStart(2, "0");

  return today.getFullYear() + "-" + month + "-" + day;
}

function getDocumentFormElements() {
  return {
    form: document.querySelector("#document-form"),
    editIdInput: document.querySelector("#document-edit-id"),
    titleInput: document.querySelector("#document-title-input"),
    typeInput: document.querySelector("#document-type-input"),
    statusInput: document.querySelector("#document-status-input"),
    ownerInput: document.querySelector("#document-owner-input"),
    descriptionInput: document.querySelector("#document-description-input"),
    urlInput: document.querySelector("#document-url-input"),
    submitButton: document.querySelector("#document-submit-button"),
    cancelButton: document.querySelector("#document-cancel-edit-button")
  };
}

function resetDocumentForm() {
  var elements = getDocumentFormElements();

  if (!resetFormEditState(elements, "新增文件（Add Document）")) {
    return;
  }

  if (elements.typeInput) {
    elements.typeInput.value = "market_research";
  }

  if (elements.statusInput) {
    elements.statusInput.value = "draft";
  }

  if (elements.ownerInput) {
    elements.ownerInput.value = "Campbell";
  }
}

function getDocumentFormValues() {
  var elements = getDocumentFormElements();

  return {
    title: elements.titleInput ? elements.titleInput.value.trim() : "",
    type: elements.typeInput ? elements.typeInput.value : "market_research",
    status: elements.statusInput ? elements.statusInput.value : "draft",
    owner: elements.ownerInput ? elements.ownerInput.value.trim() : "Campbell",
    description: elements.descriptionInput ? elements.descriptionInput.value.trim() : "",
    url: elements.urlInput ? elements.urlInput.value.trim() : ""
  };
}

function populateDocumentForm(documentItem) {
  var elements = getDocumentFormElements();

  if (!elements.form || !documentItem) {
    return;
  }

  if (elements.titleInput) {
    elements.titleInput.value = documentItem.title || "";
  }

  if (elements.typeInput) {
    elements.typeInput.value = documentTypeTextMap[documentItem.type] ? documentItem.type : "market_research";
  }

  if (elements.statusInput) {
    elements.statusInput.value = documentStatusTextMap[documentItem.status] ? documentItem.status : "draft";
  }

  if (elements.ownerInput) {
    elements.ownerInput.value = documentItem.owner || "Campbell";
  }

  if (elements.descriptionInput) {
    elements.descriptionInput.value = documentItem.description || "";
  }

  if (elements.urlInput) {
    elements.urlInput.value = documentItem.url || "";
  }

  setFormEditState(elements, documentItem.id, "儲存文件（Save Document）");

  scrollToDocumentForm();
}

function scrollToDocumentForm() {
  var elements = getDocumentFormElements();

  scrollToFormElement(elements.form);
}

function refreshDocumentModuleViews() {
  renderFilteredDocuments();
  refreshDocumentDependentViews();
}

function createRuntimeDocument(values) {
  var selectedExhibition = getSelectedExhibition();

  return {
    id: getNextDocumentId(),
    exhibitionId: selectedExhibition ? selectedExhibition.id : selectedExhibitionId,
    title: values.title,
    type: values.type || "market_research",
    status: values.status || "draft",
    owner: values.owner || "Campbell",
    updatedAt: getTodayInputDate(),
    description: values.description,
    url: values.url
  };
}

function handleDocumentFormSubmit(event) {
  var elements = getDocumentFormElements();
  var values;
  var editId;
  var documentItem;

  event.preventDefault();

  if (!selectedExhibitionId) {
    window.alert("請先選擇活動後再新增文件。");
    return;
  }

  values = getDocumentFormValues();

  if (!values.title) {
    return;
  }

  editId = elements.editIdInput ? elements.editIdInput.value : "";

  if (editId) {
    documentItem = findDocumentById(editId);

    if (!documentItem) {
      resetDocumentForm();
      return;
    }

    documentItem.title = values.title;
    documentItem.type = values.type;
    documentItem.status = values.status;
    documentItem.owner = values.owner;
    documentItem.description = values.description;
    documentItem.url = values.url;
    documentItem.updatedAt = getTodayInputDate();
  } else {
    documentData.push(createRuntimeDocument(values));
  }

  saveDocumentDataToStorage();
  resetDocumentForm();
  refreshDocumentModuleViews();
}

function startEditDocument(documentId) {
  var documentItem = findDocumentById(documentId);

  if (!documentItem) {
    return;
  }

  populateDocumentForm(documentItem);
}

function deleteDocument(documentId) {
  var elements = getDocumentFormElements();

  if (!window.confirm("確定要刪除此文件嗎？（Delete this document?）")) {
    return;
  }

  documentData = documentData.filter(function(documentItem) {
    return String(documentItem.id) !== String(documentId);
  });

  saveDocumentDataToStorage();

  if (elements.editIdInput && elements.editIdInput.value === String(documentId)) {
    resetDocumentForm();
  }

  refreshDocumentModuleViews();
}

function setupDocumentManagementControls() {
  var elements = getDocumentFormElements();
  var documentList = document.querySelector("#document-list");

  if (elements.form) {
    elements.form.addEventListener("submit", handleDocumentFormSubmit);
  }

  if (elements.cancelButton) {
    elements.cancelButton.addEventListener("click", resetDocumentForm);
  }

  if (documentList) {
    documentList.addEventListener("click", function(event) {
      var actionButton;

      if (!event.target.closest) {
        return;
      }

      actionButton = event.target.closest("[data-document-action]");

      if (!actionButton || !documentList.contains(actionButton)) {
        return;
      }

      if (actionButton.dataset.documentAction === "edit") {
        startEditDocument(actionButton.dataset.documentId);
      }

      if (actionButton.dataset.documentAction === "delete") {
        deleteDocument(actionButton.dataset.documentId);
      }
    });
  }

  resetDocumentForm();
}

function renderDocumentMessage(message) {
  var documentList = document.querySelector("#document-list");

  if (!documentList) {
    return;
  }

  documentList.innerHTML = createEmptyStateMarkup(message, "");
}

function renderDocumentEmptyState(title, description) {
  var documentList = document.querySelector("#document-list");

  if (!documentList) {
    return;
  }

  documentList.innerHTML = createEmptyStateMarkup(title, description);
}

function renderDocuments(documents) {
  var documentList = document.querySelector("#document-list");

  if (!documentList) {
    return;
  }

  if (!documents.length) {
    renderDocumentEmptyState("目前沒有文件資料", "請確認目前選取活動是否已有相關文件。");
    return;
  }

  documentList.innerHTML = documents.map(function(documentItem) {
    var statusText = getDocumentStatusText(documentItem.status);
    var statusClass = getDocumentStatusClass(documentItem.status);
    var typeText = getDocumentTypeText(documentItem.type);
    var typeClass = getDocumentTypeClass(documentItem.type);
    var documentUrl = getDisplayValue(documentItem.url);

    return "" +
      "<article class=\"document-item\" data-document-id=\"" + escapeHtml(documentItem.id) + "\">" +
        "<div class=\"document-item__header\">" +
          "<div>" +
            "<h3 class=\"document-item__title\">" + escapeHtml(getDisplayValue(documentItem.title)) + "</h3>" +
            "<span class=\"document-type-badge " + escapeHtml(typeClass) + "\">" + escapeHtml(typeText) + "</span>" +
            "<a class=\"document-item__url\" href=\"" + escapeHtml(documentUrl) + "\">" + escapeHtml(documentUrl) + "</a>" +
          "</div>" +
          "<span class=\"status-badge " + escapeHtml(statusClass) + "\">" + escapeHtml(statusText) + "</span>" +
        "</div>" +
        "<dl class=\"document-item__meta\">" +
          "<div>" +
            "<dt>活動 ID（Event ID）</dt>" +
            "<dd>" + escapeHtml(getDisplayValue(documentItem.exhibitionId)) + "</dd>" +
          "</div>" +
          "<div>" +
            "<dt>類型（Type）</dt>" +
            "<dd>" + escapeHtml(typeText) + "</dd>" +
          "</div>" +
          "<div>" +
            "<dt>負責人（Owner）</dt>" +
            "<dd>" + escapeHtml(getDisplayValue(documentItem.owner)) + "</dd>" +
          "</div>" +
          "<div>" +
            "<dt>更新日期（Updated Date）</dt>" +
            "<dd>" + escapeHtml(formatDisplayDate(documentItem.updatedAt)) + "</dd>" +
          "</div>" +
          "<div class=\"document-item__description\">" +
            "<dt>說明（Description）</dt>" +
            "<dd>" + escapeHtml(getDisplayValue(documentItem.description)) + "</dd>" +
          "</div>" +
        "</dl>" +
        "<div class=\"document-item__actions\">" +
          "<button class=\"document-action-button\" type=\"button\" data-document-action=\"edit\" data-document-id=\"" + escapeHtml(documentItem.id) + "\">編輯（Edit）</button>" +
          "<button class=\"document-action-button document-action-button--danger\" type=\"button\" data-document-action=\"delete\" data-document-id=\"" + escapeHtml(documentItem.id) + "\">刪除（Delete）</button>" +
        "</div>" +
      "</article>";
  }).join("");
}

function updateDocumentSummaryCards(documents) {
  var summaryTotal = document.querySelector("#document-summary-total");
  var summaryDraft = document.querySelector("#document-summary-draft");
  var summaryReview = document.querySelector("#document-summary-review");
  var summaryApproved = document.querySelector("#document-summary-approved");
  var summaryArchived = document.querySelector("#document-summary-archived");

  var draftCount = countByStatus(documents, "draft");
  var reviewCount = countByStatus(documents, "review");
  var approvedCount = countByStatus(documents, "approved");
  var archivedCount = countByStatus(documents, "archived");

  if (summaryTotal) {
    summaryTotal.textContent = documents.length;
  }

  if (summaryDraft) {
    summaryDraft.textContent = draftCount;
  }

  if (summaryReview) {
    summaryReview.textContent = reviewCount;
  }

  if (summaryApproved) {
    summaryApproved.textContent = approvedCount;
  }

  if (summaryArchived) {
    summaryArchived.textContent = archivedCount;
  }
}

function getFilteredDocuments() {
  var documentSearch = document.querySelector("#document-search");
  var documentStatusFilter = document.querySelector("#document-status-filter");
  var documentTypeFilter = document.querySelector("#document-type-filter");
  var keyword = documentSearch ? documentSearch.value.trim().toLowerCase() : "";
  var status = documentStatusFilter ? documentStatusFilter.value : "";
  var type = documentTypeFilter ? documentTypeFilter.value : "";

  return getDocumentsForSelectedExhibition().filter(function(documentItem) {
    var matchesStatus = !status || documentItem.status === status;
    var matchesType = !type || documentItem.type === type;
    var searchableText = [
      documentItem.title,
      documentItem.type,
      getDocumentTypeText(documentItem.type),
      documentItem.owner,
      documentItem.description,
      documentItem.url
    ].map(function(value) {
      return String(getDisplayValue(value)).toLowerCase();
    }).join(" ");
    var matchesKeyword = !keyword || searchableText.includes(keyword);

    return matchesStatus && matchesType && matchesKeyword;
  });
}

function applyDocumentFilters() {
  renderFilteredDocuments();
}

function setupDocumentFilterControls() {
  var documentSearch = document.querySelector("#document-search");
  var documentStatusFilter = document.querySelector("#document-status-filter");
  var documentTypeFilter = document.querySelector("#document-type-filter");

  if (documentSearch) {
    documentSearch.addEventListener("input", applyDocumentFilters);
  }

  if (documentStatusFilter) {
    documentStatusFilter.addEventListener("change", applyDocumentFilters);
  }

  if (documentTypeFilter) {
    documentTypeFilter.addEventListener("change", applyDocumentFilters);
  }
}

// Budget Module

function getBudgetCategoryText(category) {
  return budgetCategoryTextMap[category] || getDisplayValue(category);
}

function getBudgetStatusText(status) {
  return budgetStatusTextMap[status] || getDisplayValue(status);
}

function getBudgetStatusClass(status) {
  if (!budgetStatusTextMap[status]) {
    return "budget-status-badge--planned";
  }

  return "budget-status-badge--" + status;
}

function getBudgetCategoryClass(category) {
  if (!budgetCategoryTextMap[category]) {
    return "budget-category-badge--other";
  }

  return "budget-category-badge--" + category;
}

function formatBudgetAmount(amount) {
  var numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    numericAmount = 0;
  }

  return "NT$ " + new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(Math.round(numericAmount));
}

function getBudgetAmountValue(amount) {
  var numericAmount = Number(amount);

  return Number.isFinite(numericAmount) ? numericAmount : 0;
}

function getBudgetItemVariance(budgetItem) {
  return getBudgetAmountValue(budgetItem.estimatedAmount) - getBudgetAmountValue(budgetItem.actualAmount);
}

function getActiveBudgetItems(budgets) {
  return (Array.isArray(budgets) ? budgets : []).filter(function(budgetItem) {
    return budgetItem.status !== "cancelled";
  });
}

function calculateBudgetSummary(budgets) {
  var includedBudgets = getActiveBudgetItems(budgets);
  var estimatedTotal = includedBudgets.reduce(function(total, budgetItem) {
    return total + getBudgetAmountValue(budgetItem.estimatedAmount);
  }, 0);
  var actualTotal = includedBudgets.reduce(function(total, budgetItem) {
    return total + getBudgetAmountValue(budgetItem.actualAmount);
  }, 0);
  var remaining = estimatedTotal - actualTotal;
  var usageRate = estimatedTotal > 0
    ? Math.round((actualTotal / estimatedTotal * 100) * 10) / 10
    : 0;
  var overBudgetCount = includedBudgets.filter(function(budgetItem) {
    return getBudgetItemVariance(budgetItem) < 0;
  }).length;

  return {
    estimatedTotal: estimatedTotal,
    actualTotal: actualTotal,
    remaining: remaining,
    usageRate: usageRate,
    overBudgetCount: overBudgetCount
  };
}

function formatBudgetUsageRate(usageRate) {
  if (!usageRate) {
    return "0%";
  }

  return Number(usageRate).toFixed(1) + "%";
}

function getBudgetItemVarianceText(budgetItem) {
  var variance;

  if (budgetItem.status === "cancelled") {
    return "不納入計算";
  }

  variance = getBudgetItemVariance(budgetItem);

  if (variance > 0) {
    return "剩餘 " + formatBudgetAmount(variance);
  }

  if (variance < 0) {
    return "超支 " + formatBudgetAmount(Math.abs(variance));
  }

  return "已用完預算";
}

function getBudgetItemVarianceClass(budgetItem) {
  var variance;

  if (budgetItem.status === "cancelled") {
    return "budget-variance--excluded";
  }

  variance = getBudgetItemVariance(budgetItem);

  if (variance > 0) {
    return "budget-variance--remaining";
  }

  if (variance < 0) {
    return "budget-variance--over";
  }

  return "budget-variance--balanced";
}

function updateBudgetSummary(budgets) {
  var summary = calculateBudgetSummary(budgets);
  var remainingCard = document.querySelector("#budget-summary-remaining-card");
  var overBudgetCard = document.querySelector("#budget-summary-over-budget-card");

  setTextContent("#budget-summary-estimated", formatBudgetAmount(summary.estimatedTotal));
  setTextContent("#budget-summary-actual", formatBudgetAmount(summary.actualTotal));
  setTextContent("#budget-summary-remaining", formatBudgetAmount(summary.remaining));
  setTextContent("#budget-summary-usage-rate", formatBudgetUsageRate(summary.usageRate));
  setTextContent("#budget-summary-over-budget-count", summary.overBudgetCount);

  if (remainingCard) {
    remainingCard.classList.toggle("budget-summary-card--warning", summary.remaining < 0);
  }

  if (overBudgetCard) {
    overBudgetCard.classList.toggle("budget-summary-card--warning", summary.overBudgetCount > 0);
  }
}

function getNextBudgetId() {
  return getNextNumericId(budgetData, function(budgetItem) {
    return budgetItem.id;
  });
}

function findBudgetById(budgetId) {
  return budgetData.find(function(budgetItem) {
    return String(budgetItem.id) === String(budgetId);
  }) || null;
}

function getBudgetFormElements() {
  return {
    form: document.querySelector("#budget-form"),
    editIdInput: document.querySelector("#budget-edit-id"),
    titleInput: document.querySelector("#budget-title-input"),
    categoryInput: document.querySelector("#budget-category-input"),
    estimatedAmountInput: document.querySelector("#budget-estimated-amount-input"),
    actualAmountInput: document.querySelector("#budget-actual-amount-input"),
    statusInput: document.querySelector("#budget-status-input"),
    noteInput: document.querySelector("#budget-note-input"),
    submitButton: document.querySelector("#budget-submit-button"),
    cancelButton: document.querySelector("#budget-cancel-edit-button")
  };
}

function resetBudgetForm() {
  var elements = getBudgetFormElements();

  if (!resetFormEditState(elements, "新增預算（Add Budget）")) {
    return;
  }

  if (elements.categoryInput) {
    elements.categoryInput.value = "booth";
  }

  if (elements.estimatedAmountInput) {
    elements.estimatedAmountInput.value = "0";
  }

  if (elements.actualAmountInput) {
    elements.actualAmountInput.value = "0";
  }

  if (elements.statusInput) {
    elements.statusInput.value = "planned";
  }
}

function getBudgetFormValues() {
  var elements = getBudgetFormElements();

  return {
    title: elements.titleInput ? elements.titleInput.value.trim() : "",
    category: elements.categoryInput ? elements.categoryInput.value : "booth",
    estimatedAmount: elements.estimatedAmountInput ? Number(elements.estimatedAmountInput.value) : NaN,
    actualAmount: elements.actualAmountInput ? Number(elements.actualAmountInput.value) : NaN,
    status: elements.statusInput ? elements.statusInput.value : "planned",
    note: elements.noteInput ? elements.noteInput.value.trim() : ""
  };
}

function isValidBudgetFormValues(values) {
  return !!values.title &&
    Object.prototype.hasOwnProperty.call(budgetCategoryTextMap, values.category) &&
    Object.prototype.hasOwnProperty.call(budgetStatusTextMap, values.status) &&
    Number.isFinite(values.estimatedAmount) &&
    values.estimatedAmount >= 0 &&
    Number.isFinite(values.actualAmount) &&
    values.actualAmount >= 0;
}

function populateBudgetForm(budgetItem) {
  var elements = getBudgetFormElements();

  if (!elements.form || !budgetItem) {
    return;
  }

  if (elements.titleInput) {
    elements.titleInput.value = budgetItem.title || "";
  }

  if (elements.categoryInput) {
    elements.categoryInput.value = budgetCategoryTextMap[budgetItem.category] ? budgetItem.category : "other";
  }

  if (elements.estimatedAmountInput) {
    elements.estimatedAmountInput.value = budgetItem.estimatedAmount;
  }

  if (elements.actualAmountInput) {
    elements.actualAmountInput.value = budgetItem.actualAmount;
  }

  if (elements.statusInput) {
    elements.statusInput.value = budgetStatusTextMap[budgetItem.status] ? budgetItem.status : "planned";
  }

  if (elements.noteInput) {
    elements.noteInput.value = budgetItem.note || "";
  }

  setFormEditState(elements, budgetItem.id, "儲存預算（Save Budget）");
  scrollToFormElement(elements.form);
}

function createRuntimeBudget(values) {
  var selectedExhibition = getSelectedExhibition();

  return {
    id: getNextBudgetId(),
    exhibitionId: selectedExhibition ? selectedExhibition.id : selectedExhibitionId,
    title: values.title,
    category: values.category,
    estimatedAmount: values.estimatedAmount,
    actualAmount: values.actualAmount,
    status: values.status,
    note: values.note,
    updatedAt: getTodayInputDate()
  };
}

function handleBudgetFormSubmit(event) {
  var elements = getBudgetFormElements();
  var values;
  var editId;
  var nextBudgetData;

  event.preventDefault();

  if (!selectedExhibitionId) {
    window.alert("請先選擇活動後再新增預算。");
    return;
  }

  if (!budgetDataReady) {
    window.alert("預算資料尚未成功載入，請重新整理後再試。");
    return;
  }

  values = getBudgetFormValues();

  if (!isValidBudgetFormValues(values)) {
    return;
  }

  editId = elements.editIdInput ? elements.editIdInput.value : "";

  if (editId) {
    if (!findBudgetById(editId)) {
      resetBudgetForm();
      return;
    }

    nextBudgetData = budgetData.map(function(budgetItem) {
      if (String(budgetItem.id) !== String(editId)) {
        return budgetItem;
      }

      return {
        id: budgetItem.id,
        exhibitionId: budgetItem.exhibitionId,
        title: values.title,
        category: values.category,
        estimatedAmount: values.estimatedAmount,
        actualAmount: values.actualAmount,
        status: values.status,
        note: values.note,
        updatedAt: getTodayInputDate()
      };
    });
  } else {
    nextBudgetData = budgetData.concat([createRuntimeBudget(values)]);
  }

  if (!validateBudgetItems(nextBudgetData, exhibitionData)) {
    console.error("Budget data validation failed before save.");
    return;
  }

  budgetData = nextBudgetData;
  saveBudgetDataToStorage();
  resetBudgetForm();
  renderBudgetModuleViews();
}

function startEditBudget(budgetId) {
  var budgetItem = findBudgetById(budgetId);

  if (!budgetItem || !isRelatedToSelectedExhibition(budgetItem)) {
    return;
  }

  populateBudgetForm(budgetItem);
}

function deleteBudget(budgetId) {
  var elements = getBudgetFormElements();
  var budgetItem = findBudgetById(budgetId);

  if (!budgetItem || !isRelatedToSelectedExhibition(budgetItem)) {
    return;
  }

  if (!window.confirm("確定要刪除此預算項目嗎？（Delete this budget item?）")) {
    return;
  }

  budgetData = budgetData.filter(function(item) {
    return String(item.id) !== String(budgetId);
  });
  saveBudgetDataToStorage();

  if (elements.editIdInput && elements.editIdInput.value === String(budgetId)) {
    resetBudgetForm();
  }

  renderBudgetModuleViews();
}

function setupBudgetManagementControls() {
  var elements = getBudgetFormElements();
  var budgetList = document.querySelector("#budget-list");

  if (elements.form) {
    elements.form.addEventListener("submit", handleBudgetFormSubmit);
  }

  if (elements.cancelButton) {
    elements.cancelButton.addEventListener("click", resetBudgetForm);
  }

  if (budgetList) {
    budgetList.addEventListener("click", function(event) {
      var actionButton;

      if (!event.target.closest) {
        return;
      }

      actionButton = event.target.closest("[data-budget-action]");

      if (!actionButton || !budgetList.contains(actionButton)) {
        return;
      }

      if (actionButton.dataset.budgetAction === "edit") {
        startEditBudget(actionButton.dataset.budgetId);
      }

      if (actionButton.dataset.budgetAction === "delete") {
        deleteBudget(actionButton.dataset.budgetId);
      }
    });
  }

  resetBudgetForm();
}

function renderBudgetMessage(message) {
  var budgetList = document.querySelector("#budget-list");

  updateBudgetSummary([]);

  if (budgetList) {
    budgetList.innerHTML = createEmptyStateMarkup(message, "");
  }
}

function renderBudgetEmptyState(title, description) {
  var budgetList = document.querySelector("#budget-list");

  if (budgetList) {
    budgetList.innerHTML = createEmptyStateMarkup(title, description);
  }
}

function renderBudgets(budgets) {
  var budgetList = document.querySelector("#budget-list");

  if (!budgetList) {
    return;
  }

  if (!budgets.length) {
    renderBudgetEmptyState("目前沒有預算資料", "此活動尚未建立預算項目。");
    return;
  }

  budgetList.innerHTML = budgets.map(function(budgetItem) {
    var categoryText = getBudgetCategoryText(budgetItem.category);
    var categoryClass = getBudgetCategoryClass(budgetItem.category);
    var statusText = getBudgetStatusText(budgetItem.status);
    var statusClass = getBudgetStatusClass(budgetItem.status);
    var varianceText = getBudgetItemVarianceText(budgetItem);
    var varianceClass = getBudgetItemVarianceClass(budgetItem);

    return "" +
      "<article class=\"budget-item\" data-budget-id=\"" + escapeHtml(budgetItem.id) + "\">" +
        "<div class=\"budget-item__header\">" +
          "<div>" +
            "<h3 class=\"budget-item__title\">" + escapeHtml(getDisplayValue(budgetItem.title)) + "</h3>" +
            "<span class=\"budget-category-badge " + escapeHtml(categoryClass) + "\">" + escapeHtml(categoryText) + "</span>" +
          "</div>" +
          "<span class=\"status-badge " + escapeHtml(statusClass) + "\">" + escapeHtml(statusText) + "</span>" +
        "</div>" +
        "<dl class=\"budget-item__meta\">" +
          "<div><dt>分類（Category）</dt><dd>" + escapeHtml(categoryText) + "</dd></div>" +
          "<div><dt>預估金額（Estimated）</dt><dd>" + escapeHtml(formatBudgetAmount(budgetItem.estimatedAmount)) + "</dd></div>" +
          "<div><dt>實際金額（Actual）</dt><dd>" + escapeHtml(formatBudgetAmount(budgetItem.actualAmount)) + "</dd></div>" +
          "<div><dt>差額（Variance）</dt><dd class=\"" + escapeHtml(varianceClass) + "\">" + escapeHtml(varianceText) + "</dd></div>" +
        "</dl>" +
        "<div class=\"budget-item__actions\">" +
          "<button class=\"budget-action-button\" type=\"button\" data-budget-action=\"edit\" data-budget-id=\"" + escapeHtml(budgetItem.id) + "\">編輯（Edit）</button>" +
          "<button class=\"budget-action-button budget-action-button--danger\" type=\"button\" data-budget-action=\"delete\" data-budget-id=\"" + escapeHtml(budgetItem.id) + "\">刪除（Delete）</button>" +
        "</div>" +
      "</article>";
  }).join("");
}

function renderBudgetModuleViews() {
  var selectedBudgets = [];

  if (!selectedExhibitionId) {
    updateBudgetSummary(selectedBudgets);
    renderBudgetEmptyState("尚未選擇活動（No Event Selected）", "請先從活動清單選擇一筆活動查看相關預算。");
    return;
  }

  selectedBudgets = getBudgetsForSelectedExhibition();
  updateBudgetSummary(selectedBudgets);

  if (!selectedBudgets.length) {
    renderBudgetEmptyState("目前選取活動沒有預算", "此活動尚未建立預算項目。");
    return;
  }

  renderBudgets(selectedBudgets);
}

// Data Loaders

function restoreSampleData() {
  return Promise.all([
    fetchJsonData("data/exhibitions.json"),
    fetchJsonData("data/tasks.json"),
    fetchJsonData("data/documents.json"),
    fetchJsonData("data/event-templates.json"),
    fetchJsonData("data/task-template-items.json"),
    fetchJsonData("data/document-template-items.json"),
    fetchJsonData("data/budgets.json")
  ]).then(function(results) {
    var normalizedEventTemplates = normalizeEventTemplates(
      results[3],
      results[4],
      results[5],
      { useLegacyItemsForEmptyCollections: true }
    );
    var sampleData = {
      exhibitions: results[0],
      tasks: normalizeRuntimeTasks(results[1]),
      documents: results[2],
      eventTemplates: normalizedEventTemplates,
      taskTemplateItems: getTaskTemplateItemsFromEventTemplates(normalizedEventTemplates),
      documentTemplateItems: getDocumentTemplateItemsFromEventTemplates(normalizedEventTemplates),
      budgets: results[6]
    };

    if (
      !Array.isArray(sampleData.exhibitions) ||
      !Array.isArray(sampleData.tasks) ||
      !Array.isArray(sampleData.documents) ||
      !Array.isArray(sampleData.budgets)
    ) {
      throw new Error("Base sample data must be arrays.");
    }

    if (
      !validateEventTemplates(sampleData.eventTemplates) ||
      !validateTaskTemplateItems(sampleData.taskTemplateItems, sampleData.eventTemplates) ||
      !validateDocumentTemplateItems(sampleData.documentTemplateItems, sampleData.eventTemplates)
    ) {
      throw new Error("Template sample data validation failed.");
    }

    if (!validateBudgetItems(sampleData.budgets, sampleData.exhibitions)) {
      throw new Error("Budget sample data validation failed.");
    }

    return sampleData;
  });
}

function resetApplicationData() {
  var resetButton = document.querySelector("#reset-data-button");

  if (!window.confirm("確定要重置資料嗎？\n這會清除目前瀏覽器保存的活動、任務、文件與範本資料，並還原範例資料。")) {
    return;
  }

  if (resetButton) {
    resetButton.disabled = true;
  }

  restoreSampleData()
    .then(function(sampleData) {
      exhibitionData = sampleData.exhibitions;
      taskData = sampleData.tasks;
      documentData = sampleData.documents;
      budgetData = sampleData.budgets;
      applyNormalizedEventTemplateData(sampleData.eventTemplates);
      clearLocalStorageData();
      saveExhibitionDataToStorage();
      saveTaskDataToStorage();
      saveDocumentDataToStorage();
      saveBudgetDataToStorage();
      saveEventTemplateDataToStorage();
      exhibitionDataLoaded = true;
      taskDataLoaded = true;
      documentDataLoaded = true;
      budgetDataLoaded = true;
      exhibitionDataReady = true;
      taskDataReady = true;
      documentDataReady = true;
      budgetDataReady = true;
      eventTemplateDataLoaded = true;
      taskTemplateItemDataLoaded = true;
      documentTemplateItemDataLoaded = true;
      templateDataReady = true;
      renderEventTemplateOptions();
      closeTemplateForm();
      renderTemplateManagement();
      refreshAllViewsAfterReset();
      updateLastUpdated();
      window.alert("資料已重置為範例資料。\nSample data restored.");
    })
    .catch(function(error) {
      console.error(error);
      window.alert("資料重置失敗，請確認 Sample JSON 是否可正常載入。");
    })
    .finally(function() {
      if (resetButton) {
        resetButton.disabled = false;
      }
    });
}

function setupResetDataControl() {
  var resetButton = document.querySelector("#reset-data-button");

  if (resetButton) {
    resetButton.addEventListener("click", resetApplicationData);
  }
}

function templateDataNeedsLegacyCollection(templates, fieldName) {
  return templates.some(function(template) {
    return !template || !Array.isArray(template[fieldName]);
  });
}

function loadLegacyTemplateItemsForNormalization(templates, fieldName, storageKey, jsonPath, dataLabel) {
  var storedItems;

  if (!templateDataNeedsLegacyCollection(templates, fieldName)) {
    return Promise.resolve([]);
  }

  if (hasLocalStorageData(storageKey)) {
    storedItems = readDataFromLocalStorage(storageKey);

    if (!storedItems) {
      return Promise.reject(new Error(dataLabel + " legacy Local Storage data is invalid."));
    }

    return Promise.resolve(storedItems);
  }

  return fetchJsonData(jsonPath).then(function(items) {
    if (!Array.isArray(items)) {
      throw new Error(dataLabel + " sample data must be an array.");
    }

    return items;
  });
}

function persistNormalizedEventTemplates(templates) {
  if (!canUseLocalStorage()) {
    return;
  }

  setRawLocalStorageValue(localStorageKeys.eventTemplates, JSON.stringify(templates));
}

function loadDefaultEventTemplates() {
  return Promise.all([
    fetchJsonData("data/event-templates.json"),
    fetchJsonData("data/task-template-items.json"),
    fetchJsonData("data/document-template-items.json")
  ]).then(function(results) {
    var normalizedTemplates = normalizeEventTemplates(
      results[0],
      results[1],
      results[2],
      { useLegacyItemsForEmptyCollections: true }
    );

    if (!validateEventTemplates(normalizedTemplates)) {
      throw new Error("Event Templates sample data validation failed.");
    }

    persistNormalizedEventTemplates(normalizedTemplates);
    return normalizedTemplates;
  });
}

function loadEventTemplates() {
  var storedTemplates;

  if (!hasLocalStorageData(localStorageKeys.eventTemplates)) {
    return loadDefaultEventTemplates();
  }

  storedTemplates = readDataFromLocalStorage(localStorageKeys.eventTemplates);

  if (!storedTemplates) {
    return Promise.reject(new Error("Event Templates Local Storage data is invalid."));
  }

  return Promise.all([
    loadLegacyTemplateItemsForNormalization(
      storedTemplates,
      "taskTemplates",
      localStorageKeys.taskTemplateItems,
      "data/task-template-items.json",
      "Task Template Items"
    ),
    loadLegacyTemplateItemsForNormalization(
      storedTemplates,
      "documentTemplates",
      localStorageKeys.documentTemplateItems,
      "data/document-template-items.json",
      "Document Template Items"
    )
  ]).then(function(legacyItems) {
    var normalizedTemplates = normalizeEventTemplates(storedTemplates, legacyItems[0], legacyItems[1]);

    if (!validateEventTemplates(normalizedTemplates)) {
      throw new Error("Event Templates Local Storage normalization failed.");
    }

    if (JSON.stringify(normalizedTemplates) !== JSON.stringify(storedTemplates)) {
      persistNormalizedEventTemplates(normalizedTemplates);
    }

    return normalizedTemplates;
  });
}

function loadTemplates() {
  templateDataReady = false;
  eventTemplateDataLoaded = false;
  taskTemplateItemDataLoaded = false;
  documentTemplateItemDataLoaded = false;

  return loadEventTemplates()
    .then(function(templates) {
      applyNormalizedEventTemplateData(templates);

      if (!validateEventTemplates(eventTemplateData)) {
        throw new Error("Template data validation failed after loading.");
      }

      eventTemplateDataLoaded = true;
      taskTemplateItemDataLoaded = true;
      documentTemplateItemDataLoaded = true;
      templateDataReady = true;
      renderEventTemplateOptions();
      renderTemplateManagement();
    })
    .catch(function(error) {
      console.error(error);
      eventTemplateDataLoaded = false;
      taskTemplateItemDataLoaded = false;
      documentTemplateItemDataLoaded = false;
      templateDataReady = false;
      renderEventTemplateOptions();
      renderTemplateManagement();
    });
}

function loadTasks() {
  taskDataReady = false;
  renderTaskMessage("任務載入中...");

  return loadDataFromStorageOrJson(localStorageKeys.tasks, "data/tasks.json")
    .then(function(tasks) {
      var normalizedTasks;

      if (!Array.isArray(tasks)) {
        throw new Error("Task data must be an array.");
      }

      normalizedTasks = normalizeRuntimeTasks(tasks);

      if (JSON.stringify(normalizedTasks) !== JSON.stringify(tasks)) {
        writeDataToLocalStorage(localStorageKeys.tasks, normalizedTasks);
      }

      taskData = normalizedTasks;
      taskDataLoaded = true;
      taskDataReady = true;
      refreshTaskDependentViews();
      renderFilteredTasks();
    })
    .catch(function(error) {
      console.error(error);
      taskDataLoaded = true;
      taskDataReady = false;
      refreshDashboardViews();
      renderTaskMessage("任務載入失敗");
    });
}

function loadDocuments() {
  documentDataReady = false;
  renderDocumentMessage("文件載入中...");

  loadDataFromStorageOrJson(localStorageKeys.documents, "data/documents.json")
    .then(function(documents) {
      if (!Array.isArray(documents)) {
        throw new Error("Document data must be an array.");
      }

      documentData = documents;
      documentDataLoaded = true;
      documentDataReady = true;
      refreshDocumentDependentViews();
      renderFilteredDocuments();
    })
    .catch(function(error) {
      console.error(error);
      documentDataLoaded = true;
      documentDataReady = false;
      refreshDashboardViews();
      renderDocumentMessage("文件載入失敗");
    });
}

function loadBudgets() {
  budgetDataReady = false;

  if (!exhibitionDataReady) {
    budgetDataLoaded = true;
    console.error("Budget data cannot be loaded before Exhibition data is ready.");
    renderBudgetMessage("預算載入失敗");
    return Promise.resolve();
  }

  return loadValidatedTemplateDataFromStorageOrJson(
    localStorageKeys.budgets,
    "data/budgets.json",
    function(items) {
      return validateBudgetItems(items, exhibitionData);
    },
    "Budget Items",
    false
  )
    .then(function(items) {
      if (!Array.isArray(items)) {
        throw new Error("Budget data must be an array.");
      }

      budgetData = items;
      budgetDataLoaded = true;
      budgetDataReady = true;
      renderBudgetModuleViews();
    })
    .catch(function(error) {
      console.error(error);
      budgetDataLoaded = true;
      budgetDataReady = false;
      renderBudgetMessage("預算載入失敗");
    });
}

function loadExhibitions() {
  exhibitionDataReady = false;
  renderTableMessage(
    "資料載入中",
    "正在讀取活動資料，請稍候。"
  );

  return loadDataFromStorageOrJson(localStorageKeys.exhibitions, "data/exhibitions.json")
    .then(function(exhibitions) {
      if (!Array.isArray(exhibitions)) {
        throw new Error("Exhibition data must be an array.");
      }

      exhibitionData = exhibitions;
      exhibitionDataLoaded = true;
      exhibitionDataReady = true;
      renderExhibitions(exhibitionData);
      updateSummaryCards(exhibitionData);
      renderTemplateManagement();

      if (!selectedExhibitionId && exhibitionData.length) {
        selectExhibition(exhibitionData[0]);
        return;
      }

      if (getSelectedExhibition()) {
        selectExhibition(getSelectedExhibition());
        return;
      }

      resetExhibitionDetail();
    })
    .catch(function(error) {
      console.error(error);
      exhibitionDataLoaded = true;
      exhibitionDataReady = false;
      refreshDashboardViews();
      renderTemplateManagement();
      renderErrorRow();
    });
}

// App Initialization

document.addEventListener("DOMContentLoaded", function() {
  applyAppInfo();
  updateLastUpdated();
  renderDetailEmptyState();
  setupExhibitionManagementControls();
  setupFilterControls();
  setupTaskFilterControls();
  setupTaskManagementControls();
  setupTaskCountdownAutoRefresh();
  setupDocumentFilterControls();
  setupDocumentManagementControls();
  setupBudgetManagementControls();
  setupTemplateManagementControls();
  setupSidebarNavigation();
  setupRecentUpdatesDeepLinks();
  setupBackToTopButton();
  setupResetDataControl();
  refreshDashboardViews();
  loadTemplates();
  loadExhibitions().then(function() {
    return loadBudgets();
  });
  loadTasks();
  loadDocuments();
});

