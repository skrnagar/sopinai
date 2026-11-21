export type CodeLanguage =
  | 'typescript'
  | 'python'
  | 'json'
  | 'yaml'
  | 'http'
  | 'bash'
  | 'sql'
  | 'markdown'
  | 'sopin-spec'
  | 'text';

export type TokenType =
  | 'comment'
  | 'control'
  | 'keyword'
  | 'type'
  | 'function'
  | 'string'
  | 'number'
  | 'boolean'
  | 'property'
  | 'decorator'
  | 'operator'
  | 'punctuation'
  | 'plain';

export interface CodeToken {
  type: TokenType;
  value: string;
}

const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  typescript: 'TypeScript',
  python: 'Python',
  json: 'JSON',
  yaml: 'YAML',
  http: 'HTTP',
  bash: 'Shell',
  sql: 'SQL',
  markdown: 'Markdown',
  'sopin-spec': 'SOPIN Spec',
  text: 'Plain Text',
};

export function getLanguageDisplayName(language: CodeLanguage): string {
  return LANGUAGE_LABELS[language] ?? 'Code';
}

export function detectCodeLanguage(label?: string, code: string = ''): CodeLanguage {
  const lbl = (label || '').toLowerCase();

  if (/\.(tsx?|jsx?|mjs|cjs)\b/.test(lbl) || lbl.includes('typescript') || lbl.includes('javascript')) {
    return 'typescript';
  }
  if (/\.py\b/.test(lbl) || lbl.includes('python')) {
    return 'python';
  }
  if (/\.json\b/.test(lbl) || lbl === 'json') {
    return 'json';
  }
  if (/\.ya?ml\b/.test(lbl) || lbl.includes('yaml')) {
    return 'yaml';
  }
  if (/\.http\b/.test(lbl) || lbl.includes('http')) {
    return 'http';
  }
  if (/\.sql\b/.test(lbl) || lbl === 'sql') {
    return 'sql';
  }
  if (/\.(sh|bash|zsh)\b/.test(lbl) || /\b(cli|bash|shell|command)\b/.test(lbl)) {
    return 'bash';
  }
  if (/\.(md|mdx)\b/.test(lbl) || lbl.includes('markdown')) {
    return 'markdown';
  }
  if (
    lbl.includes('intent spec') ||
    lbl.includes('flow blueprint') ||
    lbl.includes('state graph') ||
    lbl.includes('topology')
  ) {
    return 'sopin-spec';
  }

  const trimmed = code.trim();
  if (!trimmed) return 'text';

  if (/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+\/\S*/.test(trimmed)) {
    return 'http';
  }
  if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && /"[^"\\]*"\s*:/.test(trimmed)) {
    return 'json';
  }
  if (
    /(^|\n)\s*(def\s+\w+\s*\(|class\s+\w+\s*[:(]|from\s+[\w.]+\s+import\s+|@\w+(\.\w+)*\s*\n)/.test(trimmed) ||
    (/\b(True|False|None|elif)\b/.test(trimmed) && !/;/.test(trimmed))
  ) {
    return 'python';
  }
  if (
    /\b(import\s+[\w{*]|export\s+(default|const|let|async|function|interface|type|class)|const\s+\w+\s*=|=>|:\s*(string|number|boolean)\b)/.test(
      trimmed
    )
  ) {
    return 'typescript';
  }
  if (/\b(SELECT\s+[\s\S]+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|CREATE\s+TABLE)\b/i.test(trimmed)) {
    return 'sql';
  }
  if (
    /(^|\n)\s*(Goal|Constraints|Generated Graph|flow|nodes|graph|edges|state):/.test(trimmed) ||
    trimmed.includes('->')
  ) {
    return 'sopin-spec';
  }
  if (/(^|\n)\s*[a-zA-Z_][\w-]*:\s*(\S|$)/.test(trimmed) && !trimmed.includes('{')) {
    return 'yaml';
  }
  if (/^#{1,6}\s+/.test(trimmed)) {
    return 'markdown';
  }
  if (/^(\$\s*)?(sopin|npm|npx|pnpm|yarn|curl|python3?|node|git|docker)\s+/.test(trimmed)) {
    return 'bash';
  }

  return 'text';
}

const TS_CONTROL = new Set([
  'import',
  'export',
  'from',
  'as',
  'default',
  'return',
  'if',
  'else',
  'switch',
  'case',
  'break',
  'continue',
  'for',
  'while',
  'do',
  'try',
  'catch',
  'finally',
  'throw',
  'await',
  'async',
  'yield',
]);

const TS_KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'class',
  'interface',
  'type',
  'enum',
  'extends',
  'implements',
  'new',
  'typeof',
  'keyof',
  'in',
  'of',
  'instanceof',
  'void',
  'readonly',
  'public',
  'private',
  'protected',
  'satisfies',
  'declare',
  'module',
  'namespace',
]);

