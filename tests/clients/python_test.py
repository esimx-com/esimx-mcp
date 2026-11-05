"""Exercise the official Python SDK with a synthetic Node SDK loopback server."""

import asyncio
import json
from pathlib import Path
import os
from queue import Empty, Queue
from threading import Thread
import subprocess
import sys
import unittest

from examples.python.client import (
    EXAMPLE_STOPS, ToolCallError, call_catalog_tool, catalog_session, error_messages, run_example,
)

ROOT = Path(__file__).resolve().parents[2]


class PythonSDKTests(unittest.IsolatedAsyncioTestCase):
    def start_fixture(self, mode="normal"):
        self.fixture = subprocess.Popen(
            ["node", str(ROOT / "tests/fixtures/catalog.mjs"), mode],
            cwd=ROOT, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, text=True,
        )
        self.state = None
        self.addCleanup(self.cleanup_fixture)
        ready = Queue()
        reader = Thread(target=lambda: ready.put(self.fixture.stdout.readline()), daemon=True)
        reader.start()
        try:
            line = ready.get(timeout=10)
        except Empty:
            self.fixture.kill()
            reader.join(timeout=5)
            self.fail("Loopback fixture did not become ready in 10 seconds")
        reader.join(timeout=5)
        if not line:
            self.fail(f"Loopback fixture failed to start: {self.fixture.stderr.read()}")
        self.endpoint = json.loads(line)["endpoint"]

    def stop_fixture(self):
        if self.state is None:
            stdout, stderr = self.fixture.communicate("close\n", timeout=10)
            self.assertEqual(self.fixture.returncode, 0, stderr)
            self.state = json.loads(stdout.strip())
            self.assertEqual(self.state["failures"], [])
            self.assertFalse(self.state["listening"])
            self.assertTrue(self.state["closed"])
            self.assertEqual(self.state["activeTransports"], 0)
        return self.state

    def cleanup_fixture(self):
        if self.fixture.poll() is None:
            try:
                self.stop_fixture()
            except BaseException:
                self.fixture.kill()
                self.fixture.communicate(timeout=5)
                raise

    async def test_initialize_discovery_search_compare_null_and_zero(self):
        self.start_fixture()
        output = await run_example(self.endpoint)
        self.assertEqual(output["tools"], ["search_plans", "compare_trip_options"])
        search = output["search"]["structuredContent"]
        comparison = output["comparison"]["structuredContent"]
        self.assertIn("SYNTHETIC", search["notes"][0])
        self.assertEqual(search["plans"][0]["price_usd_cents"], 0)
        self.assertIsNone(search["plans"][0]["tethering"])
        self.assertIsNone(search["plans"][0]["product_url"])
        self.assertEqual(comparison["options"][0]["total_price_usd_cents"], 0)
        self.assertFalse(comparison["options"][1]["available"])
        self.assertIsNone(comparison["options"][1]["total_price_usd_cents"])
        self.assertIsNone(comparison["price_difference_usd_cents"])
        events = self.stop_fixture()["events"]
        posts = [event for event in events if event["method"] == "POST"]
        self.assertEqual([event["body"]["method"] for event in posts], [
            "initialize", "notifications/initialized", "tools/list", "tools/call", "tools/call",
        ])
        self.assertEqual(posts[0]["body"]["params"]["protocolVersion"], "2025-11-25")
        calls = [event["body"]["params"] for event in posts if event["body"]["method"] == "tools/call"]
        self.assertEqual(calls, [
            {"name": "search_plans", "arguments": {"destination": "Japan", "days": 3, "min_data_mb": 1024, "limit": 3}},
            {"name": "compare_trip_options", "arguments": {"stops": EXAMPLE_STOPS}},
        ])
        for event in posts:
            headers = event["headers"]
            self.assertIn("application/json", headers["accept"])
            self.assertIn("text/event-stream", headers["accept"])
            self.assertNotIn("origin", headers)
            self.assertNotIn("authorization", headers)
            if event["body"]["method"] != "initialize":
                self.assertEqual(headers["mcp-protocol-version"], "2025-11-25")
        self.assertNotIn("DELETE", [event["method"] for event in events])

    async def test_root_python_script_runs_against_loopback(self):
        self.start_fixture()
        process = await asyncio.create_subprocess_exec(
            *(["node", os.environ["npm_execpath"]] if os.environ.get("npm_execpath") else ["npm"]),
            "run", "example:python", "--", "--endpoint", self.endpoint,
            cwd=ROOT, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=15)
        self.assertEqual(process.returncode, 0, stderr.decode())
        text = stdout.decode()
        output = json.loads(text[text.index("{\n"):])
        self.assertEqual(output["tools"], ["search_plans", "compare_trip_options"])
        self.assertIsNone(output["comparison"]["structuredContent"]["price_difference_usd_cents"])
        self.assertEqual(self.stop_fixture()["toolCalls"], 2)

    async def test_zero_difference_is_not_missing(self):
        self.start_fixture("zero-difference")
        result = (await run_example(self.endpoint))["comparison"]["structuredContent"]
        self.assertEqual(result["price_difference_usd_cents"], 0)
        self.assertTrue(all(option["available"] for option in result["options"]))
        self.assertEqual(result["reason_code"], "same_price_fewer_installations")

    async def test_both_tools_expose_invalid_arguments(self):
        self.start_fixture()
        async with catalog_session(self.endpoint) as session:
            await session.list_tools()
            for name, args in [("search_plans", {}), ("compare_trip_options", {"stops": [EXAMPLE_STOPS[0]]})]:
                with self.subTest(tool=name):
                    with self.assertRaises(ToolCallError) as caught:
                        await call_catalog_tool(session, name, args)
                    self.assertTrue(caught.exception.result.isError)
                    self.assertEqual(caught.exception.result.structuredContent["error_code"], "invalid_arguments")
        self.assertEqual(self.stop_fixture()["toolCalls"], 2)

    async def test_catalog_unavailable_is_not_no_match(self):
        self.start_fixture("catalog-unavailable")
        with self.assertRaises(Exception) as caught:
            await run_example(self.endpoint)
        self.assertIn("catalog_unavailable", error_messages(caught.exception))
        self.assertEqual(self.stop_fixture()["toolCalls"], 1)

    async def test_no_match_is_a_normal_domain_result(self):
        self.start_fixture("no-match")
        result = (await run_example(self.endpoint))["search"]
        self.assertFalse(result["isError"])
        self.assertEqual(result["structuredContent"]["status"], "no_match")
        self.assertEqual(result["structuredContent"]["plans"], [])

    async def test_rate_limit_reports_retry_after_and_does_not_retry(self):
        self.start_fixture("throttle")
        with self.assertRaises(Exception) as caught:
            await run_example(self.endpoint)
        self.assertIn("HTTP 429; Retry-After: 60; stopped without retrying", error_messages(caught.exception))
        self.assertEqual(self.stop_fixture()["toolCalls"], 1)

    async def test_gateway_403_does_not_get_browser_headers_or_retry(self):
        self.start_fixture("http-denied")
        with self.assertRaises(Exception) as caught:
            await run_example(self.endpoint)
        self.assertIn("403", error_messages(caught.exception))
        events = self.stop_fixture()["events"]
        self.assertEqual(len(events), 1)
        self.assertNotRegex(events[0]["headers"]["user-agent"], "Mozilla|Chrome|Safari")

    async def test_unknown_tool_protocol_error(self):
        self.start_fixture()
        async with catalog_session(self.endpoint) as session:
            await session.list_tools()
            with self.assertRaises(Exception) as caught:
                await call_catalog_tool(session, "not_a_tool", {})
            self.assertIn("Unknown tool", error_messages(caught.exception))


class PythonEntrypointTests(unittest.TestCase):
    def test_live_example_requires_explicit_opt_in(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "examples/python/client.py")],
            cwd=ROOT, capture_output=True, text=True, timeout=10,
        )
        self.assertEqual(result.returncode, 2)
        self.assertIn("--confirm-read-only", result.stderr)


if __name__ == "__main__":
    unittest.main()
