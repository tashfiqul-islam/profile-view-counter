import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkAgentDocs, cli, GUIDE_MAX_BYTES, ROUTER_MAX_BYTES } from "./agent-docs";

const guide = (name: string, body = "Read when: testing.\n") => ({
  content: `# ${name}\n\n${body}`,
  path: `docs/agents/${name}.md`,
});
const router = (...links: string[]) => ({
  content: `# Repo\n\n${links.map((path) => `[x](${path})`).join("\n")}\n`,
  path: "AGENTS.md",
});

describe("checkAgentDocs", () => {
  test("passes a small router that links every well-formed guide", () => {
    const testing = guide("testing");
    expect(checkAgentDocs(router(testing.path), [testing])).toEqual([]);
  });

  test("rejects a router over the limit", () => {
    const big = { content: "x".repeat(ROUTER_MAX_BYTES + 1), path: "AGENTS.md" };
    expect(checkAgentDocs(big, [])).toEqual([
      `AGENTS.md is ${ROUTER_MAX_BYTES + 1} bytes; the limit is ${ROUTER_MAX_BYTES}`,
    ]);
  });

  test("counts bytes, not characters", () => {
    const multibyte = { content: "é".repeat(ROUTER_MAX_BYTES / 2 + 1), path: "AGENTS.md" };
    expect(checkAgentDocs(multibyte, [])).toHaveLength(1);
  });

  test("rejects a guide over the limit", () => {
    const big = guide("big", `Read when: always.\n${"x".repeat(GUIDE_MAX_BYTES)}`);
    expect(checkAgentDocs(router(big.path), [big])).toEqual([
      `docs/agents/big.md is ${new TextEncoder().encode(big.content).length} bytes; the limit is ${GUIDE_MAX_BYTES}`,
    ]);
  });

  test("rejects a guide without a Read when opening", () => {
    const bare = guide("bare", "Some text.\n");
    expect(checkAgentDocs(router(bare.path), [bare])).toEqual([
      'docs/agents/bare.md must open with a "# Title" line, a blank line and "Read when: …"',
    ]);
  });

  test("rejects a guide the router does not link", () => {
    const orphan = guide("orphan");
    expect(checkAgentDocs(router(), [orphan])).toEqual([
      "docs/agents/orphan.md is not linked from AGENTS.md",
    ]);
  });
});

/** Runs `body` against a throwaway repo; removes exactly that directory afterwards. */
async function withRepo(
  agents: string,
  guides: Record<string, string>,
  body: (root: string) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "agent-docs-"));
  try {
    await mkdir(join(root, "docs", "agents"), { recursive: true });
    await writeFile(join(root, "AGENTS.md"), agents);
    await Promise.all(
      Object.entries(guides).map(([name, content]) =>
        writeFile(join(root, "docs", "agents", name), content),
      ),
    );
    await body(root);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
}

describe("cli", () => {
  // Restores console even when an assertion fails, so no mock leaks into a shuffled later test.
  afterEach(() => {
    mock.restore();
  });

  test("returns 0 and reports the guide count when the docs hold", async () => {
    await withRepo(
      "[t](docs/agents/testing.md)\n",
      { "testing.md": "# Testing\n\nRead when: x.\n" },
      async (root) => {
        const log = spyOn(console, "log").mockImplementation(() => undefined);
        expect(await cli(root)).toBe(0);
        expect(log).toHaveBeenCalledWith("agent docs ok: AGENTS.md + 1 guides");
      },
    );
  });

  test("returns 1 and prints each violation", async () => {
    await withRepo("# Repo\n", { "orphan.md": "no opening\n" }, async (root) => {
      const error = spyOn(console, "error").mockImplementation(() => undefined);
      expect(await cli(root)).toBe(1);
      expect(error).toHaveBeenCalledTimes(2);
    });
  });

  test("passes on this repository", async () => {
    spyOn(console, "log").mockImplementation(() => undefined);
    expect(await cli()).toBe(0);
  });
});
