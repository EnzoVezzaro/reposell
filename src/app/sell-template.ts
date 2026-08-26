/**
 * The built Vue sell page template from @reposell/sell.
 * Contains __REPOSELL_DATA__ and __JSON_LD__ placeholders
 * that get replaced with actual product data at build time.
 *
 * @reposell/sell is a dependency of this package. The template lives at
 * node_modules/@reposell/sell/dist-sell/index.html — resolved via
 * import.meta.url relative to this file's compiled location.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** This file's directory in the compiled CLI. */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Get the path to the built sell template HTML */
export function getSellTemplatePath(): string {
  // This file is at: <cli-root>/dist/app/sell-template.js
  // @reposell/sell is at: <cli-root>/node_modules/@reposell/sell/dist-sell/index.html
  // So: go up 2 dirs from dist/app/ to cli-root, then into node_modules
  const cliRoot = path.resolve(__dirname, '..', '..')
  return path.join(cliRoot, 'node_modules', '@reposell', 'sell', 'dist-sell', 'index.html')
}

/** Read the raw sell template HTML */
export function readSellTemplate(): string {
  return readFileSync(getSellTemplatePath(), 'utf-8')
}
