# Using Claude to create a Pokémon RomHack

**The idea:** make the version of Pokémon Emerald that I wanted to play as a kid.

**The how:** use [pokémon emerald decompilation project](https://github.com/pret/pokeemerald), mods from the romhacking community ([Pokémon Emerald Legacy](https://github.com/cRz-Shadows/Pokemon_Emerald_Legacy) and [enhanced version](https://github.com/Exclsior/Pokemon_Emerald_Legacy_Enhanced)), Claude Code to help me stitch things together and add my own custom modifications, and Cloudflare to host the game for free.

![title screen](/images/blog/bp3/pokeemerald-0.png)

## Solo Leveling

You are the only trainer in Hoenn that can level up. Your objective is to beat every trainer, but if you lose, you start from your hometown again. You only get to keep your team and bag. Pokémons follow you! 

Included features:
- massively diversified trainer teams
- special trainers from other regions
- dynamic level scaling
- extensive quality-of-life improvements, including all pokemon available, stats editor, and special NPCs across the region

Talk to Mom in Littleroot Town. She explains the rules and activates/deactivates the mode.

![title screen](/images/blog/bp3/pokeemerald-7.png)
![title screen](/images/blog/bp3/pokeemerald-8.png)
![title screen](/images/blog/bp3/pokeemerald-9.png)


## Colosseum

Every battle is a double battle. You start with Espeon and Umbreon or with two Eevees.

![title screen](/images/blog/bp3/pokeemerald-10.png)
![title screen](/images/blog/bp3/pokeemerald-1.png)
![title screen](/images/blog/bp3/pokeemerald-2.png)

## Pokémon Emerald Legacy

This is one of the best romhacks out there, with a huge amount of content and quality-of-life improvements. I used it as the base. A big thank you to The SmithPlays Team. You guys rock!

![title screen](/images/blog/bp3/pokeemerald-5.png)
![title screen](/images/blog/bp3/pokeemerald-4.png)
![title screen](/images/blog/bp3/pokeemerald-3.png)


## Claude

The romhack itself is built with Claude Code. The pokeemerald decompilation is ~1M lines of C, navigating it, understanding the data structures (trainer parties, scripts, map events, battle engine), and cross-referencing the two upstream forks would have taken months solo. Claude Code did the heavy lifting.

What it actually did on this repo:
- **Solo Leveling mode**: wired the toggle into the Mom NPC script, patched the trainer encounter flow to respawn the player in Littleroot on loss while preserving team and bag, and hooked into the level-scaling logic so only the player gains XP.
- **Colosseum mode**: converted single encounters to double battles, added the Espeon/Umbreon and dual-Eevee starter branch, adjusted catch logic for double battles, and extended Eevee evolution learnsets.
- **Following Pokémon**: ported the overworld follower sprite system, the diff touches `overworld.c`, `field_player_avatar.c`, and `bike.c` to keep the follower sprite coherent through biking, surfing, and map transitions.
- **QoL**: complete move relearner, stat editor with shiny toggle and Poké Ball edit, stat editor for contest stats, and a bunch of battle-engine bug fixes (BR HUD memory corruption, corrupted vars, acro bike ledge jump, pomeg-berry Shedinja).
- **Web**: the landing page, embedded Pokédex, and online play wrapper around the `.gba` build, all generated and iterated on with Claude.

Workflow: describe the feature, point Claude at the relevant subsystem (`data/trainers.party`, `src/battle_*.c`, `src/overworld.c`), let it propose a patch, compile, test in mGBA, iterate. Commit history on [the repo](https://github.com/diogodebastos/Pokemon_Emerald_Legacy) shows the progression.

![title screen](/images/blog/bp3/pokeemerald-6.png)
![title screen](/images/blog/bp3/pokeemerald-11.png)
![title screen](/images/blog/bp3/pokeemerald-13.png)

## Cloudflare

Cloudflare is what makes a project like this viable for a solo hobbyist. A ROM hack is a weird thing to ship: a `.gba` blob, a JS emulator, a Pokédex, a landing page, and the occasional experimental feature. No revenue, no enterprise budget, just me on a laptop wanting strangers to be able to click a link and play. Cloudflare Pages hosts it all, free, globally distributed, zero config beyond pointing it at the git repo. Push to main, it deploys. That is the entire ops story.

What I really appreciate is that Cloudflare treats open source and hobbyist work as first-class. The free tier is not a crippled demo, it is the real product. That matters.

The workflow also maps cleanly onto agentic development. I iterate on the ROM and the site together, Claude Code edits C in the decomp, rebuilds the `.gba`, and simultaneously updates the Astro site and Pokédex data in the edge repo. Pages picks up the push and deploys. The agent never needs to think about infrastructure, which is exactly what you want when the human-in-the-loop is reviewing feature diffs and not YAML. Shorter feedback loop, more features shipped, fewer things to hold in my head.

If someone at Cloudflare is reading: thank you. And if you are building something agentic on top of Workers/Pages/Durable Objects and want to talk to a builder who has spent real time orchestrating Claude Code across a multi-repo, multi-language project (C decomp + TypeScript/Astro frontend + emulator glue), [get in touch](https://github.com/diogodebastos).

![title screen](/images/blog/bp3/pages01.jpg)
![title screen](/images/blog/bp3/pages02.jpg)

## Play it here!

[Pokemon Emerald Legacy Solo Leveling Colosseum](https://pokemon-emerald-legacy-solo-leveling-colosseum.pages.dev/) website with embedded pokédex.

[HackDex](https://www.hackdex.app/hack/pokemon-emerald-legacy-solo-leveling-colosseum)


Contribute [here](https://github.com/diogodebastos/Pokemon_Emerald_Legacy) on GitHub.

