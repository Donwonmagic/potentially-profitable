/**
 * Workshop Kit widget: map-radius
 *
 * Visual radius around the operator's restaurant — used in L4 (Customer +
 * neighborhood) to frame "who's reachable" and in L12 (Local SEO) to
 * frame "what area am I trying to rank in."
 *
 * The plan calls for pre-baked static map tiles served from /brand/maps/
 * keyed by metro. Those tiles are a separate infrastructure task; until
 * they ship, the widget renders a CSS-art street-grid SVG that conveys
 * scale and the radius shape without violating the suite's "no fetch"
 * posture. When real tiles arrive, the SVG can be swapped for a static
 * background-image without changing the widget's external contract.
 *
 * Writes deliveryRadius: number (miles, 0.5–5 in 0.25 increments) to
 * MuntinContext. Reads restaurantProfile.address for display only —
 * the widget never geocodes (no fetch) so the visualization is
 * abstract-neighborhood, not a real map of the operator's actual street.
 *
 * Markup expected (no inline config — the slider range is fixed):
 *
 *   <section class="course-widget" data-widget="map-radius"></section>
 *
 * Accessibility:
 *   - <input type="range"> with aria-labelledby + aria-valuetext
 *     announcing miles and the time-equivalent ("≈ 8 minutes by car").
 *   - SVG is aria-hidden=true; the size info is conveyed in visible
 *     text below the visualization.
 *   - Polite live region announces "Radius set to 2 miles — about 8
 *     minutes by car or 40 minutes on foot."
 */

export const tag = 'map-radius';
export const contextKeys = ['deliveryRadius'];

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function readAccent(state) {
  const p = state && state.palette;
  if (Array.isArray(p) && typeof p[0] === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p[0])) return p[0].toUpperCase();
  return '#1F4E5B';
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// Rough time-equivalent calculations. Urban arterial average ~15 mph
// during dinner-time traffic in most US neighborhoods; walking ~3 mph.
function carMinutes(miles) { return Math.round(miles * 60 / 15); }
function walkMinutes(miles) { return Math.round(miles * 60 / 3); }

