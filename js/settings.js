/* TALKA - Settings tab UI. Attaches window.SettingsUI */
(function () {
  'use strict';

  var root = null;

  function toast(msg) {
    if (window.App && typeof window.App.toast === 'function') { window.App.toast(msg); return; }
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      setTimeout(function () { el.remove(); }, 300);
    }, 2600);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function defaultModel(provider) {
    if (window.LLM && typeof window.LLM.defaultModel === 'function') return window.LLM.defaultModel(provider);
    return provider === 'claude' ? 'claude-sonnet-5' : 'gemini-2.5-flash';
  }

  function getSettings() {
    var s = (window.Store && window.Store.get('settings', {})) || {};
    return {
      provider: s.provider === 'claude' ? 'claude' : 'gemini',
      apiKey: s.apiKey || '',
      model: s.model || '',
      ttsRate: typeof s.ttsRate === 'number' ? s.ttsRate : 0.9
    };
  }

  function $(id) { return root ? root.querySelector('#' + id) : null; }

  /* Always resolves: every caller is a click handler, so a rejection here
     would surface as an unhandled promise rejection and no feedback at all. */
  function busy(btn, fn) {
    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    return Promise.resolve()
      .then(fn)
      .catch(function (e) {
        toast(e && e.message ? e.message : 'エラーが発生しました');
      })
      .then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
  }

  function saveSettings(quiet) {
    var stored = (window.Store && window.Store.get('settings', {})) || {};
    var next = Object.assign({}, stored, {
      provider: $('set-provider').value === 'claude' ? 'claude' : 'gemini',
      apiKey: $('set-key').value.trim(),
      model: $('set-model').value.trim(),
      ttsRate: parseFloat($('set-rate').value) || 0.9
    });
    if (window.Store) window.Store.set('settings', next);
    if (!quiet) toast('設定を保存しました');
    return next;
  }

  function syncModelPlaceholder() {
    var p = $('set-provider').value;
    $('set-model').placeholder = defaultModel(p);
  }

  function vocabList() {
    if (window.Vocab && typeof window.Vocab.all === 'function') return window.Vocab.all() || [];
    return (window.Store && window.Store.get('vocab', [])) || [];
  }

  function render() {
    var s = getSettings();
    root.innerHTML =
      '<div class="fade-in">' +
        '<div class="card">' +
          '<div class="field">' +
            '<label for="set-provider">AIプロバイダー</label>' +
            '<select id="set-provider">' +
              '<option value="gemini"' + (s.provider === 'gemini' ? ' selected' : '') + '>Gemini（無料枠あり）</option>' +
              '<option value="claude"' + (s.provider === 'claude' ? ' selected' : '') + '>Claude</option>' +
            '</select>' +
          '</div>' +
          '<div class="field">' +
            '<label for="set-key">APIキー</label>' +
            '<div class="row nowrap">' +
              '<input id="set-key" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="APIキーを貼り付け" value="' + esc(s.apiKey) + '">' +
              '<button class="btn" id="set-key-toggle" type="button">表示</button>' +
            '</div>' +
            '<p class="muted">キーはこの端末のブラウザ内にのみ保存されます。</p>' +
          '</div>' +
          '<div class="field">' +
            '<label for="set-model">モデル名（空欄で既定）</label>' +
            '<input id="set-model" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + esc(defaultModel(s.provider)) + '" value="' + esc(s.model) + '">' +
          '</div>' +
          '<div class="field">' +
            '<label for="set-rate">話す速さ <span class="badge" id="set-rate-val">' + s.ttsRate.toFixed(2) + '</span></label>' +
            '<input id="set-rate" type="range" min="0.5" max="1.2" step="0.05" value="' + s.ttsRate + '">' +
          '</div>' +
          '<div class="row">' +
            '<button class="btn btn-primary" id="set-save" type="button">保存</button>' +
            '<button class="btn" id="set-test" type="button">接続テスト</button>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<h3>Gemini APIキーの取り方（無料）</h3>' +
          '<ol class="muted">' +
            '<li><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">aistudio.google.com/apikey</a> を開き、Googleアカウントでログインします。</li>' +
            '<li>「APIキーを作成」を押して、表示されたキーをコピーします。</li>' +
            '<li>上の「APIキー」欄に貼り付けて「保存」を押せば完了です。</li>' +
          '</ol>' +
        '</div>' +

        '<div class="card">' +
          '<h3>データ</h3>' +
          '<p class="muted">単語帳のバックアップ・復元ができます。インポートは既存の単語帳に追加され、重複はスキップされます。</p>' +
          '<div class="field">' +
            '<textarea id="set-data" rows="6" placeholder="ここにJSONを貼り付けてインポート"></textarea>' +
          '</div>' +
          '<div class="row">' +
            '<button class="btn" id="set-export" type="button">エクスポート</button>' +
            '<button class="btn" id="set-copy" type="button">コピー</button>' +
            '<button class="btn btn-primary" id="set-import" type="button">インポート</button>' +
          '</div>' +
        '</div>' +

        '<div class="spacer"></div>' +
      '</div>';

    bind();
  }

  function bind() {
    $('set-provider').addEventListener('change', syncModelPlaceholder);

    $('set-key-toggle').addEventListener('click', function () {
      var i = $('set-key');
      var show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      this.textContent = show ? '隠す' : '表示';
    });

    $('set-rate').addEventListener('input', function () {
      $('set-rate-val').textContent = parseFloat(this.value).toFixed(2);
    });

    $('set-save').addEventListener('click', function () { saveSettings(false); });

    $('set-test').addEventListener('click', function () {
      var btn = this;
      busy(btn, async function () {
        saveSettings(true);
        try {
          var out = await window.LLM.chat(
            [{ role: 'user', content: 'Say the single word: OK' }],
            { system: 'You are a connection test. Reply with one short word.', maxTokens: 64 }
          );
          toast('接続成功: ' + String(out).trim().slice(0, 30));
        } catch (e) {
          toast(e && e.message ? e.message : '接続に失敗しました');
        }
      });
    });

    $('set-export').addEventListener('click', function () {
      try {
        $('set-data').value = JSON.stringify(vocabList(), null, 2);
        toast('エクスポートしました');
      } catch (e) {
        toast('エクスポートに失敗しました');
      }
    });

    $('set-copy').addEventListener('click', function () {
      var ta = $('set-data');
      try {
        if (!ta.value.trim()) ta.value = JSON.stringify(vocabList(), null, 2);
      } catch (e) {
        toast('エクスポートに失敗しました');
        return;
      }
      var done = function () { toast('コピーしました'); };
      var fallback = function () {
        try { ta.select(); document.execCommand('copy'); done(); }
        catch (e) { try { ta.select(); } catch (e2) { /* ignore */ } toast('選択しました。長押しでコピーしてください'); }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(ta.value).then(done, fallback);
      } else fallback();
    });

    $('set-import').addEventListener('click', function () {
      var btn = this;
      busy(btn, async function () {
        var raw = $('set-data').value.trim();
        if (!raw) { toast('JSONを貼り付けてください'); return; }
        var data;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          data = window.LLM && window.LLM.parseJSON ? window.LLM.parseJSON(raw) : null;
        }
        if (!data) { toast('JSONを読み取れませんでした'); return; }
        if (!Array.isArray(data)) data = data.vocab || data.cards || data.items;
        if (!Array.isArray(data)) { toast('単語帳の形式ではありません'); return; }
        if (!window.Vocab || typeof window.Vocab.add !== 'function') { toast('単語帳を読み込めませんでした'); return; }

        var before = vocabList().length;
        var ok = 0;
        data.forEach(function (c) {
          if (!c || !c.term) return;
          try {
            window.Vocab.add({
              term: String(c.term),
              meaning: String(c.meaning || ''),
              example: String(c.example || ''),
              type: c.type === 'idiom' ? 'idiom' : 'word',
              source: c.source || 'import'
            });
            ok++;
          } catch (e) { /* skip */ }
        });
        var added = Math.max(0, vocabList().length - before);
        toast(added + '件を追加しました（' + (ok - added) + '件は重複）');
        if (window.VocabUI && typeof window.VocabUI.init === 'function') {
          try { window.VocabUI.init(); } catch (e) { /* ignore */ }
        }
      });
    });
  }

  window.SettingsUI = {
    init: function () {
      root = document.getElementById('view-settings');
      if (!root) return;
      render();
    },
    getSettings: getSettings
  };
})();
