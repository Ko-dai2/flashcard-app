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
let currentDeck    = [];
let isIrregular    = false;     // 不規則動詞フラグ
let fcIndex        = 0;
let fcStage        = 0;
let fcFields       = [];
let testMode       = 'jp2en';
let testIndex      = 0;
let correctCnt     = 0;
let wrongList      = [];

// 不規則テスト用サブステージ
let irSubStage     = 0;  // 0=過去形,1=過去分詞,2=四択意味

// — モード切替 —
modeSelect.addEventListener('change', () => {
  flashcardSection.hidden = modeSelect.value !== 'flashcard';
  testSection.hidden      = modeSelect.value !== 'test';
});

// — デッキ読み込み —
loadDeckBtn.addEventListener('click', () => {
  fetch(`decks/${deckSelect.value}`)
    .then(r => r.text())
    .then(csv => {
      currentDeck = Papa.parse(csv, { header: true }).data
        .filter(c => Object.keys(c).length)  // 空行除去
        .sort(() => Math.random() - 0.5);
      isIrregular = deckSelect.value === 'irregular.csv';
      initFlashcard();
      renderFlashcard();
    });
});

// — フラッシュカード初期化 —
function initFlashcard() {
  fcIndex  = 0;
  fcStage  = 0;
  // フィールド配列を決定
  const card = currentDeck[0] || {};
  if (isIrregular) {
    fcFields = ['base','past','participle','meaning'];
  } else {
    fcFields = ['word','meaning'];
  }
}

// — フラッシュカード描画 —
function renderFlashcard() {
  if (!currentDeck.length) return;
  if (fcIndex >= currentDeck.length) {
    fcPrompt.textContent    = 'お疲れさま！全問完了しました。';
    fcSubprompt.innerHTML   = '';
    fcProgress.textContent  = '';
    return;
  }
  const card  = currentDeck[fcIndex];
  const field = fcFields[fcStage];
  const title = card.base !== undefined ? card.base : card.word;
  fcPrompt.textContent = title;

  // サブプロンプト：意味ステージならリスト表示
  if (field === 'meaning' && isIrregular) {
    // 不規則動詞の意味ステージのみリスト表示
    fcSubprompt.innerHTML = `
      <ul style="text-align:left; padding-left:1em;">
        <li>原形: ${card.base}</li>
        <li>過去形: ${card.past}</li>
        <li>過去分詞: ${card.participle}</li>
        <li>意味: ${card.meaning}</li>
      </ul>`;
  } else if (field !== (isIrregular ? 'base' : 'word')) {
    // 通常のフィールド表示
    fcSubprompt.textContent = card[field] || '';
  } else {
    fcSubprompt.textContent = '';
  }
  fcProgress.textContent = `${fcIndex+1} / ${currentDeck.length}`;
}

// — フラッシュカードタップ —
flashcardSection.addEventListener('click', () => {
  if (fcIndex >= currentDeck.length) return;
  fcStage++;
  if (fcStage >= fcFields.length) {
    fcStage = 0;
    fcIndex++;
  }
  renderFlashcard();
});

// — テスト開始 —
testStartBtn.addEventListener('click', () => {
  testMode   = Array.from(testTypeRadios).find(r => r.checked).value;
  testIndex  = 0;
  correctCnt = 0;
  wrongList  = [];
  irSubStage = 0;
  testArea.hidden = false;
  renderTestQuestion();
});

// — テスト問題表示 —
function renderTestQuestion() {
  testFeedback.textContent = '';
  if (testIndex >= currentDeck.length) {
    // 結果表示
    const rate = Math.round(100*correctCnt/currentDeck.length);
    testPrompt.textContent   = `終了！ 正答率: ${rate}%`;
    testInputArea.hidden     = true;
    testOptions.hidden       = true;
    testProgress.textContent = `間違え: ${wrongList.join(', ')}`;
    return;
  }
  const card = currentDeck[testIndex];
  testProgress.textContent = `${testIndex+1} / ${currentDeck.length}`;

  if (isIrregular) {
    // 不規則動詞専用テスト
    if (irSubStage === 0) {
      // 過去形入力
      testPrompt.textContent   = `過去形 of ${card.base} は？`;
      testInputArea.hidden     = false;
      testOptions.hidden       = true;
      testInput.value          = '';
    } else if (irSubStage === 1) {
      // 過去分詞入力
      testPrompt.textContent   = `過去分詞 of ${card.base} は？`;
      testInputArea.hidden     = false;
      testOptions.hidden       = true;
      testInput.value          = '';
    } else {
      // 意味四択
      testPrompt.textContent   = `意味 of ${card.base} は？`;
      testInputArea.hidden     = true;
      testOptions.hidden       = false;
      const correct = card.meaning;
      const pool    = currentDeck.map(c=>c.meaning).filter(m=>m!==correct);
      shuffle(pool);
      const opts = [correct, pool[0], pool[1]||'', pool[2]||'']
                     .sort(()=>Math.random()-0.5);
      testOptions.innerHTML = '';
      opts.forEach(txt=>{
        const b=document.createElement('button');
        b.textContent=txt;
        b.addEventListener('click', ()=>checkIrregular(txt));
        testOptions.appendChild(b);
      });
    }
  } else {
    // 通常テスト
    if (testMode==='jp2en') {
      testPrompt.textContent = card.meaning;
      testInputArea.hidden   = false;
      testOptions.hidden     = true;
      testInput.value        = '';
    } else {
      testPrompt.textContent = card.word;
      testInputArea.hidden   = true;
      testOptions.hidden     = false;
      const correct = card.meaning;
      const pool    = currentDeck.map(c=>c.meaning).filter(m=>m!==correct);
      shuffle(pool);
      const opts = [correct, pool[0], pool[1]||'', pool[2]||'']
                     .sort(()=>Math.random()-0.5);
      testOptions.innerHTML = '';
      opts.forEach(txt=>{
        const b=document.createElement('button');
        b.textContent=txt;
        b.addEventListener('click', ()=>checkNormal(txt));
        testOptions.appendChild(b);
      });
    }
  }
}

// — 通常テストチェック —
testCheckBtn.addEventListener('click', ()=>{
  const ans = testInput.value.trim();
  checkNormal(ans);
});

// — 通常テスト回答処理 —
function checkNormal(ans) {
  const card    = currentDeck[testIndex];
  const correct = testMode==='jp2en' ? card.word : card.meaning;
  if (ans===correct) {
    testFeedback.textContent='○ 正解！';
    correctCnt++;
  } else {
    testFeedback.textContent=`× 正解: ${correct}`;
    wrongList.push(card.word);
  }
  testIndex++;
  setTimeout(renderTestQuestion,800);
}

// — 不規則テスト回答処理 —
function checkIrregular(ans) {
  const card = currentDeck[testIndex];
  let correct;
  if (irSubStage===0) correct = card.past;
  else if(irSubStage===1) correct=card.participle;
  else                 correct=card.meaning;

  if (ans===correct) {
    testFeedback.textContent='○ 正解！';
    if (irSubStage<2) ; // 入力ステージ、カウントしない
    else correctCnt++;
  } else {
    testFeedback.textContent=`× 正解: ${correct}`;
    wrongList.push(card.base);
  }
  irSubStage++;
  if (irSubStage>2) {
    irSubStage=0;
    testIndex++;
  }
  setTimeout(renderTestQuestion,800);
}

// — ユーティリティ：配列シャッフル —
function shuffle(arr) {
  for (let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}
