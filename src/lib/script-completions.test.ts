import { describe, it, expect } from 'vitest';

import { getDbCompletionItems } from '@/lib/script-completions';

describe('script-completions', () => {
  it('returns db.collection() completion', () => {
    const items = getDbCompletionItems();
    const collectionItem = items.find((i) => i.label === 'db.collection()');
    expect(collectionItem).toBeDefined();
    expect(collectionItem!.insertText).toContain('db.collection(');
  });

  it('returns .where() completion', () => {
    const items = getDbCompletionItems();
    const whereItem = items.find((i) => i.label === '.where()');
    expect(whereItem).toBeDefined();
  });

  it('returns .doc() completion', () => {
    const items = getDbCompletionItems();
    const docItem = items.find((i) => i.label === '.doc()');
    expect(docItem).toBeDefined();
  });

  it('returns .get(), .set(), .delete() completions', () => {
    const items = getDbCompletionItems();
    expect(items.find((i) => i.label === '.get()')).toBeDefined();
    expect(items.find((i) => i.label === '.set()')).toBeDefined();
    expect(items.find((i) => i.label === '.delete()')).toBeDefined();
  });

  it('returns console.log completion', () => {
    const items = getDbCompletionItems();
    expect(items.find((i) => i.label === 'console.log()')).toBeDefined();
  });
});
