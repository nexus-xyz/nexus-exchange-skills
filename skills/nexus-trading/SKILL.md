---
name: nexus-trading
description: Place, amend, and cancel orders on Nexus Exchange safely through the `nexus` CLI or the Nexus MCP tools, including limit, market, stop, take-profit, and trailing orders. Use whenever the user asks to buy, sell, open or close a position, set a stop, cancel orders, or run a batch of orders on Nexus.
---

# Trading on Nexus Exchange

Orders move money. Follow this sequence every time, even for "just a quick" order.

## The safe sequence

1. **Know the network.** Default is testnet (play funds). If the target moves
   real funds, say so to the user in plain words before doing anything else.
2. **Check the market.** `nexus market status <MARKET>` (MCP `fetch_market_status`)
   must not be halted. Read tick/lot rules from `nexus markets` or
   `nexus market risk-params <MARKET>`. Do not round a price or size yourself;
   ask the user if theirs does not fit.
3. **Preview.** `nexus order preview ...` (MCP `preview_order`) with the exact
   flags you will place. It returns required margin, projected liquidation
   price, leverage, fill VWAP and fees. Nothing is placed.
4. **Confirm with the user.** Show side, size, price, market, preview margin and
   liquidation price, and wait for a yes. Never infer consent from an earlier
   order.
5. **Place**, then **verify**: `nexus order get <ID> --market <MARKET>` or
   `nexus orders`. "Accepted" is not "filled"; check `nexus fills` for executions.

Preview is signed and counts against the **trading** rate-limit bucket. Call it
once per order, not in a loop.

## CLI

```sh
nexus order preview --market BTC-USDX-PERP --side buy --type limit --price 84000 --quantity 0.01
nexus order place   --market BTC-USDX-PERP --side buy --type limit --price 84000 --quantity 0.01 --tif GTC
nexus order amend  <ORDER_ID> --market BTC-USDX-PERP --price 85000
nexus order cancel <ORDER_ID> --market BTC-USDX-PERP
nexus order cancel --market BTC-USDX-PERP      # every order in one market
nexus order cancel --all
nexus order batch orders.json                  # JSON array; '-' reads stdin
```

- `--type` is `limit` or `market`. `--tif` is `GTC` (default), `IOC`, `FOK`, `post-only`.
- `--reduce-only` guarantees the order only shrinks a position. Use it for every
  closing order.
- By-id commands (`get`, `amend`, `cancel <ID>`) require `--market`.
- `place` prompts for confirmation. `--yes` skips it; only pass `--yes` after
  the user confirmed in the conversation.
- Add `--output json` when you need to parse results.

The CLI does **not** yet expose stop, take-profit, or trailing orders. Use the
MCP tools for those.

## MCP

`create_order`, `preview_order`, `create_orders`, `edit_order`, `cancel_order`,
`fetch_open_orders`, `fetch_order`, `fetch_my_trades`.

Order fields: `market_id`, `side` (`buy`|`sell`), `type`, `size` (a decimal
**string**), plus by type:

| `type` | also needs |
|---|---|
| `limit` | `price` |
| `market` | nothing |
| `stop_limit`, `take_profit_limit` | `price`, `trigger_price` |
| `stop_market`, `take_profit_market` | `trigger_price` |
| `trailing_stop` | `trailing_offset_bps` |
| `trailing_limit` | `trailing_offset_bps`, `limit_offset_bps` |

A field on the wrong type is rejected, not ignored. Optional: `time_in_force`
(`GTC`|`IOC`|`FOK`|`PostOnly`), `reduce_only`.

## Closing a position

Read the position first (`nexus positions` / `fetch_positions`), then place the
opposite side for its exact size with reduce-only. Do not compute size from
memory of an earlier read; a fill may have landed since.

## Things not to do

- Do not retry a failed `place` blindly. Check `nexus orders` first: the order
  may have been accepted before the error.
- Do not set leverage or margin mode; neither is supported by the API yet. Isolated
  margin can be adjusted with `nexus account margin add|remove <MARKET> <AMOUNT>`.
  `remove` raises liquidation risk; say so.
- Do not pass `--yes` or loop orders without a user-approved plan.
