# Lax on Cloudflare

*How a phone reaches a Mac that only listens on localhost: a tunnel, a Durable Object relay, sealed messages, and a page that has to prove it came from your Mac.*

Lax lives on my Mac. Its memory, its history and its code never leave it, and it listens only on `127.0.0.1`. The phone is a screen, a mic and a speaker, and it has to reach the Mac from anywhere: the desk, a train, a phone hotspot with the lid closed in a bag. That link is Cloudflare. Here is how it's built, in the order we built it, and what each step was for.

## Two ways in

**The tunnel**, for someone with a domain. `cloudflared` runs on the Mac, `lax.<your domain>` points at it, and Cloudflare Access sits in front: an email PIN in the browser, and a service token for the Android app's background link. Lax's own token is a second lock. `setup domain` does it all from one API token, which it takes from the clipboard so it never passes through the conversation.

**The relay**, for everyone else: a free Cloudflare account and no domain. It's one Worker and one Durable Object on your own account, at `lax-relay.<you>.workers.dev`, deployed by `npm run setup`.

They can run side by side.

## The relay is a pipe

The Mac opens one WebSocket out to the Durable Object and keeps it, with a ping every 20 seconds. The phone talks to the Worker over HTTPS, which is also what lets Chrome use the mic. Every request the phone makes is replayed against Lax on `127.0.0.1` and streamed back in 256 KB frames, which keeps them well under WebSocket's 1 MiB limit. The page, the Android app, voice uploads and the token all work unchanged, because to Lax it's just a request.

- **Hibernatable WebSockets**, so a link that sits idle all night costs next to nothing.
- **"Mac asleep"**, not an error. With no link from the Mac, or a minute without its ping, the phone gets a 503 and shows Lax asleep, as it last looked.
- **Twenty wrong tokens** from one address in ten minutes, and that address is refused.
- **Nothing relayed counts as "this Mac".** Replayed requests are marked, so the pairing page and anything local-only stay local.

## Held while the Mac sleeps

A pipe isn't enough when the Mac's lid is closed. What you say, a yes or no, and a settings change are held in the Durable Object, for up to 12 hours and 100 messages. The phone hears "Your Mac is asleep. I'll pass it on when it wakes." When the Mac links again, they go to it in order, before anything new.

Every request carries an id that the phone keeps when it retries (say, on a switch from Wi-Fi to mobile data), and the Mac does each id once: a repeat gets the first answer. Quick actions are never held, since "stop that session" shouldn't happen eight hours late.

We proved it with the lid closed: three messages, held, then in the session in order, each once, about 20 seconds after the lid opened.

The Mac also says goodbye just before it sleeps (a small Swift helper listening for the power notification), so the relay answers "asleep" at once instead of after a 30-second timeout.

## Falling back between them

With both ways set up, the Mac tells the phone which ones reach it, and the phone moves when the one it's on keeps failing. A page on the tunnel asks the relay whether the Mac is there and moves over. Once the way you chose works again, it moves back, never twice in three minutes. On the Flip, the app moved to the relay within 15 seconds of the tunnel stopping, and moved back by itself three minutes after it returned.

## Sealed, end to end

Both ways in pass through Cloudflare, which terminates TLS at its edge, and the relay holds messages while the Mac sleeps. So what the phone and the Mac say to each other is sealed: what you said, your yeses and noes, the feed, memory, and held messages. It's AES-256-GCM, with a key made on the Mac that reaches the phone only after the `#` of its pairing link, and browsers never send that part to any server. Cloudflare sees paths and the token, never what's said.

The page itself is a harder problem. Its own files (`lax.js` and the rest) come through Cloudflare too, and a changed `lax.js` could read everything the page opens. So each file is signed with an HMAC of its path and bytes, using a key derived from the sealing key, and the Android app fetches them itself and shows only what's signed. A browser can't check its own page; the app is the safe way in.

The first page the app refused was real. Cloudflare had added its own bot-detection script to `index.html` on the tunnel, so the signature no longer matched. The page is now sent `no-transform`, and arrives exactly as the Mac signed it.

## Lax's public face

The same deploy also serves the parts of Lax that are meant to be seen:

- **The landing**: the demo in a phone, and how to make your own Lax.
- **Its mind, live**: a page showing the shape of what Lax knows (counts, never contents), pushed by the Mac with its own key and kept by a second Durable Object.
- **Share cards**: Lax as it is today, with its name, level, species and four counts, as a 1200 × 630 PNG drawn pixel by pixel on the Mac. They're kept at an address nobody can guess, with the tags WhatsApp and X read for the preview. The Worker accepts only names and counts (`cleanCard`) and a PNG.

Opening the relay's address without being paired lands you on that public face. A paired page keeps a flag (never the token) so it opens Lax instead.

## What it costs

Nothing, for one person. The free tier's Durable Object duration is the limit to watch. A link kept alive all day comes to an estimated 10,800 of the 13,000 GB-s, thanks to hibernation. That estimate is still on the list of things only a real day of use can prove ([#31](https://github.com/diogodebastos/lax/issues/31)).

## What I'd tell someone building the same

- **Make the Mac dial out.** It needs no open port and no domain, and works on any network, including a phone hotspot.
- **Durable Objects are the right shape for one person's link**: one object, one WebSocket, a small SQLite queue, and hibernation for the quiet hours.
- **Treat the edge as a place your data passes through.** Seal the messages, sign the page, and send it `no-transform`.

---

Lax is open source: [github.com/diogodebastos/lax](https://github.com/diogodebastos/lax). The relay is `relay/worker.mjs` and the Mac's side is `lib/relay.mjs`.
