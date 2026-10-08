---
name: nexus-getting-started
description: Set up access to Nexus Exchange on testnet (install the `nexus` CLI or the MCP server, sign in with a wallet, mint an API key, claim play funds, make a first read). Use when the user wants to start trading on Nexus, has no credentials yet, or asks how to connect an agent or script to the exchange.
---

# Getting started on Nexus Exchange

Two official surfaces reach the same API. Pick by who drives:

- **`nexus` CLI** (a person or a shell script): `curl https://cli.nexus.xyz | sh`,
  or `brew install nexus-xyz/tap/nexus`. Windows: `irm https://cli.nexus.xyz | iex`.
- **MCP server** (an AI agent): `claude mcp add nexus -- npx -y @nexus-xyz/exchange-mcp`.

Everything below defaults to **testnet**, which runs on play funds. Stay there
until the user explicitly asks for something else.

## 1. Read market data (no credentials)

```sh
nexus markets                   # tradable markets and their rules
nexus ticker BTC-USDX-PERP
nexus orderbook BTC-USDX-PERP
```

MCP: `fetch_markets_summary`, `fetch_ticker`, `fetch_order_book`. If this fails, stop and
troubleshoot (see `nexus-troubleshooting`); credentials will not fix it.

## 2. Sign in and mint an API key

Trading signs each request with an HMAC key pair. Getting one takes a wallet
sign-in first:

```sh
nexus auth login        # EIP-191 sign-in; hidden prompt for the EVM private key
nexus keys create       # the secret is shown ONCE
nexus setup             # store key + secret for this network (file mode 0600)
```

Rules for the agent:

- **Never ask the user to paste a private key or API secret into the chat.**
  Tell them to run the command themselves so the hidden prompt reads it, or to
  export `NEXUS_PRIVATE_KEY` / `NEXUS_API_KEY` / `NEXUS_API_SECRET` in their own shell.
- Do not pass secrets as flags (`--api-secret`, `--private-key`). Flags end up
  in shell history and the process list.
- Keys are **per network**. A testnet key does not authenticate anywhere else.

For the MCP server, set `NEXUS_EXCHANGE_API_KEY` and `NEXUS_EXCHANGE_API_SECRET`
in its environment. `NEXUS_EXCHANGE_NETWORK` defaults to `testnet`.

For a bot, prefer a separate **agent key** over the owner wallet:
`nexus agents register --agent 0x<AGENT_ADDR> --label my-bot` (EIP-712, 30-day
default expiry). Revoke with `nexus agents revoke <ADDRESS>`.

## 3. Fund the testnet account

```sh
nexus account credit            # claim the remaining daily USDX allowance
nexus account credit --amount 500
nexus account faucet            # separate fixed grant, on its own cooldown
nexus balance
```

MCP: `claim_credit`, `claim_faucet`, `fetch_balance`. Both are refused on any
network that does not hold play funds, by design. A failed claim usually
means today's allowance is spent. The account is not broken.

## 4. Confirm it works

```sh
nexus account state             # balances + positions from one read
nexus orders                    # open orders (empty is fine)
```

Then hand off to `nexus-trading` to place a first order.

## Examples

`nexus examples list` lists runnable starter apps (Python, TypeScript, Rust,
CLI). `nexus examples get <id>` downloads one. They need no credentials to
download.
