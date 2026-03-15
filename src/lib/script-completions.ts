import type { Monaco } from '@monaco-editor/react';

type CompletionItem = {
  label: string;
  insertText: string;
  detail: string;
  kind: 'Function' | 'Method';
};

export function getDbCompletionItems(): CompletionItem[] {
  return [
    {
      label: 'db.collection()',
      insertText: 'db.collection("${1:collectionPath}")',
      detail: 'Get a collection reference',
      kind: 'Function',
    },
    {
      label: '.where()',
      insertText: '.where("${1:field}", "${2:==}", ${3:value})',
      detail: 'Add a query filter',
      kind: 'Method',
    },
    {
      label: '.doc()',
      insertText: '.doc("${1:documentId}")',
      detail: 'Get a document reference',
      kind: 'Method',
    },
    {
      label: '.get()',
      insertText: '.get()',
      detail: 'Fetch documents or a single document',
      kind: 'Method',
    },
    {
      label: '.set()',
      insertText: '.set(${1:data})',
      detail: 'Set document data',
      kind: 'Method',
    },
    {
      label: '.delete()',
      insertText: '.delete()',
      detail: 'Delete a document',
      kind: 'Method',
    },
    {
      label: 'console.log()',
      insertText: 'console.log(${1:value})',
      detail: 'Log to output panel',
      kind: 'Function',
    },
  ];
}

export function registerDbCompletions(monaco: Monaco) {
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems(
      model: { getWordUntilPosition: (pos: { lineNumber: number; column: number }) => { startColumn: number; endColumn: number } },
      position: { lineNumber: number; column: number },
    ) {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const items = getDbCompletionItems();
      return {
        suggestions: items.map((item) => ({
          label: item.label,
          kind:
            item.kind === 'Function'
              ? monaco.languages.CompletionItemKind.Function
              : monaco.languages.CompletionItemKind.Method,
          insertText: item.insertText,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          detail: item.detail,
          range,
        })),
      };
    },
  });
}
