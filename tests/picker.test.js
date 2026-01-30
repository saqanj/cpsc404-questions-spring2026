const { cleanBody, extractAuthor, weekLabel, createPool, WEEK_LABELS } = require('../picker');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}`);
        console.log(`    ${e.message}`);
    }
}

// ─── cleanBody ───────────────────────────────────────────────

console.log('\ncleanBody');

test('strips h1 and h2 headings', () => {
    const input = '# Week 2 Question\n\n## Question\nWhat is conflict?\n\n## Context\nSome context.';
    const result = cleanBody(input);
    assert(!result.includes('# Week 2'), 'should strip h1');
    assert(!result.includes('## Question'), 'should strip h2');
    assert(result.includes('What is conflict?'));
    assert(result.includes('Some context.'));
});

test('preserves h3 headings', () => {
    const input = '### Theme: Overlapping Agendas\nSome text';
    assert(cleanBody(input).includes('### Theme'));
});

test('strips **Student:** line', () => {
    const input = '**Student:** Jane Doe\n**Date:** Jan 28\n\nMy question';
    const result = cleanBody(input);
    assert(!result.includes('Jane Doe'), 'should strip student line');
    assert(!result.includes('Jan 28'), 'should strip date line');
    assert.strictEqual(result, 'My question');
});

test('strips **Author:** line', () => {
    const input = '**Author:** Drake Bellisari\n**Date:** January 28, 2026\n\nQuestion text';
    const result = cleanBody(input);
    assert(!result.includes('Drake'));
    assert(!result.includes('January 28'));
    assert.strictEqual(result, 'Question text');
});

test('strips plain Student: line (no bold)', () => {
    const input = 'Student: Fadhil Ahmed\nDate: January 28, 2026\n\nSome question';
    const result = cleanBody(input);
    assert(!result.includes('Fadhil'));
    assert(!result.includes('January 28'));
    assert.strictEqual(result, 'Some question');
});

test('strips lines with trailing whitespace', () => {
    const input = '**Student:** Alex Sanchez  \n**Date:** January 28, 2026  \n\nQuestion';
    const result = cleanBody(input);
    assert(!result.includes('Alex'));
    assert.strictEqual(result, 'Question');
});

test('handles empty input', () => {
    assert.strictEqual(cleanBody(''), '');
    assert.strictEqual(cleanBody('  \n  \n  '), '');
});

test('preserves question body with markdown formatting', () => {
    const input = '## Question\nIs *conflict* really a **feature**?\n\n## Context\nThe book says so.';
    const result = cleanBody(input);
    assert(result.includes('*conflict*'));
    assert(result.includes('**feature**'));
});

// ─── extractAuthor ───────────────────────────────────────────

console.log('\nextractAuthor');

test('extracts from **Student:** line', () => {
    const body = '# Heading\n\n**Student:** Hannah Chukwu\n**Date:** Jan 28\n\nQuestion';
    assert.strictEqual(extractAuthor('hannahchukwu.md', body), 'Hannah Chukwu');
});

test('extracts from **Author:** line', () => {
    const body = '# Heading\n\n**Author:** Drake Bellisari\n**Date:** Jan 28\n\nQuestion';
    assert.strictEqual(extractAuthor('bellisari-drake.md', body), 'Drake Bellisari');
});

test('extracts from plain Student: line', () => {
    const body = 'Student: Fadhil Ahmed\nDate: January 28\n\nQuestion';
    assert.strictEqual(extractAuthor('fadhil-ahmed.md', body), 'Fadhil Ahmed');
});

test('trims trailing whitespace from name', () => {
    const body = '**Student:** Alex Sanchez  \n**Date:** Jan 28';
    assert.strictEqual(extractAuthor('sanchez-alex.md', body), 'Alex Sanchez');
});

test('falls back to filename with hyphens', () => {
    const body = '## Chapter 1 Question\n\nSome question text';
    assert.strictEqual(extractAuthor('sanchez-alex.md', body), 'Sanchez Alex');
});

test('falls back to filename with underscores', () => {
    const body = 'Some question';
    assert.strictEqual(extractAuthor('nicole_balbuena_week1.md', body), 'Nicole Balbuena Week1');
});

test('falls back to filename for empty body', () => {
    assert.strictEqual(extractAuthor('bobak-devon.md', ''), 'Bobak Devon');
});

test('handles case-insensitive Student', () => {
    const body = '**student:** Test Name\nQuestion';
    assert.strictEqual(extractAuthor('test.md', body), 'Test Name');
});

// ─── weekLabel ───────────────────────────────────────────────

console.log('\nweekLabel');

test('returns mapped label for known week', () => {
    assert.strictEqual(weekLabel('week02-chapter01'), 'Week 2 — Ch 1: Making Inevitable Conflict Productive');
});

test('returns mapped label for dual-reading week', () => {
    assert.strictEqual(weekLabel('week06-dual-reading'), 'Week 6 — Ch 4 + ProducingOSS Ch 8');
});

test('returns mapped label for async week', () => {
    assert(weekLabel('week07-chapter05-async').includes("Prisoner's Dilemma"));
});

test('falls back to title-cased dirname for unknown week', () => {
    assert.strictEqual(weekLabel('week99-future'), 'Week99 Future');
});

test('all known week folders have labels', () => {
    const folders = [
        'week02-chapter01', 'week03-chapter02', 'week04-chapter03',
        'week06-dual-reading', 'week07-chapter05-async', 'week08-dual-reading',
        'week10-dual-reading', 'week11-chapter08', 'week12-chapter09', 'week13-chapter10'
    ];
    for (const f of folders) {
        assert(WEEK_LABELS[f], `Missing label for ${f}`);
    }
});

// ─── createPool ──────────────────────────────────────────────

console.log('\ncreatePool');

test('pick returns items and reduces remaining count', () => {
    const pool = createPool([{q: 'a'}, {q: 'b'}, {q: 'c'}]);
    assert.strictEqual(pool.total, 3);
    assert.strictEqual(pool.remaining, 3);

    const first = pool.pick();
    assert(first !== null);
    assert.strictEqual(pool.remaining, 2);
});

test('pick returns null when pool is exhausted', () => {
    const pool = createPool([{q: 'a'}]);
    pool.pick();
    assert.strictEqual(pool.isEmpty, true);
    assert.strictEqual(pool.pick(), null);
});

test('no duplicates: every item picked exactly once', () => {
    const items = [{id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}];
    const pool = createPool(items);
    const picked = [];
    while (!pool.isEmpty) {
        picked.push(pool.pick());
    }
    assert.strictEqual(picked.length, 5);
    const ids = picked.map(p => p.id).sort();
    assert.deepStrictEqual(ids, [1, 2, 3, 4, 5]);
});

test('reset restores full pool', () => {
    const pool = createPool([{q: 'a'}, {q: 'b'}]);
    pool.pick();
    pool.pick();
    assert.strictEqual(pool.isEmpty, true);

    pool.reset();
    assert.strictEqual(pool.remaining, 2);
    assert.strictEqual(pool.isEmpty, false);
});

test('empty pool returns null immediately', () => {
    const pool = createPool([]);
    assert.strictEqual(pool.total, 0);
    assert.strictEqual(pool.isEmpty, true);
    assert.strictEqual(pool.pick(), null);
});

test('pool does not mutate original array', () => {
    const items = [{q: 'a'}, {q: 'b'}];
    const pool = createPool(items);
    pool.pick();
    pool.pick();
    assert.strictEqual(items.length, 2, 'original array should be unchanged');
});

test('multiple resets work correctly', () => {
    const pool = createPool([{q: 'x'}]);
    pool.pick();
    pool.reset();
    pool.pick();
    pool.reset();
    assert.strictEqual(pool.remaining, 1);
    const item = pool.pick();
    assert.deepStrictEqual(item, {q: 'x'});
});

// ─── Integration: cleanBody + extractAuthor with real student formats ────

console.log('\nIntegration (real student formats)');

const HANNAH_MD = `# Week 2 Question - Chapter 1: Making Inevitable Conflict Productive

