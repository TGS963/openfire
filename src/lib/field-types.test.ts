import { describe, it, expect } from 'vitest';

import {
  detectFieldType,
  defaultValueForType,
  setValueAtPath,
  deleteValueAtPath,
} from '@/lib/field-types';

describe('detectFieldType', () => {
  it('detects string', () => {
    expect(detectFieldType('hello')).toBe('string');
  });

  it('detects number', () => {
    expect(detectFieldType(42)).toBe('number');
    expect(detectFieldType(3.14)).toBe('number');
  });

  it('detects boolean', () => {
    expect(detectFieldType(true)).toBe('boolean');
    expect(detectFieldType(false)).toBe('boolean');
  });

  it('detects null', () => {
    expect(detectFieldType(null)).toBe('null');
  });

  it('detects undefined as null', () => {
    expect(detectFieldType(undefined)).toBe('null');
  });

  it('detects array', () => {
    expect(detectFieldType([1, 2, 3])).toBe('array');
    expect(detectFieldType([])).toBe('array');
  });

  it('detects plain object as map', () => {
    expect(detectFieldType({ a: 1 })).toBe('map');
    expect(detectFieldType({})).toBe('map');
  });

  it('detects timestamp object', () => {
    expect(detectFieldType({ __type__: 'timestamp', seconds: 1000, nanos: 0 })).toBe('timestamp');
  });

  it('detects geopoint object', () => {
    expect(detectFieldType({ __type__: 'geopoint', latitude: 40.7, longitude: -74.0 })).toBe(
      'geopoint',
    );
  });

  it('detects reference object', () => {
    expect(detectFieldType({ __type__: 'reference', path: 'users/doc1' })).toBe('reference');
  });
});

describe('defaultValueForType', () => {
  it('returns correct defaults', () => {
    expect(defaultValueForType('string')).toBe('');
    expect(defaultValueForType('number')).toBe(0);
    expect(defaultValueForType('boolean')).toBe(false);
    expect(defaultValueForType('null')).toBeNull();
    expect(defaultValueForType('array')).toEqual([]);
    expect(defaultValueForType('map')).toEqual({});
    expect(defaultValueForType('timestamp')).toEqual({ __type__: 'timestamp', seconds: 0, nanos: 0 });
    expect(defaultValueForType('geopoint')).toEqual({ __type__: 'geopoint', latitude: 0, longitude: 0 });
    expect(defaultValueForType('reference')).toEqual({ __type__: 'reference', path: '' });
  });
});

describe('setValueAtPath', () => {
  it('sets top-level value', () => {
    const data = { name: 'Alice', age: 30 };
    const result = setValueAtPath(data, ['name'], 'Bob');
    expect(result).toEqual({ name: 'Bob', age: 30 });
    expect(data.name).toBe('Alice'); // immutable
  });

  it('sets nested value', () => {
    const data = { user: { name: 'Alice' } };
    const result = setValueAtPath(data, ['user', 'name'], 'Bob');
    expect(result).toEqual({ user: { name: 'Bob' } });
  });

  it('sets value in array', () => {
    const data = { items: ['a', 'b', 'c'] };
    const result = setValueAtPath(data, ['items', 1], 'x');
    expect(result).toEqual({ items: ['a', 'x', 'c'] });
  });

  it('creates nested structure if needed', () => {
    const data = { a: {} };
    const result = setValueAtPath(data, ['a', 'b'], 'new');
    expect(result).toEqual({ a: { b: 'new' } });
  });
});

describe('deleteValueAtPath', () => {
  it('deletes top-level key', () => {
    const data = { name: 'Alice', age: 30 };
    const result = deleteValueAtPath(data, ['name']);
    expect(result).toEqual({ age: 30 });
    expect(data).toEqual({ name: 'Alice', age: 30 }); // immutable
  });

  it('deletes nested key', () => {
    const data = { user: { name: 'Alice', age: 30 } };
    const result = deleteValueAtPath(data, ['user', 'name']);
    expect(result).toEqual({ user: { age: 30 } });
  });

  it('deletes array element', () => {
    const data = { items: ['a', 'b', 'c'] };
    const result = deleteValueAtPath(data, ['items', 1]);
    expect(result).toEqual({ items: ['a', 'c'] });
  });

  it('returns data unchanged for empty path', () => {
    const data = { a: 1 };
    const result = deleteValueAtPath(data, []);
    expect(result).toEqual({ a: 1 });
  });
});
