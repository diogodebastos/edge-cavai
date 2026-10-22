# An agent that rewrites itself for one person

*Three loops and two weeks of real records: what Lax couldn't do yet, what got in the way, and how it learns to learn.*

Most agents improve when their makers ship a new version. Lax improves for one person, in that person's own copy of its code, from what happens between the two of them. It has three loops: what it can't do yet, what got in your way, and how it learns. All three end the same way: a change on a branch, tested, and nothing reaches `main` without a yes.

This is what those loops actually did in their first two weeks, from Lax's own records.

## Loop 1: "I can't", then a wish

Every Claude Code session has Lax's `gap` tool. When Claude can't do what you asked (no tool, no access, not built yet), it calls `gap` once and answers as usual. Lax keeps a wish list. When you say "learn to…", or hit the same gap twice, Lax drafts a proposal, builds it in a git worktree on `lax/<slug>`, and runs the tests and the guardrails: no auth, no secrets, no hooks, no tunnel. Then it tells you on the phone. "Merge it" merges, restarts and checks that it came back healthy, and rolls back if it didn't.

Its first wish was "tell me my Claude usage". Lax couldn't: the usage lived in the server's memory, and Lax may not open its own database. It proposed writing the usage into each voice run's prompt, built it, and it was merged by voice as [#21](https://github.com/diogodebastos/lax/pull/21).

Two weeks in, the wish list looks like this:

| | wishes |
|---|---|
| merged | 5 (two built by Lax itself, two built by hand as whole phases once the wish showed they were needed, one a nightly fix) |
| declined | 9 |
| later | 3 |
| waiting for review | 1 |

The declines are the interesting part. Four were things I'd rather do myself: schedule a message, book a ride, delete a sent message, change an artifact's sharing. One was a dictation slip, not a wish at all ("look through the phone camera" was something I never said). For three, Lax found it already could, with its own tools or a connector, and said so instead of building them again. The last is the subscriptions review in loop 3.

## Loop 2: friction, fixed overnight

Lax keeps a friction log of small things that went wrong between us:

- a permission I answered at the terminal while the phone was asking;
- one nobody answered on the phone;
- a voice run that failed;
- a terminal session started without `lax`, so Lax couldn't hear me there (noted once a day per project);
- "Lax, that was annoying", with what it had just done.

At 3:00, if there was any friction since the night before, Lax drafts one small fix to its own code, read-only, and builds it the same way as a wish. It gets no issue and no pull request, and nothing is pushed. In the morning, at the first quiet moment, it says what it saw and what it changed.

Here is the first one, word for word from its proposal:

> **What I saw.** The one friction item is a terminal session started without `lax`, so Lax couldn't hear the user there. `onHook` notes this on a session's first prompt, but only into the friction diary that is read at night. The feed doesn't show the session as unheard, so nobody finds out during the session. The user keeps typing to a session the phone can't reach, and the `/lax` skill that reopens it is never mentioned. The condition is also an inline boolean with no test.
>
> **What I'd change.** Add and export `unheard(session, channels, mine)` […]. When it is true, add one plain feed line, "not through Lax: say /lax here to reopen it live" […]. No emoji in the line.
>
> **Risks.** If the channel registers a moment after the first prompt, the user could see a false "not through Lax" line once. The current friction note has the same race.

It noticed the gap between when it learned something and when I found out. It moved an inline condition into a tested function. It followed a rule of mine (no emoji in its UI) that it had learned weeks earlier, and it named its own race condition. It built the fix at 3:14 and I merged it that afternoon.

**Before and after, honestly.** The log is small. It holds 4 terminal sessions started without `lax` and 14 approvals nobody answered on the phone (nine of them on a single day, during a long session away from the desk). After the fix, a session without `lax` says so in the feed the moment you type into it, instead of the next night. The numbers are too few to claim a trend yet. What changed is when I find out.

The night loop also had to learn to be robust. It once got stuck on a merge nobody heard about. So after-merge retries were added, and git settles a stuck merge by itself. A night the Mac was off is now caught up later that day, once it has sat idle for half an hour.

## Loop 3: learning how to learn

![Lax's mind, live: what it keeps, as spheres; "learning" counts every change to its mind, "dreams" every reflection and weekly review](/images/blog/bp9/mind.png)

How Lax learns, remembers, wishes and sees itself isn't code. It's four plain files in its mind that it may rewrite: `learning.md`, `remembering.md`, `wishing.md` and `self.md`. Once a week, a review reads its own record (declined wishes, corrected notes, reverted merges) and changes them.

The first real change came from me saying "ask me in a week" about one of its ideas (a review of my digital subscriptions and bills). It had come back three times in five days, each time corrected. In the next review it wrote itself a deferral rule:

> Deferrals: when the user answers a wish with "ask me in a week" / "another time" […], I note the date to ask again and don't offer it earlier, however the idea comes up again.

When I declined that idea outright a week later, the review closed it for good. It also looked at four declines in three days and changed how it drafts wishes:

> He prefers building his roadmap to a growing wish list: I only draft a wish when he says "learn to…" or hits the gap twice, and I fold small ones into existing tools rather than proposing new abilities.

That's the loop above the loops. It didn't get a better model. It changed its own instructions from what its record showed about me.

## Why "for one person"

Every Lax is born fresh, from its person's own clone. Mine has a deferral rule because I said "ask me in a week". Yours won't, unless you do. Its code drifts the same way: my Lax has a feed line for sessions it can't hear because I start terminals without `lax`. `npm run update` brings in the project's changes and keeps what your Lax changed in itself: merged on a branch, tested, then `main`.

## The fences

Self-modification without fences would be a bad idea, so these are in code, not in a prompt:

- **Never on `main`.** Every change is a worktree on `lax/<slug>`.
- **Guardrails.** `lib/guard.mjs` fails any branch that touches how Lax is reached (auth, the token, pairing, the relay, the sealing), the tunnel and its setup, the hooks, the layout of its home, or the guardrails themselves, whatever the tests say. It's checked twice, before the branch is offered and again before the merge, and a wish is capped at 800 changed lines: one small ability, not a rewrite.
- **Tests.** `npm test` runs on a throwaway Lax, never your own `~/.lax`.
- **A yes.** On the phone, with the whole proposal one tap away.
- **A way back.** After a merge it restarts and checks itself, and rolls back if it doesn't come back healthy.
- **A budget.** A few runs a day, paused near your plan's limits. "learns" in the Life menu turns all of it off.

---

Lax is open source: [github.com/diogodebastos/lax](https://github.com/diogodebastos/lax). The loops are `lib/learn.mjs` (wishes), `lib/improve.mjs` (nightly fixes) and `lib/brain.mjs` (reflection and the weekly review).
