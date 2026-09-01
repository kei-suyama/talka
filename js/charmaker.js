/* TALKA - character maker: generate Emma's portrait + expression set
   with the user's Gemini API key (gemini-2.5-flash-image). Attaches window.CharMaker */
(function () {
  'use strict';

  var IMAGE_MODEL = 'gemini-2.5-flash-image';

  /* neutral comes from the base image; the rest are edits of it */
  var EXPRESSIONS = [
    { key: 'happy',     ja: 'にっこり', desc: 'a gentle warm smile' },
    { key: 'laugh',     ja: '大笑い',   desc: 'laughing joyfully with happily closed anime eyes and an open smiling mouth' },
    { key: 'excited',   ja: 'ワクワク', desc: 'a very excited expression with sparkling wide eyes and a big smile' },
    { key: 'surprised', ja: 'びっくり', desc: 'a surprised expression with wide open eyes and a small open mouth' },
    { key: 'thinking',  ja: '考え中',   desc: 'a thoughtful expression, eyes looking up and to the side, mouth closed' },
    { key: 'sad',       ja: 'しょんぼり', desc: 'a sad expression with downcast, slightly teary eyes' }
  ];

  var DEFAULT_DESC =
    'ツヤのある明るいミルクティーベージュのセミロングヘアで、ゆるふわに巻いた髪。' +
    '大きくてぱっちりした琥珀色がかったブラウンの瞳、長いまつ毛、透明感のある白い肌。' +
    '自然なピンクのチークと血色のいい唇、小さめの鼻。' +
    '清楚で親しみやすい、誰からも好かれる正統派の美少女。白いブラウスに淡いベージュのカーディガン。優しい微笑み。';

  function esc(s) {
    if (window.App && typeof App.escapeHtml === 'function') return App.escapeHtml(s);
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg) {
    if (window.App && typeof App.toast === 'function') App.toast(msg);
  }

  function getSettings() {
    return (window.Store && Store.get('settings', {})) || {};
  }

  async function callImage(parts) {
    var st = getSettings();
    var key = (st.apiKey || '').trim();
    if (!key) throw new Error('APIキーが未設定です。設定タブで登録してください。');
    if (st.provider === 'claude') throw new Error('キャラメイクはGemini APIのみ対応です。設定でGeminiに切り替えてください。');
    var res, text;
    try {
      res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + IMAGE_MODEL + ':generateContent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: parts }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        })
      });
      text = await res.text();
    } catch (e) {
      throw new Error('ネットワークに接続できませんでした。');
    }
    if (!res.ok) {
      var hint = res.status === 429 ? '画像生成の無料枠上限に達しました。しばらく待つか、明日再試行してください。'
        : (res.status === 404 || res.status === 403) ? 'このAPIキーでは画像生成モデル(' + IMAGE_MODEL + ')が使えない可能性があります。'
        : '';
      var detail = '';
      try { var j = JSON.parse(text); if (j.error && j.error.message) detail = ' (' + String(j.error.message).slice(0, 90) + ')'; } catch (e2) {}
      throw new Error('APIエラー ' + res.status + ': ' + hint + detail);
    }
    var data;
    try { data = JSON.parse(text); } catch (e3) { throw new Error('応答を解析できませんでした'); }
    var ps = (((data.candidates || [])[0] || {}).content || {}).parts || [];
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].inlineData && ps[i].inlineData.data) {
        return { mime: ps[i].inlineData.mimeType || 'image/png', b64: ps[i].inlineData.data };
      }
    }
    throw new Error('画像が返されませんでした。もう一度お試しください。');
  }

  function basePrompt(desc) {
    return 'Create a bust-up portrait illustration of one original anime girl character, facing the viewer, centered, ' +
      'head and shoulders visible, looking at the camera with a calm gentle expression (mouth closed). ' +
      'Character appearance: ' + desc + ' ' +
      'She must be exceptionally beautiful and charming — an idol-level pretty face with perfectly balanced, appealing proportions ' +
      'that would be widely loved (大衆ウケする美少女). ' +
      'Top-quality modern Japanese anime illustration: clean lineart, soft luminous cel shading, large sparkling highly detailed eyes, ' +
      'glossy hair with beautiful highlights. ' +
      'Plain solid very dark navy background (hex #131722). Square composition. No text, no watermark, no signature.';
  }

  function editPrompt(desc) {
    return 'Edit this image. Keep the exact same character, art style, colors, composition, framing and background. ' +
      'Change ONLY the facial expression to: ' + desc + '. Return the edited image only.';
  }

  /* downscale to a small square JPEG so the whole set fits in localStorage */
  function shrink(img64) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = 320; c.height = 320;
          var g = c.getContext('2d');
          var s = Math.min(img.width, img.height);
          g.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 320, 320);
          resolve(c.toDataURL('image/jpeg', 0.85));
        } catch (e) { reject(new Error('画像の縮小に失敗しました')); }
      };
      img.onerror = function () { reject(new Error('画像を読み込めませんでした')); };
      img.src = img64;
    });
  }

  function dataUrl(res) { return 'data:' + res.mime + ';base64,' + res.b64; }

  /* ---------------- UI ---------------- */

  var state = { base: null, busy: false };

  function open() {
    var existing = (window.Store && Store.get('charImages', null)) || null;
    var back = document.createElement('div');
    back.className = 'modal-backdrop';
    back.innerHTML =
      '<div class="modal fade-in">' +
        '<h3 style="margin:0 0 6px">キャラメイク</h3>' +
        '<p class="muted" style="margin:0 0 10px">AIでEmmaの見た目を生成します。ベース1枚+表情6種で合計7回、Geminiの画像生成(無料枠)を使います。</p>' +
        '<div class="field">' +
          '<label>キャラの説明(自由に編集できます)</label>' +
          '<textarea id="cm-desc" rows="5">' + esc(DEFAULT_DESC) + '</textarea>' +
        '</div>' +
        '<div id="cm-preview" style="text-align:center"></div>' +
        '<p class="muted" id="cm-progress" style="text-align:center;min-height:18px"></p>' +
        '<div class="row">' +
          '<button class="btn btn-primary" id="cm-gen" type="button">①ベースを生成</button>' +
          '<button class="btn" id="cm-faces" type="button" disabled>②表情を作って保存</button>' +
        '</div>' +
        '<div class="row" style="margin-top:10px">' +
          (existing ? '<button class="btn btn-danger" id="cm-reset" type="button">生成キャラを削除</button>' : '') +
          '<button class="btn" id="cm-close" type="button">閉じる</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(back);

    var $ = function (id) { return back.querySelector('#' + id); };
    var close = function () {
      if (state.busy) { toast('生成中です。完了までお待ちください'); return; }
      if (back.parentNode) back.parentNode.removeChild(back);
    };
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    $('cm-close').addEventListener('click', close);
    if ($('cm-reset')) $('cm-reset').addEventListener('click', function () {
      if (window.Store) Store.del('charImages');
      toast('生成キャラを削除しました。標準のイラストに戻ります');
      if (back.parentNode) back.parentNode.removeChild(back);
      remountAvatar();
    });

    function progress(t) { $('cm-progress').textContent = t || ''; }
    function setBusy(on) {
      state.busy = on;
      $('cm-gen').disabled = on;
      $('cm-faces').disabled = on || !state.base;
    }

    $('cm-gen').addEventListener('click', async function () {
      var desc = $('cm-desc').value.trim() || DEFAULT_DESC;
      setBusy(true);
      progress('ベース画像を生成しています…(10〜30秒)');
      try {
        var res = await callImage([{ text: basePrompt(desc) }]);
        state.base = res;
        $('cm-preview').innerHTML =
          '<img src="' + dataUrl(res) + '" alt="preview" style="width:200px;height:200px;object-fit:cover;border-radius:16px;border:1px solid rgba(255,255,255,0.15)">';
        progress('この見た目でよければ「②表情を作って保存」へ。イメージと違えば説明を変えて①をやり直してください。');
      } catch (e) {
        progress('');
        toast(e.message || '生成に失敗しました');
      }
      setBusy(false);
    });

    $('cm-faces').addEventListener('click', async function () {
      if (!state.base) return;
      setBusy(true);
      var imgs = {};
      var failed = [];
      try {
        progress('ベースを保存中…');
        imgs.neutral = await shrink(dataUrl(state.base));
        for (var i = 0; i < EXPRESSIONS.length; i++) {
          var ex = EXPRESSIONS[i];
          progress('表情を生成中 ' + (i + 1) + '/' + EXPRESSIONS.length + ':' + ex.ja + '…');
          try {
            var res = await callImage([
              { inlineData: { mimeType: state.base.mime, data: state.base.b64 } },
              { text: editPrompt(ex.desc) }
            ]);
            imgs[ex.key] = await shrink(dataUrl(res));
          } catch (e) {
            failed.push(ex.ja);
            if (/429/.test(e.message || '')) { toast(e.message); break; }
          }
        }
        if (window.Store) Store.set('charImages', { v: 1, imgs: imgs });
        var okCount = Object.keys(imgs).length;
        progress('保存しました(' + okCount + '種類)。' + (failed.length ? '未生成: ' + failed.join('、') + '(その表情はベース画像で代用されます)' : ''));
        toast('キャラを保存しました!次の会話から登場します');
        remountAvatar();
      } catch (e) {
        progress('');
        toast(e.message || '生成に失敗しました');
      }
      setBusy(false);
    });
  }

  function remountAvatar() {
    try {
      var box = document.getElementById('emma-box');
      if (box && window.Avatar) Avatar.mount(box);
    } catch (e) {}
  }

  window.CharMaker = { open: open };
})();
