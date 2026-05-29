/**
 * Generator template: README.md.
 *
 * Three-section deploy instructions, bilingual. Reads the operator's
 * deployTarget context key (set in L15) to highlight host-specific
 * steps; falls back to "all three" when no preference is saved.
 */

import { pickStrings } from './shared.js';

// Strip the small set of markdown-active characters that would break
// the README when interpolated into headers or inline contexts:
// backticks (code spans), brackets (links/images), pipes (tables),
// asterisks/underscores (emphasis), and angle brackets (autolinks +
// HTML passthrough). Operators won't type these in their restaurant
// name, but a stray copy/paste shouldn't corrupt the README.
function mdSafe(s) {
  return String(s == null ? '' : s).replace(/[`*_\[\]<>|#]/g, '');
}

const HOSTS = {
  cloudflare: {
    en: {
      title: 'Cloudflare Pages',
      steps: [
        'Sign up at dash.cloudflare.com/sign-up.',
        'In the dashboard: Workers & Pages → Create → Pages → Upload assets.',
        'Drag this folder onto the upload area. Wait ~30 seconds.',
        'Visit the generated URL (something.pages.dev). Test on your phone.',
        'To use your own domain: Custom domains → enter your domain → follow the CNAME instructions.'
      ]
    },
    es: {
      title: 'Cloudflare Pages',
      steps: [
        'Crea cuenta en dash.cloudflare.com/sign-up.',
        'En el panel: Workers & Pages → Create → Pages → Upload assets.',
        'Arrastra esta carpeta sobre el área de subida. Espera ~30 segundos.',
        'Visita la URL generada (algo.pages.dev). Pruébala en tu teléfono.',
        'Para usar tu propio dominio: Custom domains → ingresa tu dominio → sigue las instrucciones del CNAME.'
      ]
    }
  },
  netlify: {
    en: {
      title: 'Netlify',
      steps: [
        'Open app.netlify.com/drop in your browser.',
        'Drag this folder onto the drop area. ~15 seconds and your site is live.',
        'Click "Claim site" → sign in → rename the site to your-restaurant.',
        'To use your own domain: Domain management → Add a custom domain → follow the DNS instructions.',
        'Optional: Provision the free Let\'s Encrypt certificate (one click in HTTPS settings).'
      ]
    },
    es: {
      title: 'Netlify',
      steps: [
        'Abre app.netlify.com/drop en tu navegador.',
        'Arrastra esta carpeta sobre el área de soltado. ~15 segundos y tu sitio está en vivo.',
        'Haz clic en "Claim site" → inicia sesión → renombra el sitio a tu-restaurante.',
        'Para usar tu propio dominio: Domain management → Add a custom domain → sigue las instrucciones de DNS.',
        'Opcional: Aprovisiona el certificado gratuito de Let\'s Encrypt (un clic en HTTPS settings).'
      ]
    }
  },
  vercel: {
    en: {
      title: 'Vercel',
      steps: [
        'Sign up at vercel.com/signup.',
        'Easiest path: install the CLI with `npm i -g vercel`, cd into this folder, run `vercel`, accept defaults.',
        'Dashboard alternative: Add New → Project → search for HTML template.',
        'To use your own domain: Project → Settings → Domains → enter your domain → follow the DNS instructions.',
        'Note: Vercel\'s free tier carve-out applies to commercial sites earning >$1k/mo. Restaurant websites rarely hit this.'
      ]
    },
    es: {
      title: 'Vercel',
      steps: [
        'Crea cuenta en vercel.com/signup.',
        'Camino más fácil: instala la CLI con `npm i -g vercel`, haz cd dentro de esta carpeta, ejecuta `vercel`, acepta los defaults.',
        'Alternativa por panel: Add New → Project → busca el template HTML.',
        'Para usar tu propio dominio: Project → Settings → Domains → ingresa tu dominio → sigue las instrucciones de DNS.',
        'Nota: La excepción del nivel gratuito de Vercel aplica a sitios comerciales que ganan más de $1k/mes. Los sitios de restaurantes rara vez llegan a eso.'
      ]
    }
  }
};

function renderHostBlock(key, locale) {
  const block = HOSTS[key] && HOSTS[key][locale];
  if (!block) return '';
  const lines = ['## ' + block.title, ''];
  block.steps.forEach((s, i) => lines.push((i + 1) + '. ' + s));
  lines.push('');
  return lines.join('\n');
}

export function renderReadme(state, opts) {
  const { locale } = pickStrings(opts);
  const profile = (state && state.restaurantProfile) || {};
  const name = mdSafe(profile.name) || (locale === 'es' ? 'tu restaurante' : 'your restaurant');
  const deployTarget = (state && state.deployTarget) || '';

  const hostsToShow = (deployTarget && HOSTS[deployTarget]) ? [deployTarget] : ['cloudflare', 'netlify', 'vercel'];

  const intro = locale === 'es'
    ? [
        '# El sitio de ' + name,
        '',
        'Este sitio se generó desde el bootcamp Open the Doors de Muntin Digital (muntin.digital/es/course/). Es HTML + CSS puro — sin framework, sin JavaScript, sin servidor. Se despliega en cualquier host de archivos estáticos.',
        '',
        '## Qué hay aquí',
        '',
        '- `index.html` — página de inicio',
        '- `menu.html` — página del menú',
        '- `about.html` — acerca de',
        '- `contact.html` — dirección, teléfono, horarios',
        '- `sitemap.xml` — sitemap para Google',
        '- `robots.txt` — permite todos los rastreadores',
        '',
        '## Cómo desplegar',
        ''
      ].join('\n')
    : [
        '# ' + name + "'s site",
        '',
        'This site was generated by the Open the Doors bootcamp at Muntin Digital (muntin.digital/course/). It is plain HTML + CSS — no framework, no JavaScript, no server. It deploys to any static-file host.',
        '',
        '## What\'s here',
        '',
        '- `index.html` — home page',
        '- `menu.html` — menu',
        '- `about.html` — about',
        '- `contact.html` — address, phone, hours',
        '- `sitemap.xml` — sitemap for Google',
        '- `robots.txt` — allows all crawlers',
        '',
        '## How to deploy',
        ''
      ].join('\n');

  const hostBlocks = hostsToShow.map((h) => renderHostBlock(h, locale)).join('\n');

  const outro = locale === 'es'
    ? [
        '',
        '## Cómo volver a generar',
        '',
        'Cuando cambies algo (nuevo plato, horario nuevo, foto nueva), regresa al generador en muntin.digital/es/course/m4-launch/generator/ — todos tus datos están guardados en tu navegador. Descarga el ZIP nuevo, sobreescribe estos archivos en tu host. Toma cerca de cinco minutos.',
        '',
        '## Soporte',
        '',
        '¿Necesitas ayuda? Don lee cada mensaje: muntin.digital/es/window/',
        ''
      ].join('\n')
    : [
        '',
        '## How to re-generate',
        '',
        'When you change anything (a new dish, new hours, new photo), come back to the generator at muntin.digital/course/m4-launch/generator/ — all your data is saved in your browser. Download the new ZIP, overwrite these files on your host. Takes about five minutes.',
        '',
        '## Support',
        '',
        'Need help? Don reads every message: muntin.digital/window/',
        ''
      ].join('\n');

  return intro + hostBlocks + outro;
}
