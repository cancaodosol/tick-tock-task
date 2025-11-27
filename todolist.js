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

  function formatDateJP(timestamp) {
    const d = new Date(timestamp);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = weekdays[d.getDay()];
    return `${month}/${day}(${weekday})`;
  }

  function loadData(cb) {
    chrome.storage.sync.get([STORAGE_KEY], (res) => {
      const arr = res[STORAGE_KEY];
      if (!Array.isArray(arr)) cb([]);
      else cb(arr);
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
    const grouped = arr.reduce((acc, todo) => {
      if (todo.completed) {
        const date = new Date(todo.completedAt).toISOString().slice(0, 10);
        if (!acc.completed[date]) acc.completed[date] = [];
        acc.completed[date].push(todo.text);
      } else {
        acc.uncompleted.push(todo.text);
      }
      return acc;
    }, { completed: {}, uncompleted: [] });

    const completedDates = Object.keys(grouped.completed).sort((a, b) => new Date(b) - new Date(a));

    let output = '=== 完了済み ===\n';
    for (const date of completedDates) {
      output += `\n${formatDateJP(date)}:\n`;
      grouped.completed[date].forEach(text => {
        output += `  - ${text}\n`;
      });
    }

    output += '\n\n=== 未完了 ===\n\n';
    grouped.uncompleted.forEach(text => {
      output += `  - ${text}\n`;
    });

    els.textarea.value = output;
  }

  function makeLi(item, index) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.draggable = true;
    li.dataset.id = item.id;
    li.dataset.index = index;

    li.addEventListener('dragstart', (e) => {
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });

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

    li.appendChild(checkbox);
    li.appendChild(textDiv);
    li.appendChild(controls);

    return li;
  }

  function enterEditMode(liElem, item) {
    if (!liElem || !item) return;
    if (liElem.classList.contains('editing')) return;
    liElem.classList.add('editing');

    const textDiv = liElem.querySelector('.todo-text');
    const controlsDiv = liElem.querySelector('.controls');

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit';
    input.value = item.text;
    input.setAttribute('aria-label', '編集');

    liElem.replaceChild(input, textDiv);

    if (controlsDiv) controlsDiv.style.display = 'none';

    let saved = false;
    const finish = (save) => {
      if (saved) return;
      saved = true;
      if (controlsDiv) controlsDiv.style.display = '';
      if (!save) {
        liElem.replaceChild(textDiv, input);
        liElem.classList.remove('editing');
        return;
      }
      const newVal = input.value;
      if (isBlank(newVal)) {
        liElem.replaceChild(textDiv, input);
        liElem.classList.remove('editing');
        return;
      }
      loadData((arr) => {
        const i = arr.findIndex(t => t.id === item.id);
        if (i === -1) {
          liElem.replaceChild(textDiv, input);
          liElem.classList.remove('editing');
          return;
        }
        arr[i].text = newVal.trim();
        saveData(arr, () => {
          render(arr);
        });
      });
    };

    const onKey = (e) => {
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
      const i = arr.findIndex(t => t.id === id);
      if (i === -1) return;
      if (toCompleted) {
        arr[i].completed = true;
        arr[i].completedAt = Date.now();
      } else {
        arr[i].completed = false;
        delete arr[i].completedAt;
      }
      saveData(arr, () => render(arr));
    });
  }

  function deleteItem(id) {
    loadData((arr) => {
      const updated = arr.filter(t => t.id !== id);
      saveData(updated, () => render(updated));
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
      const item = { id: makeId(), text: raw.trim(), completed: false, createdAt: Date.now() };
      const updated = [item, ...arr];
      saveData(updated, () => {
        render(updated);
        els.input.value = '';
        els.input.focus();
      });
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
      const allEls = Array.from(els.list.querySelectorAll('.todo-item'));
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
    const draggableElements = [...els.list.querySelectorAll('.todo-item:not(.dragging)')];
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
    const items = els.list.querySelectorAll('.todo-item');
    items.forEach((el, idx) => {
      el.dataset.index = idx;
    });
  }

  const originalRender = render;
  function renderWithIndex(arr) {
    originalRender(arr);
    setIndices();
  }

  render = renderWithIndex;

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
