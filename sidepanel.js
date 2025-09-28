
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
      chrome.runtime.sendMessage({ type: 'startAlermTimer', minutes: minutes, title: title });
    });
  });

  // タイマー停止
  stopBtn.addEventListener('click', () => {
    const stopAlermBtns = document.querySelectorAll(".stopAlermName");
    stopAlermBtns.forEach((btn) => {
      const alermName = btn.getAttribute("alermName");
      chrome.runtime.sendMessage({ type: 'stopAlermTimer', alermName: alermName, minutes: 0 });
    });
    timerTitleDiv.textContent = "";
    countdownDiv.textContent = "";
    timerTitleDiv.style.display = 'inline';
    timeSelect.style.display = 'inline';
    stopBtn.style.display = 'none';
  });

  // タイマー状態を定期的に取得
  setInterval(() => {
    chrome.alarms.getAll().then((alarms) => {
      if (!alarms) return;
      if (alarms.length > 0) {
        titleInput.style.display = 'none';
        timeSelect.style.display = 'none';
        stopBtn.style.display = 'inline';

        let countdownDivHtml = "<div>";
        alarms.forEach((alarm) => {
          const words = alarm.name.split("___");
          const startDate = new Date(Number(words[1]));
          const endDate = new Date(alarm.scheduledTime);
          const title = words[2];
          const remainingSeconds = Math.floor((endDate - new Date()) / 1000);
          const min = Math.floor(remainingSeconds / 60);
          const sec = remainingSeconds % 60;

          countdownDivHtml += "<div>";
          countdownDivHtml += ` <strong>${title}</strong>`;
          countdownDivHtml += ` <div>残り ${min}分 ${sec}秒</div>`;
          countdownDivHtml += ` <input class="stopAlermName" alermName="${alarm.name}" hidden></input>`;
          countdownDivHtml += "</div>";
        });
        countdownDivHtml += "</div>";
        countdownDiv.innerHTML = countdownDivHtml;
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
});