const TS_TYPES = new Set([
  'string',
  'number',
  'boolean',
  'object',
  'unknown',
  'never',
  'any',
  'Record',
  'Promise',
  'Array',
  'Partial',
  'Required',
  'Readonly',
  'Date',
  'Error',
  'Map',
  'Set',
]);

const TS_BOOLEANS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);

const PY_CONTROL = new Set([
  'import',
  'from',
  'as',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'break',
  'continue',
  'try',
  'except',
  'finally',
  'raise',
  'with',
  'yield',
  'async',
  'await',
  'pass',
  'match',
  'case',
]);

const PY_KEYWORDS = new Set([
  'def',
  'class',
  'lambda',
  'global',
  'nonlocal',
  'assert',
  'del',
  'and',
  'or',
  'not',
  'in',
  'is',
  'self',
  'cls',
]);

const PY_TYPES = new Set([
  'str',
  'int',
  'float',
  'bool',
  'list',
  'dict',
  'tuple',
  'set',
  'bytes',
  'Any',
  'Optional',
  'Union',
  'List',
  'Dict',
  'Tuple',
  'Sequence',
  'Callable',
]);

const PY_BUILTINS = new Set([
  'print',
  'len',
  'range',
  'isinstance',
  'issubclass',
  'enumerate',
  'zip',
  'map',
  'filter',
  'sorted',
  'super',
  'open',
  'type',
]);

const PY_BOOLEANS = new Set(['True', 'False', 'None']);

const SQL_KEYWORDS = new Set([
  'SELECT',
  'FROM',
  'WHERE',
  'INSERT',
  'INTO',
  'VALUES',
  'UPDATE',
  'SET',
  'DELETE',
  'JOIN',
  'LEFT',
  'RIGHT',
  'INNER',
  'OUTER',
  'ON',
  'GROUP',
  'BY',
  'ORDER',
  'ASC',
  'DESC',
  'LIMIT',
  'OFFSET',
  'AND',
  'OR',
  'NOT',
  'IN',
  'IS',
  'AS',
  'CREATE',
  'TABLE',
  'ALTER',
  'DROP',
  'PRIMARY',
  'KEY',
  'CASE',
  'WHEN',
  'THEN',
  'ELSE',
  'END',
  'DISTINCT',
  'HAVING',
  'RETURNING',
]);

const BASH_COMMANDS = new Set([
  'sopin',
  'npm',
  'npx',
  'pnpm',
  'yarn',
  'node',
  'tsx',
  'python',
  'python3',
  'pip',
  'curl',
  'git',
  'docker',
  'kubectl',
  'export',
  'echo',
  'cd',
  'ls',
  'cat',
  'grep',
]);

function pushToken(tokens: CodeToken[], type: TokenType, value: string): void {
  if (!value) return;
  const last = tokens[tokens.length - 1];
  if (last && last.type === type) {
    last.value += value;
  } else {
    tokens.push({ type, value });
  }
}

function isIdentStart(ch: string): boolean {
  return /[a-zA-Z_$]/.test(ch);
}

