import { runExample, PUBLIC_ENDPOINT, errorMessage } from '../dist/examples/typescript/client.js';

const args = process.argv.slice(2);
if (args.length !== 1 || args[0] !== '--confirm-read-only') {
  console.error('No request sent. Run npm run smoke -- --confirm-read-only for a bounded, anonymous read-only check.');
  process.exitCode = 2;
} else {
  // This is never imported by CI tests. No retry, purchase, payment, or account operation.
  const watchdog = setTimeout(() => {
    console.error('Smoke failed: 30-second hard deadline exceeded. No retry was scheduled.');
    process.exit(1);
  }, 30_000);
  try {
    const result = await runExample(PUBLIC_ENDPOINT);
    console.log(JSON.stringify({
      endpoint: PUBLIC_ENDPOINT,
      outcome: 'passed',
      server: result.server,
      tools: result.tools,
      searchStatus: result.search.structuredContent?.status ?? null,
      comparisonStatus: result.comparison.structuredContent?.status ?? null,
      note: 'Transport and tool calls succeeded; this does not certify other clients or current inventory.',
    }, null, 2));
  } catch (error) {
    console.error(`Smoke failed: ${errorMessage(error)}`);
    console.error('Stopped without retrying. A denial, timeout, or throttling response is not a passing test.');
    process.exitCode = 1;
  } finally {
    clearTimeout(watchdog);
  }
}
