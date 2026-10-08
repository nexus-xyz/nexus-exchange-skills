---
name: nexus-portfolio-risk
description: Read and explain a Nexus Exchange account correctly (equity, margin, withdrawable balance, positions, liquidation risk, PnL, fees, funding). Use when the user asks how their account or positions are doing, how much they can withdraw, how close they are to liquidation, or for a portfolio or PnL report on Nexus.
---

# Reading a Nexus portfolio

## Start with one coherent read

```sh
nexus account state --output json     # summary + every open position, one read
```

MCP: `fetch_account_state`.

Prefer this over `account summary` + `positions`. Those are two requests, and a
fill landing between them gives totals that disagree with the position list.

## Three rules before quoting any number

1. **Null is not zero.** A `null` (shown as `-`) means the server could not
   derive the figure. For position risk fields the reason sits in a companion
   `*_error` field. Report "unknown" and the reason. Never present it as 0: a
   missing loss rendered as 0 makes an underwater account look flat.
2. **A failed read is not an empty account.** `502 authoritative_margin_unavailable`
   means the balance is *unknown right now*. Retry; do not tell the user they
   have nothing.
3. **Use `withdrawable` for "how much can I take out".** It is free margin
   already net of initial margin and order reservations, floored at zero.
   `available margin` is not the same thing.

## What to report on a position

Market, side, size, entry, mark, unrealized PnL, and liquidation price.
Also give the gap between mark and liquidation price as a percentage, because
that tells the user how close they are to being liquidated. If any of these
are null, say which and why.

## Deeper reads

| Question | CLI | MCP |
|---|---|---|
| Fee tier, maker/taker bps | `nexus account fees` | `fetch_trading_fees` |
| Equity / PnL / volume over time | `nexus account portfolio-history --window day\|week\|month\|all` | `fetch_portfolio_history` |
| Equity only, finer grain | `nexus account equity-history` | `fetch_equity_history` |
| Realized PnL on closed positions | `nexus closed-positions` | `fetch_positions_history` |
| Executions | `nexus fills --limit 100` | `fetch_my_trades` |
| Funding paid / received | `nexus account funding` | `fetch_funding_history` |
| Deposits, withdrawals | `nexus account deposits`, `nexus withdrawals` | `fetch_deposits`, `fetch_withdrawals` |
| Market risk parameters | `nexus market risk-params <MARKET>` | `fetch_market_risk_params` |
| ADL events touching the account | `nexus account adl-history 0x<ADDRESS>` | `fetch_adl_history` |

A negative maker fee is a rebate.

## Reporting style

Lead with equity, withdrawable, and the riskiest position. Keep money values as
the decimal strings the API returns; do not reformat through floats.
