// Unified-list TODO: add/edit, checkbox to complete, drag&drop reorder, chrome.storage.sync persistence.
(() => {
  const STORAGE_KEY = 'sidepanel_todos_unified_v1';

  const els = {
    form: document.getElementById('addForm'),
    input: document.getElementById('todoInput'),
    list: document.getElementById('todoList'),
    textareaContainer: document.getElementById('todo-list-text-container'),
    textarea: document.getElementById('todo-list-text'),
    showMemo: document.getElementById('showMemoBtn'),
    closeMemo: document.getElementById('closeMemoBtn'),
    empty: document.getElementById('empty')
  };

  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

  const isBlank = (s) => !s || s.trim().length === 0;
  const makeId = () => `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  let pendingEditId = null;
  let pendingEditItem = null;

  function normalizeTasks(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map((t) => ({
      ...t,
      subtasks: Array.isArray(t.subtasks) ? normalizeTasks(t.subtasks) : []
    }));
  }

  function findItem(arr, id) {
    let found = null;
    function dfs(list, parentArray) {
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        if (t.id === id) {
          found = { item: t, parentArray: list, index: i };
          return true;
        }
        if (Array.isArray(t.subtasks) && t.subtasks.length > 0) {
          if (dfs(t.subtasks, t.subtasks)) return true;
        }
      }
      return false;
    }
    dfs(arr, null);
    return found;
  }

  function formatDateJP(timestamp) {
    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = weekdays[d.getDay()];
    return `${month}/${day}(${weekday})`;
  }

  function loadData(cb) {
    chrome.storage.sync.get([STORAGE_KEY], (res) => {
      const arr = normalizeTasks(res[STORAGE_KEY]);
      cb(arr);
    });
  }

  function saveData(arr, cb) {
    const obj = {};
    obj[STORAGE_KEY] = arr;
    chrome.storage.sync.set(obj, () => {
      if (chrome.runtime.lastError) console.error('保存エラー:', chrome.runtime.lastError);
      if (typeof cb === 'function') cb();
    });
  }

  function render(arr) {
    els.list.innerHTML = '';
    if (!arr || arr.length === 0) {
      els.empty.style.display = 'block';
      return;
    }
    els.empty.style.display = 'none';
    arr.forEach((item, idx) => {
      const li = makeLi(item, idx);
      els.list.appendChild(li);
    });
    renderTextArea(arr);
  }

  function renderTextArea(arr) {
    const grouped = { completed: {}, uncompleted: [] };

    const collect = (list, depth) => {
      list.forEach((todo) => {
        if (isBlank(todo.text)) return;
        const indent = Math.max(0, depth);
        if (todo.completed) {
          const date = new Date(todo.completedAt).toISOString().slice(0, 10);
          if (!grouped.completed[date]) grouped.completed[date] = [];
          grouped.completed[date].push({ text: todo.text, depth: indent });
        } else {
          grouped.uncompleted.push({ text: todo.text, depth: indent });
        }
        if (Array.isArray(todo.subtasks) && todo.subtasks.length) {
          collect(todo.subtasks, indent + 1);
        }
      });
    };

    collect(arr, 0);

    const completedDates = Object.keys(grouped.completed).sort((a, b) => new Date(b) - new Date(a));

    let output = '=== 完了済み ===\n';
    for (const date of completedDates) {
      output += `\n${formatDateJP(date)}:\n`;
      grouped.completed[date].forEach(entry => {
        output += `${'  '.repeat(entry.depth + 1)}- ${entry.text}\n`;
      });
    }

    output += '\n\n=== 未完了 ===\n\n';
    grouped.uncompleted.forEach(entry => {
      output += `${'  '.repeat(entry.depth + 1)}- ${entry.text}\n`;
    });

    els.textarea.value = output;
  }

  function makeLi(item, index, isSubtask = false) {
    const li = document.createElement('li');
    li.className = `todo-item ${isSubtask ? 'subtask' : 'root'}`.trim();
    li.dataset.id = item.id;

    if (!isSubtask) {
      li.draggable = true;
      li.dataset.index = index;
      li.addEventListener('dragstart', (e) => {
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
      });
    }

    const row = document.createElement('div');
    row.className = 'item-row';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = !!item.completed;
    checkbox.addEventListener('change', () => {
      toggleCompleted(item.id, checkbox.checked);
    });

    const textDiv = document.createElement('div');
    textDiv.className = 'todo-text';
    if (item.completed) textDiv.classList.add('completed');
    textDiv.textContent = item.text;
    textDiv.title = 'クリックして編集';
    textDiv.addEventListener('click', (ev) => {
      ev.stopPropagation();
      enterEditMode(li, item);
    });

    const controls = document.createElement('div');
    controls.className = 'controls';

    const gotToDoBtn = document.createElement('button');
    gotToDoBtn.type = 'button';
    gotToDoBtn.className = 'btn go-to-do';
    gotToDoBtn.textContent = '▼';
    gotToDoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('titleInput').value = item.text;
      document.getElementById('titleInput').focus();
    });

    if (!isSubtask) {
      const addSubBtn = document.createElement('button');
      addSubBtn.type = 'button';
      addSubBtn.className = 'btn add-subtask';
      addSubBtn.textContent = '＋';
      addSubBtn.title = '小タスクを追加';
      addSubBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startAddSubtask(item.id);
      });
      controls.appendChild(addSubBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn delete';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteItem(item.id);
    });

    controls.appendChild(gotToDoBtn);
    controls.appendChild(delBtn);

    row.appendChild(checkbox);
    row.appendChild(textDiv);
    row.appendChild(controls);
    li.appendChild(row);

    if (Array.isArray(item.subtasks) && item.subtasks.length > 0) {
      const subList = document.createElement('ul');
      subList.className = 'subtask-list';
      item.subtasks.forEach((sub, idx) => {
        subList.appendChild(makeLi(sub, idx, true));
      });
      li.appendChild(subList);
    }

    return li;
  }

  function enterEditMode(liElem, item, options = {}) {
    if (!liElem || !item) return;
    if (liElem.classList.contains('editing')) return;
    liElem.classList.add('editing');

    const textDiv = liElem.querySelector('.todo-text');
    const controlsDiv = liElem.querySelector('.controls');
    const textParent = textDiv ? textDiv.parentNode : null;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit';
    input.value = item.text;
    input.setAttribute('aria-label', '編集');

    if (textParent) {
      textParent.replaceChild(input, textDiv);
    }

    if (controlsDiv) controlsDiv.style.display = 'none';

    let saved = false;
    const finish = (save) => {
      if (saved) return;
      saved = true;
      if (controlsDiv) controlsDiv.style.display = '';
      if (!save) {
        if (options.removeOnCancelIfBlank) {
          deleteItem(item.id);
          return;
        }
        if (textParent && textDiv) textParent.replaceChild(textDiv, input);
        liElem.classList.remove('editing');
        return;
      }
      const newVal = input.value;
      if (isBlank(newVal)) {
        if (options.removeOnCancelIfBlank) {
          deleteItem(item.id);
          return;
        }
        if (textParent && textDiv) textParent.replaceChild(textDiv, input);
        liElem.classList.remove('editing');
        return;
      }
      loadData((arr) => {
        const found = findItem(arr, item.id);
        if (!found || !found.item) {
          if (textParent && textDiv) textParent.replaceChild(textDiv, input);
          liElem.classList.remove('editing');
          return;
        }
        found.item.text = newVal.trim();
        saveData(arr, () => {
          render(arr);
        });
      });
    };

    const onKey = (e) => {
      if (e.isComposing || e.keyCode === 229) return; // ignore IME composition commits
      if (e.key === 'Enter') {
        e.preventDefault();
        finish(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
    };
    input.addEventListener('keydown', onKey);
    input.addEventListener('blur', () => setTimeout(() => finish(true), 0));

    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }

  function toggleCompleted(id, toCompleted) {
    loadData((arr) => {
      const found = findItem(arr, id);
      if (!found || !found.item) return;
      if (toCompleted) {
        found.item.completed = true;
        found.item.completedAt = Date.now();
      } else {
        found.item.completed = false;
        delete found.item.completedAt;
      }
      saveData(arr, () => render(arr));
    });
  }

  function deleteItem(id) {
    loadData((arr) => {
      const found = findItem(arr, id);
      if (!found || !found.parentArray) return;
      found.parentArray.splice(found.index, 1);
      saveData(arr, () => render(arr));
    });
  }

  function addFromInput() {
    const raw = els.input.value;
    if (isBlank(raw)) {
      els.input.value = '';
      els.input.focus();
      return;
    }
    loadData((arr) => {
      const item = { id: makeId(), text: raw.trim(), completed: false, createdAt: Date.now(), subtasks: [] };
      const updated = [item, ...arr];
      saveData(updated, () => {
        render(updated);
        els.input.value = '';
        els.input.focus();
      });
    });
  }

  function addSubtask(parentId, text) {
    loadData((arr) => {
      const found = findItem(arr, parentId);
      if (!found || !found.item) return;
      if (!Array.isArray(found.item.subtasks)) found.item.subtasks = [];
      const sub = { id: makeId(), text, completed: false, createdAt: Date.now(), subtasks: [] };
      found.item.subtasks.push(sub);
      saveData(arr, () => render(arr));
    });
  }

  function startAddSubtask(parentId) {
    loadData((arr) => {
      const found = findItem(arr, parentId);
      if (!found || !found.item) return;
      if (!Array.isArray(found.item.subtasks)) found.item.subtasks = [];
      const blankExisting = found.item.subtasks.find(s => isBlank(s.text));
      if (blankExisting) {
        pendingEditId = blankExisting.id;
        pendingEditItem = blankExisting;
        render(arr);
        return;
      }
      const sub = { id: makeId(), text: '', completed: false, createdAt: Date.now(), subtasks: [] };
      found.item.subtasks.push(sub);
      pendingEditId = sub.id;
      pendingEditItem = sub;
      saveData(arr, () => render(arr));
    });
  }

  els.list.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    getDragAfterElement(e.clientY);
  });

  els.list.addEventListener('drop', (e) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    loadData((arr) => {
      const destEl = getDragAfterElement(e.clientY);
      let destIndex;
      if (!destEl) {
        destIndex = arr.length - 1;
      } else {
        destIndex = parseInt(destEl.dataset.index, 10);
      }
      const allEls = Array.from(els.list.querySelectorAll('.todo-item.root'));
      const targetIdx = computeDropIndex(e.clientY, allEls);
      if (isNaN(sourceIndex) || targetIdx < 0) {
        render(arr);
        return;
      }
      const [moved] = arr.splice(sourceIndex, 1);
      arr.splice(targetIdx, 0, moved);
      saveData(arr, () => {
        render(arr);
      });
    });
  });

  function computeDropIndex(clientY, elements) {
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY < midpoint) {
        return i;
      }
    }
    return elements.length;
  }

  function getDragAfterElement(clientY) {
    const draggableElements = [...els.list.querySelectorAll('.todo-item.root:not(.dragging)')];
    let closest = null;
    let closestOffset = Number.NEGATIVE_INFINITY;
    for (const el of draggableElements) {
      const rect = el.getBoundingClientRect();
      const offset = clientY - (rect.top + rect.height / 2);
      if (offset < 0 && offset > closestOffset) {
        closestOffset = offset;
        closest = el;
      }
    }
    return closest;
  }

  function setIndices() {
    const items = els.list.querySelectorAll('.todo-item.root');
    items.forEach((el, idx) => { el.dataset.index = idx; });
  }

  const originalRender = render;
  function renderWithIndex(arr) {
    originalRender(arr);
    setIndices();
    focusPendingEdit();
  }

  render = renderWithIndex;

  function focusPendingEdit() {
    if (!pendingEditId) return;
    const li = els.list.querySelector(`[data-id="${pendingEditId}"]`);
    if (li) {
      const item = pendingEditItem || { id: pendingEditId, text: '' };
      enterEditMode(li, item, { removeOnCancelIfBlank: true });
    }
    pendingEditId = null;
    pendingEditItem = null;
  }

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    addFromInput();
  });

  els.showMemo.addEventListener('click', () => {
    els.textareaContainer.style.display = els.textareaContainer.style.display == 'block' ? 'none' : 'block';
    els.list.style.display = els.textareaContainer.style.display == 'block' ? 'none' : 'block';
  });

  els.closeMemo.addEventListener('click', () => {
    els.textareaContainer.style.display = 'none';
    els.list.style.display = 'block';
    els.input.focus();
  });

  function init() {
    loadData((arr) => {
      if (!Array.isArray(arr)) arr = [];
      render(arr);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
