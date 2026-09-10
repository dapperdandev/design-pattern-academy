/**
 * Builds the lesson webview. Structure is rendered here; gating, quiz state and
 * check results are handled by media/panel.js at runtime.
 *
 * No editor, no highlighter, no type-checker: the learner's code lives in a real
 * VS Code editor next door, which already does all three better.
 */
'use strict';

const vscode = require('vscode');
const path = require('node:path');

function nonce() {
  let out = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSteps(def) {
  const steps = def.steps || [];
  let html = steps
    .map(
      (s, i) => `
      <section class="step" data-step="${i}">
        <button class="head" type="button">
          <span class="status">${i === 0 ? '●' : '🔒'}</span>
          <span class="title">${i + 1} · ${esc(s.title)}</span>
          ${s.chip ? `<span class="chip">${esc(s.chip)}</span>` : ''}
        </button>
        <div class="body">${s.body || ''}</div>
      </section>`
    )
    .join('');

  const quiz = def.quiz || [];
  if (quiz.length) {
    const qs = quiz
      .map(
        (q, i) => `
        <div class="quiz-q" data-q="${i}" data-answer="${q.answer}">
          <div class="qtext">${i + 1}. ${q.q}</div>
          ${q.options.map((o) => `<button class="opt" type="button">${esc(o)}</button>`).join('')}
          <div class="expl">${q.explain || ''}</div>
        </div>`
      )
      .join('');
    html += `
      <section class="step" data-step="${steps.length}">
        <button class="head" type="button">
          <span class="status">🔒</span>
          <span class="title">${steps.length + 1} · Checkpoint quiz</span>
          <span class="chip">retrieval practice</span>
        </button>
        <div class="body">
          <p class="why">Answer from memory — no scrolling up. Effortful recall is what makes it stick.</p>
          ${qs}
        </div>
      </section>`;
  }
  return html;
}

function renderRefs(def) {
  const refs = def.meta.references || [];
  if (!refs.length) return '';
  const links = refs
    .map((r) =>
      r.name
        ? `<button class="linkish" data-reference="${esc(r.name)}" type="button">${esc(r.label)}</button>`
        : `<a href="${esc(r.href)}">${esc(r.label)}</a>`
    )
    .join(' · ');
  return `<p><b>Quick refs:</b> ${links}</p>`;
}

function panelHtml(webview, extRoot, def, progress) {
  const n = nonce();
  const cssUri = webview.asWebviewUri(vscode.Uri.file(path.join(extRoot, 'media', 'panel.css')));
  const jsUri = webview.asWebviewUri(vscode.Uri.file(path.join(extRoot, 'media', 'panel.js')));
  const meta = def.meta;
  const payload = {
    id: meta.id,
    stepCount: (def.steps || []).length,
    hasQuiz: (def.quiz || []).length > 0,
    quizCount: (def.quiz || []).length,
    progress: progress || { quiz: [], steps: [] }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${n}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="${cssUri}">
<title>${esc(meta.title)}</title>
</head>
<body>
<header>
  <div class="crumb">${meta.emoji || ''} Design Pattern Academy · ${esc(meta.number)}</div>
  <h1>${esc(meta.heading || meta.title)}</h1>
  <div class="bar">
    <span class="pill" id="pill">Step 1</span>
    <span class="spacer"></span>
    <button id="openFile" class="secondary" type="button">Open ${esc(meta.id)}.ts</button>
    <button id="run" class="primary" type="button">▶ Run checks</button>
  </div>
</header>

<main>
  ${meta.intro ? `<section class="intro">${meta.intro}</section>` : ''}
  ${meta.howto ? `<p class="howto">${meta.howto}</p>` : ''}

  <div id="results" class="results"><p class="dim">Write step 1, then save the file — checks run automatically.</p></div>

  ${renderSteps(def)}

  ${meta.finale ? `<div class="finale" id="finale">${meta.finale}</div>` : ''}

  <div class="sources">
    ${
      meta.primarySource
        ? `<p><b>Primary source:</b> <a href="${esc(meta.primarySource.url)}">${esc(
            meta.primarySource.label
          )}</a> ${meta.primarySource.note || ''}</p>`
        : ''
    }
    ${renderRefs(def)}
    <p>💬 <b>Stuck?</b> The cheat sheet above carries the skeleton and the rules of thumb. Failing
    that, ask an AI assistant to explain the step you are on a different way — nothing here is too
    small to ask about.</p>
  </div>
</main>

<script nonce="${n}">window.__DPA__ = ${JSON.stringify(payload)};</script>
<script nonce="${n}" src="${jsUri}"></script>
</body>
</html>`;
}

module.exports = { panelHtml };
