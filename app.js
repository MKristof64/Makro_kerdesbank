const questions = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];

const state = {
  order: [],
  current: 0,
  answers: {},
  summaryOpen: false,
};

const els = {
  questionProgress: document.querySelector("#question-progress"),
  answeredProgress: document.querySelector("#answered-progress"),
  progressBar: document.querySelector("#progress-bar"),
  topicLabel: document.querySelector("#topic-label"),
  questionView: document.querySelector("#question-view"),
  questionText: document.querySelector("#question-text"),
  optionsGrid: document.querySelector("#options-grid"),
  feedback: document.querySelector("#feedback"),
  summaryView: document.querySelector("#summary-view"),
  summaryTitle: document.querySelector("#summary-title"),
  summaryCopy: document.querySelector("#summary-copy"),
  wrongListTitle: document.querySelector("#wrong-list-title"),
  wrongList: document.querySelector("#wrong-list"),
  prevButton: document.querySelector("#prev-button"),
  nextButton: document.querySelector("#next-button"),
  finishButton: document.querySelector("#finish-button"),
  restartButton: document.querySelector("#restart-button"),
  finishDialog: document.querySelector("#finish-dialog"),
  confirmFinishButton: document.querySelector("#confirm-finish-button"),
};

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function startTest() {
  closeFinishDialog();
  state.order = shuffle(questions.map((_, index) => index));
  state.current = 0;
  state.answers = {};
  state.summaryOpen = false;
  render();
}

function currentQuestion() {
  return questions[state.order[state.current]];
}

function answeredCount() {
  return Object.keys(state.answers).length;
}

function selectedAnswer(question) {
  return state.answers[question.number] || "";
}

function formatLetter(letter) {
  return letter.toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render() {
  if (!questions.length) {
    renderLoadError();
    return;
  }

  if (state.summaryOpen) {
    renderSummary();
    return;
  }

  const question = currentQuestion();
  const selected = selectedAnswer(question);
  const progress = state.current + 1;
  const complete = answeredCount();

  els.questionView.hidden = false;
  els.summaryView.hidden = true;
  els.questionProgress.textContent = `Kérdés ${progress} / ${questions.length}`;
  els.answeredProgress.textContent = `${complete} megválaszolva`;
  els.progressBar.style.width = `${(complete / questions.length) * 100}%`;
  els.topicLabel.textContent = question.topic || "Makroökonómia";
  els.questionText.textContent = question.prompt;
  els.optionsGrid.innerHTML = "";
  els.finishButton.hidden = false;
  els.finishButton.disabled = false;

  Object.entries(question.options).forEach(([letter, text]) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", selected === letter ? "true" : "false");
    button.disabled = Boolean(selected);

    if (selected && letter === question.correct) {
      button.classList.add("correct");
    }
    if (selected && letter === selected && selected !== question.correct) {
      button.classList.add("incorrect");
    }

    button.innerHTML = `
      <span class="option-letter">${formatLetter(letter)}</span>
      <span class="option-text">${escapeHtml(text)}</span>
    `;
    button.addEventListener("click", () => markAnswer(letter));
    els.optionsGrid.append(button);
  });

  renderFeedback(question, selected);
  renderNavigation(Boolean(selected));
}

function renderFeedback(question, selected) {
  if (!selected) {
    els.feedback.hidden = true;
    els.feedback.innerHTML = "";
    return;
  }

  const isCorrect = selected === question.correct;
  const selectedText = question.options[selected];
  const correctText = question.options[question.correct];
  const verdict = isCorrect ? "Helyes jelölés." : "Nem ez volt a helyes válasz.";

  els.feedback.hidden = false;
  els.feedback.innerHTML = `
    <p class="result-line ${isCorrect ? "is-right" : "is-wrong"}"><strong>${verdict}</strong></p>
    <p><strong>Helyes válasz:</strong> ${formatLetter(question.correct)} - ${escapeHtml(correctText)}</p>
    ${isCorrect ? "" : `<p><strong>A jelölésed:</strong> ${formatLetter(selected)} - ${escapeHtml(selectedText)}</p>`}
    <p><strong>Indoklás:</strong> ${escapeHtml(question.explanation)}</p>
    <p><strong>Kizárásos logika:</strong> ${escapeHtml(question.elimination)}</p>
  `;
}

