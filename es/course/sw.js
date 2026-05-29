/**
 * Abre las puertas — service worker no-op.
 *
 * Alcance: /es/course/ solamente. Este service worker existe
 * únicamente para satisfacer la heurística de instalación "Añadir
 * a pantalla de inicio" de Safari en iOS — NO cachea lecciones, NO
 * sirve contenido sin conexión, y NO intercepta ningún fetch.
 *
 * La postura del sitio entero "sin fetch" se preserva: este worker
 * no tiene manejador del evento fetch.
 *
 * Documentado como el único service worker del sitio en
 * data/security-claims.json.
 */

self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});
