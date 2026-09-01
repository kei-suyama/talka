/* TALKA - Emma avatar (inline SVG, emotion-driven). Attaches window.Avatar */
(function () {
  'use strict';

  /* per-emotion: eye style (open/closed/wide), brow offsets, mouth path, blush, tilt */
  var EMOTIONS = {
    neutral:   { eyes: 'open',   browL: 0,  browR: 0,  browY: 0,  mouth: 'M52 78 Q60 82 68 78',                 blush: 0.25, tilt: 0,  sparkle: 0 },
    happy:     { eyes: 'open',   browL: -4, browR: 4,  browY: -1, mouth: 'M50 76 Q60 86 70 76',                 blush: 0.5,  tilt: 0,  sparkle: 0 },
    laugh:     { eyes: 'closed', browL: -6, browR: 6,  browY: -2, mouth: 'M50 75 Q60 90 70 75 Q60 80 50 75 Z',  blush: 0.55, tilt: 0,  sparkle: 0 },
    excited:   { eyes: 'wide',   browL: -6, browR: 6,  browY: -4, mouth: 'M50 75 Q60 90 70 75 Q60 80 50 75 Z',  blush: 0.6,  tilt: 0,  sparkle: 1 },
    surprised: { eyes: 'wide',   browL: 0,  browR: 0,  browY: -6, mouth: 'M56 77 Q60 74 64 77 Q64 84 60 84 Q56 84 56 77 Z', blush: 0.3, tilt: 0, sparkle: 0 },
    thinking:  { eyes: 'up',     browL: 3,  browR: -5, browY: -2, mouth: 'M54 79 Q60 78 66 80',                 blush: 0.2,  tilt: -3, sparkle: 0 },
    sad:       { eyes: 'open',   browL: 7,  browR: -7, browY: -2, mouth: 'M52 82 Q60 76 68 82',                 blush: 0.2,  tilt: 2,  sparkle: 0 },
    curious:   { eyes: 'wide',   browL: 0,  browR: -5, browY: -3, mouth: 'M53 78 Q60 83 67 78',                 blush: 0.35, tilt: 5,  sparkle: 0 }
  };

  var SVG =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="emma-svg" aria-label="Emma">' +
      '<defs>' +
        '<linearGradient id="emma-hair" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#6d5dfc"/><stop offset="1" stop-color="#46c3ff"/>' +
        '</linearGradient>' +
        '<clipPath id="emma-clip"><circle cx="60" cy="60" r="56"/></clipPath>' +
      '</defs>' +
      '<g clip-path="url(#emma-clip)" class="emma-tilt">' +
        '<circle cx="60" cy="60" r="56" fill="rgba(255,255,255,0.06)"/>' +
        /* back hair */
        '<path d="M18 78 Q14 34 42 20 Q60 10 78 20 Q106 34 102 78 Q102 106 90 112 L30 112 Q18 106 18 78 Z" fill="url(#emma-hair)"/>' +
        /* face */
        '<ellipse cx="60" cy="64" rx="30" ry="29" fill="#f6cdb4"/>' +
        /* bangs */
        '<path d="M28 58 Q26 26 60 24 Q94 26 92 58 Q84 44 74 42 Q78 50 72 48 Q60 44 50 46 Q40 48 36 58 Q32 50 28 58 Z" fill="url(#emma-hair)"/>' +
        /* blush */
        '<ellipse class="emma-blush" cx="41" cy="72" rx="6" ry="3.4" fill="#ff8fa3" opacity="0.25"/>' +
        '<ellipse class="emma-blush" cx="79" cy="72" rx="6" ry="3.4" fill="#ff8fa3" opacity="0.25"/>' +
        /* brows */
        '<path class="emma-brow-l" d="M40 52 Q46 49 52 51" stroke="#8a6a58" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path class="emma-brow-r" d="M68 51 Q74 49 80 52" stroke="#8a6a58" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        /* open eyes */
        '<g class="emma-eyes-open">' +
          '<g class="emma-eye-blink">' +
            '<ellipse class="emma-eye" cx="46" cy="62" rx="5" ry="6" fill="#2b2f3f"/>' +
            '<ellipse class="emma-eye" cx="74" cy="62" rx="5" ry="6" fill="#2b2f3f"/>' +
            '<circle class="emma-pupil" cx="47.6" cy="60" r="1.7" fill="#9fe1ff"/>' +
            '<circle class="emma-pupil" cx="75.6" cy="60" r="1.7" fill="#9fe1ff"/>' +
          '</g>' +
        '</g>' +
        /* closed (smiling) eyes */
        '<g class="emma-eyes-closed" opacity="0">' +
          '<path d="M40 62 Q46 56 52 62" stroke="#2b2f3f" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
          '<path d="M68 62 Q74 56 80 62" stroke="#2b2f3f" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '</g>' +
        /* mouth (static) + talking mouth */
        '<path class="emma-mouth" d="M52 78 Q60 82 68 78" stroke="#c96f6f" stroke-width="2.6" fill="rgba(201,80,80,0.85)" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<ellipse class="emma-mouth-talk" cx="60" cy="80" rx="6" ry="4.5" fill="#a84a4a" opacity="0"/>' +
        /* sparkles */
        '<g class="emma-sparkle" opacity="0">' +
          '<path d="M96 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#ffe066"/>' +
          '<path d="M22 42 l1.4 3.5 3.5 1.4 -3.5 1.4 -1.4 3.5 -1.4 -3.5 -3.5 -1.4 3.5 -1.4 Z" fill="#ffe066"/>' +
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
    qa('.emma-eye').forEach(function (el) {
      el.setAttribute('ry', e.eyes === 'wide' ? '7' : '6');
      el.setAttribute('cy', e.eyes === 'up' ? '60.5' : '62');
    });
    qa('.emma-pupil').forEach(function (el) {
      el.setAttribute('cy', e.eyes === 'up' ? '57.5' : '60');
    });
    var bl = q('.emma-brow-l');
    var br = q('.emma-brow-r');
    if (bl) bl.setAttribute('transform', 'translate(0 ' + (e.browY + (e.browL > 0 ? 1 : 0)) + ') rotate(' + e.browL + ' 46 51)');
    if (br) br.setAttribute('transform', 'translate(0 ' + (e.browY + (e.browR < 0 ? 1 : 0)) + ') rotate(' + e.browR + ' 74 51)');
    var m = q('.emma-mouth');
    if (m) {
      m.setAttribute('d', e.mouth);
      m.setAttribute('fill', /Z\s*$/.test(e.mouth) ? 'rgba(168,74,74,0.9)' : 'none');
    }
    qa('.emma-blush').forEach(function (el) { el.setAttribute('opacity', String(e.blush)); });
    var sp = q('.emma-sparkle');
    if (sp) sp.setAttribute('opacity', e.sparkle ? '1' : '0');
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
