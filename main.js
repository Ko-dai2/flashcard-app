let currentDeck = [];
let cardIndex = 0;
let fieldOrder = ["past","participle","meaning"];
let fieldIndex = 0;
let correctCount = 0;
let totalCount = 0;


function loadDeckFromCSV(path, callback) {
  fetch(path)
    .then(res => res.text())
    .then(csvText => {
      const parsed = Papa.parse(csvText, { header: true });
      callback(parsed.data);
    });
}
// ページ読み込み時に CSV 読み込み
loadDeckFromCSV('decks/irregular.csv', deck => {
  currentDeck = deck.sort(() => Math.random() - 0.5);
  document.getElementById("deck-name").textContent = "不規則動詞";
  updatePrompt();
  updateProgress();
});


function updatePrompt() {
  const card = currentDeck[cardIndex];
  const field = fieldOrder[fieldIndex];
  const labels = { past:"過去形", participle:"過去分詞", meaning:"意味" };
  document.getElementById("prompt").textContent =
    `${card.base} の ${labels[field]} は？`;
}
function updateProgress() {
  document.getElementById("progress").textContent =
    `${correctCount} / ${totalCount}`;
}
function showFeedback(isCorrect, correctAns="") {
  const fb = document.getElementById("feedback");
  fb.textContent = isCorrect? "○ 正解！": `× 正解は「${correctAns}」`;
}
document.getElementById("check-btn").addEventListener("click", () => {
  const card = currentDeck[cardIndex];
  const field = fieldOrder[fieldIndex];
  const ans = document.getElementById("answer").value.trim();
  totalCount++;
  if (ans === card[field]) {
    correctCount++;
    showFeedback(true);
    fieldIndex++;
    if (fieldIndex >= fieldOrder.length) {
      cardIndex++;
      fieldIndex = 0;
    }
  } else {
    showFeedback(false, card[field]);
  }
  document.getElementById("answer").value = "";
  updateProgress();
  if (cardIndex < currentDeck.length) updatePrompt();
  else document.getElementById("card-area").innerHTML =
    "<h2>お疲れさま！全問完了しました。</h2>";
});
