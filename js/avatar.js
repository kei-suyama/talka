/* TALKA - Emma avatar v3 (Japanese anime style, inline SVG). Attaches window.Avatar */
(function () {
  'use strict';

  var EMOTIONS = {
    neutral:   { eyes: 'open',   browL: 0,  browY: 0,  mouth: 'M56 77.5 Q60 79.5 64 77.5',                          blush: 0.4,  tilt: 0,  sparkle: 0, heart: 0 },
    happy:     { eyes: 'open',   browL: -3, browY: -1, mouth: 'M55 77 Q60 81.5 65 77',                              blush: 0.65, tilt: 0,  sparkle: 0, heart: 0 },
    laugh:     { eyes: 'closed', browL: -5, browY: -2, mouth: 'M54 76 Q60 84.5 66 76 Q60 79 54 76 Z',               blush: 0.7,  tilt: 0,  sparkle: 0, heart: 0 },
    excited:   { eyes: 'wide',   browL: -5, browY: -3, mouth: 'M54 76 Q60 84.5 66 76 Q60 79 54 76 Z',               blush: 0.75, tilt: 0,  sparkle: 1, heart: 1 },
    surprised: { eyes: 'wide',   browL: 0,  browY: -5, mouth: 'M57.2 77 Q60 75.2 62.8 77 Q62.8 81.5 60 81.5 Q57.2 81.5 57.2 77 Z', blush: 0.45, tilt: 0, sparkle: 0, heart: 0 },
    thinking:  { eyes: 'up',     browL: 4,  browY: -2, mouth: 'M56 78.5 Q60 77.5 64 79',                            blush: 0.35, tilt: -3, sparkle: 0, heart: 0 },
    sad:       { eyes: 'open',   browL: 8,  browY: -1, mouth: 'M55.5 80 Q60 76.5 64.5 80',                          blush: 0.35, tilt: 2,  sparkle: 0, heart: 0 },
    curious:   { eyes: 'wide',   browL: -2, browY: -3, mouth: 'M56 77 Q60 80.5 64 77',                              blush: 0.5,  tilt: 5,  sparkle: 0, heart: 0 }
  };

  var SVG =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="emma-svg" aria-label="Emma">' +
      '<defs>' +
        '<linearGradient id="em-hair" x1="0" y1="0" x2="0.3" y2="1">' +
          '<stop offset="0" stop-color="#a08dff"/><stop offset="0.6" stop-color="#7f8dff"/><stop offset="1" stop-color="#63c8ff"/>' +
        '</linearGradient>' +
        '<linearGradient id="em-hair-dk" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#7f6ee0"/><stop offset="1" stop-color="#4fa8e8"/>' +
        '</linearGradient>' +
        '<linearGradient id="em-iris" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#6a56e8"/><stop offset="0.55" stop-color="#4f8fff"/><stop offset="1" stop-color="#54e8ff"/>' +
        '</linearGradient>' +
        '<radialGradient id="em-bg" cx="0.5" cy="0.3" r="0.85">' +
          '<stop offset="0" stop-color="rgba(160,141,255,0.38)"/><stop offset="1" stop-color="rgba(84,232,255,0.10)"/>' +
        '</radialGradient>' +
        '<filter id="em-blur" x="-60%" y="-60%" width="220%" height="220%">' +
          '<feGaussianBlur stdDeviation="1.8"/>' +
        '</filter>' +
        '<clipPath id="em-clip"><circle cx="60" cy="60" r="57"/></clipPath>' +
      '</defs>' +
      '<g clip-path="url(#em-clip)">' +
        '<circle cx="60" cy="60" r="57" fill="url(#em-bg)"/>' +
        '<g class="emma-tilt">' +

        /* ---- back hair (long, flowing) ---- */
        '<path d="M12 120 Q4 66 20 38 Q32 12 60 9 Q88 12 100 38 Q116 66 108 120 L96 120 Q102 88 96 64 Q95 92 88 120 L80 120 Q84 84 80 62 Q76 94 72 120 L48 120 Q44 94 40 62 Q36 84 40 120 L32 120 Q25 92 24 64 Q18 88 24 120 Z" fill="url(#em-hair)"/>' +
        '<path d="M24 64 Q28 96 32 120 L40 120 Q36 84 40 62 Z" fill="url(#em-hair-dk)" opacity="0.5"/>' +
        '<path d="M80 62 Q84 84 80 120 L88 120 Q92 96 96 64 Z" fill="url(#em-hair-dk)" opacity="0.5"/>' +

        /* ---- body: sailor uniform ---- */
        '<path d="M26 120 Q28 101 43 95 L60 90 L77 95 Q92 101 94 120 Z" fill="#333a63"/>' +
        '<path d="M43 95 L60 106 L77 95 L78 101 L60 115 L42 101 Z" fill="#272d4f"/>' +
        '<path d="M45 97 L60 108 L75 97" stroke="#e8ecf4" stroke-width="1.3" fill="none"/>' +
        '<path d="M47 99.5 L60 111 L73 99.5" stroke="#e8ecf4" stroke-width="1.3" fill="none"/>' +
        /* ribbon */
        '<path d="M60 106 L52 103 L53 111 Z" fill="#ff7d95"/>' +
        '<path d="M60 106 L68 103 L67 111 Z" fill="#ff7d95"/>' +
        '<circle cx="60" cy="106.5" r="2" fill="#ff5d7a"/>' +

        /* ---- neck ---- */
        '<path d="M54 80 L54 94 Q60 99 66 94 L66 80 Z" fill="#ffdcc8"/>' +
        '<path d="M54 82 Q60 88 66 82 L66 80 L54 80 Z" fill="rgba(190,120,95,0.35)"/>' +

        /* ---- face ---- */
        '<path d="M33 54 Q33 30 60 28 Q87 30 87 54 Q87 66 82 73 Q74 83 66 86 Q60 88 54 86 Q46 83 38 73 Q33 66 33 54 Z" fill="#ffe6d5"/>' +
        /* bang shadow on forehead */
        '<path d="M36 50 Q60 58 84 50 L84 42 Q60 50 36 42 Z" fill="rgba(170,120,95,0.14)" filter="url(#em-blur)"/>' +

        /* ---- blush: soft + anime stroke lines ---- */
        '<g class="emma-blush-g">' +
          '<ellipse class="emma-blush" cx="41.5" cy="70" rx="6" ry="3.2" fill="#ff9fb2" opacity="0.4" filter="url(#em-blur)"/>' +
          '<ellipse class="emma-blush" cx="78.5" cy="70" rx="6" ry="3.2" fill="#ff9fb2" opacity="0.4" filter="url(#em-blur)"/>' +
          '<g class="emma-blush" stroke="#f490a5" stroke-width="0.9" opacity="0.4" stroke-linecap="round">' +
            '<path d="M38.5 68.5 L41.5 72.5"/><path d="M41.5 68 L44.5 72"/>' +
            '<path d="M75.5 68 L78.5 72"/><path d="M78.5 68.5 L81.5 72.5"/>' +
          '</g>' +
        '</g>' +

        /* ---- open eyes ---- */
        '<g class="emma-eyes-open">' +
          '<g class="emma-eye-blink">' +
            /* left eye */
            '<g class="emma-eye-g" data-cx="46.5">' +
              '<path d="M40 55 Q40 68 42.5 68.5 Q46.5 70 51 68.5 Q53.5 67.5 53.5 55 Z" fill="#fff"/>' +
              '<ellipse class="emma-iris" cx="46.8" cy="61" rx="5.7" ry="7.8" fill="url(#em-iris)"/>' +
              '<path class="emma-iris" d="M41.3 58.5 Q46.8 52.6 52.3 58.5 Q46.8 60.8 41.3 58.5 Z" fill="#33296b" opacity="0.55"/>' +
              '<ellipse class="emma-pupil" cx="46.8" cy="61.5" rx="2.3" ry="3.6" fill="#181c33"/>' +
              '<ellipse class="emma-iris" cx="46.8" cy="66.6" rx="3.4" ry="1.5" fill="#9ff2ff" opacity="0.65"/>' +
              '<circle class="emma-hl-big" cx="44" cy="56.8" r="2.5" fill="#fff"/>' +
              '<circle class="emma-hl-sm" cx="50" cy="64.5" r="1.15" fill="#fff" opacity="0.9"/>' +
              /* upper lash band */
              '<path d="M38.5 57 Q39.5 50.5 46.5 49.3 Q53 50 54.8 55.5 L53.5 56.5 Q52 52.3 46.6 52 Q41.5 52.3 40.2 57.5 Z" fill="#262a45"/>' +
              '<path d="M39.6 53.8 L36.6 51.6 Q38.6 51.2 40.6 52.4 Z" fill="#262a45"/>' +
              /* lower lid */
              '<path d="M42 69 Q46.5 70.8 51 69" stroke="rgba(80,70,110,0.55)" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
            '</g>' +
            /* right eye */
            '<g class="emma-eye-g" data-cx="73.5">' +
              '<path d="M66.5 55 Q66.5 67.5 69 68.5 Q73.5 70 78 68.5 Q80 68 80 55 Z" fill="#fff"/>' +
              '<ellipse class="emma-iris" cx="73.2" cy="61" rx="5.7" ry="7.8" fill="url(#em-iris)"/>' +
              '<path class="emma-iris" d="M67.7 58.5 Q73.2 52.6 78.7 58.5 Q73.2 60.8 67.7 58.5 Z" fill="#33296b" opacity="0.55"/>' +
              '<ellipse class="emma-pupil" cx="73.2" cy="61.5" rx="2.3" ry="3.6" fill="#181c33"/>' +
              '<ellipse class="emma-iris" cx="73.2" cy="66.6" rx="3.4" ry="1.5" fill="#9ff2ff" opacity="0.65"/>' +
              '<circle class="emma-hl-big" cx="70.4" cy="56.8" r="2.5" fill="#fff"/>' +
              '<circle class="emma-hl-sm" cx="76.4" cy="64.5" r="1.15" fill="#fff" opacity="0.9"/>' +
              '<path d="M81.5 57 Q80.5 50.5 73.5 49.3 Q67 50 65.2 55.5 L66.5 56.5 Q68 52.3 73.4 52 Q78.5 52.3 79.8 57.5 Z" fill="#262a45"/>' +
              '<path d="M80.4 53.8 L83.4 51.6 Q81.4 51.2 79.4 52.4 Z" fill="#262a45"/>' +
              '<path d="M69 69 Q73.5 70.8 78 69" stroke="rgba(80,70,110,0.55)" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
            '</g>' +
          '</g>' +
        '</g>' +

        /* ---- closed happy eyes (^ ^) ---- */
        '<g class="emma-eyes-closed" opacity="0">' +
          '<path d="M39.5 62 Q46.5 54.5 53.5 62" stroke="#262a45" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
          '<path d="M66.5 62 Q73.5 54.5 80.5 62" stroke="#262a45" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
          '<path d="M39 59.5 L36.8 57.8" stroke="#262a45" stroke-width="1.6" stroke-linecap="round"/>' +
          '<path d="M81 59.5 L83.2 57.8" stroke="#262a45" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>' +

        /* ---- nose / mouth ---- */
        '<path d="M59.6 71.5 Q60.6 72.2 60 73" stroke="rgba(190,125,100,0.6)" stroke-width="1.1" fill="none" stroke-linecap="round"/>' +
        '<path class="emma-mouth" d="M56 77.5 Q60 79.5 64 77.5" stroke="#e0697e" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<ellipse class="emma-mouth-talk" cx="60" cy="78.5" rx="4.2" ry="3.4" fill="#b4485c" opacity="0"/>' +

        /* ---- bangs (drawn over forehead, brows drawn over bangs) ---- */
        '<path d="M31 58 Q28 24 60 21 Q92 24 89 58 Q87 44 82 39 Q84 52 77 47 Q79 36 70 34 Q73 46 62 44 Q52 45 54 35 Q45 36 47 47 Q41 51 40 40 Q34 45 31 58 Z" fill="url(#em-hair)"/>' +
        '<path d="M54 35 Q56 42 62 44 Q52 45 54 35 Z" fill="url(#em-hair-dk)" opacity="0.45"/>' +
        '<path d="M70 34 Q68 42 62 44 Q73 46 70 34 Z" fill="url(#em-hair-dk)" opacity="0.35"/>' +
        /* angel-ring highlight */
        '<path d="M38 31 Q48 23 60 23 Q74 23 82 31 Q72 28 60 28 Q48 28 38 31 Z" fill="rgba(255,255,255,0.5)" filter="url(#em-blur)"/>' +

        /* ---- side locks over shoulders ---- */
        '<path d="M31 50 Q25 76 30 100 Q36 92 35 72 Q35 58 31 50 Z" fill="url(#em-hair)"/>' +
        '<path d="M89 50 Q95 76 90 100 Q84 92 85 72 Q85 58 89 50 Z" fill="url(#em-hair)"/>' +
        '<path d="M34 56 Q31 76 33 92 Q36 86 35.5 70 Z" fill="url(#em-hair-dk)" opacity="0.4"/>' +
        '<path d="M86 56 Q89 76 87 92 Q84 86 84.5 70 Z" fill="url(#em-hair-dk)" opacity="0.4"/>' +

        /* ---- ahoge ---- */
        '<path d="M56 22 Q50 10 61 6 Q55 12 60 16 Q64 8 70 12 Q62 12 64 21 Q60 17 56 22 Z" fill="url(#em-hair)"/>' +

        /* ---- brows (over bangs, anime style) ---- */
        '<path class="emma-brow-l" d="M40 47 Q46 44.5 52 46.5" stroke="#8d78d8" stroke-width="1.9" fill="none" stroke-linecap="round" opacity="0.95"/>' +
        '<path class="emma-brow-r" d="M68 46.5 Q74 44.5 80 47" stroke="#8d78d8" stroke-width="1.9" fill="none" stroke-linecap="round" opacity="0.95"/>' +

        /* ---- accents ---- */
        '<g class="emma-sparkle" opacity="0">' +
          '<path d="M98 38 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#ffe066"/>' +
          '<path d="M20 46 l1.4 3.5 3.5 1.4 -3.5 1.4 -1.4 3.5 -1.4 -3.5 -3.5 -1.4 3.5 -1.4 Z" fill="#ffe066"/>' +
        '</g>' +
        '<g class="emma-heart" opacity="0">' +
          '<path d="M99 58 c-2 -2.8 -6.2 -1.3 -6.2 1.7 c0 2.5 3 4.5 6.2 6.7 c3.2 -2.2 6.2 -4.2 6.2 -6.7 c0 -3 -4.2 -4.5 -6.2 -1.7 Z" fill="#ff8fa3"/>' +
        '</g>' +

        '</g>' +
      '</g>' +
    '</svg>';

  var host = null;

  function q(sel) { return host ? host.querySelector(sel) : null; }
  function qa(sel) { return host ? host.querySelectorAll(sel) : []; }

  function mount(container) {
    if (!container) return;
    container.innerHTML = SVG;
    host = container;
    setEmotion('happy');
  }

  function setEmotion(name) {
    if (!host) return;
    var e = EMOTIONS[name] || EMOTIONS.neutral;
    var open = q('.emma-eyes-open');
    var closed = q('.emma-eyes-closed');
    if (open) open.setAttribute('opacity', e.eyes === 'closed' ? '0' : '1');
    if (closed) closed.setAttribute('opacity', e.eyes === 'closed' ? '1' : '0');
    qa('.emma-eye-g').forEach(function (g) {
      var cx = parseFloat(g.getAttribute('data-cx')) || 60;
      var scale = e.eyes === 'wide' ? 1.1 : 1;
      g.setAttribute('transform', 'translate(' + cx + ' 61) scale(' + scale + ') translate(' + -cx + ' -61)');
    });
    qa('.emma-iris, .emma-pupil, .emma-hl-big, .emma-hl-sm').forEach(function (el) {
      var dy = e.eyes === 'up' ? -2 : 0;
      var dx = e.eyes === 'up' ? 1.5 : 0;
      el.setAttribute('transform', 'translate(' + dx + ' ' + dy + ')');
    });
    var bl = q('.emma-brow-l');
    var br = q('.emma-brow-r');
    if (bl) bl.setAttribute('transform', 'translate(0 ' + e.browY + ') rotate(' + e.browL + ' 46 46)');
    if (br) br.setAttribute('transform', 'translate(0 ' + e.browY + ') rotate(' + (-e.browL) + ' 74 46)');
    var m = q('.emma-mouth');
    if (m) {
      m.setAttribute('d', e.mouth);
      m.setAttribute('fill', /Z\s*$/.test(e.mouth) ? 'rgba(180,72,92,0.95)' : 'none');
    }
    qa('.emma-blush').forEach(function (el) { el.setAttribute('opacity', String(e.blush)); });
    var sp = q('.emma-sparkle');
    if (sp) sp.setAttribute('opacity', e.sparkle ? '1' : '0');
    var ht = q('.emma-heart');
    if (ht) ht.setAttribute('opacity', e.heart ? '1' : '0');
    var tilt = q('.emma-tilt');
    if (tilt) tilt.setAttribute('transform', 'rotate(' + e.tilt + ' 60 60)');
  }

  function setTalking(on) {
    if (!host) return;
    var svg = q('.emma-svg');
    if (svg) svg.classList.toggle('talking', !!on);
  }

  window.Avatar = { mount: mount, setEmotion: setEmotion, setTalking: setTalking, EMOTIONS: Object.keys(EMOTIONS) };
})();