function isIdentPart(ch: string): boolean {
  return /[a-zA-Z0-9_$]/.test(ch);
}

function skipSpacesIndex(text: string, from: number): number {
  let idx = from;
  while (idx < text.length && (text[idx] === ' ' || text[idx] === '\t')) {
    idx++;
  }
  return idx;
}

function skipWhitespaceIndex(text: string, from: number): number {
  let idx = from;
  while (idx < text.length && /\s/.test(text[idx])) {
    idx++;
  }
  return idx;
}

function scanQuotedString(text: string, start: number, quote: string): number {
  let i = start + quote.length;
  while (i < text.length) {
    if (text[i] === '\\') {
      i += 2;
      continue;
    }
    if (text.startsWith(quote, i)) {
      return i + quote.length;
    }
    if (quote.length === 1 && text[i] === '\n') {
      return i;
    }
    i++;
  }
  return text.length;
}

function scanNumber(text: string, start: number): number {
  let i = start;
  if (text[i] === '-' && /[0-9]/.test(text[i + 1] || '')) {
    i++;
  }
  if (text[i] === '0' && (text[i + 1] === 'x' || text[i + 1] === 'X')) {
    i += 2;
    while (i < text.length && /[0-9a-fA-F_]/.test(text[i])) i++;
    return i;
  }
  while (i < text.length && /[0-9_]/.test(text[i])) i++;
  if (text[i] === '.' && /[0-9]/.test(text[i + 1] || '')) {
    i++;
    while (i < text.length && /[0-9_]/.test(text[i])) i++;
  }
  if ((text[i] === 'e' || text[i] === 'E') && /[0-9+-]/.test(text[i + 1] || '')) {
    i++;
    if (text[i] === '+' || text[i] === '-') i++;
    while (i < text.length && /[0-9]/.test(text[i])) i++;
  }
  return i;
}

