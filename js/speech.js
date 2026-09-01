/* TALKA - Web Speech (STT + TTS) with iOS/Safari quirks handled. Attaches window.Speech */
(function () {
  'use strict';

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var synth = window.speechSynthesis || null;

  var UA = navigator.userAgent || '';
  var IS_IOS = /iP(hone|ad|od)/.test(UA) ||
    (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);

  var ERR_JA = {
    'not-allowed': 'マイクの使用が許可されていません',
    'service-not-allowed': 'マイクの使用が許可されていません',
    'audio-capture': 'マイクが見つかりません',
    'network': '音声認識サーバーに接続できませんでした',
    'language-not-supported': 'この端末では英語の音声認識が使えません',
    'bad-grammar': '音声認識でエラーが発生しました'
  };
  var SILENT_ERRORS = { 'no-speech': 1, 'aborted': 1 };

  /* ================= TTS ================= */

  var chosenVoice = null;
  var voicesBound = false;
  var warmed = false;
  var keepAlive = null;
  var current = null; // {chunks, idx, done, onEnd, watch}

  function scoreVoice(v) {
    var lang = (v.lang || '').replace('_', '-').toLowerCase();
    if (lang.indexOf('en') !== 0) return -1;
    var name = (v.name || '').toLowerCase();
    var s = 0;
    if (lang === 'en-us') s += 100;
    else if (lang.indexOf('en-') === 0) s += 40;
    else s += 20;
    if (/samantha|google us english|ava|allison|joanna|zira|aria|jenny/.test(name)) s += 25;
    if (/google/.test(name)) s += 10;
    if (v.localService) s += 5;
    if (/compact|eloquence|novelty|whisper|bad news|good news|bells|zarvox|trinoids/.test(name)) s -= 40;
    return s;
  }

  function pickVoice() {
    if (!synth) return null;
    var list = [];
    try { list = synth.getVoices() || []; } catch (e) { list = []; }
    if (!list.length) return chosenVoice;
    var best = null, bestScore = -1;
    for (var i = 0; i < list.length; i++) {
      var s = scoreVoice(list[i]);
      if (s > bestScore) { bestScore = s; best = list[i]; }
    }
    chosenVoice = bestScore >= 0 ? best : null;
    return chosenVoice;
  }

  function bindVoices() {
    if (!synth || voicesBound) return;
    voicesBound = true;
    pickVoice();
    if ('onvoiceschanged' in synth) {
      if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
      else synth.onvoiceschanged = pickVoice;
    }
    // iOS/Safari sometimes populates late and never fires the event
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      pickVoice();
      if (chosenVoice || tries > 12) clearInterval(t);
    }, 250);
  }
  bindVoices();

  function stopKeepAlive() {
    if (keepAlive) { clearInterval(keepAlive); keepAlive = null; }
  }

  /* Split long text into sentence-sized chunks. iOS Safari silently drops
     utterances longer than a few hundred characters, and Chrome cuts them
     off after ~15s, so we always speak in short pieces. */
  var MAX_CHUNK = 170;

  function chunkText(s) {
    var sentences = s.match(/[^.!?…]+[.!?…]+["'’)\]]*\s*|[^.!?…]+$/g) || [s];
    var out = [], buf = '';
    function flush() { if (buf.trim()) out.push(buf.trim()); buf = ''; }
    for (var i = 0; i < sentences.length; i++) {
      var part = String(sentences[i]).trim();
      if (!part) continue;
      /* a single sentence longer than the cap: break it on spaces / commas */
      while (part.length > MAX_CHUNK) {
        var cut = part.lastIndexOf(',', MAX_CHUNK);
        if (cut < 40) cut = part.lastIndexOf(' ', MAX_CHUNK);
        if (cut < 40) cut = MAX_CHUNK;
        else cut = cut + 1;
        flush();
        out.push(part.slice(0, cut).trim());
        part = part.slice(cut).trim();
      }
      if (!buf) buf = part;
      else if (buf.length + 1 + part.length <= MAX_CHUNK) buf += ' ' + part;
      else { flush(); buf = part; }
    }
    flush();
    return out.filter(function (x) { return !!x; });
  }

  function finish(entry) {
    if (!entry || entry.done) return;
    entry.done = true;
    if (entry.watch) { clearTimeout(entry.watch); entry.watch = null; }
    if (current === entry) { current = null; stopKeepAlive(); }
    if (typeof entry.onEnd === 'function') {
      try { entry.onEnd(); } catch (e) { /* ignore */ }
    }
  }

  function cancelSpeak(silent) {
    stopKeepAlive();
    var entry = current;
    current = null;
    if (entry && entry.watch) { clearTimeout(entry.watch); entry.watch = null; }
    if (synth) { try { synth.cancel(); } catch (e) { /* ignore */ } }
    if (entry) {
      if (silent) entry.done = true;
      else setTimeout(function () { finish(entry); }, 0);
    }
  }

  function estimateMs(text, rate) {
    var r = rate > 0 ? rate : 1;
    return Math.max(4000, Math.round((text.length / (12 * r)) * 1000) + 2500);
  }

  function speakChunk(entry) {
    if (!entry || entry.done || current !== entry) return;
    if (entry.idx >= entry.chunks.length) { finish(entry); return; }

    var text = entry.chunks[entry.idx];
    var u;
    try { u = new SpeechSynthesisUtterance(text); }
    catch (e) { finish(entry); return; }

    u.lang = 'en-US';
    var v = chosenVoice || pickVoice();
    if (v) { u.voice = v; if (v.lang) u.lang = String(v.lang).replace('_', '-'); }
    u.rate = entry.rate;
    u.pitch = 1;
    u.volume = 1;

    var advanced = false;
    function advance() {
      if (advanced) return;
      advanced = true;
      if (entry.watch) { clearTimeout(entry.watch); entry.watch = null; }
      if (entry.done || current !== entry) return;
      entry.idx++;
      if (entry.idx >= entry.chunks.length) { finish(entry); return; }
      /* iOS needs a beat between utterances or it drops the next one */
      setTimeout(function () { speakChunk(entry); }, IS_IOS ? 120 : 0);
    }

    u.onend = advance;
    u.onerror = function () {
      if (advanced) return;
      advanced = true;
      if (entry.watch) { clearTimeout(entry.watch); entry.watch = null; }
      finish(entry);
    };

    /* watchdog: iOS occasionally never fires onend */
    entry.watch = setTimeout(advance, estimateMs(text, u.rate));

    try { synth.speak(u); }
    catch (e) { finish(entry); }
  }

  function speak(text, opts) {
    opts = opts || {};
    var onEnd = opts.onEnd;
    var clean = (text == null ? '' : String(text)).replace(/\s+/g, ' ').trim();
    if (!synth || !clean) {
      if (typeof onEnd === 'function') setTimeout(onEnd, 0);
      return;
    }
    cancelSpeak(true);

    var rate = parseFloat(opts.rate);
    if (!isFinite(rate)) rate = 0.9;
    rate = Math.max(0.5, Math.min(1.5, rate));

    var entry = {
      chunks: chunkText(clean),
      idx: 0,
      rate: rate,
      done: false,
      onEnd: onEnd,
      watch: null
    };
    if (!entry.chunks.length) entry.chunks = [clean];
    current = entry;

    stopKeepAlive();
    /* Chrome (desktop) stops long queues unless nudged. The same trick breaks
       playback on iOS Safari, so only do it where it helps. */
    if (!IS_IOS) {
      keepAlive = setInterval(function () {
        if (!synth.speaking) { stopKeepAlive(); return; }
        try { synth.pause(); synth.resume(); } catch (e) { /* ignore */ }
      }, 9000);
    }

    setTimeout(function () {
      if (entry.done || current !== entry) return;
      try { synth.resume(); } catch (e) { /* ignore */ }
      speakChunk(entry);
    }, 60);
  }

  function warmup() {
    bindVoices();
    if (warmed || !synth) { warmed = true; return; }
    warmed = true;
    try {
      /* must run synchronously inside the first user gesture on iOS */
      var u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      u.rate = 1;
      u.lang = 'en-US';
      synth.speak(u);
      synth.resume();
    } catch (e) { /* ignore */ }
    pickVoice();
  }

  /* ================= STT ================= */

  var rec = null;
  var session = null; // {handlers, finalText, delivered, ended, stopTimer, guardTimer}

  function endSession(s) {
    if (!s || s.ended) return;
    s.ended = true;
    if (s.stopTimer) { clearTimeout(s.stopTimer); s.stopTimer = null; }
    if (s.guardTimer) { clearTimeout(s.guardTimer); s.guardTimer = null; }
    if (session === s) { session = null; rec = null; }
    var text = (s.finalText || '').trim();
    if (text && !s.delivered) {
      s.delivered = true;
      try { s.handlers.onResult && s.handlers.onResult(text, true); } catch (e) { /* ignore */ }
    }
    try { s.handlers.onEnd && s.handlers.onEnd(); } catch (e) { /* ignore */ }
  }

  function listen(handlers) {
    handlers = handlers || {};
    var fail = function (msg) {
      try { handlers.onError && handlers.onError(msg); } catch (e) { /* ignore */ }
      try { handlers.onEnd && handlers.onEnd(); } catch (e) { /* ignore */ }
    };
    if (!SR) { setTimeout(function () { fail('このブラウザは音声認識に対応していません'); }, 0); return; }

    // never listen while speaking (prevents the mic hearing the TTS)
    cancelSpeak(true);
    // tear the previous recognizer down hard: iOS allows only one at a time
    stopListening(true);

    var r;
    try { r = new SR(); } catch (e) { setTimeout(function () { fail('音声認識を開始できませんでした'); }, 0); return; }

    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = false; // iOS Safari: single utterance only
    try { r.maxAlternatives = 1; } catch (e) { /* ignore */ }

    var s = { handlers: handlers, finalText: '', delivered: false, ended: false, stopTimer: null, guardTimer: null, rec: r };
    rec = r;
    session = s;

    r.onresult = function (ev) {
      if (s.ended) return;
      var finals = '', interim = '';
      for (var i = 0; i < ev.results.length; i++) {
        var res = ev.results[i];
        var t = (res[0] && res[0].transcript) || '';
        if (res.isFinal) finals += t + ' ';
        else interim += t + ' ';
      }
      finals = finals.replace(/\s+/g, ' ').trim();
      interim = interim.replace(/\s+/g, ' ').trim();
      if (finals) s.finalText = finals;
      var shown = (s.finalText + ' ' + interim).replace(/\s+/g, ' ').trim();
      if (!shown) return;
      if (finals && !interim) {
        s.delivered = true;
        try { handlers.onResult && handlers.onResult(s.finalText, true); } catch (e) { /* ignore */ }
        // some engines keep the session open after a final result
        stopListening();
      } else {
        try { handlers.onResult && handlers.onResult(shown, false); } catch (e) { /* ignore */ }
      }
    };

    r.onerror = function (ev) {
      var code = (ev && ev.error) || '';
      if (!SILENT_ERRORS[code] && !s.ended) {
        var msg = ERR_JA[code] || '音声認識でエラーが発生しました';
        try { handlers.onError && handlers.onError(msg); } catch (e) { /* ignore */ }
      }
      // onend usually follows; guard in case it does not
      setTimeout(function () { endSession(s); }, 250);
    };

    r.onend = function () { endSession(s); };

    try {
      r.start();
    } catch (e) {
      endSession(s);
      fail('音声認識を開始できませんでした');
      return;
    }

    // safety: never leave the mic hanging (iOS sometimes never fires onend)
    s.guardTimer = setTimeout(function () { stopListening(); }, 20000);
  }

  function stopListening(silent) {
    var s = session;
    var r = rec;
    if (!s || !r) return;

    if (silent) {
      /* drop the session immediately so a new recognizer can start now */
      s.handlers = {};
      s.finalText = '';
      s.ended = true;
      if (s.stopTimer) { clearTimeout(s.stopTimer); s.stopTimer = null; }
      if (s.guardTimer) { clearTimeout(s.guardTimer); s.guardTimer = null; }
      session = null;
      rec = null;
      try { r.abort(); }
      catch (e) { try { r.stop(); } catch (e2) { /* ignore */ } }
      return;
    }

    try { r.stop(); } catch (e) { /* ignore */ }
    if (s.stopTimer) clearTimeout(s.stopTimer);
    s.stopTimer = setTimeout(function () {
      if (s.ended) return;
      try { r.abort(); } catch (e) { /* ignore */ }
      setTimeout(function () { endSession(s); }, 200);
    }, 900);
  }

  function available() {
    return { stt: !!SR, tts: !!synth };
  }

  window.Speech = {
    available: available,
    listen: listen,
    stopListening: function () { stopListening(false); },
    abortListening: function () { stopListening(true); },
    speak: speak,
    cancelSpeak: function () { cancelSpeak(false); },
    warmup: warmup,
    voice: function () { return chosenVoice; },
    _chunk: chunkText
  };
})();
