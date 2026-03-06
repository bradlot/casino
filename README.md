<div align="center">
  <h1>🎰 Discord Casino Bot</h1>
  <p>A premium, extensive, and production-ready Discord Casino & Economy Bot powered by <code>discord.js</code> v14 and <code>better-sqlite3</code>.</p>
</div>

---

> [!WARNING]
> **18+ Content Warning**
> This bot contains explicit adult themes, profanity, drug references, and simulated gambling mechanics. It is strictly intended for mature (18+) audiences and servers. By installing and using this bot, you acknowledge and accept these themes.

---

## Overview

The **Discord Casino Bot** is a massive, highly-configurable ecosystem designed for high-engagement Discord communities. Built from the ground up for production scale, it effectively completely prevents database exploits and race conditions using synchronous SQLite `WAL-mode` transactions.

With over 16 integrated internal modules ranging from interactive Blackjack to a live dynamic event scheduler, this bot gives administrators complete control over a rich virtual economy.

## Key Features

- **Robust Economy System**: Persisted balances with independent wallets and bank accounts (`=deposit`, `=withdraw`).
- **Risk & Reward Mechanics**: Engage users with daily rewards (`=payday`), randomized shifts (`=work`), risk-based crimes (`=crime`), and direct player-vs-player robbing (`=rob`).
- **Interactive Casino Games**: A fully interactive Blackjack engine (`=bj`) featuring soft-17 dealer AI, true deck shuffling, natural blackjack 3:2 payouts, and in-place message editing via Discord Button Components.
- **Dynamic Role Shop & Buffs**: A paginated storefront (`=shop`) where players can buy exclusive Discord roles, or purchase temporary, stackable account buffs (e.g. *Work Payout Multiplier*, *Robbery Protection*).
- **Leveling & XP Perks**: A passive background leveling system that scales economy payouts, reduces crime failure penalties, and natively reduces blackjack house-edge as players level up (`=level`).
- **Extensive Statistics**: A background tracker that meticulously logs user Win/Loss rates, historic biggest wins, and total net-worth (`=stats`, `=leaderboard`).
- **Exploit-Free Achievements**: 18+ unlockable achievements that passively monitor user stats and grant massive cash payouts when triggered (`=achievements`).
- **Live Event Administration**: A dynamic, database-backed template system where admins can trigger server-wide events (like *Double Payday Weekend*) with precise time durations (`=event double_payday 24h`).
- **100% Configurable**: Absolutely zero magic-numbers in the logic files. Every payout, odd, multiplier, limit, string, and requirement is editable inside a massive, centralized `config.js` file.

---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.11.0 or newer).
- A [Discord Bot Token](https://discord.com/developers/applications).

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/bradlot/casino.git
   cd casino
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Rename the `.env.example` file to `.env` and insert your bot token.
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and add: `DISCORD_TOKEN=your_token_here`*

4. **Tune the Configuration**
   Open `config.js` to modify the bot to match your server's exact theme:
   - Command Prefix (default is `=`).
   - `casinoChannelId`: Restrict bot commands to a specific channel (leave empty for global access).
   - Customize embedding colors, emojis, 18+ scenarios, shop items, and achievement thresholds.

---

## Discord Developer Portal Setup

1. Head to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a New Application and navigate to the **Bot** tab.
3. **Crucial Step**: Scroll down to **Privileged Gateway Intents** and enable both **`Message Content Intent`** and **`Server Members Intent`**.
4. Generate your invite link using the **OAuth2 -> URL Generator**:
   - Scopes: `bot` and `applications.commands`.
   - Bot Permissions: `Send Messages`, `Embed Links`, `Manage Roles` (Required to assign shop roles).
5. Invite the bot to your server. Check that the bot's role is positioned *higher* in the server settings hierarchy than any of the custom Shop roles it manages.

---

## Deployment (Docker)

This bot is fully containerized and production-ready. Do not run it via a simple `node` command if you want it to stay online 24/7. Use **Docker Compose**:

```bash
# Build the image and start the container in detached mode
docker-compose up -d --build
```
*The SQLite database will automatically generate inside the `casino/data/` volume and persist across container restarts.*

---

## Command Overview

### Economy & Jobs
- `/balance [target]` - View your wallet, bank, and total net-worth (or view another user's).
- `/deposit [amount]` - Secure funds from your wallet into the bank.
- `/withdraw [amount]` - Withdraw funds for gambling.
- `/payday` - Claim your flat daily reward.
- `/work` - Work a short shift (configurable cooldown).
- `/crime` - Attempt a high-risk crime for massive rewards.
- `/rob <target>` - Attempt to pickpocket a target's wallet.

### Gambling & Store
- `/bj <bet>` - Play an interactive game of Blackjack.
- `/shop` - Browse the paginated marketplace for roles and buffs.
- `/buy <tag>` - Purchase a shop item.

### Progression & Tracking
- `/stats [target]` - View lifetime historic gambling, robbery, and crime statistics.
- `/level [target]` - View your active Level Perks and XP progress bar.
- `/achievements [target]` - View completed/locked achievements and progression tracking.
- `/leaderboard <category>` - View top 10 rankings across Net Worth, BJ Wins, Crime Rates, and Wagered.

### Admin Operations (Requires `Administrator` Discord Permission)
- `/setup setchannel <category> <channel>` - Restrict bot commands to specific channels.
- `/setup clearchannel <category>` - Remove channel restrictions.
- `/addmoney <target> <amount>` - Mint currency into a user's wallet.
- `/removemoney <target> <amount>` - Deduct currency.
- `/setbalance <target> <amount>` - Hard-reset a user's wallet exact value.
- `/gift <target> <tag>` - Give a shop item (Role or Buff) directly without charging balance.
- `/lockcasino` - Globally lock all economy commands instantly.
- `/resetuser <target>` - Completely formats and deletes a user's database row.
- `/event <event_id> <duration>` - Trigger dynamic live events (Example: `/event double_payday 24h`).

---

## Architecture Notes for Developers

The bot dynamically loads all `.js` files located in the `src/commands` and `src/events` directories.

To add a new game (e.g. Roulette or Slots), simply:
1. Create a new file in `src/commands/games/roulette.js`.
2. Follow the `module.exports = { name: '', execute() }` structure.
3. Centralize your payouts/odds by expanding the `config.js` objects.
4. Restart the bot. The Command Handler will automatically parse and enable it!

---
*Created by bradlot*
