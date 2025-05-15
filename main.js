// ——— PWA：Service Worker 登録 ———
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// ——— 状態管理 ———
let currentDeck = [];
let cardIndex = 0, fieldIndex = 0;
let correctCount = 0, totalCount = 0;
const fieldOrder = ['word','meaning'];  // 不規則動詞は別処理

// ——— UI 要素 ———
const deckSelect = document.getElementById('deck-select');
const loadBtn = document.getElementById('load-deck');
const promptEl = document.getElementById('prompt');
const answerInput = document.getElementById('answer');
const checkBtn = document.getElementById('check-btn');
const feedbackEl = document.getElementById('feedback');
const progressEl = document.getElementById('progress');

// ——— デッキ読み込み関数 ———
function loadDeck(filename) {
  fetch(`decks/${filename}`)
    .then(res => res.text())
    .then(csv => {
      const parsed = Papa.parse(csv, { header: true }).data;
      currentDeck = parsed.sort(() => Math.random()-0.5);
      resetState();
      saveState();
      updatePrompt();
      updateProgress();
    });
}

// ——— プロンプト更新 ———
function updatePrompt() {
  const card = currentDeck[cardIndex];
  const field = currentDeck[card].base ? ['base','past','participle','meaning'][fieldIndex] : fieldOrder[fieldIndex];
  const label = field==='meaning'? '意味' : field==='word'? '単語' : field;
  promptEl.textContent = `${card[fieldOrder?field:'base']} の ${label} は？`;
}

// ——— 進捗表示 ———
function updateProgress() {
  progressEl.textContent = `${correctCount} / ${totalCount}`;
}

// ——— フィードバック ———
function showFeedback(ok, correct='') {
  feedbackEl.textContent = ok? '○ 正解！' : `× 正解は「${correct}」`;
}

// ——— チェック処理 ———
checkBtn.addEventListener('click', () => {
  const card = currentDeck[cardIndex];
  const keys = Object.keys(card);
  const field = keys[fieldIndex];
  const ans = answerInput.value.trim();
  totalCount++;
  if (ans === card[field]) {
    correctCount++;
    showFeedback(true);
    fieldIndex++;
    if (fieldIndex >= keys.length) {
      cardIndex++;
      fieldIndex = 0;
    }
  } else {
    showFeedback(false, card[field]);
  }
  answerInput.value = '';
  updateProgress();
  saveState();
  if (cardIndex < currentDeck.length) updatePrompt();
  else promptEl.textContent = 'お疲れさま！全問完了しました。';
});

// ——— State 初期化／保存／読み込み ———
function resetState() {
  cardIndex=0; fieldIndex=0; correctCount=0; totalCount=0;
}
function saveState() {
  localStorage.setItem('fcState', JSON.stringify({
    deck: deckSelect.value,
    cardIndex, fieldIndex, correctCount, totalCount
  }));
}
function loadState() {
  const s = JSON.parse(localStorage.getItem('fcState')||'{}');
  if (s.deck === deckSelect.value) {
    ({ cardIndex, fieldIndex, correctCount, totalCount } = s);
  }
}

// ——— デッキ読み込みボタン ———
loadBtn.addEventListener('click', () => {
  loadDeck(deckSelect.value);
  loadState();
});

// ——— 初期自動読み込み ———
window.addEventListener('load', () => {
  loadDeck(deckSelect.value);
  loadState();
});
