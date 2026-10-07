#!/usr/bin/env node
// Fails if a SKILL.md names an MCP tool that the published
// @nexus-xyz/exchange-mcp does not list, or lists only as deprecated.
//
// The tool list comes from the server itself (`tools/list` over stdio), so it
// is what an agent actually sees. Override the package with MCP_PACKAGE, e.g.
// MCP_PACKAGE=@nexus-xyz/exchange-mcp@0.5.0.
import { spawn } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

const pkg = process.env.MCP_PACKAGE ?? "@nexus-xyz/exchange-mcp@latest";

function listTools() {
  return new Promise((resolve, reject) => {
    const server = spawn("npx", ["-y", pkg], { stdio: ["pipe", "pipe", "inherit"] });
    const timer = setTimeout(() => { server.kill(); reject(new Error("tools/list timed out")); }, 120_000);
    let buf = "";
    server.stdout.on("data", (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const msg = JSON.parse(buf.slice(0, nl));
        buf = buf.slice(nl + 1);
        if (msg.id !== 2) continue;
        clearTimeout(timer);
        server.kill();
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result.tools);
      }
    });
    server.on("error", reject);
    const send = (m) => server.stdin.write(JSON.stringify({ jsonrpc: "2.0", ...m }) + "\n");
    send({ id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "skills-ci", version: "0" } } });
    send({ method: "notifications/initialized" });
    send({ id: 2, method: "tools/list" });
  });
}

const tools = await listTools();
const current = new Set(tools.filter((t) => !t.description.startsWith("Deprecated:")).map((t) => t.name));
// A backticked snake_case token counts as a tool reference when its first word
// is a verb some listed tool starts with (`fetch_`, `create_`, `get_`, ...).
// That keeps field names like `market_id` or `trigger_price` out.
// ponytail: a misspelled verb (`fetsh_balance`) is not seen as a tool; switch
// to an explicit marker in SKILL.md if that ever bites.
const verbs = new Set(tools.map((t) => t.name.split("_")[0]));

let bad = 0;
for (const skill of readdirSync("skills")) {
  const file = `skills/${skill}/SKILL.md`;
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    for (const [, name] of line.matchAll(/`([a-z]+(?:_[a-z]+)+)`/g)) {
      if (!verbs.has(name.split("_")[0]) || current.has(name)) continue;
      const hit = tools.find((t) => t.name === name);
      console.error(`${file}:${i + 1}: \`${name}\` ${hit ? `is deprecated (${hit.description.split(".")[0]})` : `is not a tool in ${pkg}`}`);
      bad++;
    }
  });
}
console.log(`${current.size} current tools in ${pkg}; ${bad} bad reference(s).`);
process.exit(bad ? 1 : 0);
