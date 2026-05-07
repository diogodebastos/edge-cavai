# Velvet Blum: a social network with no algorithm and no ads

*A weekend experiment in giving the feed back to the user.*

---

Every social network I've used in the last decade has the same loop: you follow people, an algorithm decides what you actually see, and ads are slotted in between. The follow graph stops being the feed. It becomes a *suggestion* the algorithm overrides.

Velvet Blum is the opposite of that. **You curate your network. Your network is your feed.** No ranking, no recommendations, no ads. Reverse-chronological, always.

Live: [velvet-blum.pages.dev](https://velvet-blum.pages.dev/).

![feed](/images/blog/bp5/feed.png)

## The lens

The interesting primitive isn't the feed — it's the **lens**.

Visit `/u/<handle>/lens` and you see *that user's feed* — the posts they would see, in their reverse-chronological order, through their follow graph. Read-only. You can't react or comment as them. But every post has a tiny `+ follow @author` button so you can copy accounts you didn't know about into your own network.

It turns curation into a public good. Instead of an algorithm doing taste-matching for you, you borrow taste from a person you trust. One click and a stranger's curator becomes a contributor to yours.

![lens](/images/blog/bp5/lens.png)

## Encrypted DMs

The other thing I wanted was DMs the server can't read.

- Per-device **X25519** keypair. Private key wrapped with a passphrase via **Argon2id** + libsodium `secretbox`. Server never sees the passphrase or the unwrapped key.
- Messages sealed client-side using the recipient's public key (`crypto_box_seal`). Server stores ciphertext only.
- A **second sealed copy** is written under the sender's own public key, so the sender can also read their own history from any device they unlock.
- Realtime fanout via a **Durable Object per conversation** with WebSocket subscribers.
- A user may DM another iff the recipient follows the sender, and neither party blocks the other. No cold inbox, no spam vector.

![encrypted DMs](/images/blog/bp5/dm.png)

If the D1 database leaks tomorrow, the messages stay opaque. The keys to read them never left the clients.

## Stack

- **Web**: SvelteKit PWA on Cloudflare Pages
- **API**: Hono on Cloudflare Workers
- **DB**: D1 (SQLite) via Drizzle
- **Media**: R2 for photos, Stream for video
- **Sessions**: Workers KV
- **Email**: Resend (magic-link auth — no passwords)
- **Realtime**: Durable Objects for DM WebSocket fanout
- **Crypto**: libsodium-wrappers (X25519 sealed-box, Argon2id KDF, secretbox)

The whole thing is one pnpm workspace: `apps/api` (Hono), `apps/web` (SvelteKit), `packages/db` (Drizzle schema + migrations), `packages/schema` (shared Zod types), `infra/wrangler.toml`.

## Why no algorithm

I'm not against ranking in general — I'm against ranking I didn't ask for. The algorithmic feed conflates two things: *what is new in my network* and *what someone thinks I want*. The first is a fact. The second is a guess. Velvet Blum only shows you the first. If you want a different selection, you build a different network — or you borrow one through a lens.

It's also a much smaller surface. No ranking pipeline, no engagement metrics, no recommendation model, no ad inventory. The whole product is a couple of Workers, a D1, an R2, and a handful of Durable Objects.

## What's next

- Threading and quote-posts.
- Group DMs (same X25519 sealed-box construction, one envelope per recipient).
- Image-first compose flow on mobile.
- Federation is the obvious next question — but I want to live with the curated-only model for a while first.

Try it: [velvet-blum.pages.dev](https://velvet-blum.pages.dev/). If you make a network, share your lens URL.
