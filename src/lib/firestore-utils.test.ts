import { describe, it, expect } from 'vitest';

import { normalizeFirestorePath, collectionFromDocPath } from './firestore-utils';

describe('normalizeFirestorePath', () => {
  it('returns a normal path unchanged', () => {
    expect(normalizeFirestorePath('users/doc1')).toBe('users/doc1');
  });

  it('strips leading and trailing slashes', () => {
    expect(normalizeFirestorePath('/users/doc1/')).toBe('users/doc1');
  });

  it('collapses double slashes', () => {
    expect(normalizeFirestorePath('users//doc1')).toBe('users/doc1');
  });

  it('trims spaces from segments', () => {
    expect(normalizeFirestorePath(' users / doc1 ')).toBe('users/doc1');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeFirestorePath('')).toBe('');
  });

  it('handles a single segment', () => {
    expect(normalizeFirestorePath('users')).toBe('users');
  });

  it('handles deep nested paths', () => {
    expect(normalizeFirestorePath('users/123/posts/456/comments')).toBe(
      'users/123/posts/456/comments',
    );
  });
});

describe('collectionFromDocPath', () => {
  it('returns the collection for a document path', () => {
    expect(collectionFromDocPath('users/doc1')).toBe('users');
  });

  it('returns the parent path for a nested document', () => {
    expect(collectionFromDocPath('users/123/posts/456')).toBe('users/123/posts');
  });

  it('returns empty string for a single segment', () => {
    expect(collectionFromDocPath('users')).toBe('');
  });

  it('returns empty string for empty input', () => {
    expect(collectionFromDocPath('')).toBe('');
  });

  it('returns the parent path for a deep path', () => {
    expect(collectionFromDocPath('a/b/c/d/e')).toBe('a/b/c/d');
  });
});
