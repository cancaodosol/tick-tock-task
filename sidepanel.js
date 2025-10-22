
document.addEventListener('DOMContentLoaded', () => {
  const countdownBoxDiv = document.getElementById('countdownBox');
  const timerTitleDiv = document.getElementById('timerTitle');
  const stopBtn = document.getElementById('stopBtn');
  const timeSelect = document.getElementById('timeSelect');
  const titleInput = document.getElementById('titleInput');
  const historyDiv = document.getElementById('history');

  // タイマー開始2
  document.querySelectorAll("#timeSelect button").forEach((ele) => {
    ele.addEventListener('click', () => {
      const minutes = parseInt(ele.value);
      const title = titleInput.value.trim();
      chrome.runtime.sendMessage({ type: 'startAlermTimer', minutes: minutes, title: title });
    });
  });

  // タイマー停止
  stopBtn.addEventListener('click', (e) => {
    const alermName = stopBtn.getAttribute("alermName");
    chrome.runtime.sendMessage({ type: 'stopAlermTimer', alermName: alermName, minutes: 0 });
    countdownBoxDiv.style.display = "none";
    timerTitleDiv.style.display = 'inline';
    timeSelect.style.display = 'block';
    titleInput.style.display = 'block';
  });

  // タイマー状態を定期的に取得
  setInterval(() => {
    chrome.alarms.getAll().then((alarms) => {
      if (!alarms) return;
      if (alarms.length > 0) {
        countdownBoxDiv.style.display = "block";
        titleInput.style.display = 'none';
        timeSelect.style.display = 'none';
        stopBtn.style.display = 'inline';

        alarms.forEach((alarm) => {
          const words = alarm.name.split("___");
          const startDate = new Date(Number(words[1]));
          const endDate = new Date(alarm.scheduledTime);
          const title = words[2];
          const remainingSeconds = Math.floor((endDate - new Date()) / 1000);
          const min = Math.floor(remainingSeconds / 60);
          const sec = remainingSeconds % 60;

          timerTitleDiv.textContent = title;
          stopBtn.setAttribute("alermName", alarm.name);
          timeTimer.setCountDownTimer(remainingSeconds, startDate);
        });
      } else {
        timerTitleDiv.textContent = "";
        countdownBoxDiv.style.display = "none";
        timeSelect.style.display = 'block';
        stopBtn.style.display = 'none';
      }
    });

    // 履歴表示
    chrome.storage.local.get({ history: [] }, (data) => {
      historyDiv.innerHTML = "<h4>タイマー履歴</h4>";
      data.history.reverse().forEach(entry => {
        let start = new Date(entry.start).toLocaleTimeString();
        start = start.substring(0, start.length - 3)
        let end = new Date(entry.end).toLocaleTimeString();
        end = end.substring(0, end.length - 3)
        const title = entry.title || "";
        historyDiv.innerHTML += `<div>${start} ～ ${end} (${entry.minutes}分)：${title}</div>`;
      });
    });
  }, 1000);

  // 履歴のクリア
  document.getElementById('clearHistoryBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'clearHistory' }, (response) => {
      if (response.success) {
        document.getElementById('history').innerHTML = "<h4>タイマー履歴</h4><div>履歴をクリアしました。</div>";
      }
    });
  });

  // 現在時刻の表示
  function updateCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('currentTimeHourMinite').textContent = `${hours}:${minutes}`;
    document.getElementById('currentTimeSecond').textContent = seconds;
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekdayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdayNames[now.getDay()];
    document.getElementById('currentDate').textContent = `${month}/${day}(${weekday})`;
  }
  updateCurrentTime();
  setInterval(updateCurrentTime, 1000);

  titleInput.focus();

  // ボタンテスト
  // document.getElementById('basicBtn').addEventListener('click', () => {
  //   chrome.notifications.create('test-notification', {
  //     type: "basic",
  //     iconUrl: "icon.png",
  //     title: "メッセージテスト",
  //     message: "リストです！！",
  //     contextMessage: "ちっちゃめのメッセージです！",
  //     requireInteraction: true,
  //     buttons: [
  //       { title: "延期" },
  //       { title: "完了" }
  //     ]
  //   });
  // });
  // document.getElementById('listBtn').addEventListener('click', () => {
  //   chrome.notifications.create({
  //     type: "list",
  //     iconUrl: "icon.png",
  //     title: "メッセージテスト",
  //     message: "リストです！！"
  //   });
  // });
  // document.getElementById('imageBtn').addEventListener('click', () => {
  //   chrome.notifications.create({
  //     type: "image",
  //     iconUrl: "icon.png",
  //     title: "メッセージテスト",
  //     message: "imageです！！"
  //   });
  // });
  // document.getElementById('progressBtn').addEventListener('click', () => {
  //   chrome.notifications.create({
  //     type: "progress",
  //     iconUrl: "icon.png",
  //     title: "メッセージテスト",
  //     message: "progressです！！",
  //     requireInteraction: true
  //   });
  // });
  // document.getElementById('alermBtn').addEventListener('click', () => {
  //   const title = titleInput.value.trim();
  //   chrome.runtime.sendMessage({ type: 'startAlermTimer', minutes: 1, title: title });
  // });
  // document.getElementById('alermGetBtn').addEventListener('click', () => {
  //   console.log('pushed alermGetBtn.');
  //   chrome.alarms.getAll().then((alarms) => {
  //     alarms.forEach((alarm) => {
  //       const words = alarm.name.split("___");
  //       console.log(alarm);
  //       console.log((new Date(Number(words[1]))).toLocaleTimeString() + " ~ " + (new Date(alarm.scheduledTime)).toLocaleTimeString() + " : " + words[2]);
  //     });
  //   });
  // });

  document.getElementById('btn-timer').style.backgroundColor = '#a2d7dd';
  document.getElementById('btn-hourglass').style.backgroundColor = '#dbd0e6';
  document.getElementById('btn-book').style.backgroundColor = '#f4dda5';
  document.getElementById('btn-todolist').style.backgroundColor = '#fef4f4';
   
  document.getElementById('btn-timer').addEventListener('click', (e) => {
    const targetElement = document.getElementById('currentTimeContainer');
    document.getElementById('btn-timer').style.backgroundColor = targetElement.style.display === 'none' ? '#a2d7dd' : '#f8fbf8';
    targetElement.style.display = targetElement.style.display === 'none' ? 'block' : 'none';   
  });
  document.getElementById('btn-hourglass').addEventListener('click', (e) => {
    const targetElement = document.getElementById('timer-container');
    document.getElementById('btn-hourglass').style.backgroundColor = targetElement.style.display === 'none' ? '#dbd0e6' : '#f8fbf8';
    targetElement.style.display = targetElement.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('btn-book').addEventListener('click', (e) => {
    const targetElement = document.getElementById('history-container');
    document.getElementById('btn-book').style.backgroundColor = targetElement.style.display === 'none' ? '#f4dda5' : '#f8fbf8';
    targetElement.style.display = targetElement.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('btn-todolist').addEventListener('click', (e) => {
    const targetElement = document.getElementById('todo-container');
    document.getElementById('btn-todolist').style.backgroundColor = targetElement.style.display === 'none' ? '#fef4f4' : '#f8fbf8';
    targetElement.style.display = targetElement.style.display === 'none' ? 'block' : 'none';
  });
});

// sidepanel.js
// Unified-list TODO with: add, edit (click), checkbox to complete, strike-through on complete,
// drag&drop reorder (HTML5 DnD), persistent via chrome.storage.sync.
// Data: array of items { id, text, completed (bool), createdAt, completedAt? }
// New items are inserted at the head (index 0). Drag reorder persists the array order.

(() => {
  const STORAGE_KEY = 'sidepanel_todos_unified_v1';

  const els = {
    form: document.getElementById('addForm'),
    input: document.getElementById('todoInput'),
    list: document.getElementById('todoList'),
    empty: document.getElementById('empty')
  };

  // helpers
  const isBlank = s => !s || s.trim().length === 0;
  const makeId = () => `${Date.now()}_${Math.floor(Math.random()*1e6)}`;
  const fmt = ts => {
    try { return new Date(ts).toLocaleString(); } catch (e) { return ''; }
  };

  // storage
  function loadData(cb) {
    chrome.storage.sync.get([STORAGE_KEY], (res) => {
      const arr = res[STORAGE_KEY];
      if (!Array.isArray(arr)) cb([]);
      else cb(arr);
    });
  }
  function saveData(arr, cb) {
    const obj = {}; obj[STORAGE_KEY] = arr;
    chrome.storage.sync.set(obj, () => {
      if (chrome.runtime.lastError) console.error('保存エラー:', chrome.runtime.lastError);
      if (typeof cb === 'function') cb();
    });
  }

  // render whole list from array
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
  }

  // create li element (draggable)
  function makeLi(item, index) {
    const li = document.createElement('li');
    li.className = 'todo-item';
    li.draggable = true;
    li.dataset.id = item.id;
    li.dataset.index = index;

    // drag events
    li.addEventListener('dragstart', (e) => {
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      // store source index
      e.dataTransfer.setData('text/plain', String(index));
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
    });

    // checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'todo-checkbox';
    checkbox.checked = !!item.completed;
    checkbox.addEventListener('change', (e) => {
      toggleCompleted(item.id, checkbox.checked);
    });

    // text div
    const textDiv = document.createElement('div');
    textDiv.className = 'todo-text';
    if (item.completed) textDiv.classList.add('completed');
    textDiv.textContent = item.text;
    textDiv.title = 'クリックして編集';
    textDiv.addEventListener('click', (ev) => {
      ev.stopPropagation();
      enterEditMode(li, item);
    });

    // controls
    const controls = document.createElement('div');
    controls.className = 'controls';

    // go to do button
    const gotToDoBtn = document.createElement('button');
    gotToDoBtn.type = 'button';
    gotToDoBtn.className = 'btn go-to-do';
    gotToDoBtn.textContent = '▼';
    gotToDoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('titleInput').value = item.text;
      document.getElementById('titleInput').focus();
    });

    // delete button
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

  // enter edit mode for item (replace textDiv with input)
  function enterEditMode(liElem, item) {
    if (!liElem || !item) return;
    if (liElem.classList.contains('editing')) return;
    liElem.classList.add('editing');

    const textDiv = liElem.querySelector('.todo-text');
    const controlsDiv = liElem.querySelector('.controls');

    // create input
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit';
    input.value = item.text;
    input.setAttribute('aria-label', '編集');

    // replace textDiv with input
    liElem.replaceChild(input, textDiv);

    // hide controls during edit
    if (controlsDiv) controlsDiv.style.display = 'none';

    let saved = false;
    const finish = (save) => {
      if (saved) return;
      saved = true;
      if (controlsDiv) controlsDiv.style.display = '';
      if (!save) {
        // restore original
        liElem.replaceChild(textDiv, input);
        liElem.classList.remove('editing');
        return;
      }
      const newVal = input.value;
      if (isBlank(newVal)) {
        // cancel on blank
        liElem.replaceChild(textDiv, input);
        liElem.classList.remove('editing');
        return;
      }
      // update storage
      loadData((arr) => {
        const i = arr.findIndex(t => t.id === item.id);
        if (i === -1) {
          liElem.replaceChild(textDiv, input);
          liElem.classList.remove('editing');
          return;
        }
        arr[i].text = newVal.trim();
        saveData(arr, () => {
          // re-render to keep indices and state consistent
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

  // toggle completed state by id (checkbox or button)
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

  // delete
  function deleteItem(id) {
    loadData((arr) => {
      const updated = arr.filter(t => t.id !== id);
      saveData(updated, () => render(updated));
    });
  }

  // add new item (unshift to put newest on top)
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

  // Drag & Drop handlers on the list (delegated)
  // We'll implement drop between items by tracking source index and destination index.
  els.list.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // find the element under cursor and show insertion hint (optional)
    const after = getDragAfterElement(e.clientY);
    // optionally you could show a visual marker; we keep simple.
  });

  els.list.addEventListener('drop', (e) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    loadData((arr) => {
      // compute destination index based on pointer
      const destEl = getDragAfterElement(e.clientY);
      let destIndex;
      if (!destEl) {
        // append to end
        destIndex = arr.length - 1;
      } else {
        destIndex = parseInt(destEl.dataset.index, 10);
      }
      // If dropping above element, we want to place before destIndex.
      // But getDragAfterElement returns the element AFTER the cursor; we want its index.
      // We'll compute target position by using bounding boxes:
      const allEls = Array.from(els.list.querySelectorAll('.todo-item'));
      const targetIdx = computeDropIndex(e.clientY, allEls);
      if (isNaN(sourceIndex) || targetIdx < 0) {
        render(arr);
        return;
      }
      // remove source
      const [moved] = arr.splice(sourceIndex, 1);
      // insert at targetIdx (targetIdx is index to insert before)
      arr.splice(targetIdx, 0, moved);
      // save and re-render
      saveData(arr, () => {
        render(arr);
      });
    });
  });

  // Helper: compute drop index based on Y and elements array
  function computeDropIndex(clientY, elements) {
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (clientY < midpoint) {
        return i;
      }
    }
    return elements.length; // insert at end
  }

  // Helper: find element after pointer (unused for final logic but kept)
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

  // set dataset.index on render to keep up to date
  function setIndices() {
    const items = els.list.querySelectorAll('.todo-item');
    items.forEach((el, idx) => {
      el.dataset.index = idx;
    });
  }

  // After render hook to assign drag listeners for drop index computation
  const originalRender = render;
  // We'll wrap render to call setIndices after appending elements
  function renderWithIndex(arr) {
    originalRender(arr);
    setIndices();
  }

  // Replace render reference to wrapped version
  render = renderWithIndex;

  // wiring
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    addFromInput();
  });

  // initial load
  function init() {
    loadData((arr) => {
      // ensure stable array
      if (!Array.isArray(arr)) arr = [];
      render(arr);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
