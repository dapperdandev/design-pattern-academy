/**
 * Pattern Dojo — exercise engine.
 *
 * Contains no exercise content. An exercise is a data file that calls
 * Dojo.register({...}) and then Dojo.start(); see exercises/_template/exercise.js
 * for the full shape of a definition.
 *
 * Deliberately plain ES5-era JS with classic <script> loading: the whole thing
 * must run by double-clicking an HTML file (file:// blocks ES modules).
 */
(function (global) {
  'use strict';

  var TS_URLS = [
    'https://unpkg.com/typescript@5.5.4/lib/typescript.js',
    'https://cdnjs.cloudflare.com/ajax/libs/typescript/5.5.4/typescript.min.js'
  ];

  var Dojo = {
    registry: [],
    register: function (def) { Dojo.registry.push(def); return def; },
    start: start,
    // storage helpers, also used by the catalog to show per-exercise progress
    keyFor: keyFor,
    readProgress: readProgress,
    escapeHtml: escapeHtml,
    highlightTS: highlightTS,
    loadTypeScript: loadTypeScript,
    currentTheme: currentTheme,
    applyTheme: applyTheme
  };

  // ---------- editor theme ----------
  // The work pane is themed as a unit (see engine.css). Default follows the OS
  // preference, because a light-background environment with the dark palette
  // leaves untokenized code nearly invisible. Explicit choice always wins.
  var THEME_KEY = 'dojo:editor-theme';
  function currentTheme() {
    var saved;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === 'light' || saved === 'dark') return saved;
    var mq = global.matchMedia && global.matchMedia('(prefers-color-scheme: light)');
    return (mq && mq.matches) ? 'light' : 'dark';
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-ed-theme', theme);
    var btn = document.getElementById('themeBtn');
    if (btn) {
      btn.textContent = theme === 'light' ? '☀ Light' : '☾ Dark';
      btn.title = 'Editor theme: ' + theme + ' — click to switch';
    }
    return theme;
  }
  function toggleTheme() {
    var next = currentTheme() === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    return applyTheme(next);
  }

  // ---------- storage ----------
  function keyFor(id, what) { return 'dojo:' + id + ':' + what; }
  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  /** Returns {done, total} for an exercise id — cheap enough for the catalog. */
  function readProgress(id, totalSteps) {
    var steps = readJSON(keyFor(id, 'steps'), []);
    var done = 0;
    for (var i = 0; i < steps.length; i++) if (steps[i]) done++;
    return { done: Math.min(done, totalSteps), total: totalSteps };
  }

  // ---------- text helpers ----------
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  var KEYWORDS = {};
  ('abstract any as async await bigint boolean break case catch class const continue declare default delete do else enum ' +
   'export extends false finally for from function get if implements import in instanceof interface let namespace never new ' +
   'null number object of private protected public readonly return set static string super switch symbol this throw true try ' +
   'type typeof undefined unknown var void while yield').split(' ').forEach(function (k) { KEYWORDS[k] = true; });

  // alternatives, in order: comment | template string | quoted string | number | word
  var TOKEN_RE = /(\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*)|(`(?:\\[\s\S]|[^\\`])*`?)|('(?:\\.|[^\\'\n])*'?|"(?:\\.|[^\\"\n])*"?)|(\b\d[\d_]*(?:\.\d[\d_]*)?\b)|([A-Za-z_$][\w$]*)/g;

  function highlightTS(code) {
    var html = '', last = 0, m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(code))) {
      html += escapeHtml(code.slice(last, m.index));
      var txt = escapeHtml(m[0]), cls = '';
      if (m[1]) cls = 'tk-c';
      else if (m[2] || m[3]) cls = 'tk-s';
      else if (m[4]) cls = 'tk-n';
      else if (m[5]) cls = KEYWORDS[m[0]] ? 'tk-k' : (/^[A-Z]/.test(m[0]) ? 'tk-t' : '');
      html += cls ? '<span class="' + cls + '">' + txt + '</span>' : txt;
      last = m.index + m[0].length;
    }
    return html + escapeHtml(code.slice(last));
  }

  function stripComments(src) {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  }

  // ---------- compiler loading ----------
  function loadTypeScript(onReady, onFail) {
    if (global.ts) { onReady(global.ts); return; }
    (function next(i) {
      if (i >= TS_URLS.length) { onFail(); return; }
      var s = document.createElement('script');
      s.src = TS_URLS[i];
      s.onload = function () { global.ts ? onReady(global.ts) : next(i + 1); };
      s.onerror = function () { next(i + 1); };
      document.head.appendChild(s);
    })(0);
  }

  // ---------- exercise page ----------
  function start(opts) {
    opts = opts || {};
    var def = opts.def || Dojo.registry[Dojo.registry.length - 1];
    if (!def) throw new Error('Dojo.start(): no exercise registered.');

    var meta = def.meta;
    var steps = def.steps || [];
    var quiz = def.quiz || [];
    var hasQuiz = quiz.length > 0;
    var totalSteps = steps.length + (hasQuiz ? 1 : 0);
    var root = document.getElementById(opts.mount || 'dojo-app') || document.body;
    var rootPath = meta.rootPath || '../..';

    var K_CODE = keyFor(meta.id, 'code');
    var K_QUIZ = keyFor(meta.id, 'quiz');
    var K_STEPS = keyFor(meta.id, 'steps');

    document.title = (meta.number ? meta.number + ' · ' : '') + meta.title +
      (meta.domain ? ' — ' + meta.domain : '') + ' · Pattern Dojo';

    // ---- build the page ----
    applyTheme(currentTheme()); // before render, so there's no flash of the wrong palette
    root.innerHTML = renderShell(meta, steps, quiz, rootPath);
    applyTheme(currentTheme()); // again, to label the button the shell just created

    var editor = document.getElementById('editor');
    var gutterInner = document.getElementById('gutterInner');
    var hlContent = document.getElementById('hlContent');
    var edstack = document.getElementById('edstack');
    var runBtn = document.getElementById('runBtn');
    var resetBtn = document.getElementById('resetBtn');
    var watchBtn = document.getElementById('watchBtn');
    var watchStatus = document.getElementById('watchStatus');
    var fileLabel = document.getElementById('fileLabel');
    var tsStatus = document.getElementById('tsStatus');
    var checksPane = document.getElementById('checksPane');
    var consoleOut = document.getElementById('consoleOut');
    var progressPill = document.getElementById('progressPill');
    var finale = document.getElementById('finale');
    var stepEls = Array.prototype.slice.call(root.querySelectorAll('.step'));

    var stepPassed = [];
    for (var i0 = 0; i0 < totalSteps; i0++) stepPassed.push(false);

    // ---- editor ----
    function updateEditorView() {
      var code = editor.value;
      var n = code.split('\n').length;
      var nums = [];
      for (var i = 1; i <= n; i++) nums.push(i);
      gutterInner.textContent = nums.join('\n');
      // trailing space keeps the overlay's height in step when the code ends on a blank line
      hlContent.innerHTML = highlightTS(code) + (code.slice(-1) === '\n' ? ' ' : '');
      syncScroll();
    }
    // transform-based sync: unlike mirroring scrollTop onto a clipped element, a translate
    // can't clamp when the textarea's scrollbars give it a larger scroll range
    function syncScroll() {
      hlContent.style.transform = 'translate(' + (-editor.scrollLeft) + 'px, ' + (-editor.scrollTop) + 'px)';
      gutterInner.style.transform = 'translateY(' + (-editor.scrollTop) + 'px)';
    }
    var saveTimer = null;
    function saveSoon() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        try { localStorage.setItem(K_CODE, editor.value); } catch (e) {}
      }, 400);
    }
    editor.addEventListener('scroll', syncScroll);
    editor.addEventListener('input', function () { updateEditorView(); saveSoon(); });
    editor.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = editor.selectionStart, t = editor.selectionEnd;
        editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(t);
        editor.selectionStart = editor.selectionEnd = s + 2;
        updateEditorView(); saveSoon();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runChecks(); }
    });

    // ---- compiler ----
    var tsReady = false;
    loadTypeScript(function (ts) {
      tsReady = true;
      tsStatus.textContent = 'TypeScript ' + ts.version + ' ✓';
      if (editor.value.trim() && editor.value !== def.scaffold) runChecks(true);
    }, function () {
      tsStatus.textContent = '⚠ could not load TypeScript compiler — are you online?';
    });

    /** Transpile + run the learner's code in a function scope, capturing console output. */
    function execute(src) {
      var result = { logs: [], error: null, globals: {} };
      var out;
      try {
        out = global.ts.transpileModule(src, {
          compilerOptions: { target: global.ts.ScriptTarget.ES2020, module: global.ts.ModuleKind.None },
          reportDiagnostics: true
        });
      } catch (e) { result.error = 'Compile failed: ' + e.message; return result; }
      var diags = out.diagnostics || [];
      if (diags.length) {
        var d = diags[0];
        var where = '';
        if (typeof d.start === 'number') {
          var upto = src.slice(0, d.start);
          var line = upto.split('\n').length;
          var col = d.start - upto.lastIndexOf('\n');
          where = 'Line ' + line + ', col ' + col + ' — ';
        }
        result.error = 'Syntax error · ' + where +
          global.ts.flattenDiagnosticMessageText(d.messageText, ' ');
        result.fatal = true; // nothing compiled, so no check below can mean anything
        return result;
      }

      var fakeConsole = {};
      ['log', 'info', 'warn', 'error'].forEach(function (k) {
        fakeConsole[k] = function () {
          result.logs.push(Array.prototype.map.call(arguments, function (a) {
            return (typeof a === 'object' && a !== null) ? JSON.stringify(a) : String(a);
          }).join(' '));
        };
      });

      // hand the named declarations back out so checks can exercise them directly
      var captures = (def.captures || []).filter(function (n) { return /^[A-Za-z_$][\w$]*$/.test(n); });
      var handoff = captures.map(function (n) {
        return ' ' + n + ': typeof ' + n + ' !== "undefined" ? ' + n + ' : undefined';
      }).join(',');
      try {
        var fn = new Function('console', out.outputText + '\n;return {' + handoff + '\n};');
        result.globals = fn(fakeConsole) || {};
      } catch (e) {
        result.error = 'Your code threw: ' + e.message;
        result.fatal = true; // it stopped before handing anything back, so checks can't run
      }
      return result;
    }

    function runChecks(silent) {
      if (!tsReady) { tsStatus.textContent = '⚠ compiler still loading — try again in a moment'; return; }
      var src = editor.value;
      var r = execute(src);
      var ctx = {
        g: r.globals,
        logs: r.logs,
        src: src,
        clean: stripComments(src),
        expect: def.expected || {},
        eq: function (got, want) {
          return got === want ? null : 'Expected "' + want + '" but got "' + got + '".';
        },
        missingLines: function (wanted) {
          return wanted.filter(function (l) { return ctx.logs.indexOf(l) === -1; });
        }
      };

      consoleOut.textContent = (r.logs.length ? r.logs.join('\n') : '(no output)') +
        (r.error ? '\n\n⛔ ' + r.error : '');

      var html = '';
      if (r.error) html += '<div class="checkline fail">⛔ <span class="msg">' + escapeHtml(r.error) + '</span></div>';

      for (var z = 0; z < steps.length; z++) stepPassed[z] = false; // no stale ✓ from earlier runs

      // A compile error or an uncaught throw means nothing ran. Reporting each
      // step's checks then would bury the real cause under a pile of misleading
      // "not found yet" failures, so stop here and point at the one thing to fix.
      if (r.fatal) {
        checksPane.innerHTML = html +
          '<div class="bigmsg">Your code didn\'t run, so the step checks are skipped. ' +
          'Fix the error above and run again — the line number is in the message.</div>';
        if (!silent) setTab(0);
        refreshUI();
        return;
      }

      for (var s = 0; s < steps.length; s++) {
        var checks = steps[s].checks || [];
        var allOk = checks.length > 0;
        html += '<div class="stephdr">' + escapeHtml(stepLabel(steps[s], s)) + '</div>';
        for (var i = 0; i < checks.length; i++) {
          var failMsg;
          try { failMsg = checks[i].run(ctx) || null; }
          catch (e) { failMsg = e.message; }
          html += '<div class="checkline ' + (failMsg ? 'fail' : 'ok') + '">' +
            (failMsg ? '✗' : '✓') + ' ' + escapeHtml(checks[i].name) +
            (failMsg ? ' <span class="msg">— ' + escapeHtml(failMsg) + '</span>' : '') + '</div>';
          if (failMsg) { allOk = false; break; } // first failure per step keeps the signal high
        }
        stepPassed[s] = allOk;
        if (!allOk) break; // later steps build on this one
      }
      checksPane.innerHTML = html || '<div class="bigmsg">Nothing to check yet.</div>';
      if (!silent) setTab(0);
      refreshUI();
    }

    // ---- quiz ----
    var quizState = readJSON(K_QUIZ, []);
    while (quizState.length < quiz.length) quizState.push(false);
    root.querySelectorAll('.quiz-q').forEach(function (q) {
      var idx = +q.dataset.q, ans = +q.dataset.answer;
      var opts = q.querySelectorAll('button.opt');
      function lock() {
        q.classList.add('answered');
        opts.forEach(function (b, i) { b.disabled = true; if (i === ans) b.classList.add('correct'); });
      }
      if (quizState[idx]) lock();
      opts.forEach(function (b, i) {
        b.addEventListener('click', function () {
          if (i === ans) {
            quizState[idx] = true;
            writeJSON(K_QUIZ, quizState);
            lock();
            refreshUI();
          } else {
            b.classList.add('wrong'); b.disabled = true;
            q.classList.add('answered');
          }
        });
      });
    });

    // ---- gating ----
    function refreshUI() {
      if (hasQuiz) {
        stepPassed[totalSteps - 1] = quiz.length > 0 && quizState.slice(0, quiz.length).every(Boolean);
      }
      // persisted here, not in runChecks, so the quiz slot above is included
      writeJSON(K_STEPS, stepPassed);
      var current = 0;
      while (current < totalSteps && stepPassed[current]) current++;
      stepEls.forEach(function (el, i) {
        el.classList.remove('locked', 'passed', 'open');
        var st = el.querySelector('.status');
        if (stepPassed[i]) { el.classList.add('passed'); st.textContent = '✓'; }
        else if (i <= current) { st.textContent = '●'; }
        else { el.classList.add('locked'); st.textContent = '🔒'; }
      });
      stepEls[Math.min(current, totalSteps - 1)].classList.add('open');
      progressPill.textContent = current >= totalSteps ? 'Complete ✓' : 'Step ' + (current + 1) + ' of ' + totalSteps;
      if (finale) {
        finale.style.display = current >= totalSteps ? 'block' : 'none';
        if (current >= totalSteps) finale.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    stepEls.forEach(function (el) {
      el.querySelector('.head').addEventListener('click', function () {
        if (el.classList.contains('locked')) return;
        el.classList.toggle('open');
      });
    });

    // ---- result tabs ----
    var tabChecks = document.getElementById('tabChecks'), tabConsole = document.getElementById('tabConsole');
    tabChecks.addEventListener('click', function () { setTab(0); });
    tabConsole.addEventListener('click', function () { setTab(1); });
    function setTab(i) {
      tabChecks.classList.toggle('active', i === 0);
      tabConsole.classList.toggle('active', i === 1);
      checksPane.classList.toggle('active', i === 0);
      document.getElementById('consolePane').classList.toggle('active', i === 1);
    }

    // ---- watch a real file (Chromium File System Access API) ----
    var watchHandle = null, watchTimer = null, lastMod = 0;
    if (!global.showOpenFilePicker) watchBtn.style.display = 'none';
    watchBtn.addEventListener('click', function () {
      if (watchHandle) { stopWatch(); return; }
      global.showOpenFilePicker({
        types: [{ description: 'TypeScript', accept: { 'text/plain': ['.ts'] } }]
      }).then(function (handles) {
        watchHandle = handles[0];
        editor.readOnly = true;
        edstack.classList.add('readonly');
        fileLabel.textContent = watchHandle.name + ' (watching — edit in your editor, save to re-check)';
        watchBtn.textContent = '✕ Stop watching';
        poll(); watchTimer = setInterval(poll, 1000);
      }).catch(function () { /* picker dismissed */ });
    });
    function poll() {
      watchHandle.getFile().then(function (f) {
        if (f.lastModified !== lastMod) {
          lastMod = f.lastModified;
          f.text().then(function (t) {
            editor.value = t; updateEditorView();
            watchStatus.textContent = 'synced ' + new Date().toLocaleTimeString();
            runChecks(true);
          });
        }
      }).catch(function () { watchStatus.textContent = '⚠ lost file access'; stopWatch(); });
    }
    function stopWatch() {
      clearInterval(watchTimer); watchHandle = null; lastMod = 0;
      editor.readOnly = false;
      edstack.classList.remove('readonly');
      fileLabel.textContent = 'scratch editor (autosaved)';
      watchBtn.textContent = '👁 Watch a file';
      watchStatus.textContent = '';
    }

    // ---- buttons ----
    document.getElementById('themeBtn').addEventListener('click', function () { toggleTheme(); });
    runBtn.addEventListener('click', function () { runChecks(); });
    resetBtn.addEventListener('click', function () {
      if (!confirm('Reset the editor to the empty scaffold? Your quiz progress is kept.')) return;
      editor.value = def.scaffold || ''; updateEditorView(); saveSoon();
    });

    // ---- init ----
    var saved = null;
    try { saved = localStorage.getItem(K_CODE); } catch (e) {}
    editor.value = (saved === null ? (def.scaffold || '') : saved);
    updateEditorView();
    refreshUI();

    return { def: def, run: runChecks };
  }

  function stepLabel(step, i) { return 'Step ' + (i + 1) + ' · ' + step.title; }

  // ---------- markup ----------
  function renderShell(meta, steps, quiz, rootPath) {
    var stepsHtml = steps.map(function (st, i) {
      return '<div class="step" data-step="' + i + '">' +
        '<div class="head"><span class="status">' + (i === 0 ? '●' : '🔒') + '</span> ' +
        (i + 1) + ' · ' + st.title +
        (st.chip ? '<span class="blogchip">' + st.chip + '</span>' : '') +
        '</div><div class="body">' + st.body + '</div></div>';
    }).join('');

    var quizHtml = '';
    if (quiz.length) {
      var qs = quiz.map(function (q, i) {
        var opts = q.options.map(function (o) { return '<button class="opt">' + o + '</button>'; }).join('');
        return '<div class="quiz-q" data-q="' + i + '" data-answer="' + q.answer + '">' +
          '<div class="qtext">' + (i + 1) + '. ' + q.q + '</div>' + opts +
          '<div class="expl">' + (q.explain || '') + '</div></div>';
      }).join('');
      quizHtml = '<div class="step" data-step="' + steps.length + '">' +
        '<div class="head"><span class="status">🔒</span> ' + (steps.length + 1) +
        ' · Checkpoint quiz<span class="blogchip">retrieval practice</span></div>' +
        '<div class="body"><p class="why">Answer from memory — no scrolling up. ' +
        'Effortful recall is what makes it stick.</p>' + qs + '</div></div>';
    }

    var refs = (meta.references || []).map(function (r) {
      return '<a href="' + r.href + '" target="_blank">' + r.label + '</a>';
    }).join(' · ');

    var sourceBox = '<div class="infobox">' +
      (meta.primarySource ? '<b>Primary source:</b> <a href="' + meta.primarySource.url +
        '" target="_blank">' + meta.primarySource.label + '</a>' +
        (meta.primarySource.note ? ' ' + meta.primarySource.note : '') + '<br><br>' : '') +
      (refs ? '<b>Quick refs:</b> ' + refs + '<br><br>' : '') +
      '💬 <b>Stuck or curious?</b> Ask your teacher — Claude, in the session that made this. ' +
      'Nothing here is too small to ask about.</div>';

    return '' +
      '<header class="dojo">' +
        '<h1>' + (meta.emoji || '🥋') + ' <a class="home" href="' + rootPath + '/index.html">Pattern Dojo</a> / ' +
          '<span>' + (meta.number ? meta.number + ' · ' : '') + meta.title + '</span></h1>' +
        '<span class="pill" id="progressPill">Step 1</span>' +
        '<span id="tsStatus">loading TypeScript compiler…</span>' +
        '<div class="spacer"></div>' +
        '<button id="themeBtn" title="Toggle editor theme">☾ Dark</button>' +
        '<button id="watchBtn" title="Edit the file in your own editor; checks re-run on save">👁 Watch a file</button>' +
        '<button id="resetBtn">Reset code</button>' +
        '<button class="primary" id="runBtn" title="Ctrl+Enter">▶ Run checks</button>' +
      '</header>' +
      '<main class="dojo">' +
        '<aside>' +
          '<h2>' + (meta.heading || meta.title) + '</h2>' +
          (meta.missionNote ? '<div class="missionnote">' + meta.missionNote + '</div>' : '') +
          (meta.howto ? '<p class="howto">' + meta.howto + '</p>' : '') +
          stepsHtml + quizHtml +
          (meta.finale ? '<div class="infobox" id="finale">' + meta.finale + '</div>' : '') +
          sourceBox +
        '</aside>' +
        '<section class="work">' +
          '<div class="toolbar">' +
            '<span class="fname" id="fileLabel">scratch editor (autosaved)</span>' +
            '<span class="watch" id="watchStatus"></span>' +
          '</div>' +
          '<div class="editorwrap">' +
            '<div id="gutter"><div id="gutterInner">1</div></div>' +
            '<div class="edstack" id="edstack">' +
              '<pre id="highlight" aria-hidden="true"><code id="hlContent"></code></pre>' +
              '<textarea id="editor" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>' +
            '</div>' +
          '</div>' +
          '<div class="results">' +
            '<div class="tabs">' +
              '<button id="tabChecks" class="active">Checks</button>' +
              '<button id="tabConsole">Console</button>' +
            '</div>' +
            '<div class="pane active" id="checksPane"><div class="bigmsg">' +
              'Write Step 1, then hit ▶ Run checks (Ctrl+Enter).</div></div>' +
            '<div class="pane" id="consolePane"><pre id="consoleOut">(program output appears here)</pre></div>' +
          '</div>' +
        '</section>' +
      '</main>';
  }

  global.Dojo = Dojo;
})(window);
