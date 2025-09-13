
document.addEventListener('DOMContentLoaded', () => {
  const countdownDiv = document.getElementById('countdown');
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
      chrome.runtime.sendMessage({ type: 'startTimer', minutes: minutes, title: title });
    });
  });

  // タイマー停止
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'stopTimer' });
    timerTitleDiv.textContent = "";
    countdownDiv.textContent = "";
    startBtn.style.display = 'inline';
    timerTitleDiv.style.display = 'inline';
    timeSelect.style.display = 'inline';
    stopBtn.style.display = 'none';
  });

  // タイマー状態を定期的に取得
  setInterval(() => {
    chrome.runtime.sendMessage({ type: 'getRemainingTime' }, (response) => {
      if (!response) return;
      if (response.remainingSeconds > 0) {
        const min = Math.floor(response.remainingSeconds / 60);
        const sec = response.remainingSeconds % 60;
        timerTitleDiv.textContent = `${response.title}`;
        countdownDiv.textContent = `残り ${min}分 ${sec}秒`;
        titleInput.style.display = 'none';
        timeSelect.style.display = 'none';
        stopBtn.style.display = 'inline';
      } else {
        timerTitleDiv.textContent = "";
        countdownDiv.textContent = "";
        titleInput.style.display = 'inline';
        timeSelect.style.display = 'inline';
        stopBtn.style.display = 'none';
      }
    });

    // 履歴表示
    chrome.storage.local.get({ history: [] }, (data) => {
      historyDiv.innerHTML = "<h4>タイマー履歴</h4>";
      data.history.reverse().forEach(entry => {
        const start = new Date(entry.start).toLocaleTimeString().substring(0, 5);
        const end = new Date(entry.end).toLocaleTimeString().substring(0, 5);
        const title = entry.title || "";
        historyDiv.innerHTML += `<div>${start} ～ ${end}：【${entry.minutes}分】${title}</div>`;
      });
    });
  }, 1000);


  titleInput.focus();

  // ボタンテスト
  document.getElementById('basicBtn').addEventListener('click', () => {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "メッセージテスト",
      message: "リストです！！",
      contextMessage: "ちっちゃめのメッセージです！",
      requireInteraction: true
    });
  });
  document.getElementById('listBtn').addEventListener('click', () => {
    chrome.notifications.create({
      type: "list",
      iconUrl: "icon.png",
      title: "メッセージテスト",
      message: "リストです！！"
    });
  });
  document.getElementById('imageBtn').addEventListener('click', () => {
    chrome.notifications.create({
      type: "image",
      iconUrl: "icon.png",
      title: "メッセージテスト",
      message: "imageです！！"
    });
  });
  document.getElementById('progressBtn').addEventListener('click', () => {
    chrome.notifications.create({
      type: "progress",
      iconUrl: "icon.png",
      title: "メッセージテスト",
      message: "progressです！！",
      requireInteraction: true
    });
  });
});
