import { describe, it, expect, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { generateSellSite, renderSellTemplate } from './sell.js';

let cwd: string;

beforeEach(async () => {
  cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'reposell-sell-'));
});

describe('generateSellSite', () => {
  it('writes the standalone template and storefront document', async () => {
    const result = await generateSellSite(cwd, { productName: 'acme-tool' });
    expect(result.written.sort()).toEqual([
      '.reposell/storefront.json',
      'sell/index.html',
      'sell/scripts.js',
      'sell/styles.css',
    ]);
    const html = await fs.readFile(path.join(cwd, 'sell', 'index.html'), 'utf8');
    expect(html).toContain('acme-tool');
  });

  it('keeps the buy CTA disabled until a release is available, link on record', async () => {
    const result = await generateSellSite(cwd, {
      productName: 'acme-tool',
      paymentLink: 'https://buy.stripe.com/test_wizard',
    });
    expect(result.paymentLinkWired).toBe(true);
    const html = await fs.readFile(path.join(cwd, 'sell', 'index.html'), 'utf8');
    // No published release yet — checkout must not be live.
    expect(html).toContain('rs-btn--disabled');
    expect(html).not.toMatch(/href="https:\/\/buy\.stripe\.com/);
    expect(html).toContain('Payment Link on record: https://buy.stripe.com/test_wizard');
  });

  it('never exposes the source repository to buyers', async () => {
    const { html } = renderSellTemplate({ productName: 'acme-tool' });
    expect(html).not.toContain('github.com');
    expect(html).not.toContain('View repository');
    expect(html).not.toContain('See repository');
    expect(html.toLowerCase()).toContain('fork');
  });

  it('matches the reposell landing identity', async () => {
    const result = await generateSellSite(cwd, { productName: 'acme-tool' });
    expect(result.written).toContain('sell/styles.css');
    const css = await fs.readFile(path.join(cwd, 'sell', 'styles.css'), 'utf8');
    expect(css).toContain('#0af188'); // signal green
    expect(css).toContain('#0a0a0a'); // ink background
    expect(css).toContain('Syne');
    expect(css).toContain('Oxanium');
    expect(css).toContain('"Geist Mono"');
  });

  it('renders a disabled CTA with publish guidance when no link is known', async () => {
    const result = await generateSellSite(cwd, { productName: 'acme-tool' });
    expect(result.paymentLinkWired).toBe(false);
    const html = await fs.readFile(path.join(cwd, 'sell', 'index.html'), 'utf8');
    expect(html).toContain('rs-btn--disabled');
    expect(html).toContain('reposell publish v0.1.0');
  });

  it('personalizes .reposell/storefront.json for the Studio', async () => {
    await generateSellSite(cwd, { productName: 'acme-tool' });
    // SAFETY: JSON.parse returns any; the generated storefront.json is produced
    // by generateSellSite above, and the assertions below pin its schema.
    const document = JSON.parse(
      await fs.readFile(path.join(cwd, '.reposell', 'storefront.json'), 'utf8'),
    ) as { schema: string; product: { name: string } };
    expect(document.schema).toBe('reposell-storefront');
    expect(document.product.name).toBe('acme-tool');
  });

  it('never overwrites existing files', async () => {
    await fs.mkdir(path.join(cwd, 'sell'), { recursive: true });
    await fs.writeFile(path.join(cwd, 'sell', 'index.html'), '<!-- custom -->');
    const second = await generateSellSite(cwd, { productName: 'acme-tool' });
    expect(second.written).not.toContain('sell/index.html');
    expect(await fs.readFile(path.join(cwd, 'sell', 'index.html'), 'utf8')).toBe('<!-- custom -->');
  });
});

describe('renderSellTemplate', () => {
  it('escapes product names in HTML output', () => {
    const { html } = renderSellTemplate({ productName: '<script>x</script>' });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
