
document.addEventListener('DOMContentLoaded', () => {
  const countdownBoxDiv = document.getElementById('countdownBox');
  const timerTitleDiv = document.getElementById('timerTitle');
  const stopBtn = document.getElementById('stopBtn');
  const timeSelect = document.getElementById('timeSelect');
  const titleInput = document.getElementById('titleInput');
  const titleInputBox = document.getElementById('titleInputBox');
  const historyDiv = document.getElementById('history');

  if (typeof setupQuoteWidget === 'function') {
    setupQuoteWidget();
  } else {
    console.warn('setupQuoteWidget is not available.');
  }

  // タイトル入力欄クリアボタン
  document.getElementById('clearTodoBtn').addEventListener('click', () => {
    titleInput.value = '';
    titleInput.focus();
  });

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
    titleInputBox.style.display = 'flex';
  });

  // タイマー状態を定期的に取得
  setInterval(() => {
    chrome.alarms.getAll().then((alarms) => {
      if (!alarms) return;
      if (alarms.length > 0) {
        countdownBoxDiv.style.display = "block";
        titleInputBox.style.display = 'none';
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
        titleInputBox.style.display = 'flex';
        timeSelect.style.display = 'block';
        stopBtn.style.display = 'none';
      }
    });

    // 履歴表示
    const youbi = ['日', '月', '火', '水', '木', '金', '土'];
    chrome.storage.local.get({ history: [] }, (data) => {
      historyDiv.innerHTML = "<h4>タイマー履歴</h4>";
      let oldDateString = "";
      data.history.reverse().forEach(entry => {
        let start = new Date(entry.start).toLocaleTimeString();
        start = start.substring(0, start.length - 3)
        let end = new Date(entry.end).toLocaleTimeString();
        end = end.substring(0, end.length - 3)
        const title = entry.title || "";
        if(oldDateString !== new Date(entry.start).toLocaleDateString()) {
          const youbistr = youbi[new Date(entry.start).getDay()];
          historyDiv.innerHTML += `<div style="margin-top:20px; margin-bottom:5px;">【 ${new Date(entry.start).toLocaleDateString()}(${youbistr}) 】</div>`;
        }
        historyDiv.innerHTML += `<div>${start} ～ ${end} (${entry.minutes}分)：${title}</div>`;
        oldDateString = new Date(entry.start).toLocaleDateString();
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

  const sideMenuButtons = {
    'btn-timer' : { display: true, bgColor: '#a2d7dd', targetContainer: 'currentTimeContainer' },
    'btn-hourglass' : { display: true, bgColor: '#dbd0e6', targetContainer: 'timer-container' },
    'btn-book' : { display: true, bgColor: '#f4dda5', targetContainer: 'history-container' },
    'btn-todolist' : { display: true, bgColor: '#fef4f4', targetContainer: 'todo-container' },
  };

  function refreshSideMenuButtons() {
    for (const [btnId, config] of Object.entries(sideMenuButtons)) {
        const targetElement = document.getElementById(config.targetContainer);
        document.getElementById(btnId).style.backgroundColor = config.display ? config.bgColor : '#f8fbf8';
        targetElement.style.display = config.display ? 'block' : 'none';
      }
  }

  for (const [btnId, config] of Object.entries(sideMenuButtons)) {
      document.getElementById(btnId).addEventListener('click', () => {
          config.display = !config.display;
          refreshSideMenuButtons();
      });
  }

  refreshSideMenuButtons();
});