function tokenizeTypeScript(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;
  let prevNonWs = '';

  const push = (type: TokenType, value: string) => {
    pushToken(tokens, type, value);
    const trimmed = value.trim();
    if (trimmed) {
      prevNonWs = trimmed[trimmed.length - 1];
    }
  };

  while (i < code.length) {
    const ch = code[i];

    // Whitespace
    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /\s/.test(code[j])) j++;
      pushToken(tokens, 'plain', code.slice(i, j));
      i = j;
      continue;
    }

    // Line comment
    if (ch === '/' && code[i + 1] === '/') {
      const nl = code.indexOf('\n', i);
      const end = nl === -1 ? code.length : nl;
      pushToken(tokens, 'comment', code.slice(i, end));
      i = end;
      continue;
    }

    // Block comment
    if (ch === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      const end = close === -1 ? code.length : close + 2;
      pushToken(tokens, 'comment', code.slice(i, end));
      i = end;
      continue;
    }

    // Strings (' or ")
    if (ch === '"' || ch === "'") {
      const end = scanQuotedString(code, i, ch);
      push('string', code.slice(i, end));
      i = end;
      continue;
    }

    // Template literal (`...`)
    if (ch === '`') {
      let strStart = i;
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2;
          continue;
        }
        if (code[i] === '$' && code[i + 1] === '{') {
          pushToken(tokens, 'string', code.slice(strStart, i));
          pushToken(tokens, 'punctuation', '${');
          i += 2;
          let depth = 1;
          const exprStart = i;
          while (i < code.length && depth > 0) {
            if (code[i] === '{') depth++;
            else if (code[i] === '}') depth--;
            if (depth > 0) i++;
          }
          const exprTokens = tokenizeTypeScript(code.slice(exprStart, i));
          for (const t of exprTokens) pushToken(tokens, t.type, t.value);
          if (code[i] === '}') {
            pushToken(tokens, 'punctuation', '}');
            i++;
          }
          strStart = i;
          continue;
        }
        if (code[i] === '`') {
          i++;
          push('string', code.slice(strStart, i));
          strStart = -1;
          break;
        }
        i++;
      }
      if (strStart !== -1 && strStart < code.length) {
        push('string', code.slice(strStart));
      }
      continue;
    }

    // Decorator
    if (ch === '@' && isIdentStart(code[i + 1] || '')) {
      let j = i + 2;
      while (j < code.length && (isIdentPart(code[j]) || code[j] === '.')) j++;
      push('decorator', code.slice(i, j));
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch)) {
      const end = scanNumber(code, i);
      push('number', code.slice(i, end));
      i = end;
      continue;
    }

    // Identifiers & Keywords
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < code.length && isIdentPart(code[j])) j++;
      const word = code.slice(i, j);
      const nextNonSpace = code[skipSpacesIndex(code, j)] || '';
      const afterTwo = code.slice(skipSpacesIndex(code, j), skipSpacesIndex(code, j) + 2);

      let type: TokenType = 'plain';
      if (TS_CONTROL.has(word)) {
        type = 'control';
      } else if (TS_KEYWORDS.has(word)) {
        type = 'keyword';
      } else if (TS_BOOLEANS.has(word)) {
        type = 'boolean';
      } else if (TS_TYPES.has(word)) {
        type = 'type';
      } else if (nextNonSpace === '(') {
        type = 'function';
      } else if (nextNonSpace === ':' && afterTwo !== '::' && prevNonWs !== '?') {
        type = 'property';
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        type = 'type';
      } else if (prevNonWs === '.') {
        type = 'property';
      }

      push(type, word);
      i = j;
      continue;
    }

    // Multi-char operators
    const two = code.slice(i, i + 2);
    const three = code.slice(i, i + 3);
    if (three === '===' || three === '!==' || three === '...') {
      push('operator', three);
      i += 3;
      continue;
    }
    if (
      two === '=>' ||
      two === '==' ||
      two === '!=' ||
      two === '<=' ||
      two === '>=' ||
      two === '&&' ||
      two === '||' ||
      two === '??' ||
      two === '?.'
    ) {
      push('operator', two);
      i += 2;
      continue;
    }

    if ('{}()[],;.'.includes(ch)) {
      push('punctuation', ch);
      i++;
      continue;
    }

    if ('=<>!+-*/%&|:?'.includes(ch)) {
      push('operator', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return tokens;
}

function tokenizePython(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;
  let prevWord = '';
  let prevNonWs = '';

  const push = (type: TokenType, value: string, recordWord: boolean = false) => {
    pushToken(tokens, type, value);
    const trimmed = value.trim();
    if (trimmed) {
      prevNonWs = trimmed[trimmed.length - 1];
      prevWord = recordWord ? trimmed : '';
    }
  };

  while (i < code.length) {
    const ch = code[i];

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /\s/.test(code[j])) j++;
      pushToken(tokens, 'plain', code.slice(i, j));
      i = j;
      continue;
    }

    // Comment
    if (ch === '#') {
      const nl = code.indexOf('\n', i);
      const end = nl === -1 ? code.length : nl;
      pushToken(tokens, 'comment', code.slice(i, end));
      i = end;
      continue;
    }

    // String prefixes f/r/b/u + triple or single quotes
    const prefixMatch =
      (ch === 'f' || ch === 'r' || ch === 'b' || ch === 'u' || ch === 'F' || ch === 'R') &&
      (code[i + 1] === '"' || code[i + 1] === "'");
    const quotePos = prefixMatch ? i + 1 : i;
    if (code[quotePos] === '"' || code[quotePos] === "'") {
      const q = code[quotePos];
      const triple = code.startsWith(q + q + q, quotePos) ? q + q + q : q;
      const end = scanQuotedString(code, quotePos, triple);
      push('string', code.slice(i, end));
      i = end;
      continue;
    }

    // Decorator
    if (ch === '@' && isIdentStart(code[i + 1] || '')) {
      let j = i + 2;
      while (j < code.length && (isIdentPart(code[j]) || code[j] === '.')) j++;
      push('decorator', code.slice(i, j));
      i = j;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch)) {
      const end = scanNumber(code, i);
      push('number', code.slice(i, end));
      i = end;
      continue;
    }

    // Identifiers
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < code.length && isIdentPart(code[j])) j++;
      const word = code.slice(i, j);
      const nextIdx = skipSpacesIndex(code, j);
      const nextChar = code[nextIdx] || '';
      const nextTwo = code.slice(nextIdx, nextIdx + 2);

      let type: TokenType = 'plain';
      if (PY_CONTROL.has(word)) {
        type = 'control';
      } else if (PY_KEYWORDS.has(word)) {
        type = 'keyword';
      } else if (PY_BOOLEANS.has(word)) {
        type = 'boolean';
      } else if (PY_TYPES.has(word)) {
        type = 'type';
      } else if (prevWord === 'def' || prevWord === 'class') {
        type = prevWord === 'class' ? 'type' : 'function';
      } else if (PY_BUILTINS.has(word) || nextChar === '(') {
        type = 'function';
      } else if (nextChar === '=' && nextTwo !== '==') {
        type = 'property';
      } else if (/^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
        type = 'type';
      } else if (prevNonWs === '.') {
        type = 'property';
      }

      push(type, word, true);
      i = j;
      continue;
    }

    const two = code.slice(i, i + 2);
    if (two === '->' || two === '==' || two === '!=' || two === '<=' || two === '>=' || two === '**' || two === '//') {
      push('operator', two);
      i += 2;
      continue;
    }
    if ('{}()[],;.'.includes(ch)) {
      push('punctuation', ch);
      i++;
      continue;
    }
    if ('=<>!+-*/%&|:'.includes(ch)) {
      push('operator', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeJson(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /\s/.test(code[j])) j++;
      pushToken(tokens, 'plain', code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '"') {
      const end = scanQuotedString(code, i, '"');
      const nextNonWs = code[skipWhitespaceIndex(code, end)] || '';
      pushToken(tokens, nextNonWs === ':' ? 'property' : 'string', code.slice(i, end));
      i = end;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '-' && /[0-9]/.test(code[i + 1] || ''))) {
      const end = scanNumber(code, i);
      pushToken(tokens, 'number', code.slice(i, end));
      i = end;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (word === 'true' || word === 'false' || word === 'null') {
        pushToken(tokens, 'boolean', word);
      } else {
        pushToken(tokens, 'plain', word);
      }
      i = j;
      continue;
    }

    if ('{}()[],:'.includes(ch)) {
      pushToken(tokens, 'punctuation', ch);
      i++;
      continue;
    }

    pushToken(tokens, 'plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeHttp(code: string): CodeToken[] {
  const lines = code.split('\n');
  const tokens: CodeToken[] = [];
  let inJsonBody = false;

  lines.forEach((line, idx) => {
    if (idx > 0) pushToken(tokens, 'plain', '\n');
    const trimmed = line.trim();

    if (inJsonBody || trimmed.startsWith('{') || trimmed.startsWith('[')) {
      inJsonBody = true;
      const bodyTokens = tokenizeJson(line);
      for (const t of bodyTokens) pushToken(tokens, t.type, t.value);
      return;
    }

    const reqMatch = line.match(/^(\s*)(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)(\s+)(\S+)(.*)$/);
    if (reqMatch) {
      pushToken(tokens, 'plain', reqMatch[1]);
      pushToken(tokens, 'control', reqMatch[2]);
      pushToken(tokens, 'plain', reqMatch[3]);
      pushToken(tokens, 'string', reqMatch[4]);
      if (reqMatch[5]) pushToken(tokens, 'keyword', reqMatch[5]);
      return;
    }

    const headerMatch = line.match(/^([^:\s]+)(:\s*)(.*)$/);
    if (headerMatch) {
      pushToken(tokens, 'property', headerMatch[1]);
      pushToken(tokens, 'punctuation', headerMatch[2]);
      pushToken(tokens, 'string', headerMatch[3]);
      return;
    }

    pushToken(tokens, 'plain', line);
  });

  return tokens;
}

function tokenizeYamlOrSpec(code: string, isSpec: boolean): CodeToken[] {
  const tokens: CodeToken[] = [];
  const lines = code.split('\n');

  const tokenizeInline = (segment: string) => {
    let i = 0;
    while (i < segment.length) {
      const ch = segment[i];
      if (/\s/.test(ch)) {
        let j = i + 1;
        while (j < segment.length && /\s/.test(segment[j])) j++;
        pushToken(tokens, 'plain', segment.slice(i, j));
        i = j;
        continue;
      }
      if (ch === '#') {
        pushToken(tokens, 'comment', segment.slice(i));
        break;
      }
      if (ch === '"' || ch === "'") {
        const end = scanQuotedString(segment, i, ch);
        pushToken(tokens, 'string', segment.slice(i, end));
        i = end;
        continue;
      }
      if (segment.startsWith('->', i)) {
        pushToken(tokens, 'control', '->');
        i += 2;
        continue;
      }
      if (segment.startsWith('==', i) || segment.startsWith('!=', i) || segment.startsWith('&&', i) || segment.startsWith('||', i) || segment.startsWith('<=', i) || segment.startsWith('>=', i)) {
        pushToken(tokens, 'operator', segment.slice(i, i + 2));
        i += 2;
        continue;
      }
      if (/[0-9]/.test(ch)) {
        const end = scanNumber(segment, i);
        pushToken(tokens, 'number', segment.slice(i, end));
        i = end;
        continue;
      }
      if (/[a-zA-Z_]/.test(ch)) {
        let j = i + 1;
        while (j < segment.length && /[a-zA-Z0-9_.-]/.test(segment[j])) j++;
        const word = segment.slice(i, j);
        const nextIdx = skipSpacesIndex(segment, j);
        const nextChar = segment[nextIdx] || '';

        if (word === 'true' || word === 'false' || word === 'null' || word === 'always') {
          pushToken(tokens, 'boolean', word);
        } else if (word === 'when' || word === 'then' || word === 'else' || word === 'condition') {
          pushToken(tokens, 'control', word);
        } else if (word === 'string' || word === 'boolean' || word === 'number' || /^[A-Z][a-zA-Z0-9_]*$/.test(word)) {
          pushToken(tokens, 'type', word);
        } else if (nextChar === '(') {
          pushToken(tokens, 'function', word);
        } else if (nextChar === ':') {
          pushToken(tokens, 'property', word);
        } else {
          pushToken(tokens, isSpec && word.includes('.') ? 'type' : 'plain', word);
        }
        i = j;
        continue;
      }
      if ('{}()[],:'.includes(ch)) {
        pushToken(tokens, 'punctuation', ch);
        i++;
        continue;
      }
      if ('=<>!&|+-*/'.includes(ch)) {
        pushToken(tokens, 'operator', ch);
        i++;
        continue;
      }
      pushToken(tokens, 'plain', ch);
      i++;
    }
  };

  lines.forEach((line, idx) => {
    if (idx > 0) pushToken(tokens, 'plain', '\n');

    const trimmed = line.trim();
    if (!trimmed) {
      pushToken(tokens, 'plain', line);
      return;
    }

    if (trimmed.startsWith('#')) {
      pushToken(tokens, 'comment', line);
      return;
    }

    // Key-value YAML/spec line (optionally prefixed with list "- ")
    const kvMatch = line.match(/^(\s*(?:-\s+)?)([A-Za-z_][\w\s.-]*?)(:)(\s*)(.*)$/);
    if (kvMatch && !kvMatch[2].includes('->') && !kvMatch[1].includes('->')) {
      const [, prefix, key, colon, space, rest] = kvMatch;
      if (prefix) {
        const dashIdx = prefix.indexOf('-');
        if (dashIdx !== -1) {
          pushToken(tokens, 'plain', prefix.slice(0, dashIdx));
          pushToken(tokens, 'control', '-');
          pushToken(tokens, 'plain', prefix.slice(dashIdx + 1));
        } else {
          pushToken(tokens, 'plain', prefix);
        }
      }
      pushToken(tokens, 'property', key);
      pushToken(tokens, 'punctuation', colon);
      pushToken(tokens, 'plain', space);

      // Handle inline extra YAML attribute on same line e.g. "id: parse_document      type: tool.extract"
      if (rest) {
        tokenizeInline(rest);
      }
      return;
    }

    // Bullet item line
    const bulletMatch = line.match(/^(\s*)(-\s+|->\s+)(.*)$/);
    if (bulletMatch) {
      pushToken(tokens, 'plain', bulletMatch[1]);
      pushToken(tokens, 'control', bulletMatch[2].trimEnd());
      pushToken(tokens, 'plain', bulletMatch[2].slice(bulletMatch[2].trimEnd().length));
      tokenizeInline(bulletMatch[3]);
      return;
    }

    tokenizeInline(line);
  });

  return tokens;
}

function tokenizeBash(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    if (idx > 0) pushToken(tokens, 'plain', '\n');
    let i = 0;
    let expectCommand = true;

    while (i < line.length) {
      const ch = line[i];

      if (/\s/.test(ch)) {
        let j = i + 1;
        while (j < line.length && /\s/.test(line[j])) j++;
        pushToken(tokens, 'plain', line.slice(i, j));
        i = j;
        continue;
      }

      if (ch === '#') {
        pushToken(tokens, 'comment', line.slice(i));
        break;
      }

      if (ch === '$' && line[i + 1] === ' ') {
        pushToken(tokens, 'punctuation', '$');
        i++;
        expectCommand = true;
        continue;
      }

      if (ch === '$') {
        let j = i + 1;
        if (line[j] === '{') {
          const close = line.indexOf('}', j);
          j = close === -1 ? line.length : close + 1;
        } else {
          while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
        }
        pushToken(tokens, 'property', line.slice(i, j));
        i = j;
        expectCommand = false;
        continue;
      }

      if (ch === '"' || ch === "'") {
        const end = scanQuotedString(line, i, ch);
        pushToken(tokens, 'string', line.slice(i, end));
        i = end;
        expectCommand = false;
        continue;
      }

      if (line.startsWith('&&', i) || line.startsWith('||', i) || line.startsWith('>>', i)) {
        pushToken(tokens, 'control', line.slice(i, i + 2));
        i += 2;
        expectCommand = true;
        continue;
      }

      if (ch === '|' || ch === ';' || ch === '>') {
        pushToken(tokens, 'control', ch);
        i++;
        expectCommand = true;
        continue;
      }

      if (ch === '-' && /[a-zA-Z-]/.test(line[i + 1] || '')) {
        let j = i + 1;
        while (j < line.length && /[a-zA-Z0-9_-]/.test(line[j])) j++;
        pushToken(tokens, 'decorator', line.slice(i, j));
        i = j;
        expectCommand = false;
        continue;
      }

      let j = i + 1;
      while (j < line.length && !/[\s"'|;&>]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (expectCommand || BASH_COMMANDS.has(word)) {
        pushToken(tokens, 'function', word);
        expectCommand = false;
      } else if (/^\d+(\.\d+)?$/.test(word)) {
        pushToken(tokens, 'number', word);
      } else if (word.includes('://') || word.startsWith('/')) {
        pushToken(tokens, 'string', word);
      } else {
        pushToken(tokens, 'plain', word);
      }
      i = j;
    }
  });

  return tokens;
}

