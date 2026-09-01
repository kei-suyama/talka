/* TALKA - Emma avatar v4 (cool street style: white bob + teal inner color,
   fur-trim jacket, choker). Inline SVG. Attaches window.Avatar */
(function () {
  'use strict';

  var EMOTIONS = {
    neutral:   { eyes: 'open',   browL: 0,  browY: 0,  mouth: 'M56.5 78 Q60 79 63.5 78',                            blush: 0.3,  tilt: 0,  sparkle: 0, heart: 0 },
    happy:     { eyes: 'open',   browL: -3, browY: -1, mouth: 'M55.5 77.5 Q60 81 64.5 77.5',                        blush: 0.55, tilt: 0,  sparkle: 0, heart: 0 },
    laugh:     { eyes: 'closed', browL: -5, browY: -2, mouth: 'M54.5 76.5 Q60 84 65.5 76.5 Q60 79 54.5 76.5 Z',     blush: 0.6,  tilt: 0,  sparkle: 0, heart: 0 },
    excited:   { eyes: 'wide',   browL: -5, browY: -3, mouth: 'M54.5 76.5 Q60 84 65.5 76.5 Q60 79 54.5 76.5 Z',     blush: 0.65, tilt: 0,  sparkle: 1, heart: 1 },
    surprised: { eyes: 'wide',   browL: 0,  browY: -5, mouth: 'M57.4 77 Q60 75.4 62.6 77 Q62.6 81 60 81 Q57.4 81 57.4 77 Z', blush: 0.4, tilt: 0, sparkle: 0, heart: 0 },
    thinking:  { eyes: 'up',     browL: 4,  browY: -2, mouth: 'M56.5 78.5 Q60 77.8 63.5 79',                        blush: 0.25, tilt: -3, sparkle: 0, heart: 0 },
    sad:       { eyes: 'open',   browL: 8,  browY: -1, mouth: 'M56 79.8 Q60 77 64 79.8',                            blush: 0.3,  tilt: 2,  sparkle: 0, heart: 0 },
    curious:   { eyes: 'wide',   browL: -2, browY: -3, mouth: 'M56.5 77.5 Q60 80 63.5 77.5',                        blush: 0.4,  tilt: 5,  sparkle: 0, heart: 0 }
  };

  var SVG =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" class="emma-svg" aria-label="Emma">' +
      '<defs>' +
        '<linearGradient id="em-hairW" x1="0" y1="0" x2="0.2" y2="1">' +
          '<stop offset="0" stop-color="#f7f6fa"/><stop offset="0.7" stop-color="#e9e8f1"/><stop offset="1" stop-color="#d4d4e4"/>' +
        '</linearGradient>' +
        '<linearGradient id="em-hairIn" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#8ce8dc"/><stop offset="1" stop-color="#4cc4c0"/>' +
        '</linearGradient>' +
        '<linearGradient id="em-iris" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#2c93b8"/><stop offset="0.55" stop-color="#43c2d6"/><stop offset="1" stop-color="#a2f2e6"/>' +
        '</linearGradient>' +
        '<radialGradient id="em-bg" cx="0.5" cy="0.3" r="0.85">' +
          '<stop offset="0" stop-color="rgba(210,216,232,0.30)"/><stop offset="1" stop-color="rgba(120,214,206,0.10)"/>' +
        '</radialGradient>' +
        '<filter id="em-blur" x="-60%" y="-60%" width="220%" height="220%">' +
          '<feGaussianBlur stdDeviation="1.8"/>' +
        '</filter>' +
        '<clipPath id="em-clip"><circle cx="60" cy="60" r="57"/></clipPath>' +
      '</defs>' +
      '<g clip-path="url(#em-clip)">' +
        '<circle cx="60" cy="60" r="57" fill="url(#em-bg)"/>' +
        '<g class="emma-tilt">' +

        /* ---- back hair: white bob, inner teal layer showing at the ends ---- */
        '<path d="M22 76 Q14 34 38 18 Q50 9 60 9 Q70 9 82 18 Q106 34 98 76 Q96 88 90 93 L30 93 Q24 88 22 76 Z" fill="url(#em-hairW)"/>' +
        /* teal inner color peeking out under the bob */
        '<path d="M28 74 Q30 88 36 94 Q42 90 40 78 Q44 90 50 95 Q54 90 52 80 Q56 92 60 95 Q64 92 68 80 Q66 90 70 95 Q76 90 80 78 Q78 90 84 94 Q90 88 92 74 L86 70 L34 70 Z" fill="url(#em-hairIn)"/>' +

        /* ---- body: black jacket with white fur trim ---- */
        '<path d="M22 120 Q24 102 40 96 L60 91 L80 96 Q96 102 98 120 Z" fill="#191b24"/>' +
        '<path d="M40 108 L60 100 L80 108" stroke="#2c2f3d" stroke-width="1.4" fill="none"/>' +
        '<path d="M60 101 L60 120" stroke="#31344a" stroke-width="1.6"/>' +
        /* fur collar: fluffy bumps across the shoulders */
        '<path d="M24 112 Q23 104 29 103 Q27 96 34 96 Q33 89 41 91 Q41 84 48 88 Q49 82 55 86 Q58 81 62 86 Q67 82 69 88 Q75 84 76 91 Q83 89 83 96 Q90 96 88 103 Q94 104 93 112 Q88 118 78 114 Q73 119 66 115 Q61 120 54 115 Q47 119 42 114 Q32 118 24 112 Z" fill="#f1f2f7"/>' +
        '<path d="M30 106 Q36 100 44 102 M50 98 Q56 94 64 97 M70 100 Q78 99 84 105" stroke="#d5d7e4" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +

        /* ---- neck + choker ---- */
        '<path d="M54 78 L54 92 Q60 97 66 92 L66 78 Z" fill="#ffeadb"/>' +
        '<path d="M54 80 Q60 86 66 80 L66 78 L54 78 Z" fill="rgba(180,120,100,0.30)"/>' +
        '<path d="M53.5 86.5 Q60 90 66.5 86.5 L66.5 90 Q60 93.5 53.5 90 Z" fill="#20222d"/>' +
        '<rect x="58.6" y="87.6" width="2.8" height="2.8" rx="0.6" fill="#8f94a8"/>' +

        /* ---- face ---- */
        '<path d="M33 54 Q33 30 60 28 Q87 30 87 54 Q87 66 82 73 Q74 83 66 86 Q60 88 54 86 Q46 83 38 73 Q33 66 33 54 Z" fill="#fff0e4"/>' +
        '<path d="M36 50 Q60 58 84 50 L84 42 Q60 50 36 42 Z" fill="rgba(150,130,120,0.12)" filter="url(#em-blur)"/>' +

        /* ---- ear + piercings (viewer left) ---- */
        '<path d="M33 60 Q29.5 58 30 63 Q30.5 68 34 69 Z" fill="#ffe6d6"/>' +
        '<circle cx="31.8" cy="66.5" r="1.1" fill="none" stroke="#aeb4c8" stroke-width="0.8"/>' +
        '<circle cx="33.4" cy="68.8" r="0.9" fill="none" stroke="#aeb4c8" stroke-width="0.8"/>' +

        /* ---- blush (soft, subtle) ---- */
        '<g class="emma-blush-g">' +
          '<ellipse class="emma-blush" cx="42" cy="70.5" rx="5.5" ry="2.8" fill="#f5aeb8" opacity="0.3" filter="url(#em-blur)"/>' +
          '<ellipse class="emma-blush" cx="78" cy="70.5" rx="5.5" ry="2.8" fill="#f5aeb8" opacity="0.3" filter="url(#em-blur)"/>' +
        '</g>' +

        /* ---- open eyes (cool, slightly droopy, aqua iris) ---- */
        '<g class="emma-eyes-open">' +
          '<g class="emma-eye-blink">' +
            '<g class="emma-eye-g" data-cx="46.5">' +
              '<path d="M40 55.5 Q40 66.5 42.5 67.5 Q46.5 69 51 67.5 Q53.5 66.5 53.5 55.5 Z" fill="#fff"/>' +
              '<ellipse class="emma-iris" cx="46.8" cy="60.8" rx="5.5" ry="7" fill="url(#em-iris)"/>' +
              '<path class="emma-iris" d="M41.5 58 Q46.8 53 52.1 58 Q46.8 60 41.5 58 Z" fill="#1e6b8a" opacity="0.6"/>' +
              '<ellipse class="emma-pupil" cx="46.8" cy="61" rx="2.2" ry="3.3" fill="#132433"/>' +
              '<ellipse class="emma-iris" cx="46.8" cy="65.8" rx="3.2" ry="1.4" fill="#c8fbf2" opacity="0.7"/>' +
              '<circle class="emma-hl-big" cx="44.2" cy="56.8" r="2.2" fill="#fff"/>' +
              '<circle class="emma-hl-sm" cx="49.8" cy="64" r="1" fill="#fff" opacity="0.9"/>' +
              /* flatter, cooler upper lash */
              '<path d="M38.8 56.5 Q40.5 51.8 46.5 51.2 Q52.5 51.6 54.5 55.5 L53.3 56.5 Q51.8 53.8 46.6 53.6 Q41.8 53.8 40.3 57 Z" fill="#3f4254"/>' +
              '<path d="M39.8 54.5 L37 53 Q38.8 52.6 40.6 53.6 Z" fill="#3f4254"/>' +
              '<path d="M42 68 Q46.5 69.6 51 68" stroke="rgba(90,86,120,0.45)" stroke-width="1" fill="none" stroke-linecap="round"/>' +
            '</g>' +
            '<g class="emma-eye-g" data-cx="73.5">' +
              '<path d="M66.5 55.5 Q66.5 66.5 69 67.5 Q73.5 69 78 67.5 Q80 66.5 80 55.5 Z" fill="#fff"/>' +
              '<ellipse class="emma-iris" cx="73.2" cy="60.8" rx="5.5" ry="7" fill="url(#em-iris)"/>' +
              '<path class="emma-iris" d="M67.9 58 Q73.2 53 78.5 58 Q73.2 60 67.9 58 Z" fill="#1e6b8a" opacity="0.6"/>' +
              '<ellipse class="emma-pupil" cx="73.2" cy="61" rx="2.2" ry="3.3" fill="#132433"/>' +
              '<ellipse class="emma-iris" cx="73.2" cy="65.8" rx="3.2" ry="1.4" fill="#c8fbf2" opacity="0.7"/>' +
              '<circle class="emma-hl-big" cx="70.6" cy="56.8" r="2.2" fill="#fff"/>' +
              '<circle class="emma-hl-sm" cx="76.2" cy="64" r="1" fill="#fff" opacity="0.9"/>' +
              '<path d="M81.2 56.5 Q79.5 51.8 73.5 51.2 Q67.5 51.6 65.5 55.5 L66.7 56.5 Q68.2 53.8 73.4 53.6 Q78.2 53.8 79.7 57 Z" fill="#3f4254"/>' +
              '<path d="M80.2 54.5 L83 53 Q81.2 52.6 79.4 53.6 Z" fill="#3f4254"/>' +
              '<path d="M69 68 Q73.5 69.6 78 68" stroke="rgba(90,86,120,0.45)" stroke-width="1" fill="none" stroke-linecap="round"/>' +
            '</g>' +
          '</g>' +
        '</g>' +

        /* ---- closed eyes ---- */
        '<g class="emma-eyes-closed" opacity="0">' +
          '<path d="M40 61.5 Q46.5 55 53 61.5" stroke="#3f4254" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
          '<path d="M67 61.5 Q73.5 55 80 61.5" stroke="#3f4254" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
        '</g>' +

        /* ---- beauty mark, nose, mouth ---- */
        '<circle cx="38.6" cy="69.8" r="0.75" fill="#5a5064"/>' +
        '<path d="M59.6 71.5 Q60.6 72.2 60 73" stroke="rgba(180,125,105,0.55)" stroke-width="1" fill="none" stroke-linecap="round"/>' +
        '<path class="emma-mouth" d="M56.5 78 Q60 79 63.5 78" stroke="#c66a78" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<ellipse class="emma-mouth-talk" cx="60" cy="78.8" rx="4" ry="3.2" fill="#a05a68" opacity="0"/>' +

        /* ---- bangs: white, choppy, over the brows ---- */
        '<path d="M31 60 Q28 24 60 21 Q92 24 89 60 Q87 45 81 40 Q83 55 76 49 Q78 37 69 34 Q72 48 61 45 Q51 46 53 35 Q45 36 47 48 Q40 52 41 40 Q35 45 31 60 Z" fill="url(#em-hairW)"/>' +
        '<path d="M53 35 Q55 42 61 45 Q51 46 53 35 Z" fill="#d9d9e8" opacity="0.7"/>' +
        '<path d="M69 34 Q67 42 61 45 Q72 48 69 34 Z" fill="#d9d9e8" opacity="0.55"/>' +
        /* teal strands mixed into the bangs */
        '<path d="M47 48 Q46 42 48 37 Q50 43 49 48 Z" fill="url(#em-hairIn)" opacity="0.8"/>' +
        '<path d="M74 48 Q75 42 73 37 Q71 43 72 48 Z" fill="url(#em-hairIn)" opacity="0.8"/>' +
        /* soft hair sheen */
        '<path d="M40 30 Q50 24 62 24 Q52 27 46 33 Z" fill="rgba(255,255,255,0.6)" filter="url(#em-blur)"/>' +

        /* ---- bob side pieces framing the face ---- */
        '<path d="M31 50 Q26 68 31 84 Q38 80 36 64 Q36 55 31 50 Z" fill="url(#em-hairW)"/>' +
        '<path d="M89 50 Q94 68 89 84 Q82 80 84 64 Q84 55 89 50 Z" fill="url(#em-hairW)"/>' +
        '<path d="M33 62 Q31 74 33 81 Q36 77 35.5 66 Z" fill="url(#em-hairIn)" opacity="0.75"/>' +
        '<path d="M87 62 Q89 74 87 81 Q84 77 84.5 66 Z" fill="url(#em-hairIn)" opacity="0.75"/>' +

        /* ---- ahoge (small, subtle) ---- */
        '<path d="M62 21 Q60 12 68 9 Q63 14 66 17 Q69 13 73 15 Q67 16 67.5 22 Q64.5 18 62 21 Z" fill="url(#em-hairW)"/>' +

        /* ---- brows (pale, over bangs) ---- */
        '<path class="emma-brow-l" d="M40.5 47.5 Q46 45.5 51.5 47" stroke="#b8bac9" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>' +
        '<path class="emma-brow-r" d="M68.5 47 Q74 45.5 79.5 47.5" stroke="#b8bac9" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.95"/>' +

        /* ---- accents ---- */
        '<g class="emma-sparkle" opacity="0">' +
          '<path d="M98 38 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#a2f2e6"/>' +
          '<path d="M20 46 l1.4 3.5 3.5 1.4 -3.5 1.4 -1.4 3.5 -1.4 -3.5 -3.5 -1.4 3.5 -1.4 Z" fill="#a2f2e6"/>' +
        '</g>' +
        '<g class="emma-heart" opacity="0">' +
          '<path d="M99 58 c-2 -2.8 -6.2 -1.3 -6.2 1.7 c0 2.5 3 4.5 6.2 6.7 c3.2 -2.2 6.2 -4.2 6.2 -6.7 c0 -3 -4.2 -4.5 -6.2 -1.7 Z" fill="#f5aeb8"/>' +
        '</g>' +

        '</g>' +
      '</g>' +
    '</svg>';

  var host = null;
  var imgSet = null; // AI-generated expression set from CharMaker, if any
  var IMG_FALLBACK = { curious: 'surprised', excited: 'laugh', laugh: 'happy' };

  function q(sel) { return host ? host.querySelector(sel) : null; }
  function qa(sel) { return host ? host.querySelectorAll(sel) : []; }

  function mount(container) {
    if (!container) return;
    host = container;
    imgSet = null;
    try {
      var data = window.Store && Store.get('charImages', null);
      if (data && data.imgs && data.imgs.neutral) imgSet = data.imgs;
    } catch (e) {}
    if (imgSet) {
      container.innerHTML = '<img class="emma-img" alt="Emma">';
      setEmotion('neutral');
      return;
    }
    container.innerHTML = SVG;
    setEmotion('neutral');
  }

  function imgFor(name) {
    if (!imgSet) return null;
    var k = name;
    var hops = 0;
    while (k && !imgSet[k] && hops < 4) { k = IMG_FALLBACK[k]; hops++; }
    return imgSet[k] || imgSet.neutral;
  }

  function setEmotion(name) {
    if (!host) return;
    if (imgSet) {
      var im = q('.emma-img');
      var src = imgFor(name);
      if (im && src && im.getAttribute('src') !== src) im.setAttribute('src', src);
      return;
    }
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
    if (bl) bl.setAttribute('transform', 'translate(0 ' + e.browY + ') rotate(' + e.browL + ' 46 47)');
    if (br) br.setAttribute('transform', 'translate(0 ' + e.browY + ') rotate(' + (-e.browL) + ' 74 47)');
    var m = q('.emma-mouth');
    if (m) {
      m.setAttribute('d', e.mouth);
      m.setAttribute('fill', /Z\s*$/.test(e.mouth) ? 'rgba(160,90,104,0.95)' : 'none');
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
    if (imgSet) {
      var im = q('.emma-img');
      if (im) im.classList.toggle('talking', !!on);
      return;
    }
    var svg = q('.emma-svg');
    if (svg) svg.classList.toggle('talking', !!on);
  }

  window.Avatar = { mount: mount, setEmotion: setEmotion, setTalking: setTalking, EMOTIONS: Object.keys(EMOTIONS) };
})();
