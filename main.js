// PWA: Service Worker 登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

// — DOM要素取得 —
const deckSelect    = document.getElementById('deck-select');
const loadDeckBtn   = document.getElementById('load-deck');
const modeSelect    = document.getElementById('mode-select');

const flashcardSection = document.getElementById('flashcard-mode');
const fcPrompt         = document.getElementById('fc-prompt');
const fcSubprompt      = document.getElementById('fc-subprompt');
const fcProgress       = document.getElementById('fc-progress');

const testSection    = document.getElementById('test-mode');
const testStartBtn   = document.getElementById('test-start');
const testArea       = document.getElementById('test-area');
const testPrompt     = document.getElementById('test-prompt');
const testInputArea  = document.getElementById('test-input-area');
const testInput      = document.getElementById('test-input');
const testCheckBtn   = document.getElementById('test-check');
const testOptions    = document.getElementById('test-options');
const testFeedback   = document.getElementById('test-feedback');
const testProgress   = document.getElementById('test-progress');
const testTypeRadios = document.getElementsByName('test-type');

// — 状態管理 —
let currentDeck = [];
let fcIndex     = 0;
let fcStage     = 0;
let fcFields    = [];  // 今回のデッキのフィールド順
let testMode    = 'jp2en';
let testIndex   = 0;
let correctCnt  = 0;
let wrongList   = [];

// — モード切替 —
modeSelect.addEventListener('change', () => {
  if (modeSelect.value === 'flashcard') {
    flashcardSection.hidden = false;
    testSection.hidden      = true;
  } else {
    flashcardSection.hidden = true;
    testSection.hidden      = false;
  }
});

// — デッキ読み込み —
loadDeckBtn.addEventListener('click', () => {
  fetch(`decks/${deckSelect.value}`)
    .then(res => res.text())
    .then(csv => {
      // CSV → オブジェクト配列
      currentDeck = Papa.parse(csv, { header: true }).data
        .filter(c => Object.keys(c).length)   // 空行除去
        .sort(() => Math.random() - 0.5);
      initFlashcard();
      renderFlashcard();
    });
});

// — フラッシュカード初期化 —
function initFlashcard() {
  fcIndex  = 0;
  fcStage  = 0;
  // 最初のカードを見てフィールド配列を決定
  const card = currentDeck[0] || {};
  if (card.base !== undefined && card.past !== undefined && card.participle !== undefined) {
    // 不規則動詞：4フィールド
    fcFields = ['base','past','participle','meaning'];
  } else {
    // 通常英単語：2フィールド
    fcFields = ['word','meaning'];
  }
}

// — フラッシュカード描画 —
function renderFlashcard() {
  if (!currentDeck.length) return;
  if (fcIndex >= currentDeck.length) {
    // 全カード完了
    fcPrompt.textContent    = 'お疲れさま！全問完了しました。';
    fcSubprompt.textContent = '';
    fcProgress.textContent  = '';
    return;
  }
  const card  = currentDeck[fcIndex];
  const field = fcFields[fcStage];
  // 見出し語 (原形 or 単語)
  const title = card.base !== undefined ? card.base : card.word;
  fcPrompt.textContent = title;
  // 補助語 (2～4番目のフィールド)
  if (field !== (card.base !== undefined ? 'base' : 'word')) {
    fcSubprompt.textContent = card[field] || '';
  } else {
    fcSubprompt.textContent = '';
  }
  fcProgress.textContent = `${fcIndex+1} / ${currentDeck.length}`;
}

// — 画面タップでめくる —
flashcardSection.addEventListener('click', () => {
  if (fcIndex >= currentDeck.length) return;
  fcStage++;
  if (fcStage >= fcFields.length) {
    // 最後のフィールドまで見終えたら次カード
    fcStage = 0;
    fcIndex++;
  }
  renderFlashcard();
});

// — テストモード：開始 —
testStartBtn.addEventListener('click', () => {
  testMode   = Array.from(testTypeRadios).find(r => r.checked).value;
  testIndex  = 0;
  correctCnt = 0;
  wrongList  = [];
  testArea.hidden = false;
  renderTestQuestion();
});

// — テストモード：問題表示 —
function renderTestQuestion() {
  testFeedback.textContent = '';
  if (testIndex >= currentDeck.length) {
    // テスト完了
    const rate = Math.round(100 * correctCnt / currentDeck.length);
    testPrompt.textContent   = `終了！ 正答率: ${rate}%`;
    testInputArea.hidden     = true;
    testOptions.hidden       = true;
    testProgress.textContent = `間違えた: ${wrongList.join(', ')}`;
    return;
  }
  const card = currentDeck[testIndex];
  testProgress.textContent = `${testIndex+1} / ${currentDeck.length}`;
  if (testMode === 'jp2en') {
    // 和→英入力
    testPrompt.textContent = card.meaning || card.past;
    testInputArea.hidden   = false;
    testOptions.hidden     = true;
  } else {
    // 英→四択
    testPrompt.textContent = card.base !== undefined ? card.base : card.word;
    testInputArea.hidden   = true;
    testOptions.hidden     = false;
    // 正解とダミー選択肢を作成
    const correct = card.meaning || card.past;
    const pool    = currentDeck.map(c => c.meaning || c.past)
                      .filter(m => m !== correct);
    shuffle(pool);
    const opts = [correct, pool[0], pool[1] || '', pool[2] || '']
                   .sort(() => Math.random() - 0.5);
    testOptions.innerHTML = '';
    opts.forEach(text => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.addEventListener('click', () => checkAnswer(text));
      testOptions.appendChild(btn);
    });
  }
}

// — テストモード：入力チェック —
testCheckBtn.addEventListener('click', () => {
  checkAnswer(testInput.value.trim());
});

// — テストモード：共通チェック処理 —
function checkAnswer(ans) {
  const card = currentDeck[testIndex];
  const correct = (testMode === 'jp2en')
    ? (card.base !== undefined ? card.base : card.word)
    : (card.meaning || card.past);
  if (ans === correct) {
    testFeedback.textContent = '○ 正解！';
    correctCnt++;
  } else {
    testFeedback.textContent = `× 正解: ${correct}`;
    wrongList.push(card.base !== undefined ? card.base : card.word);
  }
  testIndex++;
  setTimeout(renderTestQuestion, 800);
}

// — ユーティリティ：配列シャッフル —
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
