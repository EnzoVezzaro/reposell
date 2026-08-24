/**
 * Theme loader — exclusive identity layers.
 *
 * Each theme owns its own stylesheet (tokens, fonts, shapes, chrome).
 * Layers are activated on demand; every rule is scoped under
 * html[data-theme='<id>'], so an inactive layer can never style the
 * page even while its chunk stays cached. No cross-theme mixing.
 */

const REGISTRY = {
  security: () => import('./security/theme.css'),
  shadcn: () => import('./shadcn/theme.css'),
  canvas: () => import('./canvas/theme.css'),
  cartoon: () => import('./cartoon/theme.css'),
}

export const THEME_IDS = Object.keys(REGISTRY)

/** Activates a theme's identity layer. Idempotent per session. */
export function loadTheme(id) {
  const load = REGISTRY[id]
  if (load === undefined) return Promise.resolve()
  return load().catch((error) => {
    console.warn(`theme "${id}" failed to load:`, error)
  })
}
