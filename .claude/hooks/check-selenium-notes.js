
// check-selenium-notes.js
// Claude Code hook: runs after every Write/Edit. If a TypeScript file in src/ or tests/
// has methods or tests without a "SELENIUM JAVA EQUIVALENT" comment block, it blocks
// with exit code 2 so Claude Code must add the missing notes before moving on.
const fs = require('fs');

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let filePath;
  try {
    filePath = JSON.parse(input).tool_input?.file_path;
  } catch {
    process.exit(0); // not something we can check
  }
  if (!filePath) process.exit(0);
  const p = filePath.replace(/\\/g, '/');
  if (!p.endsWith('.ts') || !/\/(src|tests)\//.test(p) || !fs.existsSync(filePath)) process.exit(0);

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const marker = /SELENIUM JAVA EQUIVALENT/;
  // Things that need notes: class methods (async or not, excluding constructor) and tests.
  const needsNote = /^\s*(?:(?:public|private|protected)\s+)?(?:async\s+)?(?!constructor\b|if\b|for\b|while\b|switch\b|catch\b|return\b)([a-zA-Z_]\w*)\s*\([^)]*\)\s*(?::\s*[^={]+)?\{\s*$|^\s*test(?:\.\w+)?\(\s*['"`]/;

  const missing = [];
  lines.forEach((line, i) => {
    if (!needsNote.test(line)) return;
    // Look back up to 40 lines (stopping at the previous method/test) for the marker.
    for (let j = i - 1; j >= Math.max(0, i - 40); j--) {
      if (marker.test(lines[j])) return;
      if (needsNote.test(lines[j])) break;
    }
    missing.push(`  line ${i + 1}: ${line.trim()}`);
  });

  if (missing.length) {
    console.error(
      `Missing Selenium notes in ${filePath}.\n` +
      `Add a "SELENIUM JAVA EQUIVALENT" comment block (see CLAUDE.md) directly above:\n` +
      missing.join('\n')
    );
    process.exit(2);
  }
  process.exit(0);
});
