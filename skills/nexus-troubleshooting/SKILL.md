---
name: nexus-troubleshooting
description: Diagnose failures from the `nexus` CLI or the Nexus MCP server (missing or rejected credentials, wrong network, rate limits, refused faucet or real-funds actions, unavailable margin, halted markets). Use when a Nexus command or tool call errors, returns nothing, or behaves unexpectedly.
---

# Troubleshooting Nexus Exchange

Work top-down: network, then credentials, then the specific error. Check the
cheap public call first (`nexus health`, `nexus markets`). If that fails,
credentials are not the problem.

## Network

- The default is **testnet**. Confirm which network ran: `nexus --network testnet ...`
  or `NEXUS_NETWORK` (CLI), `NEXUS_EXCHANGE_NETWORK` (MCP).
- **`mainnet` is not reachable in the current release.** Requests are refused
  locally. This is expected behaviour, not an outage.
- `stable` and `beta` were retired. `--network beta` is rejected; use `testnet`.
  A config file still naming one warns and falls back to the default. Old
  scripts that pass `beta` need updating.
- A custom network (a label under `custom_networks` in the config) must declare
  `funds`. Undeclared funds means **unknown**, and fund-moving commands are
  refused until it is declared.

## Credentials

| Symptom | Cause | Fix |
|---|---|---|
| "no credentials are configured" | No key for *this* network | `nexus setup` for that network, or export `NEXUS_API_KEY` / `NEXUS_API_SECRET` |
| Signature / 401 on a key that worked before | Key minted on another network; keys are per network | Mint a key on this network |
| `keys ...` fails | Needs a session token | `nexus auth login` first (session lasts 24h) |
| `agents register` refused on a custom network | No signing chain id declared | Declare `chain_id` for the network, or pass `--chain-id` |

Resolution order: flags, then env vars, then the config file
(`$XDG_CONFIG_HOME/nexus/config.json`). An env var silently overrides the file.

## Specific errors

- **429 / rate limited:** `nexus account rate-limit` (MCP `fetch_rate_limit_status`)
  shows tier, remaining, and reset. Wait for the reset. `order preview` spends
  the trading bucket too, so do not preview in a loop.
- **`502 authoritative_margin_unavailable`:** margin could not be read right
  now. Retry shortly. Do not report the balance as zero.
- **Faucet / credit refused:** either the network is not play funds, or today's
  allowance or cooldown is spent. Not an account problem.
- **Order rejected:** check `nexus market status <MARKET>` for a halt, then
  tick/lot size in `nexus markets`. If the order may have been accepted before the
  error, check `nexus orders` before retrying.
- **`nexus ws` refuses to connect on a custom network:** `ws_url` is never
  derived; declare it on the network entry.
- **No command for leverage, margin mode, transfers, sub-accounts, or
  withdrawals:** the published API does not offer these yet, so neither the
  CLI nor the MCP server has them. Tell the user; do not look for a workaround.

## Getting details for a bug report

`nexus --version` prints the CLI version and the API spec version it targets.
Include it, the exact command, the network, and the `--output json` error
body. Never include the API secret or private key.
