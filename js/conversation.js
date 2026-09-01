/* TALKA - conversation feature (window.Talk) */
(function () {
  'use strict';

  var SCENARIOS = [
    { id: 'free', label: 'フリートーク', en: 'Free talk about anything the learner brings up.' },
    { id: 'weekend', label: '週末の雑談', en: 'Small talk about weekends, hobbies and daily life.' },
    { id: 'restaurant', label: 'レストラン', en: 'At a restaurant: ordering, recommendations, paying.' },
    { id: 'work', label: '仕事の会話', en: 'Workplace small talk and light business conversation.' },
    { id: 'travel', label: '旅行', en: 'Travel talk: trips, airports, hotels, sightseeing.' },
    { id: 'directions', label: '道案内', en: 'Asking for and giving directions in a city.' }
  ];

  /* form -> base for common irregular verbs */
  var IRREGULAR = {
    ran: 'run', run: 'run', went: 'go', gone: 'go', go: 'go', got: 'get', gotten: 'get', get: 'get',
    took: 'take', taken: 'take', take: 'take', came: 'come', come: 'come', had: 'have', has: 'have',
    have: 'have', made: 'make', make: 'make', was: 'be', were: 'be', been: 'be', am: 'be', is: 'be',
    are: 'be', be: 'be', did: 'do', done: 'do', does: 'do', do: 'do', said: 'say', say: 'say',
    saw: 'see', seen: 'see', see: 'see', gave: 'give', given: 'give', give: 'give',
    kept: 'keep', keep: 'keep', held: 'hold', hold: 'hold', brought: 'bring', bring: 'bring',
    thought: 'think', think: 'think', found: 'find', find: 'find', left: 'leave', leave: 'leave',
    felt: 'feel', feel: 'feel', caught: 'catch', catch: 'catch', broke: 'break', broken: 'break',
    break: 'break', spoke: 'speak', spoken: 'speak', speak: 'speak', told: 'tell', tell: 'tell',
    knew: 'know', known: 'know', know: 'know', wrote: 'write', written: 'write', write: 'write',
    met: 'meet', meet: 'meet', paid: 'pay', pay: 'pay', sat: 'sit', sit: 'sit', stood: 'stand',
    stand: 'stand', lost: 'lose', lose: 'lose', bought: 'buy', buy: 'buy', sent: 'send', send: 'send',
    spent: 'spend', spend: 'spend', stuck: 'stick', stick: 'stick', wore: 'wear', wear: 'wear',
    won: 'win', win: 'win', threw: 'throw', thrown: 'throw', throw: 'throw', grew: 'grow', grow: 'grow',
    flew: 'fly', fly: 'fly', forgot: 'forget', forgotten: 'forget', forget: 'forget',
    chose: 'choose', chosen: 'choose', choose: 'choose', became: 'become', become: 'become',
    began: 'begin', begun: 'begin', begin: 'begin', built: 'build', build: 'build',
    taught: 'teach', teach: 'teach', understood: 'understand', understand: 'understand',
    woke: 'wake', wake: 'wake', meant: 'mean', mean: 'mean', heard: 'hear', hear: 'hear',
    led: 'lead', lead: 'lead', rose: 'rise', rise: 'rise', drove: 'drive', driven: 'drive',
    drive: 'drive', ate: 'eat', eaten: 'eat', eat: 'eat', hung: 'hang', hang: 'hang',
    slept: 'sleep', sleep: 'sleep', dealt: 'deal', deal: 'deal', drew: 'draw', drawn: 'draw',
    draw: 'draw', put: 'put', cut: 'cut', let: 'let', set: 'set', hit: 'hit', hurt: 'hurt',
    read: 'read', cost: 'cost', shook: 'shake', shake: 'shake', rode: 'ride', ride: 'ride'
  };

  var MAX_HISTORY = 16;

  var state = {
    missions: [],
    scenario: SCENARIOS[0],
    history: [],
    done: {},
    listening: false,
    interim: false,
    sttValue: null,
    stick: true,
    busy: false,
    started: false
  };

  var el = {};

  /* ---------- small helpers ---------- */

  function view() { return document.getElementById('view-talk'); }

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

  function settings() {
    try { return (window.Store && Store.get('settings', {})) || {}; } catch (e) { return {}; }
  }

  function busyBtn(btn, on, label) {
    if (!btn) return;
    if (on) {
      if (!btn.dataset.label) btn.dataset.label = btn.textContent;
      btn.disabled = true;
      btn.textContent = (label || btn.dataset.label) + '…';
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.textContent = btn.dataset.label;
    }
  }

  function pickMissions(n) {
    try {
      var m = (window.Vocab && Vocab.pickMission) ? Vocab.pickMission(n || 3) : [];
      return Array.isArray(m) ? m : [];
    } catch (e) { return []; }
  }

  /* ---------- mission matching ---------- */

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[^a-z0-9'\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokens(s) {
    var n = normalize(s);
    return n ? n.split(' ') : [];
  }

  function stem(w) {
    if (IRREGULAR[w]) return IRREGULAR[w];
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 4 && /(ing|ied)$/.test(w)) return w.slice(0, -3);
    if (w.length > 3 && /(ed|es)$/.test(w)) return w.slice(0, -2);
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }

  /* Every plausible base form of a word. A single canonical stem is not enough:
     "used" -> "us" but "use" -> "use", and "going"/"getting" never reach the
     irregular table because they are inflections of short verbs. */
  function stemSet(w) {
    var out = {};
    out[w] = 1;
    var len = w.length;
    if (len > 4 && /ies$/.test(w)) { out[w.slice(0, -3) + 'y'] = 1; out[w.slice(0, -2)] = 1; }
    if (len > 4 && /ing$/.test(w)) {
      var b = w.slice(0, -3);
      out[b] = 1; out[b + 'e'] = 1; out[b.replace(/(.)\1$/, '$1')] = 1;
    }
    if (len > 3 && /ed$/.test(w)) {
      var c = w.slice(0, -2);
      out[c] = 1; out[w.slice(0, -1)] = 1; out[c.replace(/(.)\1$/, '$1')] = 1;
    }
    if (len > 3 && /s$/.test(w) && !/ss$/.test(w)) {
      out[w.slice(0, -1)] = 1;
      if (/es$/.test(w)) out[w.slice(0, -2)] = 1;
    }
    Object.keys(out).forEach(function (k) { if (IRREGULAR[k]) out[IRREGULAR[k]] = 1; });
    return out;
  }

  function shareStem(a, b) {
    var sa = stemSet(a), sb = stemSet(b);
    for (var k in sa) {
      if (Object.prototype.hasOwnProperty.call(sa, k) && sb[k]) return true;
    }
    return false;
  }

  /* placeholders inside dictionary entries: "make up one's mind" */
  var ANY_WORD = { "one's": 1, ones: 1, "someone's": 1, "somebody's": 1, "something's": 1, someone: 1, somebody: 1, something: 1, sth: 1, sb: 1, oneself: 1, yourself: 1, themselves: 1 };
  var POSSESSIVE = { my: 1, your: 1, his: 1, her: 1, their: 1, our: 1, its: 1, "one's": 1 };

  function wordMatch(target, said) {
    if (target === said) return true;
    if (ANY_WORD[target]) return true;
    if (POSSESSIVE[target] && POSSESSIVE[said]) return true;
    /* inflections + irregular verbs: run/ran, go/going, get/got, use/used ... */
    if (shareStem(target, said)) return true;
    /* short function words (in, up, to, on) must match exactly */
    if (target.length <= 3) return false;
    var a = stem(target), b = stem(said);
    if (a === b) return true;
    /* doubled consonant forms: run -> running */
    if (a.length > 3 && b.length > 3 && (a.replace(/(.)\1$/, '$1') === b.replace(/(.)\1$/, '$1'))) return true;
    /* shared stem prefix of 3+ chars for reasonably long words */
    var min = Math.min(a.length, b.length);
    if (min >= 4) {
      var i = 0;
      while (i < min && a[i] === b[i]) i++;
      if (i >= 4 || (i >= 3 && min <= 5)) return true;
    }
    return false;
  }

  function matchesTerm(term, utterance) {
    var t = tokens(term);
    var u = tokens(utterance);
    if (!t.length || !u.length) return false;
    /* each content word must appear in order, small gaps allowed */
    for (var s = 0; s < u.length; s++) {
      if (!wordMatch(t[0], u[s])) continue;
      var i = 1, j = s + 1, gaps = 0, ok = true;
      while (i < t.length) {
        if (j >= u.length) { ok = false; break; }
        if (wordMatch(t[i], u[j])) { i++; j++; gaps = 0; }
        else { gaps++; j++; if (gaps > 3) { ok = false; break; } }
      }
      if (ok && i === t.length) return true;
    }
    return false;
  }

  function checkMissions(text) {
    state.missions.forEach(function (card, idx) {
      if (state.done[idx]) return;
      if (!matchesTerm(card.term, text)) return;
      state.done[idx] = true;
      var chip = view().querySelector('.chip[data-idx="' + idx + '"]');
      if (chip) chip.classList.add('done');
      try { if (window.Vocab && Vocab.markUsed && card.id) Vocab.markUsed(card.id); } catch (e) {}
      toast('ミッション達成: ' + card.term);
    });
  }

  /* ---------- start screen ---------- */

  function renderStart() {
    state.started = false;
    state.history = [];
    state.done = {};
    state.listening = false;
    state.interim = false;
    state.sttValue = null;
    state.stick = true;
    state.busy = false;
    el = {};
    try {
      if (window.Speech) {
        if (Speech.cancelSpeak) Speech.cancelSpeak();
        if (Speech.abortListening) Speech.abortListening();
      }
    } catch (e) {}

    var v = view();
    var opts = SCENARIOS.map(function (s) {
      return '<option value="' + s.id + '"' + (s.id === state.scenario.id ? ' selected' : '') + '>' + esc(s.label) + '</option>';
    }).join('');

    v.innerHTML =
      '<div class="talk-start fade-in">' +
        '<div class="card">' +
          '<div class="row" style="justify-content:space-between;align-items:center">' +
            '<strong>今日のミッション</strong>' +
            '<button class="btn" id="talk-reroll" type="button">引き直す</button>' +
          '</div>' +
          '<p class="muted">会話の中でこの表現を使ってみよう</p>' +
          '<div class="row" id="talk-mission-preview" style="flex-wrap:wrap"></div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="field">' +
            '<label for="talk-scenario">シーン</label>' +
            '<select id="talk-scenario">' + opts + '</select>' +
          '</div>' +
          '<p class="muted">Emma（ネイティブのAIパートナー）と英語で話します。マイクを押して話しかけてください。</p>' +
        '</div>' +
        '<button class="btn btn-primary" id="talk-begin" type="button">会話をはじめる</button>' +
        '<div class="spacer"></div>' +
      '</div>';

    if (!state.missions.length) state.missions = pickMissions(3);
    renderMissionPreview();

    v.querySelector('#talk-reroll').addEventListener('click', function () {
      state.missions = pickMissions(3);
      renderMissionPreview();
    });
    v.querySelector('#talk-scenario').addEventListener('change', function (e) {
      var found = SCENARIOS.filter(function (s) { return s.id === e.target.value; })[0];
      if (found) state.scenario = found;
    });
    v.querySelector('#talk-begin').addEventListener('click', function () {
      try { if (window.Speech && Speech.warmup) Speech.warmup(); } catch (e) {}
      start();
    });
  }

  function renderMissionPreview() {
    var box = view().querySelector('#talk-mission-preview');
    if (!box) return;
    if (!state.missions.length) {
      box.innerHTML = '<span class="muted">単語帳が空です。単語帳タブで追加してください。</span>';
      return;
    }
    box.innerHTML = state.missions.map(function (c) {
      return '<span class="chip">' + esc(c.term) + '</span>';
    }).join('');
  }

  /* ---------- chat UI ---------- */

  function renderChat() {
    var v = view();
    var sttOK = false, ttsOK = false;
    try {
      var a = (window.Speech && Speech.available) ? Speech.available() : {};
      sttOK = !!a.stt; ttsOK = !!a.tts;
    } catch (e) {}

    v.innerHTML =
      '<div class="talk-chat fade-in">' +
        '<div class="row" id="talk-chips"></div>' +
        '<div class="msg-list" id="talk-msgs"></div>' +
        '<div class="talk-controls">' +
          '<div class="row talk-mic-row" style="align-items:center;justify-content:center">' +
            '<button class="btn-mic" id="talk-mic" type="button" aria-label="話す">' +
              '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="row" style="align-items:center">' +
            '<input id="talk-input" type="text" placeholder="' + (sttOK ? 'マイクか入力で話す' : '英語で入力…') + '" ' +
              'autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" ' +
              'enterkeyhint="send" lang="en" style="flex:1">' +
            '<button class="btn" id="talk-send" type="button">送信</button>' +
          '</div>' +
          '<div class="row" style="justify-content:center">' +
            '<button class="btn btn-danger" id="talk-end" type="button">終了</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    el.chips = v.querySelector('#talk-chips');
    el.msgs = v.querySelector('#talk-msgs');
    el.mic = v.querySelector('#talk-mic');
    el.input = v.querySelector('#talk-input');
    el.send = v.querySelector('#talk-send');
    el.end = v.querySelector('#talk-end');

    renderChips();

    el.mic.addEventListener('click', function () {
      if (!sttOK) { toast('この端末では音声認識が使えません。テキストで入力してください。'); return; }
      if (state.listening) stopListening(); else startListening();
    });
    el.send.addEventListener('click', function () { submitText(); });
    el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); submitText(); }
    });
    /* typing over an interim transcript makes it the user's own draft */
    el.input.addEventListener('input', function () { if (state.interim) releaseGhost(); });
    el.end.addEventListener('click', endSession);
    state.stick = true;
    el.msgs.addEventListener('scroll', function () { state.stick = atBottom(); });
    el.msgs.addEventListener('click', function (e) {
      var w = e.target.closest ? e.target.closest('.word') : null;
      if (w) openLookup(w.dataset.word || w.textContent, w.closest('.msg') ? w.closest('.msg').dataset.raw || '' : '');
    });

    if (!ttsOK) toast('この端末では音声読み上げが使えません。テキストで表示します。');
  }

  function renderChips() {
    if (!el.chips) return;
    el.chips.innerHTML = state.missions.map(function (c, i) {
      return '<span class="chip' + (state.done[i] ? ' done' : '') + '" data-idx="' + i + '">' + esc(c.term) + '</span>';
    }).join('');
  }

  function wrapWords(text) {
    var parts = String(text || '').split(/([A-Za-z][A-Za-z'’-]*)/);
    var out = '';
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      if (i % 2 === 1) out += '<span class="word" data-word="' + esc(p) + '">' + esc(p) + '</span>';
      else out += esc(p);
    }
    return out;
  }

  function atBottom() {
    var m = el.msgs;
    if (!m) return true;
    return m.scrollHeight - m.scrollTop - m.clientHeight < 80;
  }

  function scrollToBottom() {
    var m = el.msgs;
    if (!m) return;
    m.scrollTop = m.scrollHeight;
    /* the bubble animates in, so settle again on the next frame */
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () { if (el.msgs === m) m.scrollTop = m.scrollHeight; });
    }
  }

  function appendMsg(role, text) {
    if (!el.msgs) return null;
    var stick = role === 'user' || state.stick || atBottom();
    var d = document.createElement('div');
    d.className = 'msg ' + (role === 'user' ? 'user' : 'ai') + ' fade-in';
    d.dataset.raw = text;
    d.innerHTML = role === 'user' ? esc(text) : wrapWords(text);
    el.msgs.appendChild(d);
    if (stick) { state.stick = true; scrollToBottom(); }
    return d;
  }

  function appendTyping() {
    if (!el.msgs) return null;
    var stick = state.stick || atBottom();
    var d = document.createElement('div');
    d.className = 'msg ai fade-in';
    d.textContent = '…';
    el.msgs.appendChild(d);
    if (stick) scrollToBottom();
    return d;
  }

  function setBusy(on) {
    state.busy = on;
    if (el.send) el.send.disabled = on;
    if (el.mic) el.mic.disabled = on;
    if (el.input) el.input.disabled = on;
  }

  /* ---------- speech ---------- */

  function startListening() {
    try { if (window.Speech && Speech.cancelSpeak) Speech.cancelSpeak(); } catch (e) {}
    state.listening = true;
    el.mic.classList.add('listening');
    try {
      Speech.listen({
        onResult: function (text, isFinal) {
          if (isFinal) {
            consumeGhost();
            stopListening(true);
            handleUser(text);
          } else {
            if (!el.input) return;
            state.interim = true;
            state.sttValue = text;
            el.input.value = text;
            el.input.style.opacity = '0.55';
          }
        },
        onError: function (msg) {
          releaseGhost();
          stopListening(true);
          toast(msg || '音声を認識できませんでした');
        },
        onEnd: function () { releaseGhost(); stopListening(true); }
      });
    } catch (e) {
      releaseGhost();
      stopListening(true);
      toast(e && e.message ? e.message : '音声認識を開始できませんでした');
    }
  }

  function stopListening(skipStop) {
    state.listening = false;
    if (el.mic) el.mic.classList.remove('listening');
    if (!skipStop) {
      try { if (window.Speech && Speech.stopListening) Speech.stopListening(); } catch (e) {}
    }
  }

  /* The interim transcript lives in the same input the user can type in.
     Hand it over as a normal editable draft instead of throwing it away. */
  function releaseGhost() {
    if (!el.input) return;
    el.input.style.opacity = '';
    state.interim = false;
  }

  /* Called once the recognised text has been committed as a message. */
  function consumeGhost() {
    if (!el.input) { state.sttValue = null; state.interim = false; return; }
    if (state.sttValue != null && el.input.value === state.sttValue) el.input.value = '';
    state.sttValue = null;
    releaseGhost();
  }

  function speak(text) {
    try {
      var s = settings();
      if (window.Speech && Speech.speak) Speech.speak(text, { rate: s.ttsRate || 0.9 });
    } catch (e) {}
  }

  /* ---------- conversation flow ---------- */

  function systemPrompt() {
    var terms = state.missions.map(function (c) { return c.term; }).join(', ') || '(none)';
    return 'You are Emma, a friendly native English conversation partner and tutor. ' +
      'Speak natural, casual English. Keep every reply to 1-3 short sentences and always end with a question ' +
      'to keep the conversation going. Scenario: ' + state.scenario.label + ' — ' + state.scenario.en + ' ' +
      'Subtly steer the topic so the learner gets natural chances to use these target expressions ' +
      '(never mention that these are targets): ' + terms + '. ' +
      'Match the learner\'s level (intermediate); do not use Japanese. ' +
      'Never use lists, emoji, stage directions or markdown — plain spoken sentences only. ' +
      'React warmly to what the learner says before asking the next question.';
  }

  function chatHistory() {
    return state.history.slice(-MAX_HISTORY).map(function (m) {
      return { role: m.role, content: m.content };
    });
  }

  function start() {
    state.started = true;
    state.done = {};
    state.history = [];
    if (!state.missions.length) state.missions = pickMissions(3);
    renderChat();
    openGreeting();
  }

  function openGreeting() {
    var t = appendTyping();
    setBusy(true);
    window.LLM.chat(
      [{ role: 'user', content: '(The learner just opened the app and is ready to talk. Greet them warmly in one or two sentences and ask an opening question.)' }],
      { system: systemPrompt(), maxTokens: 200 }
    ).then(function (reply) {
      if (t && t.parentNode) t.parentNode.removeChild(t);
      var text = String(reply || '').trim() || 'Hi! I\'m Emma. How has your day been so far?';
      state.history.push({ role: 'assistant', content: text });
      appendMsg('ai', text);
      speak(text);
    }).catch(function (err) {
      if (t && t.parentNode) t.parentNode.removeChild(t);
      toast(err && err.message ? err.message : '接続に失敗しました');
    }).then(function () { setBusy(false); });
  }

  function submitText() {
    if (state.busy || !el.input) return;
    releaseGhost();
    state.sttValue = null;
    var text = (el.input.value || '').trim();
    if (!text) return;
    el.input.value = '';
    handleUser(text);
  }

  function handleUser(text) {
    text = String(text || '').trim();
    if (!text || state.busy) return;
    if (state.listening) stopListening();
    state.history.push({ role: 'user', content: text });
    appendMsg('user', text);
    checkMissions(text);
    replyToUser();
  }

  function replyToUser() {
    var t = appendTyping();
    setBusy(true);
    window.LLM.chat(chatHistory(), { system: systemPrompt(), maxTokens: 200 })
      .then(function (reply) {
        if (t && t.parentNode) t.parentNode.removeChild(t);
        var text = String(reply || '').trim();
        if (!text) throw new Error('返答を取得できませんでした');
        state.history.push({ role: 'assistant', content: text });
        appendMsg('ai', text);
        speak(text);
      })
      .catch(function (err) {
        if (t && t.parentNode) t.parentNode.removeChild(t);
        toast(err && err.message ? err.message : '接続に失敗しました');
      })
      .then(function () { setBusy(false); });
  }

  /* ---------- word lookup bottom sheet ---------- */

  function openLookup(word, context) {
    word = String(word || '').trim();
    if (!word) return;
    var back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML =
      '<div class="modal fade-in">' +
        '<div class="row" style="justify-content:space-between;align-items:center">' +
          '<h3 style="margin:0">' + esc(word) + '</h3>' +
          '<button class="btn" data-act="speak" type="button">🔊</button>' +
        '</div>' +
        '<div id="lookup-body"><p class="muted">調べています…</p></div>' +
        '<div class="row">' +
          '<button class="btn btn-primary" data-act="add" type="button" disabled>単語帳に追加</button>' +
          '<button class="btn" data-act="close" type="button">閉じる</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(back);

    function close() { if (back.parentNode) back.parentNode.removeChild(back); }
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    back.querySelector('[data-act="close"]').addEventListener('click', close);
    back.querySelector('[data-act="speak"]').addEventListener('click', function () { speak(word); });

    var body = back.querySelector('#lookup-body');
    var addBtn = back.querySelector('[data-act="add"]');

    var prompt = 'Word or phrase: "' + word + '"\n' +
      (context ? 'It appeared in this sentence: "' + context + '"\n' : '') +
      'Explain it for a Japanese intermediate English learner.\n' +
      'Return ONLY this JSON object, no other text:\n' +
      '{"meaning_ja": "自然で簡潔な日本語の意味(20文字程度)", "example_en": "a short natural English example sentence using it"}';

    window.LLM.chat([{ role: 'user', content: prompt }], {
      system: 'You are a concise English-Japanese dictionary for Japanese learners. Always answer with a single valid JSON object and nothing else. meaning_ja must be Japanese; example_en must be English.',
      json: true,
      maxTokens: 300
    }).then(function (res) {
      var meaning = (res && res.meaning_ja) ? String(res.meaning_ja) : '';
      var example = (res && res.example_en) ? String(res.example_en) : '';
      if (!meaning) throw new Error('意味を取得できませんでした');
      body.innerHTML =
        '<p style="font-size:17px;margin:6px 0">' + esc(meaning) + '</p>' +
        (example ? '<p class="muted" style="margin:6px 0">' + esc(example) + '</p>' : '');
      addBtn.disabled = false;
      addBtn.addEventListener('click', function () {
        try {
          window.Vocab.add({
            term: word,
            meaning: meaning,
            example: example,
            type: /\s/.test(word) ? 'idiom' : 'word',
            source: 'talk'
          });
          addBtn.disabled = true;
          addBtn.textContent = '追加済み';
          toast('単語帳に追加しました');
        } catch (e) {
          toast(e && e.message ? e.message : '追加できませんでした');
        }
      });
    }).catch(function (err) {
      body.innerHTML = '<p class="muted">' + esc(err && err.message ? err.message : '取得に失敗しました') + '</p>';
    });
  }

  /* ---------- end session -> report ---------- */

  function endSession() {
    if (state.busy) { toast('AIの応答を待っています…'); return; }
    if (state.listening) stopListening();
    consumeGhost();
    try { if (window.Speech && Speech.cancelSpeak) Speech.cancelSpeak(); } catch (e) {}

    var userTurns = state.history.filter(function (m) { return m.role === 'user'; });
    if (!userTurns.length) { renderStart(); return; }

    busyBtn(el.end, true, '作成中');
    setBusy(true);

    var v = view();
    v.innerHTML =
      '<div class="card fade-in" style="text-align:center">' +
        '<p>レポートを作成しています…</p>' +
        '<p class="muted">会話を分析中です</p>' +
      '</div>';

    /* carry the live matcher's result into the report so both agree */
    var missionsForReport = state.missions.map(function (c, i) {
      var copy = {};
      for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) copy[k] = c[k];
      copy.done = !!state.done[i];
      return copy;
    });

    /* keep the analysed transcript bounded so a long chat cannot blow the
       context window (and the free-tier quota) on one report call */
    window.Report.generate(state.history.slice(-40), missionsForReport)
      .then(function (report) {
        v.innerHTML = '';
        var box = document.createElement('div');
        box.className = 'fade-in';
        v.appendChild(box);
        window.Report.render(box, report, missionsForReport);
      })
      .catch(function (err) {
        v.innerHTML =
          '<div class="card fade-in">' +
            '<p>レポートを作成できませんでした</p>' +
            '<p class="muted">' + esc(err && err.message ? err.message : 'エラー') + '</p>' +
            '<button class="btn btn-primary" id="talk-back" type="button">スタートに戻る</button>' +
          '</div>';
        var b = v.querySelector('#talk-back');
        if (b) b.addEventListener('click', reset);
        toast(err && err.message ? err.message : 'レポートの作成に失敗しました');
      })
      .then(function () { state.busy = false; });
  }

  function reset() {
    state.missions = pickMissions(3);
    renderStart();
  }

  /* leaving the tab must not leave Emma talking or the mic hot */
  function suspend() {
    try {
      if (window.Speech) {
        if (Speech.cancelSpeak) Speech.cancelSpeak();
        if (Speech.abortListening) Speech.abortListening();
        else if (Speech.stopListening) Speech.stopListening();
      }
    } catch (e) {}
    if (state.listening) stopListening(true);
    releaseGhost();
  }

  window.Talk = {
    init: function () { state.missions = pickMissions(3); renderStart(); },
    start: start,
    reset: reset,
    suspend: suspend,
    _matchesTerm: matchesTerm
  };
})();
