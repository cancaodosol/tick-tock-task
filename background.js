
let timer = null;
let endTime = null;
let currentTitle = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'clearHistory') {
    chrome.storage.local.set({ history: [] }, () => {
      sendResponse({ success: true });
    });
    return true; // Indicates async response
  }

  if (message.type === 'startAlermTimer') {
    console.log("start: startAlermTimer");
    chrome.alarms.create(String("tic-tac-task___" + Date.now() + "___"+ message.title), { when : Date.now() + Number(message.minutes) * 60000 });
    return true; // Indicates async response
  }

  if (message.type === 'stopAlermTimer') {
    stopAlerm(message.alermName);
    return true; // Indicates async response
  }
});

// Chromeの拡張機能のアイコンがクリックされたときに、サイドパネルを開くように。
chrome.action.onClicked.addListener(() => {
  chrome.windows.getCurrent({}, (window) => {
    chrome.sidePanel.open({ windowId: window.id });
  });
});

// アラームを使ってタイマーを実装する場合の例

//拡張機能をインストールしたときに呼ばれる
chrome.runtime.onInstalled.addListener(function() {
  chrome.alarms.clearAll();
  ensureQuoteCorsRule();
});

//設定した周期でアラームが呼ばれる
chrome.alarms.onAlarm.addListener(function (alarm) {
  const words = alarm.name.split("___");
  const title = words[2];
  const startDate = new Date(Number(words[1]));

  const endDate = new Date();
  const seconds = Math.floor((endDate - startDate) / 1000);
  const minutes = Math.floor(seconds / 60);

  chrome.notifications.create(alarm.name, {
    type: "basic",
    iconUrl: "icon.png",
    title: "チクタクタスク",
    message: `${title} (${minutes}分経過しました！)`,
    requireInteraction: true,
    buttons: [
      { title: "5分延長" },
      { title: "10分延長" }
    ]
  });
});

//通知画面のボタンをクリックした際のイベントを追加
chrome.notifications.onButtonClicked.addListener(function(notificationId, Index) {
  console.log(notificationId + " の " + Index + "番目のボタンがクリックされた");
  if(notificationId.startsWith("tic-tac-task___")){
    if(Index === 0){
      chrome.alarms.create(notificationId, { when : Date.now() + Number(5) * 60000 });
    } else if(Index === 1){
      chrome.alarms.create(notificationId, { when : Date.now() + Number(10) * 60000 });
    }
  }
});

// 通知が閉じられた際に実行される
chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  console.log(`通知「${notificationId}」が閉じられました。ユーザーによる: ${byUser}`);
  if(notificationId.startsWith("tic-tac-task___")){
    stopAlerm(notificationId);
  }
});

function stopAlerm(alermName) {
  console.log('stopAlerm: ' + alermName);
  
  const words = alermName.split("___");
  const title = words[2];
  const startDate = new Date(Number(words[1]));

  const endDate = new Date();
  const seconds = Math.floor((endDate - startDate) / 1000);
  const minutes = Math.floor(seconds / 60);
  
  chrome.storage.local.get({ history: [] }, (data) => {
    const newEntry = {
      title: title,
      minutes: minutes,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    };
    const updatedHistory = [...data.history, newEntry];
    chrome.storage.local.set({ history: updatedHistory });
  });

  chrome.alarms.clear(alermName);
}

// Ensure we can fetch the quote API without CORS errors by setting response headers.
function ensureQuoteCorsRule() {
  const RULE_ID = 1;
  const rule = {
    id: RULE_ID,
    priority: 1,
    action: {
      type: 'modifyHeaders',
      responseHeaders: [
        { header: 'Access-Control-Allow-Origin', operation: 'set', value: '*' },
        { header: 'Access-Control-Allow-Headers', operation: 'set', value: '*' },
        { header: 'Access-Control-Allow-Methods', operation: 'set', value: 'GET, OPTIONS' }
      ]
    },
    condition: {
      urlFilter: '||h1deblog.com/wp-json/quotes/v1/random*',
      resourceTypes: ['xmlhttprequest']
    }
  };

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [RULE_ID],
    addRules: [rule]
  }, () => {
    if (chrome.runtime.lastError) {
      console.warn('Failed to set CORS rule for quotes API:', chrome.runtime.lastError);
    }
  });
}

// Also attempt to set the rule when the service worker starts, in case onInstalled missed.
ensureQuoteCorsRule();