// Build a stable pseudo-random street grid from an address string so
// the same address always shows the same neighborhood layout. Not a
// real map — just a coherent visual placeholder.
function hashAddress(addr) {
  const s = String(addr || 'default').toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function buildStreetGrid(addrHash, accent) {
  // 400x400 viewBox. Render 3-5 N-S streets and 3-5 E-W streets,
  // positions seeded from the address hash. Pure visual chrome.
  const r1 = (addrHash >>> 0) % 100;
  const r2 = ((addrHash >>> 8) >>> 0) % 100;
  const r3 = ((addrHash >>> 16) >>> 0) % 100;
  const r4 = ((addrHash >>> 24) >>> 0) % 100;

  const nsX = [70 + r1 % 40, 160 + r2 % 30, 250 + r3 % 30, 330 + r4 % 30];
  const ewY = [70 + r2 % 40, 160 + r1 % 30, 250 + r4 % 30, 330 + r3 % 30];

  const parts = [];
  parts.push('<rect x="0" y="0" width="400" height="400" fill="#F3EEE3"/>');
  // Park / green block — one random rectangle
  const parkX = 50 + r1 % 200;
  const parkY = 50 + r2 % 200;
  parts.push('<rect x="' + parkX + '" y="' + parkY + '" width="80" height="60" fill="#D5E2C8" rx="3"/>');
  // Building blocks: faint tan rectangles between the streets
  for (let i = 0; i < nsX.length - 1; i++) {
    for (let j = 0; j < ewY.length - 1; j++) {
      const x = nsX[i] + 4;
      const y = ewY[j] + 4;
      const w = nsX[i + 1] - nsX[i] - 8;
      const h = ewY[j + 1] - ewY[j] - 8;
      if (w > 8 && h > 8) {
        parts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="#EAE4D5" opacity=".6" rx="2"/>');
      }
    }
  }
  // Streets — light cream lines
  nsX.forEach((x) => parts.push('<line x1="' + x + '" y1="0" x2="' + x + '" y2="400" stroke="#FAF7F2" stroke-width="6"/>'));
  ewY.forEach((y) => parts.push('<line x1="0" y1="' + y + '" x2="400" y2="' + y + '" stroke="#FAF7F2" stroke-width="6"/>'));
  return parts.join('');
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';

  const initialRadius = (state && typeof state.deliveryRadius === 'number')
    ? clamp(state.deliveryRadius, 0.5, 5)
    : 1.5;

  const t = locale === 'es' ? {
    label: 'Radio alrededor de tu restaurante',
    addressLabel: 'Tu dirección',
    addressMissing: 'Establece tu dirección en la Lección 10 para anclar la vista.',
    radiusLabel: 'Radio',
    miles: function (n) { return n.toFixed(2).replace(/\.?0+$/,'') + ' mi'; },
    summary: function (mi, carMin, walkMin) { return mi + ' mi — ~' + carMin + ' min en auto o ~' + walkMin + ' min a pie.'; },
    rationale: 'L4 lo usa para enmarcar quién vive lo suficientemente cerca para venir entre semana. L12 lo usa para el radio de palabras clave en SEO local.',
    announce: function (mi, carMin) { return 'Radio puesto a ' + mi + ' millas — aproximadamente ' + carMin + ' minutos en auto.'; }
  } : {
    label: 'Radius around your restaurant',
    addressLabel: 'Your address',
    addressMissing: 'Set your address in Lesson 10 to anchor this view.',
    radiusLabel: 'Radius',
    miles: function (n) { return n.toFixed(2).replace(/\.?0+$/,'') + ' mi'; },
    summary: function (mi, carMin, walkMin) { return mi + ' mi — about ' + carMin + ' min by car or ' + walkMin + ' min on foot.'; },
    rationale: 'L4 uses this to frame who lives close enough to come on a weeknight. L12 uses this for the local-SEO keyword radius.',
    announce: function (mi, carMin) { return 'Radius set to ' + mi + ' miles — about ' + carMin + ' minutes by car.'; }
  };

  const profile = (state && state.restaurantProfile) || {};
  const address = profile.address || '';
  const accent = readAccent(state);
  const addrHash = hashAddress(address || 'default');
  const grid = buildStreetGrid(addrHash, accent);

  rootEl.innerHTML = [
    '<div class="mrw">',
      '<h3 id="mrwLabel" class="mrw-label">', escHtml(t.label), '</h3>',
      '<div class="mrw-grid">',

        '<div class="mrw-map-wrap">',
          '<svg class="mrw-map" viewBox="0 0 400 400" aria-hidden="true">',
            grid,
            '<circle class="mrw-radius" cx="200" cy="200" r="80" fill="', escAttr(accent), '" fill-opacity=".18" stroke="', escAttr(accent), '" stroke-opacity=".55" stroke-width="2" stroke-dasharray="4 4"/>',
            '<circle class="mrw-pin" cx="200" cy="200" r="10" fill="', escAttr(accent), '" stroke="#FFF" stroke-width="3"/>',
          '</svg>',
          '<p class="mrw-addr">',
            '<span class="mrw-addr-lbl">', escHtml(t.addressLabel), ': </span>',
            address
              ? ('<span class="mrw-addr-val">' + escHtml(String(address).replace(/\s+/g,' ')) + '</span>')
              : ('<span class="mrw-addr-empty">' + escHtml(t.addressMissing) + '</span>'),
          '</p>',
        '</div>',

        '<div class="mrw-controls">',
          '<label class="mrw-range-row">',
            '<span class="mrw-range-lbl">', escHtml(t.radiusLabel), '</span>',
            '<span class="mrw-range-val">', escHtml(t.miles(initialRadius)), '</span>',
          '</label>',
          '<input class="mrw-range" type="range" min="0.5" max="5" step="0.25" value="', initialRadius, '" aria-labelledby="mrwLabel">',
          '<p class="mrw-summary"></p>',
          '<p class="mrw-rationale">', escHtml(t.rationale), '</p>',
        '</div>',

      '</div>',
      '<p class="mrw-live sr-only" role="status" aria-live="polite"></p>',
    '</div>'
  ].join('');

  const els = {
    range:   rootEl.querySelector('.mrw-range'),
    rangeVal: rootEl.querySelector('.mrw-range-val'),
    radius:  rootEl.querySelector('.mrw-radius'),
    summary: rootEl.querySelector('.mrw-summary'),
    live:    rootEl.querySelector('.mrw-live')
  };

  function render(animate) {
    const v = parseFloat(els.range.value);
    // Map 0.5..5 miles to circle r 40..180 in the SVG viewport.
    const r = 40 + ((v - 0.5) / 4.5) * 140;
    els.radius.setAttribute('r', String(r));
    els.rangeVal.textContent = t.miles(v);
    els.summary.textContent = t.summary(els.rangeVal.textContent.replace(' mi',''), carMinutes(v), walkMinutes(v));
    els.range.setAttribute('aria-valuetext', t.summary(els.rangeVal.textContent.replace(' mi',''), carMinutes(v), walkMinutes(v)));
    if (animate) {
      els.live.textContent = t.announce(els.rangeVal.textContent.replace(' mi',''), carMinutes(v));
    }
  }

  function commit() {
    const v = parseFloat(els.range.value);
    if (deps && typeof deps.commit === 'function') {
      deps.commit({ deliveryRadius: v });
    }
  }

  let announceTimer;
  els.range.addEventListener('input', () => {
    render(false);
    commit();
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => render(true), 250);
  });

  function onContextChange(e) {
    // If the address arrives later (operator finishes L10), re-render
    // so the street grid + display address update without a remount.
    if (!window.MuntinContext) return;
    const ctx = window.MuntinContext.read() || {};
    const newAddr = (ctx.restaurantProfile && ctx.restaurantProfile.address) || '';
    if (newAddr !== address) {
      const fresh = mount(rootEl, ctx, deps);
      // No-op — mount() rewrote rootEl.innerHTML, breaking our local refs.
      // The new mount() call's own listeners take over.
      void fresh;
    }
  }
  document.addEventListener('mtn:context-change', onContextChange);

  render(false);

  return {
    unmount: function () {
      document.removeEventListener('mtn:context-change', onContextChange);
      rootEl.innerHTML = '';
    }
  };
}

export function serialize(rootEl) {
  const r = rootEl.querySelector('.mrw-range');
  if (!r) return {};
  return { deliveryRadius: parseFloat(r.value) };
}
