"""Read-only catalog example using the official MCP Python SDK, stable protocol."""

import argparse
import asyncio
import json
import sys
from contextlib import asynccontextmanager
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from mcp.types import CallToolResult, Implementation

PROJECT = json.loads((Path(__file__).resolve().parents[2] / "project.json").read_text(encoding="utf-8"))
PUBLIC_ENDPOINT = PROJECT["endpoint"]
EXAMPLE_STOPS = [
    {"destination": "Japan", "days": 3, "min_data_mb": 1024},
    {"destination": "South Korea", "days": 3, "min_data_mb": 1024},
]


class ToolCallError(RuntimeError):
    def __init__(self, result: CallToolResult):
        self.result = result
        super().__init__(f"Tool failed: {result.model_dump_json(by_alias=True)}")


async def report_throttling(response: httpx.Response) -> None:
    if response.status_code == 429:
        retry_after = response.headers.get("retry-after", "not supplied")
        raise RuntimeError(f"HTTP 429; Retry-After: {retry_after}; stopped without retrying")


@asynccontextmanager
async def catalog_session(endpoint: str):
    # No Origin, authentication, browser impersonation, or POST retries.
    async with asyncio.timeout(25):
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(7),
            follow_redirects=False,
            event_hooks={"response": [report_throttling]},
        ) as http_client:
            async with streamable_http_client(endpoint, http_client=http_client) as (read, write, _):
                async with ClientSession(
                    read,
                    write,
                    read_timeout_seconds=timedelta(seconds=7),
                    client_info=Implementation(name="esimx-python-example", version=PROJECT["version"]),
                ) as session:
                    await session.initialize()
                    yield session
    # Context managers close session, streams, and HTTP connections on success and failure.


async def call_catalog_tool(session: ClientSession, name: str, arguments: dict) -> CallToolResult:
    result = await session.call_tool(name, arguments)
    if result.isError:
        raise ToolCallError(result)
    return result


async def run_example(endpoint: str) -> dict:
    async with catalog_session(endpoint) as session:
        discovery = await session.list_tools()
        names = [tool.name for tool in discovery.tools]
        for required in ("search_plans", "compare_trip_options"):
            if required not in names:
                raise RuntimeError(f"Expected tool not discovered: {required}")
        search = await call_catalog_tool(session, "search_plans", {
            "destination": "Japan", "days": 3, "min_data_mb": 1024, "limit": 3,
        })
        comparison = await call_catalog_tool(session, "compare_trip_options", {"stops": EXAMPLE_STOPS})
        # Keep native fields and null/zero values. Do not recompute or invent prices.
        return {
            "tools": names,
            "search": search.model_dump(mode="json", by_alias=True, exclude_none=False),
            "comparison": comparison.model_dump(mode="json", by_alias=True, exclude_none=False),
        }


def error_messages(error: BaseException) -> str:
    """Keep the actual HTTP/tool cause visible when AnyIO wraps it in a group."""
    if isinstance(error, BaseExceptionGroup):
        return "; ".join(error_messages(child) for child in error.exceptions)
    return str(error)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--endpoint", default=PUBLIC_ENDPOINT)
    parser.add_argument("--confirm-read-only", action="store_true")
    args = parser.parse_args()
    endpoint = urlparse(args.endpoint)
    loopback = endpoint.scheme == "http" and endpoint.hostname == "127.0.0.1"
    if not loopback and not args.confirm_read_only:
        parser.error("No network request sent. Add --confirm-read-only to allow discovery and both catalog tools.")
    try:
        print(json.dumps(asyncio.run(run_example(args.endpoint)), indent=2))
        return 0
    except Exception as error:
        print(error_messages(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
