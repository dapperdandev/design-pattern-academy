/**
 * Home-page catalog. Loads each registered exercise's definition (they're small)
 * so the cards and progress bars come from one source of truth — the exercise
 * file itself — rather than a hand-maintained copy of its title and blurb.
 */
(function () {
  'use strict';

  var root = document.getElementById('catalog-root');
  var cat = (window.Dojo && Dojo.catalog) || { exercises: [], planned: [] };
  var ids = cat.exercises || [];

  if (!ids.length) { render(); return; }

  // Inject each exercise.js; each one calls Dojo.register(). These load in
  // parallel and finish in arbitrary order, so a card's folder is derived from
  // meta.id by convention (folder name === meta.id) rather than from load order.
  var remaining = ids.length;
  ids.forEach(function (dir) {
    var s = document.createElement('script');
    s.src = 'exercises/' + dir + '/exercise.js';
    s.onload = s.onerror = function () { if (--remaining === 0) render(); };
    document.head.appendChild(s);
  });

  function render() {
    var defs = (window.Dojo && Dojo.registry ? Dojo.registry.slice() : []);
    defs.sort(function (a, b) {
      return String(a.meta.number || '').localeCompare(String(b.meta.number || ''));
    });

    var html = '';
    if (defs.length) {
      html += '<h2>Exercises</h2><div class="cards">' +
        defs.map(function (def) { return card(def); }).join('') +
        '</div>';
    } else {
      html += '<p class="empty">No exercises found — check <code>exercises/manifest.js</code>.</p>';
    }

    var planned = cat.planned || [];
    if (planned.length) {
      html += '<h2>Planned</h2><div class="cards">' + planned.map(plannedCard).join('') + '</div>';
    }

    html += '<footer>' +
      'Local-only workspace. Add an exercise by copying <code>exercises/_template/</code> ' +
      'and listing it in <code>exercises/manifest.js</code> — see ' +
      '<a href="README.md">README.md</a>.<br>' +
      'Reference sheets: <a href="reference/design-patterns-glossary.html">glossary</a> · ' +
      '<a href="reference/builder-pattern.html">builder</a>' +
      '</footer>';

    root.innerHTML = html;
  }

  function card(def) {
    var m = def.meta;
    var dir = m.id; // convention: exercises/<meta.id>/
    var total = (def.steps ? def.steps.length : 0) + (def.quiz && def.quiz.length ? 1 : 0);
    var p = Dojo.readProgress(m.id, total);
    var pct = total ? Math.round((p.done / total) * 100) : 0;
    var label = p.done === 0 ? 'Not started'
      : (p.done >= total ? 'Complete ✓' : p.done + ' of ' + total + ' steps');
    return '<a class="card" href="exercises/' + dir + '/index.html">' +
      '<span class="emoji">' + (m.emoji || '🧩') + '</span>' +
      '<span class="num">' + (m.number || '') + '</span>' +
      '<h3>' + Dojo.escapeHtml(m.title) + '</h3>' +
      '<p>' + Dojo.escapeHtml(m.blurb || '') + '</p>' +
      '<div class="meta">' +
        (m.category ? '<span class="tag">' + Dojo.escapeHtml(m.category) + '</span>' : '') +
        (m.domain ? '<span>' + Dojo.escapeHtml(m.domain) + '</span>' : '') +
        '<span class="spacer"></span><span>' + label + '</span>' +
      '</div>' +
      '<div class="bar' + (pct >= 100 ? ' done' : '') + '"><i style="width:' + pct + '%"></i></div>' +
      '</a>';
  }

  function plannedCard(p) {
    return '<div class="card soon">' +
      '<span class="emoji">' + (p.emoji || '🧩') + '</span>' +
      '<span class="num">' + (p.number || '') + '</span>' +
      '<h3>' + Dojo.escapeHtml(p.title) + '</h3>' +
      '<p>Not written yet.</p>' +
      '<div class="meta">' +
        (p.category ? '<span class="tag">' + Dojo.escapeHtml(p.category) + '</span>' : '') +
      '</div></div>';
  }
})();
