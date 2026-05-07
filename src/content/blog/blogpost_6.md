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

## Security

"Isn't a vibecoded social app a security disaster?" Fair question. Two pieces are worth being concrete about: account access and message contents.

**Account access.** There are no passwords to leak or reuse. Auth is magic-link only: you put in your email, the API mints a single-use token, you click it, and the server creates a session. The session token is 32 bytes from `crypto.getRandomValues` (256 bits of entropy), stored server-side in Workers KV, and handed back as an `httpOnly`, `SameSite=Lax`, `Secure` cookie. JavaScript can't read it, so an XSS bug can't exfiltrate it; SameSite blocks the obvious CSRF shapes. Magic-link issuance is rate-limited (5 per email per 10 minutes), and links are single-use and time-bound. The practical floor of your account security is your email inbox.

**How login works**, end to end:

1. Client `POST /auth/magic-link` with an email. The API generates a token, stores `(token, email, expiresAt)` in D1, and emails a link via Resend.
2. Client `POST /auth/consume` with the token. The API marks the magic-link row consumed (single-use), looks up or creates the user, mints a session token, writes `s:<token> → userId` to Workers KV with a 30-day TTL, and sets the `vb_session` cookie.
3. Every subsequent request goes through `sessionMiddleware`, which reads the cookie and resolves it back to a `userId` via KV. Protected routes wrap that with `requireAuth`.
4. Logout deletes the KV entry and clears the cookie, immediately invalidating the session everywhere.

The whole auth surface is small enough to read in one sitting: [`apps/api/src/routes/auth.ts`](https://github.com/diogodebastos/velvet-blum/blob/main/apps/api/src/routes/auth.ts) for the login flow, and [`apps/web/src/lib/crypto.ts`](https://github.com/diogodebastos/velvet-blum/blob/main/apps/web/src/lib/crypto.ts) (~150 lines) for every line of crypto in the app.

**Message contents.** The DM keys live on your device, not on the server. The X25519 keypair is generated client-side; the private key is wrapped with an Argon2id-derived key (`OPSLIMIT_MODERATE` / `MEMLIMIT_MODERATE`, random per-user salt) using libsodium `secretbox`, and only the *wrapped* blob is uploaded. Once unwrapped with your passphrase, the raw private key is cached in the browser's IndexedDB on that device. The server stores public keys, wrapped private keys, and sealed ciphertexts — nothing it can decrypt. A session hijacker on a fresh device sees encrypted blobs until they also know your passphrase.

**What this doesn't give you.** Sealed-box DMs use static keys, so there's no forward secrecy: if a device is fully compromised, past ciphertexts on that device become readable. There's no 2FA or active-session list yet, no "log out everywhere" button, and no re-auth prompt for sensitive actions. The crypto is standard libsodium primitives in roughly 150 lines (`apps/web/src/lib/crypto.ts`) — easy to audit, but not formally audited. Forward secrecy via ephemeral session keys, device management, and a passphrase-strength meter are the obvious next steps.

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
- Security:
  - Forward secrecy for DMs via ephemeral session keys (X3DH-style handshake), so device compromise doesn't retroactively unlock history.
  - Active-session list and a "log out everywhere" button backed by a per-user session index in KV.
  - Optional TOTP 2FA on top of magic-link, and re-auth prompts for destructive actions (delete account, rotate keys).
  - Passphrase strength meter at signup, plus a key-rotation flow that re-wraps the private key without invalidating message history.
  - A formal third-party audit of `crypto.ts` and the auth surface before the app leaves "weekend experiment" status.

Try it: [velvet-blum.pages.dev](https://velvet-blum.pages.dev/). If you make a network, share your lens URL.
