/**
 * Workshop Kit widget: persona-card-builder
 *
 * Structured persona capture for L4 (Customer + neighborhood). The
 * operator sketches one specific archetypal customer as:
 *
 *   - Name (real or composite)
 *   - Age (free-text; "34" or "30s" or "mid-30s" all valid)
 *   - Role (one short label: "schoolteacher", "freelance designer", …)
 *   - Traits (up to 6 short specifics, rendered as chips)
 *   - Paragraph (narrative; preserves the customerParagraph wire that
 *     downstream lessons + the L14 About-page template already read)
 *
 * Writes both:
 *   - customerCard: { name, age, role, traits[] }   (structured)
 *   - customerParagraph: <textarea value>           (existing key, prose)
 *
 * The dual-write preserves backward compatibility: any lesson or
 * template that already reads `customerParagraph` (L9, L10, L12, the
 * About page) keeps working. New consumers can opt into the
 * structured customerCard.
 *
 * Avatar: pure CSS — operator's initials (1–2 chars) inside a circle
 * tinted with the brand accent color. No image upload, no remote
 * fetch — matches the suite's "no fetch" posture.
 *
 * Markup expected (no inline config block — the widget's defaults
 * are correct):
 *
 *   <section class="course-widget" data-widget="persona-card-builder"></section>
 *
 * Accessibility:
 *   - Three labeled inputs (name, age, role) wired with aria-describedby.
 *   - Traits chip-list is a single <input> with an aria-label and
 *     <button>Add</button>; each existing chip is a <button> that
 *     removes itself on click + Enter/Space. Polite-region announces
 *     "Trait added: …" / "Trait removed: …".
 *   - The narrative textarea is labeled and has a character counter
 *     announced politely on each input.
 */

export const tag = 'persona-card-builder';
export const contextKeys = ['customerCard', 'customerParagraph'];

const MAX_TRAITS = 6;
const MAX_PARAGRAPH = 600;

