# nexus-exchange-skills

Agent skills for trading on [Nexus Exchange](https://exchange.nexus.xyz) with the
[`nexus` CLI](https://github.com/nexus-xyz/nexus-exchange-cli) or the
[Nexus MCP server](https://github.com/nexus-xyz/nexus-exchange-mcp).

Each skill is a folder with a `SKILL.md` in the [Agent Skills](https://agentskills.io)
format. They teach an agent *how* to use the exchange safely. The CLI and MCP
server provide the actual calls.

| Skill | Use it for |
|---|---|
| [`nexus-getting-started`](skills/nexus-getting-started/SKILL.md) | Install, wallet sign-in, API key, testnet funds, first read |
| [`nexus-trading`](skills/nexus-trading/SKILL.md) | Preview, confirm, place, amend, cancel; all order types |
| [`nexus-portfolio-risk`](skills/nexus-portfolio-risk/SKILL.md) | Reading equity, withdrawable, positions and liquidation risk correctly |
| [`nexus-troubleshooting`](skills/nexus-troubleshooting/SKILL.md) | Networks, credentials, rate limits, and common errors |

## Install

### Claude Code plugin (skills + MCP server in one step)

```text
/plugin marketplace add nexus-xyz/nexus-exchange-skills
/plugin install nexus-exchange@nexus-exchange
```

The plugin registers all four skills and the Nexus MCP server
(`npx -y @nexus-xyz/exchange-mcp`, so Node.js is required). Market data works
with no setup. For account and trading tools, export credentials in the shell
you start Claude Code from:

```sh
export NEXUS_EXCHANGE_API_KEY=nx_...
export NEXUS_EXCHANGE_API_SECRET=...
# NEXUS_EXCHANGE_NETWORK defaults to testnet
```

### Skills only (any Agent Skills client)

```sh
git clone https://github.com/nexus-xyz/nexus-exchange-skills.git
mkdir -p ~/.claude/skills
ln -s "$PWD"/nexus-exchange-skills/skills/* ~/.claude/skills/
```

Use `.claude/skills/` inside a project instead to scope them to that project.
Other agents that read the Agent Skills format can load the same folders. Pair
them with the MCP server (`claude mcp add nexus -- npx -y @nexus-xyz/exchange-mcp`)
or the `nexus` CLI so the agent can act on them.

## Safety defaults

Every skill assumes **testnet** (play funds) unless the user says otherwise,
previews before placing, asks for confirmation before any order, and never asks
for a private key or API secret in chat.

## License

Dual-licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE), at your option.
