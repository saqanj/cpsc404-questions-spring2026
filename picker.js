// Pure functions and pool logic for the Discussion Question Picker.
// Used by index.html and tested by tests/picker.test.js.

const WEEK_LABELS = {
    'week02-chapter01': 'Week 2 — Ch 1: Making Inevitable Conflict Productive',
    'week03-chapter02': 'Week 3 — Ch 2: Giving Good-Enough Answers',
    'week04-chapter03': 'Week 4 — Ch 3: Creating Constructive Loyalty',
    'week06-dual-reading': 'Week 6 — Ch 4 + ProducingOSS Ch 8',
    'week07-chapter05-async': "Week 7 — Ch 5: Winning the Prisoner's Dilemma",
    'week08-dual-reading': 'Week 8 — Ch 6 + ProducingOSS Ch 6',
    'week10-dual-reading': 'Week 10 — Ch 7 + ProducingOSS Ch 4',
    'week11-chapter08': 'Week 11 — Ch 8: Your Boss Is Not Your Friend',
    'week12-chapter09': 'Week 12 — Ch 9: Dealing with Special Cases',
    'week13-chapter10': 'Week 13 — Ch 10: Managing Your Manager',
};

// Strip metadata lines (Student, Date, headings) and keep just the question content
function cleanBody(text) {
    return text
        .split('\n')
        .filter(line => {
            const trimmed = line.trim();
            if (/^#{1,2}\s/.test(trimmed)) return false;
            if (/^\*\*(Student|Author)[:：]\*\*/i.test(trimmed)) return false;
            if (/^Student[:：]/i.test(trimmed)) return false;
            if (/^\*\*Date[:：]\*\*/i.test(trimmed)) return false;
            if (/^Date[:：]/i.test(trimmed)) return false;
            return true;
        })
        .join('\n')
        .trim();
}

// Extract author name from various formats students used
function extractAuthor(filename, body) {
    // **Student:** Name or **Author:** Name
    const bold = body.match(/\*\*(Student|Author)[:：]\*\*\s*(.+)/i);
    if (bold) return bold[2].trim();
    // Student: Name (no bold)
    const plain = body.match(/^Student[:：]\s*(.+)/im);
    if (plain) return plain[1].trim();
    // Fall back to filename
    return filename
        .replace('.md', '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Get a friendly label for a week folder
function weekLabel(dirname) {
    if (WEEK_LABELS[dirname]) return WEEK_LABELS[dirname];
    return dirname
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

// Question pool: pick without replacement
function createPool(questions) {
    const all = [...questions];
    let remaining = [...questions];

    return {
        pick() {
            if (remaining.length === 0) return null;
            const index = Math.floor(Math.random() * remaining.length);
            return remaining.splice(index, 1)[0];
        },
        reset() {
            remaining = [...all];
        },
        get remaining() { return remaining.length; },
        get total() { return all.length; },
        get isEmpty() { return remaining.length === 0; },
    };
}

// Node.js exports (ignored in browser)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WEEK_LABELS, cleanBody, extractAuthor, weekLabel, createPool };
}
