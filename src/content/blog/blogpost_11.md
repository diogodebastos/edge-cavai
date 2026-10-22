# How Lax uses every Claude Code extension point

*Hooks, an MCP server, channels, headless runs, skills and git worktrees: a tour of every place Lax plugs into Claude Code.*

Lax is a pixel companion for Claude Code that lives on an old phone. It watches every session on my Mac, carries my approvals to the phone, answers me out loud, remembers how we fixed things, and changes its own code. It has no agent framework and no vector database, and it calls no API with its own key. Claude Code already is the agent loop: tools, permissions, resuming, MCP, skills and hooks. Lax plugs into every place Claude Code lets you plug in, and this is a tour of them.

## 1. Hooks: seeing every session without opting in

`npm run setup` adds one script, `hooks/lax-hook.mjs`, to `~/.claude/settings.json` on nine events. Every Claude Code session on the Mac reports to Lax from then on, whether it's in a terminal, the desktop app or a headless run.

| Event | What Lax does with it |
|---|---|
| `SessionStart` | Returns `additionalContext`: a page of what Lax knows about this project and about you (2.5k + 1k characters at most). Every new session starts briefed. |
| `UserPromptSubmit` | The prompt goes into the feed on the phone, and into the journal Lax learns from. |
| `PreToolUse`, `PermissionRequest` | The approval goes to the phone as a bubble with ✓ / ✗ and ⋯ for the full command. Whichever answers first wins, the phone or the terminal. |
| `PostToolUse`, `PostToolUseFailure` | The live feed, XP, and the tool counts its traits grow from. |
| `Notification`, `Stop` | "Waiting for you" and "done" bubbles, read aloud if you want. |
| `Stop`, `SessionEnd` (and every event's `transcript_path`) | The session's tab closes, and once it's quiet its transcript is copied to Lax's archive with secrets scrubbed, so it outlives Claude Code's 30 days. |

Two details made hooks work in real life:

- **Waits in layers.** An approval can wait on the phone for 15 s to 2 minutes, which you pick, or up to 10 minutes for a scheduled job. The server's wait sits inside the hook's HTTP request, which sits inside Claude Code's hook timeout, and each layer outlasts the one inside it (`hooks/timeouts.mjs`). A bubble never outlives the hook that asked for it.
- **Fail open, fast.** When Lax's server is down, the hook exits in milliseconds and the terminal prompt takes over. Lax never slows Claude Code down.

The same hook is also a fence. When Lax runs Claude Code on its own (see 5), `lax-hook.mjs` decides each tool call: reading is free, Lax's secrets and its database are refused outright, and anything that changes something asks the phone.

## 2. The status line

`hooks/lax-status.mjs` is the status line, installed only if you don't already have one. It shows your plan's usage under the prompt, and it's also how Lax learns that usage: Claude Code passes it the rate limits, Lax keeps them for the phone, and it slows its own background work as you get near your limits. It also passes on each session's model and how full its context is, which the phone shows under the session's tab.

## 3. An MCP server in every session

`channel/lax-channel.mjs` is a user-level MCP server called `lax`, so every session gets its tools:

- `recall`: "how did we fix the tunnel in August?" It searches episodes, then notes, then the transcript archive, all with grep and no index.
- `gap`: called when Claude can't do what you asked. Lax keeps it as a wish (see 6).
- `misheard`: when the dictated words had to be read as a name Lax knows, it learns the slip so it's fixed next time.
- `schedule`: "every weekday at 8:30, brief me on open PRs". The job is saved only after a yes on the phone.
- `self`: how Lax looks today (body, colours), so the pages it makes are in its own hand.
- `tell`: pass a message to another live session.
- `share`: a WhatsApp draft with what you made, opened on the Mac.

## 4. Channels: talking into a running session

Channels are a research preview, and they're the most fun extension point. `lax` is a wrapper for `claude --dangerously-load-development-channels server:lax`. In a session started that way, what you say to the phone arrives in the terminal as `← lax: …`, Claude does the work, and its `reply` tool sends the answer back to be read aloud. Approvals in that session go to the phone too.

Two things are worth knowing:

- Claude Code loads a channel only at startup. So `/lax`, a skill, reopens the current conversation in a new terminal window as a live `lax` session (`claude --resume`, same folder).
- The development flag shows a warning. Lax answers it for you only after you've answered it yourself once (`~/.lax/consent.json`).

## 5. Headless `claude -p`: Lax's own thinking

Everything Lax "thinks" is a `claude -p` run with your normal Claude Code login, which is why it needs no API credits:

- **Talking to Lax itself** (its own tab on the phone): `claude -p --resume` in its mind folder, `~/.lax/mind`, where `CLAUDE.md` says who it is and what it knows about you. The conversation starts fresh after 8 quiet hours or 150k tokens, carrying the last few turns over.
- **Reflection**, after a session has been quiet for 10 minutes: one Sonnet run reads the journal, rewrites the project's notes and keeps an episode. At most 20 a day.
- **Scheduled jobs**: a fresh run in the job's folder, with a time limit and its project notes up front.
- **The nightly fix** (see 7).

Each run gets a prompt, a folder, a time limit and the fence from 1. The mind folder's `.claude/settings.json` does the rest: your repos and Lax's own code are readable, editing outside the mind asks the phone, and its secrets are denied.

Background work is budgeted: a few runs a day, paused near your plan's limits. "Its own work: light or normal" in the Life menu sets how much.

## 6. Skills, in both directions

- **Lax ships one**: `/lax`.
- **Lax writes them for you.** When the reflection sees a workflow you repeat, it drafts a `SKILL.md` in its mind. The phone shows the whole text, and only your yes installs it as `~/.claude/skills/lax-<name>`. Code-level guardrails apply: one file, no tool grants, nothing about its secrets or getting around permissions.

## 7. Self-modification: worktrees, tests and a yes

Lax's code is a clone it may change, but never on `main`:

- **Wishes.** When `gap` fires and you say "learn to…", Lax drafts a proposal and builds it in a worktree on `lax/<slug>`, fenced, with the guardrails (no auth, no secrets, no hooks) and the tests. You merge it by voice. After the merge it restarts, checks itself, and rolls back if it doesn't come back healthy. Its first wish, "tell me my Claude usage", went from "I can't" to a merged pull request by voice ([#21](https://github.com/diogodebastos/lax/pull/21)).
- **Nightly fixes.** At 3:00, if something got in your way that day, it drafts one small fix to itself the same way. In the morning it says what it saw and what it changed. "Merge it" merges; "no" throws it away for good.

## What I'd tell someone building on Claude Code

- **The loop is already there.** Before reaching for a framework, check whether a `claude -p` run with a folder, a `CLAUDE.md`, a settings file and a hook does the job. For Lax it always has.
- **Hooks are the integration surface.** Nine events gave Lax everything: context in, approvals out, a feed, a journal and an archive.
- **Plain files beat clever storage.** Lax's memory is markdown in a git repo, and recall is grep. You can read everything it knows, and so can it.

---

Lax is open source: [github.com/diogodebastos/lax](https://github.com/diogodebastos/lax). `git clone`, `npm run setup`, and it's talking in about four minutes.
