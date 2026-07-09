// Last Updated / App Meta

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

var exhibitionDataLoaded = false;

var taskDataLoaded = false;

var documentDataLoaded = false;

var localStorageAvailable = null;

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

var navigationSectionIds = [
  "dashboard-home",
  "exhibition-module",
  "task-module",
  "document-module"
];

var localStorageKeys = {
  exhibitions: "eventManagement_exhibitions",
  tasks: "eventManagement_tasks",
  documents: "eventManagement_documents"
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

function saveExhibitionDataToStorage() {
  writeDataToLocalStorage(localStorageKeys.exhibitions, exhibitionData);
}

function saveTaskDataToStorage() {
  writeDataToLocalStorage(localStorageKeys.tasks, taskData);
}

function saveDocumentDataToStorage() {
  writeDataToLocalStorage(localStorageKeys.documents, documentData);
}

function clearLocalStorageData() {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(localStorageKeys.exhibitions);
  window.localStorage.removeItem(localStorageKeys.tasks);
  window.localStorage.removeItem(localStorageKeys.documents);
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
  window.scrollTo({
    top: 0,
    behavior: "smooth"
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

function getExhibitionFormElements() {
  return {
    form: document.querySelector("#exhibition-form"),
    editIdInput: document.querySelector("#exhibition-edit-id"),
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

  setFormEditState(elements, exhibition.id, "儲存活動（Save Event）");

  scrollToExhibitionForm();
}

function scrollToExhibitionForm() {
  var elements = getExhibitionFormElements();

  scrollToFormElement(elements.form);
}

function createRuntimeExhibition(values) {
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
    objective: values.objective
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

function refreshExhibitionModuleViews(exhibition) {
  renderExhibitions(getFilteredExhibitions());
  updateSummaryCards(exhibitionData);

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

    updateExhibitionFromValues(exhibition, values);
  } else {
    exhibition = createRuntimeExhibition(values);
    exhibitionData.push(exhibition);
    setControlValue("#exhibition-search", "");
    setControlValue("#exhibition-status-filter", "");
  }

  saveExhibitionDataToStorage();
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
    note: "此任務為目前瀏覽器工作階段新增。"
  };
}

function handleTaskFormSubmit(event) {
  var elements = getTaskFormElements();
  var values;
  var editId;
  var task;

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

    task.title = values.title;
    task.dueDate = values.dueDate;
    task.priority = values.priority;
    task.owner = values.owner;
    task.status = values.status;
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

// Data Loaders

function restoreSampleData() {
  return Promise.all([
    fetchJsonData("data/exhibitions.json"),
    fetchJsonData("data/tasks.json"),
    fetchJsonData("data/documents.json")
  ]).then(function(results) {
    return {
      exhibitions: results[0],
      tasks: results[1],
      documents: results[2]
    };
  });
}

function resetApplicationData() {
  var resetButton = document.querySelector("#reset-data-button");

  if (!window.confirm("確定要重置資料嗎？\n這會清除目前瀏覽器保存的活動、任務與文件資料，並還原範例資料。")) {
    return;
  }

  if (resetButton) {
    resetButton.disabled = true;
  }

  clearLocalStorageData();

  restoreSampleData()
    .then(function(sampleData) {
      exhibitionData = sampleData.exhibitions;
      taskData = sampleData.tasks;
      documentData = sampleData.documents;
      exhibitionDataLoaded = true;
      taskDataLoaded = true;
      documentDataLoaded = true;
      saveExhibitionDataToStorage();
      saveTaskDataToStorage();
      saveDocumentDataToStorage();
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

function loadTasks() {
  renderTaskMessage("任務載入中...");

  loadDataFromStorageOrJson(localStorageKeys.tasks, "data/tasks.json")
    .then(function(tasks) {
      taskData = tasks;
      taskDataLoaded = true;
      refreshTaskDependentViews();
      renderFilteredTasks();
    })
    .catch(function(error) {
      console.error(error);
      taskDataLoaded = true;
      refreshDashboardViews();
      renderTaskMessage("任務載入失敗");
    });
}

function loadDocuments() {
  renderDocumentMessage("文件載入中...");

  loadDataFromStorageOrJson(localStorageKeys.documents, "data/documents.json")
    .then(function(documents) {
      documentData = documents;
      documentDataLoaded = true;
      refreshDocumentDependentViews();
      renderFilteredDocuments();
    })
    .catch(function(error) {
      console.error(error);
      documentDataLoaded = true;
      refreshDashboardViews();
      renderDocumentMessage("文件載入失敗");
    });
}

function loadExhibitions() {
  renderTableMessage(
    "資料載入中",
    "正在讀取活動資料，請稍候。"
  );

  loadDataFromStorageOrJson(localStorageKeys.exhibitions, "data/exhibitions.json")
    .then(function(exhibitions) {
      exhibitionData = exhibitions;
      exhibitionDataLoaded = true;
      renderExhibitions(exhibitionData);
      updateSummaryCards(exhibitionData);

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
      refreshDashboardViews();
      renderErrorRow();
    });
}

// App Initialization

document.addEventListener("DOMContentLoaded", function() {
  updateLastUpdated();
  renderDetailEmptyState();
  setupExhibitionManagementControls();
  setupFilterControls();
  setupTaskFilterControls();
  setupTaskManagementControls();
  setupTaskCountdownAutoRefresh();
  setupDocumentFilterControls();
  setupDocumentManagementControls();
  setupSidebarNavigation();
  setupRecentUpdatesDeepLinks();
  setupBackToTopButton();
  setupResetDataControl();
  refreshDashboardViews();
  loadExhibitions();
  loadTasks();
  loadDocuments();
});
