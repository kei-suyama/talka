// vocab.js - SRS engine (window.Vocab) + vocab tab UI (window.VocabUI)
(function () {
  const INTERVALS = [0, 1, 3, 7, 14, 30];
  const KEY = 'vocab';

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function addDays(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + days);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

  // Never trust what is in localStorage: an import or an older build can leave
  // cards without srs/term, and a single bad row used to crash the whole tab.
  function sanitize(c, today) {
    if (!c || typeof c !== 'object') return null;
    const term = String(c.term == null ? '' : c.term).trim();
    if (!term) return null;
    const srs = c.srs && typeof c.srs === 'object' ? c.srs : {};
    let level = Number(srs.level);
    if (!isFinite(level) || level < 0) level = 0;
    level = Math.min(Math.floor(level), INTERVALS.length - 1);
    let used = Number(srs.used);
    if (!isFinite(used) || used < 0) used = 0;
    let reviews = Number(srs.reviews);
    if (!isFinite(reviews) || reviews < 0) reviews = 0;
    const dueStr = typeof srs.due === 'string' && DATE_RE.test(srs.due) ? srs.due : today;
    const examples = Array.isArray(c.examples)
      ? c.examples
          .map((e) => ({ en: String((e && e.en) || ''), ja: String((e && e.ja) || '') }))
          .filter((e) => e.en)
          .slice(0, 12)
      : [];
    return {
      id: typeof c.id === 'string' && c.id ? c.id : uuid(),
      term,
      meaning: String(c.meaning == null ? '' : c.meaning),
      example: String(c.example == null ? '' : c.example),
      examples,
      type: c.type === 'idiom' ? 'idiom' : 'word',
      source: String(c.source || 'user'),
      srs: { level, due: dueStr, used: Math.floor(used), reviews: Math.floor(reviews) },
    };
  }

  const SEED_VERSION = 2;

  function load() {
    const today = todayStr();
    let raw = Store.get(KEY, null);
    if (!Array.isArray(raw)) {
      const seeded = (window.SEED_CARDS || [])
        .map((c) => sanitize({ ...c, source: 'seed', srs: { level: 0, due: today, used: 0 } }, today))
        .filter(Boolean);
      Store.set(KEY, seeded);
      Store.set('seedVersion', SEED_VERSION);
      return seeded;
    }
    const out = [];
    for (const c of raw) {
      const s = sanitize(c, today);
      if (s) out.push(s);
    }
    // one-time merge: newly shipped seed cards join an existing deck
    if (Store.get('seedVersion', 1) < SEED_VERSION && Array.isArray(window.SEED_CARDS)) {
      const have = new Set(out.map((c) => c.term.toLowerCase()));
      let added = false;
      for (const c of window.SEED_CARDS) {
        const s = sanitize({ ...c, source: 'seed', srs: { level: 0, due: today, used: 0 } }, today);
        if (s && !have.has(s.term.toLowerCase())) {
          out.push(s);
          have.add(s.term.toLowerCase());
          added = true;
        }
      }
      Store.set('seedVersion', SEED_VERSION);
      if (added) Store.set(KEY, out);
    }
    return out;
  }

  function save(list) {
    Store.set(KEY, list);
  }

  function all() {
    return load();
  }

  function get(id) {
    return load().find((c) => c.id === id) || null;
  }

  function add(card) {
    card = card || {};
    const term = String(card.term == null ? '' : card.term).trim();
    if (!term) return null;
    const list = load();
    const lower = term.toLowerCase();
    const existing = list.find((c) => c.term.toLowerCase() === lower);
    if (existing) return existing;
    const today = todayStr();
    const item = {
      id: uuid(),
      term,
      meaning: String(card.meaning == null ? '' : card.meaning),
      example: String(card.example == null ? '' : card.example),
      type: card.type === 'idiom' ? 'idiom' : 'word',
      source: String(card.source || 'user'),
      srs: { level: 0, due: today, used: 0 },
    };
    list.push(item);
    save(list);
    return item;
  }

  function remove(id) {
    const list = load().filter((c) => c.id !== id);
    save(list);
  }

  function due() {
    const today = todayStr();
    return load().filter((c) => c.srs.due <= today);
  }

  function review(id, grade) {
    const list = load();
    const card = list.find((c) => c.id === id);
    if (!card) return null;
    const today = todayStr();
    card.srs.reviews = (card.srs.reviews || 0) + 1;
    let level = card.srs.level;
    if (grade === 0) {
      level = Math.max(0, level - 2);
      card.srs.due = today;
    } else if (grade === 1) {
      card.srs.due = addDays(today, 1);
    } else {
      level = Math.min(level + 1, INTERVALS.length - 1);
      card.srs.due = addDays(today, INTERVALS[level]);
    }
    card.srs.level = level;
    save(list);
    return card;
  }

  function pickMission(n) {
    n = Math.max(0, Math.floor(Number(n) || 0));
    const list = load();
    if (!n || !list.length) return [];
    const today = todayStr();
    // Missions must be expressions the learner has actually studied
    // (reviewed in flashcards or already used in a conversation) —
    // an unseen seed card is not something they can be asked to use.
    const studied = list.filter((c) => (c.srs.reviews || 0) > 0 || (c.srs.used || 0) > 0 || c.srs.level > 0);
    const base = studied.length ? studied : list;
    const sorted = base.slice().sort((a, b) => {
      const aDue = a.srs.due <= today ? 0 : 1;
      const bDue = b.srs.due <= today ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      if (a.srs.used !== b.srs.used) return a.srs.used - b.srs.used;
      return a.srs.level - b.srs.level;
    });
    // Sample from the best-ranked pool instead of always returning the same
    // head of the list, otherwise the 引き直す button is a no-op.
    const pool = sorted.slice(0, Math.max(n * 4, Math.min(sorted.length, 12)));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, n);
  }

  function markUsed(id) {
    const list = load();
    const card = list.find((c) => c.id === id);
    if (!card) return;
    card.srs.used = (card.srs.used || 0) + 1;
    const level = Math.min(card.srs.level + 1, INTERVALS.length - 1);
    card.srs.level = level;
    card.srs.due = addDays(todayStr(), INTERVALS[level]);
    save(list);
  }

  function stats() {
    const list = load();
    const today = todayStr();
    return {
      total: list.length,
      due: list.filter((c) => c.srs.due <= today).length,
      learned: list.filter((c) => c.srs.level >= 4).length,
    };
  }

  function addExamples(id, arr) {
    const list = load();
    const card = list.find((c) => c.id === id);
    if (!card) return null;
    const clean = (Array.isArray(arr) ? arr : [])
      .map((e) => ({ en: String((e && e.en) || '').trim(), ja: String((e && e.ja) || '').trim() }))
      .filter((e) => e.en);
    const have = new Set([card.example, ...card.examples.map((e) => e.en)].map((s) => String(s).toLowerCase()));
    for (const e of clean) {
      if (have.has(e.en.toLowerCase())) continue;
      card.examples.push(e);
      have.add(e.en.toLowerCase());
    }
    card.examples = card.examples.slice(0, 12);
    save(list);
    return card;
  }

  window.Vocab = { all, add, get, remove, due, review, pickMission, markUsed, stats, addExamples };

  // ---------------- VocabUI ----------------

  let root = null;
  let sessionQueue = [];
  let sessionIdx = 0;
  let sessionFlipped = false;
  let listFilter = 'all';
  let inSession = false;
  let sessionReviewed = [];

  function el(html) {
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstElementChild;
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  function renderStats(container) {
    const s = stats();
    container.innerHTML = `
      <div class="row">
        <div class="card stat"><div class="stat-num">${s.total}</div><div class="stat-label">総数</div></div>
        <div class="card stat"><div class="stat-num">${s.due}</div><div class="stat-label">今日の復習</div></div>
        <div class="card stat"><div class="stat-num">${s.learned}</div><div class="stat-label">習得済み</div></div>
      </div>`;
  }

  function renderMain() {
    inSession = false;
    root.innerHTML = '';
    const wrap = el('<div class="fade-in"></div>');

    const statsBox = el('<div></div>');
    renderStats(statsBox);
    wrap.appendChild(statsBox);

    const spacer1 = el('<div class="spacer"></div>');
    wrap.appendChild(spacer1);

    const startBtn = el('<button class="btn btn-primary" style="width:100%">復習をはじめる</button>');
    startBtn.addEventListener('click', () => startSession());
    wrap.appendChild(startBtn);

    const spacer2 = el('<div class="spacer"></div>');
    wrap.appendChild(spacer2);

    // add form
    const addCard = el(`
      <div class="card">
        <div class="field">
          <label>新しい単語・フレーズを追加</label>
          <input type="text" id="vocab-add-term" placeholder="例: give it a shot" />
        </div>
        <div class="row">
          <button class="btn btn-primary" id="vocab-add-ai">AIで意味を補完して追加</button>
        </div>
      </div>`);
    wrap.appendChild(addCard);

    const spacer3 = el('<div class="spacer"></div>');
    wrap.appendChild(spacer3);

    // filter row
    const filterRow = el(`
      <div class="row">
        <button class="btn" data-filter="all">すべて</button>
        <button class="btn" data-filter="word">単語</button>
        <button class="btn" data-filter="idiom">熟語</button>
      </div>`);
    wrap.appendChild(filterRow);

    const listBox = el('<div class="fade-in"></div>');
    wrap.appendChild(listBox);

    root.appendChild(wrap);

    const syncFilter = () => {
      filterRow.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('active', b.dataset.filter === listFilter);
      });
    };
    filterRow.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        listFilter = btn.dataset.filter;
        syncFilter();
        renderList(listBox);
      });
    });
    syncFilter();

    renderList(listBox);

    addCard.querySelector('#vocab-add-ai').addEventListener('click', async () => {
      const input = addCard.querySelector('#vocab-add-term');
      const term = input.value.trim();
      if (!term) {
        window.App && window.App.toast && window.App.toast('単語を入力してください');
        return;
      }
      const btn = addCard.querySelector('#vocab-add-ai');
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        const result = await window.LLM.chat(
          [{ role: 'user', content: `Term: "${term}"` }],
          {
            system:
              'You are a JSON API for an English learning app. Given an English word, phrasal verb, or idiom, respond ONLY with JSON: {"meaning_ja": "concise Japanese meaning", "example_en": "one natural example sentence in English", "type": "word or idiom"}',
            json: true,
          }
        );
        const meaning = result && result.meaning_ja ? String(result.meaning_ja) : '';
        if (!meaning) throw new Error('AIの応答を解析できませんでした');
        Vocab.add({
          term,
          meaning,
          example: result.example_en ? String(result.example_en) : '',
          type: result.type === 'idiom' || /\s/.test(term) ? 'idiom' : 'word',
          source: 'ai',
        });
        input.value = '';
        renderStats(statsBox);
        renderList(listBox);
        window.App && window.App.toast && window.App.toast('単語帳に追加しました');
      } catch (e) {
        window.App && window.App.toast && window.App.toast(e.message || 'エラーが発生しました');
      } finally {
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  }

  function renderList(listBox) {
    const items = all()
      .filter((c) => listFilter === 'all' || c.type === listFilter)
      .slice()
      .sort((a, b) => a.term.localeCompare(b.term));
    if (items.length === 0) {
      listBox.innerHTML = '<div class="muted" style="text-align:center;padding:20px 0;">単語がありません</div>';
      return;
    }
    listBox.innerHTML = '';
    items.forEach((c) => {
      const row = el(`
        <div class="card row" style="align-items:center;justify-content:space-between;cursor:pointer;">
          <div style="flex:1;min-width:0;">
            <div style="font-weight:600;">${escapeHtml(c.term)} <span class="badge">${c.type === 'idiom' ? '熟語' : '単語'}</span></div>
            <div class="muted" style="font-size:13px;">${escapeHtml(c.meaning)}</div>
          </div>
          <button class="btn btn-danger" data-id="${c.id}">削除</button>
        </div>`);
      row.querySelector('button').addEventListener('click', (ev) => {
        ev.stopPropagation();
        remove(c.id);
        renderMain();
      });
      row.addEventListener('click', () => openCardModal(c.id));
      listBox.appendChild(row);
    });
  }

  // ---- card detail modal: meaning + growing list of AI examples ----

  function speakSafe(text) {
    try {
      const s = (window.Store && Store.get('settings', {})) || {};
      if (window.Speech && Speech.speak) Speech.speak(text, { rate: s.ttsRate || 0.9 });
    } catch (e) { /* ignore */ }
  }

  function openCardModal(id) {
    const card = get(id);
    if (!card) return;
    const back = el(`
      <div class="modal-backdrop">
        <div class="modal fade-in">
          <div class="row" style="justify-content:space-between;align-items:center;">
            <h3 style="margin:0;">${escapeHtml(card.term)} <span class="badge">${card.type === 'idiom' ? '熟語' : '単語'}</span></h3>
            <button class="btn" data-act="speak" type="button">🔊</button>
          </div>
          <p style="font-size:17px;margin:8px 0;">${escapeHtml(card.meaning) || '<span class="muted">(意味未登録)</span>'}</p>
          <div id="card-examples"></div>
          <div class="row" style="margin-top:12px;">
            <button class="btn btn-primary" data-act="more" type="button">例文を追加(AI)</button>
            <button class="btn" data-act="close" type="button">閉じる</button>
          </div>
        </div>
      </div>`);
    document.body.appendChild(back);
    const close = () => { if (back.parentNode) back.parentNode.removeChild(back); };
    back.addEventListener('click', (e) => { if (e.target === back) close(); });
    back.querySelector('[data-act="close"]').addEventListener('click', close);
    back.querySelector('[data-act="speak"]').addEventListener('click', () => speakSafe(card.term));

    const box = back.querySelector('#card-examples');
    const renderExamples = () => {
      const cur = get(id) || card;
      const list = [];
      if (cur.example) list.push({ en: cur.example, ja: '' });
      list.push(...(cur.examples || []));
      box.innerHTML = list.length
        ? list.map((e, i) => `
            <div style="padding:8px 0;border-top:1px solid rgba(255,255,255,0.08);">
              <div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px;">
                <span style="flex:1;">${escapeHtml(e.en)}</span>
                <button class="btn" data-say="${i}" type="button" style="min-height:34px;padding:5px 10px;">🔊</button>
              </div>
              ${e.ja ? `<div class="muted" style="margin-top:2px;">${escapeHtml(e.ja)}</div>` : ''}
            </div>`).join('')
        : '<p class="muted">例文がまだありません。「例文を追加(AI)」を押してください。</p>';
      box.querySelectorAll('[data-say]').forEach((b) => {
        b.addEventListener('click', () => { const e = list[Number(b.dataset.say)]; if (e) speakSafe(e.en); });
      });
    };
    renderExamples();

    back.querySelector('[data-act="more"]').addEventListener('click', async function () {
      const btn = this;
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        const cur = get(id) || card;
        const known = [cur.example, ...(cur.examples || []).map((e) => e.en)].filter(Boolean);
        const res = await window.LLM.chat(
          [{ role: 'user', content:
            `Expression: "${cur.term}" (Japanese meaning: ${cur.meaning})\n` +
            (known.length ? `Already shown examples (do NOT repeat these):\n${known.join('\n')}\n` : '') +
            'Give 3 new short natural conversational English example sentences using this expression, each with a Japanese translation.' }],
          {
            system: 'You are an example-sentence generator for a Japanese intermediate English learner. Respond ONLY with JSON: {"examples":[{"en":"English sentence","ja":"自然な日本語訳"},...]} (exactly 3 items).',
            json: true,
          }
        );
        const arr = res && Array.isArray(res.examples) ? res.examples : [];
        if (!arr.length) throw new Error('例文を取得できませんでした');
        addExamples(id, arr);
        renderExamples();
      } catch (e) {
        window.App && window.App.toast && window.App.toast(e.message || 'エラーが発生しました');
      } finally {
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  }

  function startSession() {
    sessionQueue = due();
    sessionIdx = 0;
    sessionFlipped = false;
    sessionReviewed = [];
    if (sessionQueue.length === 0) {
      window.App && window.App.toast && window.App.toast('今日復習する単語はありません');
      return;
    }
    inSession = true;
    renderSession();
  }

  function renderSession() {
    root.innerHTML = '';
    if (sessionIdx >= sessionQueue.length) {
      inSession = false;
      renderSessionDone();
      return;
    }
    inSession = true;
    const card = sessionQueue[sessionIdx];
    sessionFlipped = false;
    const wrap = el('<div class="fade-in"></div>');
    const progress = el(`<div class="muted" style="text-align:center;margin-bottom:12px;">${sessionIdx + 1} / ${sessionQueue.length}</div>`);
    wrap.appendChild(progress);

    const flash = el(`
      <div class="flashcard">
        <div class="fc-front">
          <div>${escapeHtml(card.term)}</div>
          <div class="fc-hint">タップして答えを見る</div>
        </div>
        <div class="fc-back" style="display:none;">
          <div>${escapeHtml(card.term)}</div>
          <div class="fc-meaning">${escapeHtml(card.meaning)}</div>
          ${card.example ? `<div class="fc-example">${escapeHtml(card.example)}</div>` : ''}
        </div>
      </div>`);
    wrap.appendChild(flash);

    const spacer = el('<div class="spacer"></div>');
    wrap.appendChild(spacer);

    const btnRow = el(`
      <div class="srs-buttons" style="display:none;">
        <button class="btn btn-danger" data-grade="0">わからない</button>
        <button class="btn" data-grade="1">あいまい</button>
        <button class="btn btn-primary" data-grade="2">覚えた</button>
      </div>`);
    wrap.appendChild(btnRow);

    flash.addEventListener('click', () => {
      if (sessionFlipped) return;
      sessionFlipped = true;
      flash.querySelector('.fc-front').style.display = 'none';
      flash.querySelector('.fc-back').style.display = 'block';
      btnRow.style.display = 'flex';
    });

    btnRow.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const grade = Number(btn.dataset.grade);
        review(card.id, grade);
        if (grade >= 1) sessionReviewed.push(card);
        sessionIdx++;
        renderSession();
      });
    });

    const endBtn = el('<button class="btn" style="width:100%;margin-top:16px;">中断する</button>');
    endBtn.addEventListener('click', () => renderMain());
    wrap.appendChild(endBtn);

    root.appendChild(wrap);
  }

  function renderSessionDone() {
    const wrap = el(`
      <div class="fade-in card" style="text-align:center;padding:32px 16px;">
        <div style="font-size:20px;font-weight:700;margin-bottom:8px;">復習完了！</div>
        <div class="muted">お疲れさまでした。</div>
      </div>`);
    root.appendChild(wrap);
    const spacer = el('<div class="spacer"></div>');
    root.appendChild(spacer);
    // close the study -> speak loop: take what was just reviewed straight
    // into a conversation as the missions
    if (sessionReviewed.length && window.Talk && typeof window.Talk.startWithMissions === 'function') {
      const talkBtn = el('<button class="btn btn-primary" style="width:100%">いま復習した表現で会話する</button>');
      talkBtn.addEventListener('click', () => {
        const pick = sessionReviewed.slice(-3);
        renderMain();
        window.Talk.startWithMissions(pick);
      });
      root.appendChild(talkBtn);
      root.appendChild(el('<div class="spacer"></div>'));
    }
    const backBtn = el('<button class="btn" style="width:100%">戻る</button>');
    backBtn.addEventListener('click', () => renderMain());
    root.appendChild(backBtn);
  }

  function init() {
    root = document.getElementById('view-vocab');
    if (!root) return;
    renderMain();
  }

  // A conversation (markUsed) or a report (add) changes the deck behind this
  // tab's back, so re-read it whenever the tab is shown again.
  function refresh() {
    if (!root || inSession) return;
    renderMain();
  }

  window.VocabUI = { init, refresh };
})();
