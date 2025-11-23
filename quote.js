// Handles fetching and rendering quotes into the side panel card.
function setupQuoteWidget() {
  const quoteTitle = document.getElementById('quote-title');
  const quoteBody = document.getElementById('quote-body');
  const quoteBook = document.getElementById('quote-book');
  const quoteAuthor = document.getElementById('quote-author');
  const quotePage = document.getElementById('quote-page');
  const quoteContent = document.getElementById('quote-content');
  const quoteLoading = document.getElementById('quote-loading');
  const quoteError = document.getElementById('quote-error');

  if (!quoteTitle || !quoteBody || !quoteBook || !quoteAuthor || !quoteContent || !quoteLoading || !quoteError) {
    console.warn('Quote elements not found; skipping setup.');
    return;
  }

  const toPlainText = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    const paras = Array.from(tmp.querySelectorAll('p'));
    if (paras.length > 0) {
      return paras.map(p => p.textContent.trim()).filter(Boolean).join('\n\n');
    }
    return (tmp.textContent || '').trim();
  };

  const loadQuote = async (showSpinner = true) => {
    quoteError.textContent = '';
    if (showSpinner) {
      quoteLoading.style.display = 'block';
      quoteContent.style.display = 'none';
    }
    try {
      const res = await fetch('https://h1deblog.com//wp-json/quotes/v1/random');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      quoteTitle.textContent = data.title || 'タイトル不明';
      quoteBody.textContent = toPlainText(data.content) || '本文が取得できませんでした';
      quoteBook.textContent = data.book?.title || '不明';
      quoteAuthor.textContent = data.book?.author?.title || '不明';
      quotePage.textContent = data.page || '';
      quoteContent.style.display = 'block';
    } catch (err) {
      console.error('名言の取得に失敗しました', err);
      quoteError.textContent = '名言の取得に失敗しました。リトライしてください。';
      quoteContent.style.display = 'none';
    } finally {
      quoteLoading.style.display = 'none';
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadQuote(false);
    }
  });

  loadQuote(true);
}