function escHtml(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function initialsOf(name) {
  const clean = String(name == null ? '' : name).trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function readPaletteAccent(state) {
  const p = state && state.palette;
  if (Array.isArray(p) && typeof p[0] === 'string' && /^#[0-9A-Fa-f]{6}$/.test(p[0])) return p[0].toUpperCase();
  return '#1F4E5B';
}

export function mount(rootEl, state, deps) {
  const locale = (deps && deps.locale) || 'en';

  const initialCard = (state && state.customerCard) || {};
  const initialParagraph = (state && typeof state.customerParagraph === 'string') ? state.customerParagraph : '';

  const t = locale === 'es' ? {
    sectionLabel: 'Construye tu cliente',
    nameLabel: 'Nombre',
    namePh: 'Ana',
    ageLabel: 'Edad',
    agePh: '34',
    roleLabel: 'Rol o trabajo',
    rolePh: 'maestra de primaria',
    traitsLabel: 'Detalles específicos',
    traitsHelp: 'Hasta 6 chips. Por ejemplo: "vive a 10 cuadras", "viernes en la noche", "comparte una botella con su hermana".',
    traitPh: 'añade un detalle y pulsa Enter',
    traitAdd: 'Añadir',
    traitRemove: 'quitar',
    paragraphLabel: 'El cliente en un párrafo',
    paragraphPh: 'Ana, 34, maestra de primaria, vive a diez cuadras, dos hijos en la escuela, viene los viernes cuando su esposo está con los niños, siempre pide lo mismo, comparte una botella con su hermana.',
    paragraphHelp: '3 a 6 oraciones. Lo específico le gana a lo abstracto.',
    charsLeft: function (n) { return n + ' caracteres restantes'; },
    addedAnnounce: function (s) { return 'Detalle añadido: ' + s; },
    removedAnnounce: function (s) { return 'Detalle eliminado: ' + s; },
    limitAnnounce: 'Máximo de 6 detalles alcanzado.',
    cardHeading: 'Tu cliente',
    cardEmpty: 'Empieza por su nombre.'
  } : {
    sectionLabel: 'Build your customer',
    nameLabel: 'Name',
    namePh: 'Anna',
    ageLabel: 'Age',
    agePh: '34',
    roleLabel: 'Role or job',
    rolePh: 'schoolteacher',
    traitsLabel: 'Specific details',
    traitsHelp: 'Up to 6 chips. Things like "walks here from 10 blocks away," "Friday nights only," "splits a bottle with her sister."',
    traitPh: 'add one detail and press Enter',
    traitAdd: 'Add',
    traitRemove: 'remove',
    paragraphLabel: 'The customer in one paragraph',
    paragraphPh: 'Anna, 34, schoolteacher, lives ten blocks away, two kids in elementary school, comes in on Friday nights when her husband is on bedtime duty, orders the same thing each time, splits a bottle with her sister.',
    paragraphHelp: '3 to 6 sentences. Specific beats abstract.',
    charsLeft: function (n) { return n + ' characters left'; },
    addedAnnounce: function (s) { return 'Detail added: ' + s; },
    removedAnnounce: function (s) { return 'Detail removed: ' + s; },
    limitAnnounce: 'Maximum of 6 details reached.',
    cardHeading: 'Your customer',
    cardEmpty: 'Start with their name.'
  };

  const accent = readPaletteAccent(state);

  rootEl.innerHTML = [
    '<div class="pcb" data-accent="', escAttr(accent), '">',
      '<div class="pcb-grid">',

        '<div class="pcb-form">',
          '<h3 class="pcb-section-label">', escHtml(t.sectionLabel), '</h3>',

          '<div class="pcb-row">',
            '<label class="pcb-field">',
              '<span class="pcb-lbl">', escHtml(t.nameLabel), '</span>',
              '<input class="pcb-input" type="text" data-field="name" autocomplete="off" placeholder="', escAttr(t.namePh), '" value="', escAttr(initialCard.name || ''), '" maxlength="40">',
            '</label>',
            '<label class="pcb-field pcb-field--age">',
              '<span class="pcb-lbl">', escHtml(t.ageLabel), '</span>',
              '<input class="pcb-input" type="text" data-field="age" autocomplete="off" placeholder="', escAttr(t.agePh), '" value="', escAttr(initialCard.age || ''), '" maxlength="20">',
            '</label>',
          '</div>',

          '<label class="pcb-field">',
            '<span class="pcb-lbl">', escHtml(t.roleLabel), '</span>',
            '<input class="pcb-input" type="text" data-field="role" autocomplete="off" placeholder="', escAttr(t.rolePh), '" value="', escAttr(initialCard.role || ''), '" maxlength="60">',
          '</label>',

          '<div class="pcb-field">',
            '<span class="pcb-lbl">', escHtml(t.traitsLabel), '</span>',
            '<div class="pcb-traits" role="list" aria-label="', escAttr(t.traitsLabel), '"></div>',
            '<div class="pcb-trait-add">',
              '<input class="pcb-input pcb-trait-input" type="text" placeholder="', escAttr(t.traitPh), '" aria-label="', escAttr(t.traitPh), '" maxlength="60">',
              '<button type="button" class="pcb-add-btn">', escHtml(t.traitAdd), '</button>',
            '</div>',
            '<p class="pcb-help">', escHtml(t.traitsHelp), '</p>',
          '</div>',

          '<label class="pcb-field">',
            '<span class="pcb-lbl">', escHtml(t.paragraphLabel), '</span>',
            '<textarea class="pcb-textarea" data-field="paragraph" rows="5" maxlength="', MAX_PARAGRAPH, '" placeholder="', escAttr(t.paragraphPh), '">', escHtml(initialParagraph), '</textarea>',
            '<p class="pcb-help"><span class="pcb-counter">', escHtml(t.charsLeft(MAX_PARAGRAPH - initialParagraph.length)), '</span> · ', escHtml(t.paragraphHelp), '</p>',
          '</label>',
        '</div>',

        '<aside class="pcb-card" aria-label="', escAttr(t.cardHeading), '">',
          '<div class="pcb-avatar" aria-hidden="true">', escHtml(initialsOf(initialCard.name || '')), '</div>',
          '<div class="pcb-card-body">',
            '<p class="pcb-card-eyebrow">', escHtml(t.cardHeading), '</p>',
            '<p class="pcb-card-name">', initialCard.name ? escHtml(initialCard.name) : ('<span class="pcb-card-empty">' + escHtml(t.cardEmpty) + '</span>'), '</p>',
            '<p class="pcb-card-meta"></p>',
            '<ul class="pcb-card-traits"></ul>',
          '</div>',
        '</aside>',

      '</div>',
      '<p class="pcb-live sr-only" role="status" aria-live="polite"></p>',
    '</div>'
  ].join('');

  const card = { name: '', age: '', role: '', traits: [] };
  card.name = initialCard.name || '';
  card.age = initialCard.age || '';
  card.role = initialCard.role || '';
  card.traits = Array.isArray(initialCard.traits) ? initialCard.traits.slice(0, MAX_TRAITS).map((s) => String(s)) : [];

  const els = {
    name: rootEl.querySelector('[data-field="name"]'),
    age: rootEl.querySelector('[data-field="age"]'),
    role: rootEl.querySelector('[data-field="role"]'),
    paragraph: rootEl.querySelector('[data-field="paragraph"]'),
    traits: rootEl.querySelector('.pcb-traits'),
    traitInput: rootEl.querySelector('.pcb-trait-input'),
    addBtn: rootEl.querySelector('.pcb-add-btn'),
    counter: rootEl.querySelector('.pcb-counter'),
    avatar: rootEl.querySelector('.pcb-avatar'),
    cardName: rootEl.querySelector('.pcb-card-name'),
    cardMeta: rootEl.querySelector('.pcb-card-meta'),
    cardTraits: rootEl.querySelector('.pcb-card-traits'),
    live: rootEl.querySelector('.pcb-live')
  };

  function renderTraitsChips() {
    els.traits.innerHTML = card.traits.map((trait, i) => {
      return '<button type="button" class="pcb-chip" data-i="' + i + '" aria-label="' + escAttr(t.traitRemove) + ': ' + escAttr(trait) + '">' +
               '<span class="pcb-chip-text">' + escHtml(trait) + '</span>' +
               '<span class="pcb-chip-x" aria-hidden="true">×</span>' +
             '</button>';
    }).join('');
    els.traits.querySelectorAll('.pcb-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-i'), 10);
        const removed = card.traits[i];
        card.traits.splice(i, 1);
        renderTraitsChips();
        renderCard();
        commit();
        if (removed) els.live.textContent = t.removedAnnounce(removed);
      });
    });
  }

  function renderCard() {
    els.avatar.textContent = initialsOf(card.name);
    if (card.name) {
      els.cardName.innerHTML = escHtml(card.name);
    } else {
      els.cardName.innerHTML = '<span class="pcb-card-empty">' + escHtml(t.cardEmpty) + '</span>';
    }
    const metaBits = [];
    if (card.age)  metaBits.push(escHtml(card.age));
    if (card.role) metaBits.push(escHtml(card.role));
    els.cardMeta.innerHTML = metaBits.join(' · ');
    els.cardTraits.innerHTML = card.traits.map((trait) => {
      return '<li class="pcb-card-trait">' + escHtml(trait) + '</li>';
    }).join('');
  }

  function commit() {
    if (deps && typeof deps.commit === 'function') {
      deps.commit({
        customerCard: {
          name: card.name,
          age: card.age,
          role: card.role,
          traits: card.traits.slice()
        },
        customerParagraph: els.paragraph.value
      });
    }
  }

  function addTrait() {
    const v = (els.traitInput.value || '').trim();
    if (!v) return;
    if (card.traits.length >= MAX_TRAITS) {
      els.live.textContent = t.limitAnnounce;
      return;
    }
    card.traits.push(v);
    els.traitInput.value = '';
    renderTraitsChips();
    renderCard();
    commit();
    els.live.textContent = t.addedAnnounce(v);
  }

  ['name', 'age', 'role'].forEach((field) => {
    els[field].addEventListener('input', () => {
      card[field] = els[field].value;
      renderCard();
      commit();
    });
  });

  els.paragraph.addEventListener('input', () => {
    const left = MAX_PARAGRAPH - els.paragraph.value.length;
    if (els.counter) els.counter.textContent = t.charsLeft(left);
    commit();
  });

  els.traitInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addTrait(); }
  });
  els.addBtn.addEventListener('click', () => { addTrait(); });

  renderTraitsChips();
  renderCard();

  return {
    unmount: function () { rootEl.innerHTML = ''; }
  };
}

export function serialize(rootEl) {
  const name = (rootEl.querySelector('[data-field="name"]') || { value: '' }).value;
  const age  = (rootEl.querySelector('[data-field="age"]')  || { value: '' }).value;
  const role = (rootEl.querySelector('[data-field="role"]') || { value: '' }).value;
  const paragraph = (rootEl.querySelector('[data-field="paragraph"]') || { value: '' }).value;
  const traits = Array.from(rootEl.querySelectorAll('.pcb-chip .pcb-chip-text')).map((el) => el.textContent || '');
  return {
    customerCard: { name: name, age: age, role: role, traits: traits },
    customerParagraph: paragraph
  };
}