**Student:** Hannah Chukwu
**Date:** January 28, 2026

## Question
If conflict between employees and managers is inevitable, as HYBHY suggests, is it realistic to expect employees to turn conflict into collaboration when managers still hold most of the power?

## Context (optional)
In Chapter 1 of Help Your Boss Help You, conflict is described as something that naturally happens.`;

test('Hannah: author extracted, body cleaned', () => {
    assert.strictEqual(extractAuthor('hannahchukwu.md', HANNAH_MD), 'Hannah Chukwu');
    const clean = cleanBody(HANNAH_MD);
    assert(!clean.includes('Hannah Chukwu'));
    assert(!clean.includes('January 28'));
    assert(!clean.includes('# Week 2'));
    assert(!clean.includes('## Question'));
    assert(clean.startsWith('If conflict between'));
});

const FADHIL_MD = `Week 2 Question – Chapter 1: Making Inevitable Conflict Productive



Student: Fadhil Ahmed

Date: January 28, 2026



Question



Chapter 1 suggests that conflict between employees and managers is inevitable.`;

test('Fadhil: plain Student: extracted, body cleaned', () => {
    assert.strictEqual(extractAuthor('fadhil-ahmed.md', FADHIL_MD), 'Fadhil Ahmed');
    const clean = cleanBody(FADHIL_MD);
    assert(!clean.includes('Fadhil Ahmed'));
    assert(!clean.includes('January 28'));
    // "Question" on its own line is not a heading (no #), so it stays
    assert(clean.includes('Chapter 1 suggests'));
});

const DRAKE_MD = `# Week 2 – Making Inevitable Conflict Productive

**Author:** Drake Bellisari
**Date:** January 28, 2026

## Question
HYBHY argues conflict is inevitable and can be productive.`;

test('Drake: **Author:** extracted, body cleaned', () => {
    assert.strictEqual(extractAuthor('bellisari-drake.md', DRAKE_MD), 'Drake Bellisari');
    const clean = cleanBody(DRAKE_MD);
    assert(!clean.includes('Drake'));
    assert(clean.includes('HYBHY argues'));
});

const MAYA_MD = `## Chapter 1 Question

The authors frame conflict with managers as inevitable.`;

test('Maya: no student line, falls back to filename', () => {
    assert.strictEqual(extractAuthor('mayacar.md', MAYA_MD), 'Mayacar');
    const clean = cleanBody(MAYA_MD);
    assert(!clean.includes('## Chapter'));
    assert(clean.startsWith('The authors frame'));
});

const NICOLE_MD = `### Nicole Balbuena Gutierrez - Week 2 Disucssion Question

##Question:##
HYBHY Chapter 1 argues that conflict is inevitable.`;

test('Nicole: h3 preserved, ##Question:## stripped, filename fallback', () => {
    assert.strictEqual(extractAuthor('nicole_balbuena_week1.md', NICOLE_MD), 'Nicole Balbuena Week1');
    const clean = cleanBody(NICOLE_MD);
    // ### is h3, not stripped
    assert(clean.includes('Nicole Balbuena Gutierrez'));
    assert(clean.includes('HYBHY Chapter 1 argues'));
});

// ─── Summary ─────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
