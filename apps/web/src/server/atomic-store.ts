import { mkdir, readFile, rename, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const registry = globalThis as typeof globalThis & { __lingoflowWriteQueues?: Map<string, Promise<unknown>> };
const queues = registry.__lingoflowWriteQueues ??= new Map<string, Promise<unknown>>();

/** Local single-process persistence; replace with database transactions before deployment. */
export class AtomicJsonStore<T> {
  readonly filename: string;
  readonly empty: () => T;
  readonly validate: (value: unknown) => value is T;
  constructor(filename: string, empty: () => T, validate: (value: unknown) => value is T) { this.filename=filename;this.empty=empty;this.validate=validate; }
  private async readDisk(): Promise<T> {
    try {
      const value: unknown = JSON.parse(await readFile(this.filename, 'utf8'));
      if (!this.validate(value)) throw new Error('invalid_local_store');
      return value;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return this.empty();
      throw error;
    }
  }
  async read(): Promise<T> {
    await (queues.get(this.filename) ?? Promise.resolve()).catch(() => undefined);
    return this.readDisk();
  }
  async mutate<R>(change: (value: T) => R | Promise<R>): Promise<R> {
    const operation = (queues.get(this.filename) ?? Promise.resolve()).catch(() => undefined).then(async () => {
      const value = await this.readDisk();
      const result = await change(value);
      await mkdir(path.dirname(this.filename), { recursive: true, mode: 0o700 });
      const temporary = `${this.filename}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, JSON.stringify(value, null, 2), { mode: 0o600, flag: 'wx' });
        await rename(temporary, this.filename);
      } finally {
        await rm(temporary, { force: true });
      }
      return result;
    });
    queues.set(this.filename, operation);
    return operation;
  }
}
