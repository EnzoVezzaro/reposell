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

  it('wires the wizard payment link into buy CTAs', async () => {
    const result = await generateSellSite(cwd, {
      productName: 'acme-tool',
      paymentLink: 'https://buy.stripe.com/test_wizard',
    });
    expect(result.paymentLinkWired).toBe(true);
    const html = await fs.readFile(path.join(cwd, 'sell', 'index.html'), 'utf8');
    expect(html).toContain('href="https://buy.stripe.com/test_wizard"');
    expect(html).not.toContain('rs-btn--disabled');
  });

  it('renders a disabled CTA with guidance when no link is known', async () => {
    const result = await generateSellSite(cwd, { productName: 'acme-tool' });
    expect(result.paymentLinkWired).toBe(false);
    const html = await fs.readFile(path.join(cwd, 'sell', 'index.html'), 'utf8');
    expect(html).toContain('rs-btn--disabled');
    expect(html).toContain('reposell sell init --link');
  });

  it('personalizes .reposell/storefront.json for the Studio', async () => {
    await generateSellSite(cwd, { productName: 'acme-tool' });
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