function renderNavigation(hasAnswer) {
  const isLast = state.current === questions.length - 1;

  els.prevButton.hidden = false;
  els.nextButton.hidden = false;
  els.prevButton.disabled = state.current === 0;
  els.nextButton.disabled = !hasAnswer;
  els.nextButton.textContent = isLast ? "Eredmény" : "Következő";
}

function renderSummary() {
  const wrongAnsweredNumbers = questions
    .filter((question) => state.answers[question.number] && state.answers[question.number] !== question.correct)
    .map((question) => question.number)
    .sort((a, b) => a - b);
  const correct = questions.filter((question) => state.answers[question.number] === question.correct).length;
  const percent = Math.round((correct / questions.length) * 100);
  const answered = answeredCount();
  const hasUnanswered = answered < questions.length;

  els.questionView.hidden = true;
  els.summaryView.hidden = false;
  els.questionProgress.textContent = "Összegzés";
  els.answeredProgress.textContent = `${answered} megválaszolva`;
  els.progressBar.style.width = "100%";
  els.topicLabel.textContent = "Makroökonómia";
  els.summaryTitle.textContent = `${correct} / ${questions.length} helyes válasz`;
  els.summaryCopy.textContent = hasUnanswered
    ? `Az eredményed ${percent}%. A tesztet ${answered} megválaszolt kérdés után zártad le; a lista kizárólag az eredeti kérdésbank szerinti hibásan megválaszolt sorszámokat mutatja.`
    : `Az eredményed ${percent}%. Az alábbi lista az eredeti kérdésbank szerinti hibásan megválaszolt sorszámokat mutatja.`;
  els.wrongListTitle.textContent = "Hibásan megválaszolt kérdések sorszáma";
  els.wrongList.textContent = wrongAnsweredNumbers.length ? wrongAnsweredNumbers.join(", ") : "Nincs hibás válasz.";
  els.finishButton.hidden = true;

  els.prevButton.hidden = true;
  els.nextButton.hidden = false;
  els.nextButton.disabled = false;
  els.nextButton.textContent = "Új teszt";
}

function renderLoadError() {
  els.questionProgress.textContent = "Adathiba";
  els.answeredProgress.textContent = "";
  els.topicLabel.textContent = "Makroökonómia";
  els.questionText.textContent = "A kérdésbank adatai nem töltődtek be.";
  els.optionsGrid.innerHTML = "";
  els.feedback.hidden = false;
  els.feedback.innerHTML = "<p>Ellenőrizd, hogy a data/questions.js fájl elérhető-e.</p>";
  els.prevButton.disabled = true;
  els.nextButton.disabled = true;
  els.finishButton.disabled = true;
}

function markAnswer(letter) {
  const question = currentQuestion();
  if (selectedAnswer(question)) {
    return;
  }

  state.answers[question.number] = letter;
  render();
}

function goNext() {
  if (state.summaryOpen) {
    startTest();
    return;
  }

  const question = currentQuestion();
  if (!selectedAnswer(question)) {
    return;
  }

  if (state.current === questions.length - 1) {
    state.summaryOpen = true;
    render();
    return;
  }

  state.current += 1;
  render();
}

function goPrevious() {
  if (state.current === 0 || state.summaryOpen) {
    return;
  }

  state.current -= 1;
  render();
}

function openFinishDialog() {
  if (state.summaryOpen) {
    return;
  }

  if (typeof els.finishDialog.showModal === "function") {
    els.finishDialog.showModal();
    return;
  }

  finishTest();
}

function closeFinishDialog() {
  if (els.finishDialog.open) {
    els.finishDialog.close();
  }
}

function finishTest() {
  closeFinishDialog();
  state.summaryOpen = true;
  render();
}

els.nextButton.addEventListener("click", goNext);
els.prevButton.addEventListener("click", goPrevious);
els.finishButton.addEventListener("click", openFinishDialog);
els.confirmFinishButton.addEventListener("click", finishTest);
els.restartButton.addEventListener("click", startTest);

startTest();
