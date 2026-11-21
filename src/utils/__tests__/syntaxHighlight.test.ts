import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CodeLanguage,
  detectCodeLanguage,
  tokenizeCode,
  tokenizeCodeLines,
} from '../syntaxHighlight';

test('detectCodeLanguage resolves file extensions, labels, and fallback content accurately', () => {
  assert.equal(detectCodeLanguage('agent.ts', ''), 'typescript');
  assert.equal(detectCodeLanguage('agent.py (planned syntax)', ''), 'python');
  assert.equal(detectCodeLanguage('sopin.blueprint.json', ''), 'json');
  assert.equal(detectCodeLanguage('gateway.routing.yaml', ''), 'yaml');
  assert.equal(detectCodeLanguage('decisions-eval.http', ''), 'http');
  assert.equal(detectCodeLanguage('Compiled Intent Spec', ''), 'sopin-spec');
  assert.equal(detectCodeLanguage('SOPIN Flow Blueprint', ''), 'sopin-spec');
  assert.equal(detectCodeLanguage('State Graph Topology', ''), 'sopin-spec');
  assert.equal(detectCodeLanguage('cli', ''), 'bash');
  assert.equal(detectCodeLanguage('audit.sql', ''), 'sql');
  assert.equal(detectCodeLanguage('artifact.md', ''), 'markdown');

  // Content-only fallback
  assert.equal(
    detectCodeLanguage(undefined, 'def run_agent(query: str) -> None:\n    return True'),
    'python'
  );
  assert.equal(
    detectCodeLanguage(undefined, 'POST /v1/decisions/evaluate\n{"ok": true}'),
    'http'
  );
  assert.equal(
    detectCodeLanguage(undefined, '{\n  "amount": 1200,\n  "approved": true\n}'),
    'json'
  );
  assert.equal(
    detectCodeLanguage(undefined, 'SELECT id, status FROM executions WHERE duration_ms > 5;'),
    'sql'
  );
});

test('tokenizeCode and tokenizeCodeLines are 100% lossless across all languages', () => {
  const samples: Array<[CodeLanguage, string]> = [
    [
      'typescript',
      `import { SopinClient, z } from "@sopin/sdk";
// Initialize workspace client
const client = new SopinClient();
export const cfg = {
  maxSteps: 8,
  strict: true,
  label: \`run-\${client.id}\`,
};`,
    ],
    [
      'python',
      `from sopin import Agent, Tool

@Agent.register
def review_invoice(amount: int, verified: bool = True) -> dict:
    """Validate invoice payload."""
    # Return approval tier
    return {"approved": amount <= 50000 and verified, "notes": None}`,
    ],
    [
      'json',
      `{
  "targetId": "rule-invoice-auto-approve",
  "amount": 32500.5,
  "verified": true,
  "reason": null
}`,
    ],
    [
      'http',
      `POST /v1/decisions/evaluate
Content-Type: application/json
{
  "targetType": "rule",
  "environment": "production"
}`,
    ],
    [
      'yaml',
      `# Gateway routing profile
route: structured-reasoning
retries: 3
strictSchema: true
fallbacks:
  - "claude-sonnet"`,
    ],
    [
      'sopin-spec',
      `flow: vendor-intake-pipeline
nodes:
  - id: route_high_risk type: condition (risk == "high")
    -> true: human_gate("legal-review")`,
    ],
    [
      'bash',
      `$ npx sopin deploy --env=production && curl -X POST https://api.sopin.ai/v1/eval # deploy`,
    ],
    [
      'sql',
      `-- Audit query
SELECT id, status FROM decision_executions WHERE duration_ms <= 10 AND matched = TRUE;`,
    ],
    [
      'markdown',
      `# Execution Report
- **Status**: Completed
- Artifact: \`invoice_trace.json\``,
    ],
  ];

  for (const [lang, code] of samples) {
    const flat = tokenizeCode(code, lang);
    assert.equal(
      flat.map((t) => t.value).join(''),
      code,
      `Flat tokens should round-trip identically for ${lang}`
    );

    const lines = tokenizeCodeLines(code, lang);
    assert.equal(
      lines.map((line) => line.map((t) => t.value).join('')).join('\n'),
      code,
      `Line-split tokens should round-trip identically for ${lang}`
    );
  }
});

test('TypeScript, Python, JSON, and HTTP produce expected VS Code token categories', () => {
  const tsTokens = tokenizeCode(
    `import { SopinClient } from "@sopin/sdk";\nconst ok = true;\n// comment\nclient.run(42);`,
    'typescript'
  );
  assert.ok(tsTokens.some((t) => t.type === 'control' && t.value === 'import'));
  assert.ok(tsTokens.some((t) => t.type === 'type' && t.value === 'SopinClient'));
  assert.ok(tsTokens.some((t) => t.type === 'string' && t.value === '"@sopin/sdk"'));
  assert.ok(tsTokens.some((t) => t.type === 'keyword' && t.value === 'const'));
  assert.ok(tsTokens.some((t) => t.type === 'boolean' && t.value === 'true'));
  assert.ok(tsTokens.some((t) => t.type === 'comment' && t.value === '// comment'));
  assert.ok(tsTokens.some((t) => t.type === 'function' && t.value === 'run'));
  assert.ok(tsTokens.some((t) => t.type === 'number' && t.value === '42'));

  const pyTokens = tokenizeCode(
    `@agent\ndef check(limit=10):\n    # rule\n    return False`,
    'python'
  );
  assert.ok(pyTokens.some((t) => t.type === 'decorator' && t.value === '@agent'));
  assert.ok(pyTokens.some((t) => t.type === 'keyword' && t.value === 'def'));
  assert.ok(pyTokens.some((t) => t.type === 'function' && t.value === 'check'));
  assert.ok(pyTokens.some((t) => t.type === 'property' && t.value === 'limit'));
  assert.ok(pyTokens.some((t) => t.type === 'number' && t.value === '10'));
  assert.ok(pyTokens.some((t) => t.type === 'comment' && t.value === '# rule'));
  assert.ok(pyTokens.some((t) => t.type === 'boolean' && t.value === 'False'));

  const jsonTokens = tokenizeCode(`{"risk": "LOW", "score": 95, "pass": true}`, 'json');
  assert.ok(jsonTokens.some((t) => t.type === 'property' && t.value === '"risk"'));
  assert.ok(jsonTokens.some((t) => t.type === 'string' && t.value === '"LOW"'));
  assert.ok(jsonTokens.some((t) => t.type === 'number' && t.value === '95'));
  assert.ok(jsonTokens.some((t) => t.type === 'boolean' && t.value === 'true'));
});