function tokenizeSql(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < code.length) {
    const ch = code[i];

    if (/\s/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /\s/.test(code[j])) j++;
      pushToken(tokens, 'plain', code.slice(i, j));
      i = j;
      continue;
    }

    if (ch === '-' && code[i + 1] === '-') {
      const nl = code.indexOf('\n', i);
      const end = nl === -1 ? code.length : nl;
      pushToken(tokens, 'comment', code.slice(i, end));
      i = end;
      continue;
    }

    if (ch === '/' && code[i + 1] === '*') {
      const close = code.indexOf('*/', i + 2);
      const end = close === -1 ? code.length : close + 2;
      pushToken(tokens, 'comment', code.slice(i, end));
      i = end;
      continue;
    }

    if (ch === "'") {
      const end = scanQuotedString(code, i, "'");
      pushToken(tokens, 'string', code.slice(i, end));
      i = end;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      const end = scanNumber(code, i);
      pushToken(tokens, 'number', code.slice(i, end));
      i = end;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /[a-zA-Z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const upper = word.toUpperCase();
      if (upper === 'TRUE' || upper === 'FALSE' || upper === 'NULL') {
        pushToken(tokens, 'boolean', word);
      } else if (SQL_KEYWORDS.has(upper)) {
        pushToken(tokens, 'keyword', word);
      } else if (code[skipSpacesIndex(code, j)] === '(') {
        pushToken(tokens, 'function', word);
      } else {
        pushToken(tokens, 'property', word);
      }
      i = j;
      continue;
    }

    if ('(),.;'.includes(ch)) {
      pushToken(tokens, 'punctuation', ch);
      i++;
      continue;
    }

    if ('=<>!+-*/'.includes(ch)) {
      pushToken(tokens, 'operator', ch);
      i++;
      continue;
    }

    pushToken(tokens, 'plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeMarkdown(code: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const lines = code.split('\n');

  lines.forEach((line, idx) => {
    if (idx > 0) pushToken(tokens, 'plain', '\n');

    if (/^\s*#{1,6}\s+/.test(line)) {
      pushToken(tokens, 'decorator', line);
      return;
    }

    const listMatch = line.match(/^(\s*(?:[-*]|\d+\.)\s+)(.*)$/);
    let rest = line;
    if (listMatch) {
      pushToken(tokens, 'control', listMatch[1]);
      rest = listMatch[2];
    }

    let i = 0;
    while (i < rest.length) {
      if (rest[i] === '`') {
        const close = rest.indexOf('`', i + 1);
        if (close !== -1) {
          pushToken(tokens, 'string', rest.slice(i, close + 1));
          i = close + 1;
          continue;
        }
      }
      if (rest.startsWith('**', i)) {
        const close = rest.indexOf('**', i + 2);
        if (close !== -1) {
          pushToken(tokens, 'type', rest.slice(i, close + 2));
          i = close + 2;
          continue;
        }
      }
      pushToken(tokens, 'plain', rest[i]);
      i++;
    }
  });

  return tokens;
}

export function tokenizeCode(code: string, language: CodeLanguage): CodeToken[] {
  if (!code) return [];
  switch (language) {
    case 'typescript':
      return tokenizeTypeScript(code);
    case 'python':
      return tokenizePython(code);
    case 'json':
      return tokenizeJson(code);
    case 'http':
      return tokenizeHttp(code);
    case 'yaml':
      return tokenizeYamlOrSpec(code, false);
    case 'sopin-spec':
      return tokenizeYamlOrSpec(code, true);
    case 'bash':
      return tokenizeBash(code);
    case 'sql':
      return tokenizeSql(code);
    case 'markdown':
      return tokenizeMarkdown(code);
    case 'text':
    default:
      return [{ type: 'plain', value: code }];
  }
}

export function tokenizeCodeLines(code: string, language: CodeLanguage): CodeToken[][] {
  const flat = tokenizeCode(code, language);
  const lines: CodeToken[][] = [[]];

  for (const token of flat) {
    if (!token.value.includes('\n')) {
      lines[lines.length - 1].push(token);
      continue;
    }
    const parts = token.value.split('\n');
    parts.forEach((part, idx) => {
      if (idx > 0) {
        lines.push([]);
      }
      if (part.length > 0) {
        lines[lines.length - 1].push({ type: token.type, value: part });
      }
    });
  }

  return lines;
}
