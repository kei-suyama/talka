/* TALKA - session report (window.Report) */
(function () {
  'use strict';

  function esc(s) {
    if (window.App && typeof App.escapeHtml === 'function') return App.escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg) {
    if (window.App && typeof App.toast === 'function') { App.toast(msg); return; }
    var t = document.createElement('div');
    t.className = 'toast fade-in';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2200);
  }

  function str(v) { return typeof v === 'string' ? v.trim() : (v == null ? '' : String(v).trim()); }
  function arr(v) { return Array.isArray(v) ? v : []; }

  var SYSTEM =
    'You are Emma, a warm and encouraging English tutor for Japanese learners. ' +
    'You review a short English conversation and produce a compact feedback report. ' +
    'You always answer with a single valid JSON object and nothing else — no markdown, no code fences, no commentary. ' +
    'All Japanese fields must be written in natural, friendly Japanese (です・ます調). ' +
    'All English fields must be natural, everyday English.';

  function buildPrompt(history, missions) {
    var transcript = arr(history).map(function (m) {
      return (m.role === 'user' ? 'Learner: ' : 'Emma: ') + str(m.content);
    }).join('\n');

    var terms = arr(missions).map(function (c) { return str(c && c.term); }).filter(Boolean);

    return 'Here is a conversation between an intermediate Japanese learner of English and Emma (the tutor).\n\n' +
      '--- TRANSCRIPT ---\n' + transcript + '\n--- END TRANSCRIPT ---\n\n' +
      'Target expressions the learner was trying to use: ' + (terms.length ? terms.join(', ') : '(none)') + '\n\n' +
      'Analyse ONLY the learner\'s lines and produce a feedback report.\n' +
      'Rules:\n' +
      '- missions_used: from the target expressions list above, include exactly those the learner actually used (any tense or inflection counts). Copy the term text exactly as given. Empty array if none.\n' +
      '- corrections: at most 5, only real mistakes or clearly unnatural English from the learner. "original" = the learner\'s exact wording, "better" = a natural rewrite, "note_ja" = a short Japanese explanation of why (30-60文字). Ignore speech-recognition typos and punctuation. Empty array if the English was fine.\n' +
      '- new_expressions: at most 4 useful words/idioms/phrasal verbs at intermediate level that would have fit this exact conversation and that the learner did NOT use. "meaning_ja" = short Japanese meaning, "example_en" = one short natural English sentence.\n' +
      '- praise_ja: 2-3 sentences of specific, warm Japanese praise about what the learner did well in this conversation.\n\n' +
      'Return ONLY this JSON object:\n' +
      '{"missions_used":["term"],"corrections":[{"original":"","better":"","note_ja":""}],"new_expressions":[{"term":"","meaning_ja":"","example_en":""}],"praise_ja":""}';
  }

  function normalize(raw) {
    var r = (raw && typeof raw === 'object') ? raw : {};
    return {
      missions_used: arr(r.missions_used).map(str).filter(Boolean),
      corrections: arr(r.corrections).map(function (c) {
        c = c || {};
        return { original: str(c.original), better: str(c.better), note_ja: str(c.note_ja) };
      }).filter(function (c) { return c.original && c.better; }).slice(0, 5),
      new_expressions: arr(r.new_expressions).map(function (n) {
        n = n || {};
        return { term: str(n.term), meaning_ja: str(n.meaning_ja), example_en: str(n.example_en) };
      }).filter(function (n) { return n.term && n.meaning_ja; }).slice(0, 4),
      praise_ja: str(r.praise_ja) || 'よく話しきりました！英語で伝えようとする姿勢がすばらしいです。'
    };
  }

  function generate(history, missions) {
    return Promise.resolve().then(function () {
      return window.LLM.chat(
        [{ role: 'user', content: buildPrompt(history, missions) }],
        { system: SYSTEM, json: true, maxTokens: 1200 }
      );
    }).then(normalize);
  }

  function usedSet(report) {
    var set = {};
    (report.missions_used || []).forEach(function (t) { set[String(t).toLowerCase().trim()] = true; });
    return set;
  }

  function render(container, report, missions) {
    if (!container) return;
    report = normalize(report);
    missions = arr(missions);
    var used = usedSet(report);
    /* a mission counts as done if the AI saw it OR the live matcher already flagged it */
    function isDone(c) {
      return !!(used[String(c && c.term).toLowerCase().trim()] || (c && c.done));
    }
    var doneCount = missions.filter(isDone).length;

    var html = '';

    html +=
      '<div class="report-section card fade-in">' +
        '<h2 style="margin:0 0 8px">セッションレポート</h2>' +
        '<div class="row">' +
          '<div class="stat"><b>' + doneCount + '/' + missions.length + '</b><span>ミッション</span></div>' +
          '<div class="stat"><b>' + report.corrections.length + '</b><span>改善ポイント</span></div>' +
          '<div class="stat"><b>' + report.new_expressions.length + '</b><span>新しい表現</span></div>' +
        '</div>' +
      '</div>';

    html +=
      '<div class="report-section card">' +
        '<h3 style="margin:0 0 8px">よかった点</h3>' +
        '<p>' + esc(report.praise_ja) + '</p>' +
      '</div>';

    html +=
      '<div class="report-section card">' +
        '<h3 style="margin:0 0 8px">ミッション達成</h3>' +
        (missions.length
          ? '<div class="row" style="flex-wrap:wrap">' + missions.map(function (c) {
              var t = String(c && c.term || '');
              return '<span class="chip' + (isDone(c) ? ' done' : '') + '">' + esc(t) + '</span>';
            }).join('') + '</div>'
          : '<p class="muted">ミッションはありませんでした。</p>') +
      '</div>';

    html +=
      '<div class="report-section card">' +
        '<h3 style="margin:0 0 8px">もっと自然に言うなら</h3>' +
        (report.corrections.length
          ? report.corrections.map(function (c) {
              return '<div class="correction" style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08)">' +
                '<p style="margin:0 0 4px;color:#8b93a7;text-decoration:line-through">' + esc(c.original) + '</p>' +
                '<p style="margin:0 0 4px">' + esc(c.better) + '</p>' +
                (c.note_ja ? '<p class="muted" style="margin:0;font-size:13px">' + esc(c.note_ja) + '</p>' : '') +
              '</div>';
            }).join('')
          : '<p class="muted">大きな間違いはありませんでした。すばらしい！</p>') +
      '</div>';

    html +=
      '<div class="report-section card">' +
        '<h3 style="margin:0 0 8px">次に使いたい表現</h3>' +
        (report.new_expressions.length
          ? report.new_expressions.map(function (n, i) {
              return '<div style="padding:10px 0;border-top:1px solid rgba(255,255,255,0.08)">' +
                '<div class="row" style="justify-content:space-between;align-items:center;gap:8px">' +
                  '<strong>' + esc(n.term) + '</strong>' +
                  '<button class="btn btn-primary" data-add="' + i + '" type="button">単語帳に追加</button>' +
                '</div>' +
                '<p style="margin:4px 0 0">' + esc(n.meaning_ja) + '</p>' +
                (n.example_en ? '<p class="muted" style="margin:2px 0 0">' + esc(n.example_en) + '</p>' : '') +
              '</div>';
            }).join('')
          : '<p class="muted">今回の提案はありません。</p>') +
      '</div>';

    html +=
      '<button class="btn btn-primary" id="report-again" type="button">もう一度話す</button>' +
      '<div class="spacer"></div>';

    container.innerHTML = html;

    container.querySelectorAll('[data-add]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n = report.new_expressions[Number(btn.dataset.add)];
        if (!n) return;
        try {
          window.Vocab.add({
            term: n.term,
            meaning: n.meaning_ja,
            example: n.example_en,
            type: /\s/.test(n.term) ? 'idiom' : 'word',
            source: 'report'
          });
          btn.disabled = true;
          btn.textContent = '追加済み';
          toast('単語帳に追加しました');
        } catch (e) {
          toast(e && e.message ? e.message : '追加できませんでした');
        }
      });
    });

    var again = container.querySelector('#report-again');
    if (again) again.addEventListener('click', function () {
      if (window.Talk && window.Talk.reset) window.Talk.reset();
    });
  }

  window.Report = { generate: generate, render: render };
})();
