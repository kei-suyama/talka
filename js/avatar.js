/* TALKA - Emma avatar v2 (modern kawaii, inline SVG). Attaches window.Avatar */
(function () {
  'use strict';

  /* per-emotion config:
     eyes: open | closed | wide | up   brow: rotation for L (R mirrored) + lift
     mouth: path (Z-closed paths get filled)   blush 0..1   tilt deg   sparkle/heart 0|1 */
  var EMOTIONS = {
    neutral:   { eyes: 'open',   browL: 0,  browY: 0,  mouth: 'M55 80 Q60 83 65 80',                                blush: 0.35, tilt: 0,  sparkle: 0, heart: 0 },
    happy:     { eyes: 'open',   browL: -3, browY: -1, mouth: 'M53 79 Q60 86 67 79',                                blush: 0.6,  tilt: 0,  sparkle: 0, heart: 0 },
    laugh:     { eyes: 'closed', browL: -5, browY: -2, mouth: 'M52 78 Q60 90 68 78 Q60 82 52 78 Z',                 blush: 0.65, tilt: 0,  sparkle: 0, heart: 0 },
    excited:   { eyes: 'wide',   browL: -5, browY: -3, mouth: 'M52 78 Q60 90 68 78 Q60 82 52 78 Z',                 blush: 0.7,  tilt: 0,  sparkle: 1, heart: 1 },
    surprised: { eyes: 'wide',   browL: 0,  browY: -5, mouth: 'M56.5 79 Q60 76.5 63.5 79 Q63.5 85 60 85 Q56.5 85 56.5 79 Z', blush: 0.4, tilt: 0, sparkle: 0, heart: 0 },
    thinking:  { eyes: 'up',     browL: 4,  browY: -2, mouth: 'M55 81 Q60 80 65 82',                                blush: 0.3,  tilt: -3, sparkle: 0, heart: 0 },
    sad:       { eyes: 'open',   browL: 8,  browY: -1, mouth: 'M54 83 Q60 78 66 83',                                blush: 0.3,  tilt: 2,  sparkle: 0, heart: 0 },
    curious:   { eyes: 'wide',   browL: -2, browY: -3, mouth: 'M55 79 Q60 84 65 79',                                blush: 0.45, tilt: 5,  sparkle: 0, heart: 0 }
  };

  var SVG =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="emma-svg" aria-label="Emma">' +
      '<defs>' +
        '<linearGradient id="em-hair" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#9b8bff"/><stop offset="0.55" stop-color="#7a8cff"/><stop offset="1" stop-color="#5ad0ff"/>' +
        '</linearGradient>' +
        '<linearGradient id="em-hair-in" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#c7bdff"/><stop offset="1" stop-color="#8fe0ff"/>' +
        '</linearGradient>' +
        '<linearGradient id="em-iris" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#8f7bff"/><stop offset="0.6" stop-color="#4f9fff"/><stop offset="1" stop-color="#46e3ff"/>' +
        '</linearGradient>' +
        '<radialGradient id="em-bg" cx="0.5" cy="0.35" r="0.8">' +
          '<stop offset="0" stop-color="rgba(155,139,255,0.35)"/><stop offset="1" stop-color="rgba(70,195,255,0.10)"/>' +
        '</radialGradient>' +
        '<filter id="em-blur" x="-60%" y="-60%" width="220%" height="220%">' +
          '<feGaussianBlur stdDeviation="2.2"/>' +
        '</filter>' +
        '<clipPath id="em-clip"><circle cx="60" cy="60" r="57"/></clipPath>' +
      '</defs>' +
      '<g clip-path="url(#em-clip)">' +
        '<circle cx="60" cy="60" r="57" fill="url(#em-bg)"/>' +
        '<g class="emma-tilt">' +
          /* back hair: big soft silhouette + side tails */
          '<path d="M14 86 Q8 40 34 22 Q47 11 60 11 Q73 11 86 22 Q112 40 106 86 Q104 104 96 118 L84 118 Q90 96 88 78 Q80 92 76 118 L44 118 Q40 92 32 78 Q30 96 36 118 L24 118 Q16 104 14 86 Z" fill="url(#em-hair)"/>' +
          /* face */
          '<path d="M33 62 Q33 38 60 37 Q87 38 87 62 Q87 78 78 86 Q69 93 60 93 Q51 93 42 86 Q33 78 33 62 Z" fill="#ffe3d2"/>' +
          /* soft shadow under bangs */
          '<path d="M36 56 Q60 64 84 56 L84 50 Q60 58 36 50 Z" fill="rgba(150,110,90,0.10)"/>' +
          /* bangs: rounded curtain */
          '<path d="M31 60 Q28 26 60 24 Q92 26 89 60 Q86 48 80 44 Q82 54 74 50 Q76 42 68 40 Q70 50 60 48 Q50 50 52 40 Q44 42 46 50 Q38 54 40 44 Q34 48 31 60 Z" fill="url(#em-hair)"/>' +
          /* inner-color strands in bangs */
          '<path d="M52 40 Q54 46 60 47 Q50 49 52 40 Z" fill="url(#em-hair-in)" opacity="0.7"/>' +
          '<path d="M68 40 Q66 46 60 47 Q70 49 68 40 Z" fill="url(#em-hair-in)" opacity="0.7"/>' +
          /* side locks framing the face */
          '<path d="M31 54 Q26 78 34 96 Q40 88 38 70 Q36 60 31 54 Z" fill="url(#em-hair)"/>' +
          '<path d="M89 54 Q94 78 86 96 Q80 88 82 70 Q84 60 89 54 Z" fill="url(#em-hair)"/>' +
          /* ahoge */
          '<path d="M58 24 Q54 12 63 8 Q58 14 62 18 Q66 12 70 16 Q63 16 64 24 Q61 20 58 24 Z" fill="url(#em-hair)"/>' +
          /* hair gloss */
          '<path d="M40 32 Q50 26 62 27 Q52 30 46 36 Z" fill="rgba(255,255,255,0.35)" filter="url(#em-blur)"/>' +
          /* blush (blurred) */
          '<ellipse class="emma-blush" cx="42" cy="74" rx="6.5" ry="3.6" fill="#ff9fb2" opacity="0.35" filter="url(#em-blur)"/>' +
          '<ellipse class="emma-blush" cx="78" cy="74" rx="6.5" ry="3.6" fill="#ff9fb2" opacity="0.35" filter="url(#em-blur)"/>' +
          /* brows */
          '<path class="emma-brow-l" d="M40 53 Q45 50.5 50 52" stroke="#b78d76" stroke-width="2" fill="none" stroke-linecap="round"/>' +
          '<path class="emma-brow-r" d="M70 52 Q75 50.5 80 53" stroke="#b78d76" stroke-width="2" fill="none" stroke-linecap="round"/>' +
          /* open eyes (big, gradient iris, double highlight) */
          '<g class="emma-eyes-open">' +
            '<g class="emma-eye-blink">' +
              '<g class="emma-eye-g">' +
                '<ellipse cx="45" cy="66" rx="7.2" ry="9" fill="#fff"/>' +
                '<ellipse class="emma-iris" cx="45" cy="66.5" rx="6" ry="8" fill="url(#em-iris)"/>' +
                '<ellipse class="emma-pupil" cx="45" cy="67" rx="2.7" ry="3.8" fill="#232742"/>' +
                '<circle class="emma-hl-big" cx="42.6" cy="62.8" r="2.3" fill="#fff"/>' +
                '<circle class="emma-hl-sm" cx="47.6" cy="70" r="1.1" fill="#fff" opacity="0.85"/>' +
                '<path d="M37.5 61 Q45 55.5 52.5 61" stroke="#4a4160" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
              '</g>' +
              '<g class="emma-eye-g">' +
                '<ellipse cx="75" cy="66" rx="7.2" ry="9" fill="#fff"/>' +
                '<ellipse class="emma-iris" cx="75" cy="66.5" rx="6" ry="8" fill="url(#em-iris)"/>' +
                '<ellipse class="emma-pupil" cx="75" cy="67" rx="2.7" ry="3.8" fill="#232742"/>' +
                '<circle class="emma-hl-big" cx="72.6" cy="62.8" r="2.3" fill="#fff"/>' +
                '<circle class="emma-hl-sm" cx="77.6" cy="70" r="1.1" fill="#fff" opacity="0.85"/>' +
                '<path d="M67.5 61 Q75 55.5 82.5 61" stroke="#4a4160" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
              '</g>' +
            '</g>' +
          '</g>' +
          /* closed happy eyes */
          '<g class="emma-eyes-closed" opacity="0">' +
            '<path d="M38 66 Q45 59 52 66" stroke="#4a4160" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
            '<path d="M68 66 Q75 59 82 66" stroke="#4a4160" stroke-width="2.8" fill="none" stroke-linecap="round"/>' +
            '<path d="M52.5 64 L55 62.5" stroke="#4a4160" stroke-width="1.6" stroke-linecap="round"/>' +
            '<path d="M67.5 64 L65 62.5" stroke="#4a4160" stroke-width="1.6" stroke-linecap="round"/>' +
          '</g>' +
          /* tiny nose */
          '<path d="M59.4 74 Q60.4 74.8 59.8 75.6" stroke="rgba(180,120,95,0.55)" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +
          /* mouth */
          '<path class="emma-mouth" d="M55 80 Q60 83 65 80" stroke="#e37a8a" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<ellipse class="emma-mouth-talk" cx="60" cy="82" rx="5" ry="4" fill="#c25a6b" opacity="0"/>' +
          /* accents */
          '<g class="emma-sparkle" opacity="0">' +
            '<path d="M97 40 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#ffe066"/>' +
            '<path d="M21 48 l1.4 3.5 3.5 1.4 -3.5 1.4 -1.4 3.5 -1.4 -3.5 -3.5 -1.4 3.5 -1.4 Z" fill="#ffe066"/>' +
          '</g>' +
          '<g class="emma-heart" opacity="0">' +
            '<path d="M100 62 c-2.4 -3.4 -7.4 -1.6 -7.4 2 c0 3 3.6 5.4 7.4 8 c3.8 -2.6 7.4 -5 7.4 -8 c0 -3.6 -5 -5.4 -7.4 -2 Z" fill="#ff8fa3" transform="scale(0.8) translate(18 10)"/>' +
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
      var scale = e.eyes === 'wide' ? 1.12 : 1;
      var cx = g === qa('.emma-eye-g')[0] ? 45 : 75;
      g.setAttribute('transform', 'translate(' + cx + ' 66) scale(' + scale + ') translate(' + -cx + ' -66)');
    });
    qa('.emma-iris, .emma-pupil, .emma-hl-big, .emma-hl-sm').forEach(function (el) {
      var dy = e.eyes === 'up' ? -2.2 : 0;
      var dx = e.eyes === 'up' ? 1.6 : 0;
      el.setAttribute('transform', 'translate(' + dx + ' ' + dy + ')');
    });
    var bl = q('.emma-brow-l');
    var br = q('.emma-brow-r');
    if (bl) bl.setAttribute('transform', 'translate(0 ' + e.browY + ') rotate(' + e.browL + ' 45 52)');
    if (br) br.setAttribute('transform', 'translate(0 ' + e.browY + ') rotate(' + (-e.browL) + ' 75 52)');
    var m = q('.emma-mouth');
    if (m) {
      m.setAttribute('d', e.mouth);
      m.setAttribute('fill', /Z\s*$/.test(e.mouth) ? 'rgba(194,90,107,0.95)' : 'none');
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
