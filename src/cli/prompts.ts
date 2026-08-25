/**
 * Zero-dependency interactive prompts (readline) with input buffering.
 *
 * Piped/scripted input often arrives as one chunk, faster than the wizard
 * asks questions — and readline's question() drops any extra lines that ride
 * along in the same tick. This wrapper never uses question(): every line is
 * pushed into a FIFO queue and answers are consumed one at a time.
 * Interactive sessions behave like normal prompts.
 */

import { createInterface, type Interface } from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

export interface ChooseOption<T = string> {
  label: string;
  hint?: string;
  value: T;
}

export class Prompter {
  private readonly rl: Interface;
  private readonly queue: string[] = [];
  private waiter?: { resolve: (line: string) => void; reject: (error: Error) => void };
  private closed = false;

  constructor() {
    this.rl = createInterface({ input, output });
    this.rl.on('line', (line: string) => {
      const waiting = this.waiter;
      if (waiting !== undefined) {
        this.waiter = undefined;
        waiting.resolve(line);
      } else {
        this.queue.push(line);
      }
    });
    this.rl.on('close', () => {
      this.closed = true;
      const waiting = this.waiter;
      this.waiter = undefined;
      waiting?.reject(new Error('input ended before the wizard finished'));
    });
    this.rl.on('error', () => {
      /* keep the process alive on TTY quirks */
    });
  }

  /** Free-text question with an optional default shown as [default]. */
  async ask(question: string, fallback = ''): Promise<string> {
    const suffix = fallback.length > 0 ? ` [${fallback}]` : '';
    const answer = await this.read(`${question}${suffix}: `);
    const trimmed = answer.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  /** y/n confirmation; Enter accepts the default. */
  async confirm(question: string, defaultYes = true): Promise<boolean> {
    const hint = defaultYes ? '[Y/n]' : '[y/N]';
    for (;;) {
      const answer = (await this.read(`${question} ${hint}: `)).trim().toLowerCase();
      if (answer.length === 0) return defaultYes;
      if (answer === 'y' || answer === 'yes') return true;
      if (answer === 'n' || answer === 'no') return false;
      output.write('  Please answer yes or no.\n');
    }
  }

  /** Numbered single-select menu; Enter picks the first option. */
  async choose<T = string>(title: string, options: Array<ChooseOption<T>>): Promise<T> {
    output.write(`${title}\n`);
    options.forEach((option, index) => {
      const hint = option.hint !== undefined ? ` \u2014 ${option.hint}` : '';
      output.write(`  ${index + 1}. ${option.label}${hint}\n`);
    });
    for (;;) {
      const answer = (await this.read(`Choose 1-${options.length} [1]: `)).trim();
      if (answer.length === 0) return options[0]!.value;
      const index = Number(answer);
      if (Number.isInteger(index) && index >= 1 && index <= options.length) {
        return options[index - 1]!.value;
      }
      output.write('  Invalid choice, try again.\n');
    }
  }

  close(): void {
    this.rl.close();
  }

  private async read(prompt: string): Promise<string> {
    // Drain queued answers first — input may have finished arriving (closed)
    // while answers were still waiting to be asked.
    const queued = this.queue.shift();
    if (queued !== undefined) {
      // Replay an early-arriving answer so the transcript reads naturally.
      output.write(`${prompt}${queued}\n`);
      return queued;
    }
    if (this.closed) throw new Error('input ended before the wizard finished');
    output.write(prompt);
    return new Promise<string>((resolve, reject) => {
      this.waiter = { resolve, reject };
    });
  }
}
