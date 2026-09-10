/* Webview client: step gating, quiz state, and rendering check results.
   All grading happens in the extension host; this file only displays it. */
(function () {
  'use strict';

  const vscode = acquireVsCodeApi();
  const cfg = window.__DPA__ || { stepCount: 0, hasQuiz: false, quizCount: 0, progress: {} };
  const totalSteps = cfg.stepCount + (cfg.hasQuiz ? 1 : 0);

  const stepEls = Array.prototype.slice.call(document.querySelectorAll('.step'));
  const pill = document.getElementById('pill');
  const results = document.getElementById('results');
  const finale = document.getElementById('finale');

  let stepPassed = new Array(totalSteps).fill(false);
  let quizState = (cfg.progress && cfg.progress.quiz) || [];
  const savedSteps = (cfg.progress && cfg.progress.steps) || [];
  savedSteps.forEach((v, i) => {
    if (i < cfg.stepCount) stepPassed[i] = !!v;
  });

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ---------- gating ----------
  function refresh() {
    if (cfg.hasQuiz) {
      stepPassed[totalSteps - 1] =
        cfg.quizCount > 0 && quizState.slice(0, cfg.quizCount).filter(Boolean).length === cfg.quizCount;
    }
    let current = 0;
    while (current < totalSteps && stepPassed[current]) current++;

    stepEls.forEach((el, i) => {
      el.classList.remove('locked', 'passed', 'open');
      const status = el.querySelector('.status');
      if (stepPassed[i]) {
        el.classList.add('passed');
        status.textContent = '✓';
      } else if (i <= current) {
        status.textContent = '●';
      } else {
        el.classList.add('locked');
        status.textContent = '🔒';
      }
    });
    if (stepEls.length) stepEls[Math.min(current, totalSteps - 1)].classList.add('open');

    pill.textContent = current >= totalSteps ? 'Complete ✓' : 'Step ' + (current + 1) + ' of ' + totalSteps;
    if (finale) finale.style.display = current >= totalSteps ? 'block' : 'none';
  }

  stepEls.forEach((el) => {
    el.querySelector('.head').addEventListener('click', () => {
      if (el.classList.contains('locked')) return;
      el.classList.toggle('open');
    });
  });

  // ---------- quiz ----------
  document.querySelectorAll('.quiz-q').forEach((q) => {
    const idx = Number(q.dataset.q);
    const answer = Number(q.dataset.answer);
    const opts = q.querySelectorAll('.opt');
    function lock() {
      q.classList.add('answered');
      opts.forEach((b, i) => {
        b.disabled = true;
        if (i === answer) b.classList.add('correct');
      });
    }
    if (quizState[idx]) lock();
    opts.forEach((b, i) => {
      b.addEventListener('click', () => {
        if (i === answer) {
          quizState[idx] = true;
          vscode.postMessage({ type: 'quiz', index: idx });
          lock();
          refresh();
        } else {
          b.classList.add('wrong');
          b.disabled = true;
          q.classList.add('answered');
        }
      });
    });
  });

  // ---------- results ----------
  function line(kind, mark, text, msg) {
    return (
      '<div class="line ' + kind + '"><span class="mark">' + mark + '</span><span>' + text +
      (msg ? ' <span class="msg">— ' + msg + '</span>' : '') + '</span></div>'
    );
  }

  function renderTypeErrors(errors) {
    const shown = errors.slice(0, 8);
    return (
      '<h3>TypeScript · ' + errors.length + (errors.length === 1 ? ' error' : ' errors') + '</h3>' +
      shown
        .map((e) => line('fail', '✗', 'Line ' + e.line + ', col ' + e.col, esc(e.message)))
        .join('') +
      (errors.length > 8 ? '<p class="dim">…and ' + (errors.length - 8) + ' more.</p>' : '') +
      '<p class="hint">These are VS Code\'s own type errors — the ones underlined in your editor. ' +
      'Your code may still run, since types vanish at runtime, but the step checks stay locked ' +
      'until it type-checks.</p>'
    );
  }

  function renderReport(report) {
    let html = '';
    if (report.error) {
      html += line('fail', '⛔', esc(report.error));
    }
    if (report.fatal) {
      return (
        html +
        '<p class="hint">Nothing ran, so the step checks are skipped. Fix the error above and save again.</p>'
      );
    }
    report.steps.forEach((step, i) => {
      if (!step.reached) return;
      html += '<h3>Step ' + (i + 1) + ' · ' + esc(step.title) + '</h3>';
      step.checks.forEach((c) => {
        html += c.pass
          ? line('ok', '✓', esc(c.name))
          : line('fail', '✗', esc(c.name), esc(c.message || ''));
      });
    });
    return html || '<p class="dim">No checks ran.</p>';
  }

  window.addEventListener('message', (event) => {
    const msg = event.data || {};
    if (msg.type === 'busy') {
      results.classList.add('busy');
      return;
    }
    if (msg.type !== 'results') return;
    results.classList.remove('busy');

    if (msg.missingFile) {
      results.innerHTML = '<p class="dim">Exercise file not found — reopen the exercise.</p>';
      return;
    }
    if (msg.typeErrors && msg.typeErrors.length) {
      stepPassed = stepPassed.map((v, i) => (i < cfg.stepCount ? false : v));
      results.innerHTML = renderTypeErrors(msg.typeErrors);
      refresh();
      return;
    }
    if (msg.report) {
      msg.report.steps.forEach((s, i) => {
        if (i < cfg.stepCount) stepPassed[i] = !!s.passed;
      });
      results.innerHTML = renderReport(msg.report);
      refresh();
    }
  });

  // ---------- intro ----------
  // Remembered in extension state, so collapsing it sticks past this panel.
  const intro = document.querySelector('details.intro');
  if (intro) {
    intro.addEventListener('toggle', () => {
      vscode.postMessage({ type: 'intro', open: intro.open });
    });
  }

  // ---------- actions ----------
  document.getElementById('run').addEventListener('click', () => vscode.postMessage({ type: 'runChecks' }));
  document.getElementById('openFile').addEventListener('click', () => vscode.postMessage({ type: 'openFile' }));
  document.querySelectorAll('[data-reference]').forEach((b) => {
    b.addEventListener('click', () => vscode.postMessage({ type: 'reference', name: b.dataset.reference }));
  });

  refresh();
})();
