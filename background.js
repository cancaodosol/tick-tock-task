
let timer = null;
let endTime = null;
let currentTitle = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'startTimer') {
    const now = new Date();
    endTime = new Date(now.getTime() + message.minutes * 60000);
    currentTitle = message.title || "";

    chrome.storage.local.get({ history: [] }, (data) => {
      const newEntry = {
        title: currentTitle,
        minutes: message.minutes,
        start: now.toISOString(),
        end: endTime.toISOString()
      };
      const updatedHistory = [...data.history, newEntry];
      chrome.storage.local.set({ history: updatedHistory });
    });

    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      const remaining = Math.floor((endTime - new Date()) / 1000);
      if (remaining <= 0) {
        clearInterval(timer);
        timer = null;
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: `${message.minutes}分経過しました！`,
          message: currentTitle ? `${currentTitle}` : "",
          requireInteraction: true
        });
      }
    }, 1000);
  }

  if (message.type === 'stopTimer') {
    if (timer) {
      clearInterval(timer);
      timer = null;
      endTime = null;
      const now = new Date();
      chrome.storage.local.get({ history: [] }, (data) => {
        const updatedHistory = data.history.map(entry => {
          if (!entry.stopped && entry.end && new Date(entry.end) > now) {
            entry.end = now.toISOString();
            entry.stopped = true;
          }
          return entry;
        });
        chrome.storage.local.set({ history: updatedHistory });
      });
    }
  }

  if (message.type === 'getRemainingTime') {
    if (endTime) {
      const remaining = Math.floor((endTime - new Date()) / 1000);
      sendResponse({ remainingSeconds: remaining > 0 ? remaining : 0 , title : currentTitle });
    } else {
      sendResponse({ remainingSeconds: 0 , title : currentTitle });
    }
    return true;
  }
});
