// — PWA Service Worker 登録（前提 sw.js がある場合）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// — DOM 要素取得
const deckSelect = document.getElementById('deck-select');
const loadDeckBtn = document.getElementById('load-deck');
const modeSelect = document.getElementById('mode-select');

const flashcardSection = document.getElementById('flashcard-mode');
const fcPrompt = document.getElementById('fc-prompt');
const fcSubprompt = document.getElementById('fc-subprompt');
const fcProgress = document.getElementById('fc-progress');

const testSection = document.getElementById('test-mode');
const testStartBtn = document.getElementById('test-start');
const testArea = document.getElementById('test-area');
const testPrompt = document.getElementById('test-prompt');
const testInputArea = document.getElementById('test-input-area');
const testInput = document.getElementById('test-input');
const testCheckBtn = document.getElementById('test-check');
const testOptions = document.getElementById('test-options');
const testFeedback = document.getElementById('test-feedback');
const testProgress = document.getElementById('test-progress');
const testTypeRadios = document.getElementsByName('test-type');

// — 状態管理
let currentDeck = [];
let deckName = '';
// フラッシュカード用
let fcIndex = 0, fcStage = 0; // stage:0=英語,1=日本語
// テストモード用
let testMode = 'jp2en', testIndex = 0, correctCount = 0;
let wrongList = [];

// — モード切替処理
modeSelect.addEventListener('change', () => {
  if (modeSelect.value === 'flashcard') {
    flashcardSection.hidden = false;
    testSection.hidden = true;
  } else {
    flashcardSection.hidden = true;
    testSection.hidden = false;
  }
});

// — デッキ読み込み
loadDeckBtn.addEventListener('click', () => {
  const file = deckSelect.value;
  deckName = file;
  fetch(`decks/${file}`)
    .then(r => r.text())
    .then(csv => {
      currentDeck = Papa.parse(csv, { header: true }).data
        .sort(() => Math.random() - 0.5);
      resetFlashcardState();
      renderFlashcard();
    });
});

// — Flashcard: ステート初期化
function resetFlashcardState() {
  fcIndex = 0;
  fcStage = 0;
}

// — Flashcard: 表示更新
function renderFlashcard() {
  if (fcIndex >= currentDeck.length) {
    fcPrompt.textContent = 'お疲れさま！全問完了しました。';
    fcSubprompt.textContent = '';
    fcProgress.textContent = '';
    return;
  }
  const card = currentDeck[fcIndex];
  // 英語表示
  if (fcStage === 0) {
    fcPrompt.textContent = card.word || card.base;
    fcSubprompt.textContent = '';
  } else {
    // 日本語表示
    fcPrompt.textContent = card.word || card.base;
    fcSubprompt.textContent = card.meaning || card.past;
  }
  fcProgress.textContent = `${fcIndex+1} / ${currentDeck.length}`;
}

// — Flashcard: 画面タップでめくる
flashcardSection.addEventListener('click', () => {
  if (fcIndex >= currentDeck.length) return;
  if (fcStage === 0) {
    fcStage = 1;
  } else {
    fcStage = 0;
    fcIndex++;
  }
  renderFlashcard();
});

// — Test: テストタイプ選択取得
function getTestMode() {
  for (const r of testTypeRadios) {
    if (r.checked) return r.value;
  }
}

// — Test: 開始ボタン
testStartBtn.addEventListener('click', () => {
  testMode = getTestMode();
  testIndex = 0;
  correctCount = 0;
  wrongList = [];
  testArea.hidden = false;
  renderTestQuestion();
});

// — Test: 問題表示
function renderTestQuestion() {
  testFeedback.textContent = '';
  if (testIndex >= currentDeck.length) {
    // 結果表示
    testPrompt.textContent = `終了！ 正答率: ${Math.round(100*correctCount/currentDeck.length)}%`;
    testInputArea.hidden = true;
    testOptions.hidden = true;
    testProgress.textContent = `間違えた: ${wrongList.join(', ')}`;
    return;
  }
  const card = currentDeck[testIndex];
  testProgress.textContent = `${testIndex+1} / ${currentDeck.length}`;
  if (testMode === 'jp2en') {
    testPrompt.textContent = card.meaning || card.past;
    testInputArea.hidden = false;
    testOptions.hidden = true;
  } else {
    testPrompt.textContent = card.word || card.base;
    testInputArea.hidden = true;
    testOptions.hidden = false;
    // 四択を生成
    const correct = card.meaning || card.past;
    const others = currentDeck
      .map(c => c.meaning || c.past)
      .filter(m => m !== correct);
    shuffleArray(others);
    const choices = [correct, others[0], others[1] || '', others[2] || '']
      .sort(() => Math.random() - 0.5);
    testOptions.innerHTML = '';
    choices.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.addEventListener('click', () => checkTestAnswer(opt));
      testOptions.appendChild(btn);
    });
  }
}

// — Test: 入力チェック（和→英）
testCheckBtn.addEventListener('click', () => {
  const ans = testInput.value.trim();
  const correct = currentDeck[testIndex].word || currentDeck[testIndex].base;
  checkTestAnswer(ans);
});

// — Test: 回答チェック共通
function checkTestAnswer(answer) {
  const card = currentDeck[testIndex];
  const correct = (testMode === 'jp2en')
    ? (card.word || card.base)
    : (card.meaning || card.past);
  if (answer === correct) {
    testFeedback.textContent = '○ 正解！';
    correctCount++;
  } else {
    testFeedback.textContent = `× 正解: ${correct}`;
    wrongList.push(card.word || card.base);
  }
  testIndex++;
  setTimeout(renderTestQuestion, 1000);
}

// — ユーティリティ: 配列シャッフル
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
