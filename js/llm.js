/* TALKA - LLM adapters (Gemini / Claude). Attaches window.LLM */
(function () {
  'use strict';

  var DEFAULT_MODELS = { gemini: 'gemini-2.5-flash', claude: 'claude-sonnet-5' };
  var GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
  var CLAUDE_URL = 'https://api.anthropic.com/v1/messages';

  var JSON_RULE =
    'Output ONLY one valid JSON object. No markdown, no code fences, no comments, no text before or after the JSON.';

  function getSettings() {
    var s = (window.Store && window.Store.get('settings', {})) || {};
    return {
      provider: s.provider === 'claude' ? 'claude' : 'gemini',
      apiKey: (s.apiKey || '').trim(),
      model: (s.model || '').trim(),
      ttsRate: s.ttsRate
    };
  }

  function modelFor(st) {
    return st.model || DEFAULT_MODELS[st.provider] || DEFAULT_MODELS.gemini;
  }

  /* ---------- message normalization ---------- */

  function normalize(messages) {
    var list = [];
    (messages || []).forEach(function (m) {
      if (!m) return;
      var text = typeof m.content === 'string' ? m.content : String(m.content == null ? '' : m.content);
      if (!text.trim()) return;
      var role = m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user';
      var last = list[list.length - 1];
      if (last && last.role === role) last.content += '\n' + text;
      else list.push({ role: role, content: text });
    });
    if (!list.length) list.push({ role: 'user', content: 'Hello!' });
    if (list[0].role !== 'user') list.unshift({ role: 'user', content: 'Hi!' });
    return list;
  }

  /* ---------- lenient JSON parsing ---------- */

  function sliceBalanced(s, open, close) {
    var start = s.indexOf(open);
    if (start < 0) return null;
    var depth = 0, inStr = false, esc = false;
    for (var i = start; i < s.length; i++) {
      var c = s[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === open) depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) return s.slice(start, i + 1);
      }
    }
    return s.slice(start); // unterminated
  }

  function repair(s) {
    var out = s
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/,\s*([}\]])/g, '$1');
    // escape raw newlines / tabs inside string literals
    var res = '', inStr = false, esc = false;
    for (var i = 0; i < out.length; i++) {
      var c = out[i];
      if (inStr) {
        if (esc) { res += c; esc = false; continue; }
        if (c === '\\') { res += c; esc = true; continue; }
        if (c === '"') { inStr = false; res += c; continue; }
        if (c === '\n') { res += '\\n'; continue; }
        if (c === '\r') { continue; }
        if (c === '\t') { res += '\\t'; continue; }
        res += c;
        continue;
      }
      if (c === '"') inStr = true;
      res += c;
    }
    if (inStr) res += '"';
    return res;
  }

  function closeOpen(s) {
    // naive completion for truncated JSON
    var stack = [], inStr = false, esc = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === '{' || c === '[') stack.push(c);
      else if (c === '}' || c === ']') stack.pop();
    }
    var out = s;
    if (inStr) out += '"';
    for (var j = stack.length - 1; j >= 0; j--) out += stack[j] === '{' ? '}' : ']';
    return out.replace(/,\s*([}\]])/g, '$1');
  }

  function parseLenient(text) {
    if (text && typeof text === 'object') return text;
    if (typeof text !== 'string') return null;
    var s = text.replace(/^﻿/, '').trim();
    var fence = s.match(/```[a-zA-Z]*\s*([\s\S]*?)```/);
    if (fence && fence[1].trim()) s = fence[1].trim();
    s = s.replace(/```/g, '').trim();

    var candidates = [s];
    var obj = sliceBalanced(s, '{', '}');
    if (obj) candidates.push(obj);
    var arr = sliceBalanced(s, '[', ']');
    if (arr) candidates.push(arr);

    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (!c) continue;
      var variants = [c, repair(c), closeOpen(repair(c))];
      for (var v = 0; v < variants.length; v++) {
        try {
          var parsed = JSON.parse(variants[v]);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) { /* next */ }
      }
    }
    return null;
  }

  /* ---------- errors ---------- */

  function httpError(status, bodyText) {
    var hint = '';
    var body = String(bodyText || '');
    if (status === 400) {
      hint = /api[\s_-]?key|API_KEY_INVALID|credential/i.test(body)
        ? 'APIキーを確認してください。'
        : 'リクエストが不正です。モデル名を確認してください。';
    }
    else if (status === 401 || status === 403) hint = 'APIキーを確認してください。';
    else if (status === 404) hint = 'モデルが見つかりません。設定のモデル名を空欄にすると自動選択されます。';
    else if (status === 429) hint = '無料枠の上限に達した可能性があります。少し待って再試行してください。';
    else if (status === 500 || status === 502 || status === 503 || status === 529)
      hint = 'AIサーバーが混雑しています。少し待って再試行してください。';
    else hint = '通信に失敗しました。';
    var detail = '';
    try {
      var j = JSON.parse(bodyText);
      var m = (j.error && (j.error.message || j.error.status)) || j.message || '';
      if (m) detail = ' (' + String(m).slice(0, 90) + ')';
    } catch (e) {
      if (bodyText) detail = ' (' + String(bodyText).slice(0, 90) + ')';
    }
    return new Error('APIエラー ' + status + ': ' + hint + detail);
  }

  async function readBody(res) {
    try { return await res.text(); } catch (e) { return ''; }
  }

  var TIMEOUT_MS = 45000;

  async function request(url, options) {
    var ctrl = null, timer = null;
    try { ctrl = typeof AbortController === 'function' ? new AbortController() : null; }
    catch (e) { ctrl = null; }
    if (ctrl) {
      options = Object.assign({}, options, { signal: ctrl.signal });
      timer = setTimeout(function () { try { ctrl.abort(); } catch (e) { /* ignore */ } }, TIMEOUT_MS);
    }

    var res;
    try {
      res = await fetch(url, options);
    } catch (e) {
      if (timer) clearTimeout(timer);
      if (e && (e.name === 'AbortError' || e.code === 20)) {
        throw new Error('AIの応答がタイムアウトしました。もう一度お試しください。');
      }
      throw new Error('ネットワークに接続できませんでした。通信環境を確認してください。');
    }
    var text = await readBody(res);
    if (timer) clearTimeout(timer);
    if (!res.ok) throw httpError(res.status, text);
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('AIの応答を解析できませんでした');
    }
  }

  /* ---------- providers ---------- */

  /* Google retires Gemini model names often (all 1.x and 2.0 already return
     404), so a hard-coded default eventually breaks. When no model is set,
     discover what this API key can actually use and cache the best pick. */
  var AUTO_MODEL_KEY = 'geminiAutoModel';

  function scoreGeminiModel(n) {
    var s = 0;
    var v = n.match(/gemini-(\d+(?:\.\d+)?)/);
    if (v) s += parseFloat(v[1]) * 100;
    if (/flash/.test(n)) s += 50;
    if (/pro/.test(n)) s += 20;
    if (/lite/.test(n)) s -= 30;
    if (/preview|exp/.test(n)) s -= 15;
    if (/latest/.test(n)) s += 5;
    return s;
  }

  async function discoverGeminiModel(st) {
    var data = await request(GEMINI_URL + '?pageSize=1000', {
      method: 'GET',
      headers: { 'x-goog-api-key': st.apiKey }
    });
    var names = (data.models || []).filter(function (m) {
      var methods = m.supportedGenerationMethods || m.supportedActions || [];
      return !methods.length || methods.indexOf('generateContent') >= 0;
    }).map(function (m) {
      return String(m.name || '').replace(/^models\//, '');
    }).filter(function (n) {
      return /^gemini-/.test(n) &&
        !/tts|embed|image|imagen|audio|live|native|veo|thinking|robotics|computer/i.test(n);
    });
    if (!names.length) return null;
    names.sort(function (a, b) { return scoreGeminiModel(b) - scoreGeminiModel(a); });
    return names[0];
  }

  async function geminiChat(st, msgs, system, json, maxTokens) {
    var userPinned = !!st.model;
    if (!userPinned) {
      var auto = (window.Store && Store.get(AUTO_MODEL_KEY, '')) || '';
      if (auto) st = Object.assign({}, st, { model: auto });
    }
    try {
      return await callGemini(st, msgs, system, json, maxTokens);
    } catch (e) {
      /* stale/unavailable model -> ask the API what exists and retry once */
      if (!userPinned && /APIエラー 404/.test(e.message || '')) {
        var found = null;
        try { found = await discoverGeminiModel(st); } catch (e2) { /* keep original error */ }
        if (found && found !== modelFor(st)) {
          if (window.Store) Store.set(AUTO_MODEL_KEY, found);
          return await callGemini(Object.assign({}, st, { model: found }), msgs, system, json, maxTokens);
        }
      }
      throw e;
    }
  }

  async function callGemini(st, msgs, system, json, maxTokens) {
    var model = modelFor(st);
    var url = GEMINI_URL + encodeURIComponent(model) + ':generateContent';
    var gen = { maxOutputTokens: maxTokens, temperature: json ? 0.4 : 0.9 };
    if (json) gen.responseMimeType = 'application/json';
    /* 2.x Flash models think by default and can burn the whole output budget
       before emitting a single character (empty parts + finishReason MAX_TOKENS). */
    if (/flash/i.test(model) && !/1\.5/.test(model)) gen.thinkingConfig = { thinkingBudget: 0 };
    var body = {
      contents: msgs.map(function (m) {
        return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] };
      }),
      generationConfig: gen
    };
    if (system) body.systemInstruction = { parts: [{ text: system }] };

    var headers = { 'Content-Type': 'application/json', 'x-goog-api-key': st.apiKey };
    var data;
    try {
      data = await request(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
    } catch (e) {
      // some models reject responseMimeType / thinkingConfig -> retry once plainly
      var hadExtras = !!(gen.responseMimeType || gen.thinkingConfig);
      if (hadExtras && /APIエラー 400/.test(e.message)) {
        delete gen.responseMimeType;
        delete gen.thinkingConfig;
        data = await request(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
      } else throw e;
    }

    var cand = (data.candidates && data.candidates[0]) || null;
    if (!cand) {
      var blocked = data.promptFeedback && data.promptFeedback.blockReason;
      throw new Error(blocked ? 'AIが応答を拒否しました（' + blocked + '）' : 'AIから応答がありませんでした');
    }
    var parts = (cand.content && cand.content.parts) || [];
    var out = parts.map(function (p) { return p.text || ''; }).join('').trim();
    if (!out) {
      if (cand.finishReason === 'MAX_TOKENS') throw new Error('AIの応答が長すぎて途中で切れました。もう一度お試しください。');
      if (cand.finishReason === 'SAFETY' || cand.finishReason === 'RECITATION') {
        throw new Error('AIが応答を拒否しました（' + cand.finishReason + '）');
      }
      throw new Error('AIから応答がありませんでした');
    }
    return out;
  }

  async function callClaude(st, msgs, system, json, maxTokens) {
    var body = {
      model: modelFor(st),
      max_tokens: maxTokens,
      messages: msgs.map(function (m) { return { role: m.role, content: m.content }; })
    };
    if (system) body.system = system;
    var data = await request(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': st.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(body)
    });
    var blocks = data.content || [];
    var out = blocks
      .filter(function (b) { return b && b.type === 'text'; })
      .map(function (b) { return b.text || ''; })
      .join('')
      .trim();
    if (!out) {
      if (data.stop_reason === 'max_tokens') throw new Error('AIの応答が長すぎて途中で切れました。もう一度お試しください。');
      throw new Error('AIから応答がありませんでした');
    }
    return out;
  }

  /* ---------- public ---------- */

  async function chat(messages, opts) {
    opts = opts || {};
    var st = getSettings();
    if (!st.apiKey) throw new Error('APIキーが未設定です。設定タブで登録してください。');

    var msgs = normalize(messages);
    var system = (opts.system || '').trim();
    var json = !!opts.json;
    var maxTokens = Math.max(64, Math.min(4096, opts.maxTokens || (json ? 1024 : 512)));
    if (json) system = system ? system + '\n\n' + JSON_RULE : JSON_RULE;

    var raw = st.provider === 'claude'
      ? await callClaude(st, msgs, system, json, maxTokens)
      : await geminiChat(st, msgs, system, json, maxTokens);

    if (!json) return raw;

    var parsed = parseLenient(raw);
    if (parsed) return parsed;

    // one lenient retry: ask the model to re-emit strict JSON
    try {
      var retryMsgs = msgs.concat([
        { role: 'assistant', content: raw.slice(0, 1500) },
        { role: 'user', content: 'Reformat your previous answer as strict JSON only. ' + JSON_RULE }
      ]);
      var raw2 = st.provider === 'claude'
        ? await callClaude(st, normalize(retryMsgs), system, true, maxTokens)
        : await geminiChat(st, normalize(retryMsgs), system, true, maxTokens);
      var parsed2 = parseLenient(raw2);
      if (parsed2) return parsed2;
    } catch (e) { /* fall through */ }

    throw new Error('AIの応答を解析できませんでした');
  }

  window.LLM = {
    DEFAULT_MODELS: DEFAULT_MODELS,
    defaultModel: function (provider) { return DEFAULT_MODELS[provider] || DEFAULT_MODELS.gemini; },
    parseJSON: parseLenient,
    chat: chat
  };
})();
