/**
 * Runs a learner's exercise file and grades it against the exercise definition.
 *
 * Deliberately does NOT type-check: VS Code's own TypeScript service already does
 * that in the editor, with real squiggles. The extension reads those diagnostics
 * instead of reimplementing them (see extension.js). This module only answers
 * "does the code behave the way the pattern requires?".
 *
 * Type stripping is Node's own (`module.stripTypeScriptTypes`), which is exactly
 * what `node file.ts` does. That means the constructs Node can't strip — `enum`,
 * constructor parameter properties — fail here for the same reason and with the
 * same message as they would on the command line.
 */
'use strict';

const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

/** Render a value the way Node's console.log does, so the panel matches a real run. */
function inspect(value, depth = 0) {
  if (typeof value === 'string') return depth === 0 ? value : `'${value}'`;
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return String(value);
  if (depth > 4) return '[deep]';
  if (Array.isArray(value)) {
    return value.length ? `[ ${value.map((v) => inspect(v, depth + 1)).join(', ')} ]` : '[]';
  }
  const ctor = value.constructor && value.constructor.name;
  const name = ctor && ctor !== 'Object' ? `${ctor} ` : '';
  const keys = Object.keys(value);
  if (!keys.length) return `${name}{}`;
  return `${name}{ ${keys.map((k) => `${k}: ${inspect(value[k], depth + 1)}`).join(', ')} }`;
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

/**
 * Execute the learner's source in an isolated context.
 * @returns {{logs: string[], error: string|null, fatal: boolean, globals: object}}
 */
function execute(def, source) {
  const result = { logs: [], error: null, fatal: false, globals: {} };

  let js;
  try {
    js = stripTypeScriptTypes(source);
  } catch (e) {
    result.error = `Cannot run this file: ${e.message}`;
    result.fatal = true;
    return result;
  }

  const logs = result.logs;
  const record = (...args) => logs.push(args.map((a) => inspect(a, 0)).join(' '));
  const sandbox = {
    console: { log: record, info: record, warn: record, error: record }
  };

  const captures = (def.captures || []).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n));
  const handoff = captures
    .map((n) => `  ${n}: typeof ${n} !== 'undefined' ? ${n} : undefined`)
    .join(',\n');
  // Invoked inside the vm, not returned and called outside, so the timeout
  // actually covers the learner's top-level code — an accidental `while (true)`
  // must not hang the extension host.
  const wrapped = `(function () {\n${js}\n;return {\n${handoff}\n};\n})()`;

  try {
    result.globals = vm.runInNewContext(wrapped, sandbox, { timeout: 5000 }) || {};
  } catch (e) {
    result.error = /timed out/i.test(e.message)
      ? 'Your code ran for more than 5 seconds and was stopped — is there a loop that never ends?'
      : `Your code threw: ${e.message}`;
    result.fatal = true;
  }
  return result;
}

/**
 * Grade the source against every step.
 * @returns {{logs, error, fatal, steps: Array<{title, checks: Array<{name, pass, message}>, passed, reached}>}}
 */
function runChecks(def, source) {
  const run = execute(def, source);
  const steps = def.steps || [];

  const ctx = {
    g: run.globals,
    logs: run.logs,
    src: source,
    clean: stripComments(source),
    expect: def.expected || {},
    eq: (got, want) => (got === want ? null : `Expected "${want}" but got "${got}".`),
    missingLines: (wanted) => wanted.filter((l) => !ctx.logs.includes(l))
  };

  const report = {
    logs: run.logs,
    error: run.error,
    fatal: run.fatal,
    steps: steps.map((s) => ({ title: s.title, checks: [], passed: false, reached: false }))
  };
  if (run.fatal) return report;

  for (let i = 0; i < steps.length; i++) {
    const entry = report.steps[i];
    entry.reached = true;
    const checks = steps[i].checks || [];
    let ok = checks.length > 0;
    for (const check of checks) {
      let message = null;
      try {
        message = check.run(ctx) || null;
      } catch (e) {
        message = e.message;
      }
      entry.checks.push({ name: check.name, pass: !message, message });
      if (message) {
        ok = false;
        break; // first failure per step keeps the signal high
      }
    }
    entry.passed = ok;
    if (!ok) break; // later steps build on this one
  }
  return report;
}

module.exports = { runChecks, execute, inspect, stripComments };
