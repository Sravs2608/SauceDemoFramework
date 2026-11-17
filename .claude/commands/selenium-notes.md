---
description: Write detailed Selenium Java comparison notes for a file we built
argument-hint: <path to a .ts file>
---
Read $ARGUMENTS and explain it for a Test Lead who knows Selenium concepts but is new to hands-on automation.

1. For every method and test in the file, check that the "SELENIUM JAVA EQUIVALENT" comment block above it is complete and correct (see CLAUDE.md). Fix or improve any block that is missing, wrong or too thin.
2. Add or update the matching section in docs/SELENIUM-COMPARISON.md with:
   - what the code does, in simple language
   - the Playwright snippet from this file
   - a complete, compilable Selenium 4 Java version (Page Object class or JUnit 5 test, with imports)
   - key differences: locators, waits, setup/teardown, assertions, reporting
   - which approach is better here and why
   - where Selenium has no direct equivalent, say so and show the usual workaround
3. Do not change any TypeScript logic. Only comments and docs.
4. Summarize in chat what you added, in 3-5 lines.
