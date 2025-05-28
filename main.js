// PWA: Service Worker 登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// DOM 要素取得
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

// 状態管理
let currentDeck = [];
let fcIndex = 0, fcStage = 0;          // フラッシュカード
let testMode = 'jp2en', testIndex = 0, correctCount = 0;
let wrongList = [];

// モード切替
modeSelect.addEventListener('change', () => {
  if (modeSelect.value === 'flashcard') {
    flashcardSection.hidden = false;
    testSection.hidden = true;
  } else {
    flashcardSection.hidden = true;
    testSection.hidden = false;
  }
});

// デッキ読み込み
loadDeckBtn.addEventListener('click', () => {
  fetch(`decks/${deckSelect.value}`)
    .then(r => r.text())
    .then(csv => {
      currentDeck = Papa.parse(csv, { header: true }).data
        .sort(() => Math.random() - 0.5);
      resetFlashcardState();
      renderFlashcard();
    });
});

// フラッシュカード用リセット
function resetFlashcardState() {
  fcIndex = 0;
  fcStage = 0;
}

// フラッシュカード表示更新
function renderFlashcard() {
  if (!currentDeck.length) return;
  if (fcIndex >= currentDeck.length) {
    fcPrompt.textContent = 'お疲れさま！全問完了しました。';
    fcSubprompt.textContent = '';
    fcProgress.textContent = '';
    return;
  }
  const card = currentDeck[fcIndex];
  if (fcStage === 0) {
    fcPrompt.textContent = card.word || card.base;
    fcSubprompt.textContent = '';
  } else {
    fcPrompt.textContent = card.word || card.base;
    fcSubprompt.textContent = card.meaning || card.past;
  }
  fcProgress.textContent = `${fcIndex + 1} / ${currentDeck.length}`;
}

// タップでめくり
flashcardSection.addEventListener('click', () => {
  if (fcIndex >= currentDeck.length) return;
  fcStage = fcStage === 0 ? 1 : 0;
  if (fcStage === 0) fcIndex++;
  renderFlashcard();
});

// テスト：開始
testStartBtn.addEventListener('click', () => {
  testMode = Array.from(testTypeRadios).find(r => r.checked).value;
  testIndex = 0;
  correctCount = 0;
  wrongList = [];
  testArea.hidden = false;
  renderTestQuestion();
});

// テスト問題表示
function renderTestQuestion() {
  testFeedback.textContent = '';
  if (testIndex >= currentDeck.length) {
    testPrompt.textContent = `終了！ 正答率: ${Math.round(100 * correctCount / currentDeck.length)}%`;
    testInputArea.hidden = true;
    testOptions.hidden = true;
    testProgress.textContent = `間違えた: ${wrongList.join(', ')}`;
    return;
  }
  const card = currentDeck[testIndex];
  testProgress.textContent = `${testIndex + 1} / ${currentDeck.length}`;
  if (testMode === 'jp2en') {
    testPrompt.textContent = card.meaning || card.past;
    testInputArea.hidden = false;
    testOptions.hidden = true;
  } else {
    testPrompt.textContent = card.word || card.base;
    testInputArea.hidden = true;
    testOptions.hidden = false;
    const correct = card.meaning || card.past;
    const others = currentDeck.map(c => c.meaning || c.past).filter(m => m !== correct);
    shuffleArray(others);
    const choices = [correct, others[0], others[1] || '', others[2] || ''].sort(() => Math.random() - 0.5);
    testOptions.innerHTML = '';
    choices.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.addEventListener('click', () => checkTestAnswer(opt));
      testOptions.appendChild(btn);
    });
  }
}

// テスト：入力チェック
testCheckBtn.addEventListener('click', () => {
  checkTestAnswer(testInput.value.trim());
});

// テスト：共通チェック処理
function checkTestAnswer(answer) {
  const card = currentDeck[testIndex];
  const correct = testMode === 'jp2en' ? (card.word || card.base) : (card.meaning || card.past);
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

// ユーティリティ：配列シャッフル
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
