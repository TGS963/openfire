export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'array'
  | 'map'
  | 'timestamp'
  | 'geopoint'
  | 'reference';

export function detectFieldType(value: unknown): FieldType {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.__type__ === 'timestamp') return 'timestamp';
    if (obj.__type__ === 'geopoint') return 'geopoint';
    if (obj.__type__ === 'reference') return 'reference';
    return 'map';
  }

  return 'string';
}

export function defaultValueForType(type: FieldType): unknown {
  switch (type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'null':
      return null;
    case 'array':
      return [];
    case 'map':
      return {};
    case 'timestamp':
      return { __type__: 'timestamp', seconds: 0, nanos: 0 };
    case 'geopoint':
      return { __type__: 'geopoint', latitude: 0, longitude: 0 };
    case 'reference':
      return { __type__: 'reference', path: '' };
  }
}

export function setValueAtPath(
  data: Record<string, unknown>,
  path: (string | number)[],
  value: unknown,
): Record<string, unknown> {
  if (path.length === 0) return data;
  if (path.length === 1) {
    return { ...data, [path[0]]: value };
  }

  const [head, ...rest] = path;
  const child = data[head];

  if (Array.isArray(child)) {
    const newChild = [...child];
    const idx = typeof rest[0] === 'number' ? rest[0] : parseInt(String(rest[0]), 10);
    if (rest.length === 1) {
      newChild[idx] = value;
    } else {
      newChild[idx] = setValueAtPath(
        newChild[idx] as Record<string, unknown>,
        rest.slice(1),
        value,
      );
    }
    return { ...data, [head]: newChild };
  }

  return {
    ...data,
    [head]: setValueAtPath((child ?? {}) as Record<string, unknown>, rest, value),
  };
}

export function deleteValueAtPath(
  data: Record<string, unknown>,
  path: (string | number)[],
): Record<string, unknown> {
  if (path.length === 0) return data;

  if (path.length === 1) {
    const key = path[0];
    const { [key]: _, ...rest } = data;
    return rest;
  }

  const [head, ...remaining] = path;
  const child = data[head];

  if (Array.isArray(child) && remaining.length === 1) {
    const idx = typeof remaining[0] === 'number' ? remaining[0] : parseInt(String(remaining[0]), 10);
    const newChild = [...child.slice(0, idx), ...child.slice(idx + 1)];
    return { ...data, [head]: newChild };
  }

  if (typeof child === 'object' && child !== null) {
    return {
      ...data,
      [head]: deleteValueAtPath(child as Record<string, unknown>, remaining),
    };
  }

  return data;
}
