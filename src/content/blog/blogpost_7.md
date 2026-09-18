# Edge Guard: learning Terraform on a zone I could break

*My domain's security, in code, and the four things that didn't behave the way I expected.*

---

I build a lot on Cloudflare, but almost all of it has been the developer platform: Workers, D1, Durable Objects, Workers AI. The other half of Cloudflare is the part that sits in front of a website: WAF rules, rate limiting, bots, caching. I had only ever read about it. And I had never used Terraform.

So I bought [diogodebastos.com](https://diogodebastos.com), moved this site onto it, and gave myself one constraint: learn both against something real. A zone I own, already serving a live site I could break.

The result is **Edge Guard**: [edge-guard.diogodebastos.com](https://edge-guard.diogodebastos.com/). Every rule on that page is declared in HCL and applied with `terraform apply`, on the Free plan.

![Edge Guard: the posture table](/images/blog/bp7/posture.jpg)

## One zone, two owners

The first design problem wasn't a rule. It was ownership. One zone now serves two apps, deployed by two different tools:

```
                diogodebastos.com  (one zone, Free plan)
                              │
      ┌───────────────────────┴───────────────────────┐
  apex + www                              edge-guard.diogodebastos.com
  this site (Worker: edge-cavai)          the demo (Worker: edge-guard)
  owned by wrangler                       owned by Terraform
      └───────────────────────┬───────────────────────┘
                  zone-level config, owned by Terraform:
          WAF · rate limiting · cache rules · TLS · Bot Fight Mode
```

The rule I held myself to was simple: Terraform never touches the apex or `www`. Before the first apply I grepped the plan JSON for anything that did, and got nothing back. That's when Terraform clicked for me. The value isn't `apply`, it's the plan. Against a zone that already serves a live site, the plan is the review.

The second lesson came from the same place. `cloudflare_ruleset` doesn't manage a rule; it manages a whole *phase*. Once Terraform owns `http_request_firewall_custom` for the zone, any rule someone adds by hand in the dashboard disappears on the next apply. That's an operational commitment, not a detail, and it's the first thing I'd tell anyone taking over a zone like this.

## What's in the zone

- **Four WAF custom rules.** One is deliberately zone-wide: it blocks `/wp-admin`, `/wp-login.php` and `/.env` probes on every hostname, so this site gets it too. The other three only match Edge Guard's hostname.
- **One rate limiting rule** on `/api/ping`: 5 requests per 10 seconds per IP.
- **One cache rule** for `/static/*`.
- **Zone settings:** always HTTPS, TLS 1.2 minimum, HSTS. I left the SSL mode alone, because it was the one setting that could take the live site down.
- **Bot Fight Mode**, applied as a separate second step, because on the Free plan it can't be scoped to one hostname.
- **Turnstile**, in front of a Workers AI assistant. It explains each rule, or drafts a new one from plain English as a Rules expression plus the Terraform block for it.

WAF rules, rate limiting and cache rules turned out to be the same `cloudflare_ruleset` resource with a different phase. Once that clicked, three products became one mental model.

My favourite trick is a small one. The posture table on the page isn't hand-written. Terraform hands the Worker a binding with `jsonencode()` of the same `locals` the rulesets are built from, so the page can't drift from what was actually applied.

## Try to get blocked

The page has buttons that hit the zone from your browser. The status codes come back from Cloudflare's edge, not from the Worker:

![Try to get blocked](/images/blog/bp7/try-to-get-blocked.jpg)

`/wp-admin` gets a 403 from the WAF. The test header gets a 403. Thirty requests to `/api/ping` come back as five 200s, then twenty-five 429s. The logo is a MISS, then a HIT.

## What didn't behave the way I expected

This is the part I learned the most from, because none of it came from reading. It came from running the thing.

**A cache rule doesn't cache a Worker's own response.** The `/static/*` rule applied cleanly, and the first test returned no `cf-cache-status` at all. The docs are explicit: zone cache configuration doesn't apply to Workers. A Worker on a custom domain *is* the origin, so its bytes never pass through the cache the rule governs. The fix was Workers Cache, enabled from the same Terraform resource. Both are in the repo, and the page says which one produced the HIT. Correct config, wrong layer.

**Parallel bursts don't trip the rate limit.** My first in-browser burst fired all thirty requests at once and got thirty 200s. Sent one after another, they gave the expected five and twenty-five. Rate-limit counters are eventually consistent, which is worth knowing before promising anyone an exact threshold.

**Bot Fight Mode needs JavaScript detections, and then it still surprised me.** Turning it on first failed with `cannot enable Fight_Mode while EnableJS is disabled`. Once it was on, real browsers were unaffected, as intended. But `curl`, python-requests, Scrapy and Wget weren't challenged either, even though the JS detections were visibly live on the pages. I couldn't work out why, so I won't pretend I did.

**Terraform shows a diff that isn't there.** `terraform plan` always wants to update the Worker script, even straight after an apply, because the provider marks some computed attributes as unknown. It's noise, not drift, but it means "the plan is clean" isn't a safe CI gate here.

The Free plan shaped the rules themselves, too:
- There's no `log` action, so my "observe only" rule for Tor exits had to be a managed challenge.
- There's no regex, so every expression is built from `starts_with`, `ends_with`, `contains` and `eq`.
- DDoS overrides need Enterprise, so I didn't declare one. The DDoS protection is always on; I just can't configure it.

## How it was built

AI-native, like everything else on this site. The spec was one long prompt with the constraints spelled out: which hostnames Terraform may touch, which rules must be host-scoped, Bot Fight Mode as its own step, and nothing marked done without a live check. Claude Code wrote the HCL and the Worker, then ran the plan, the applies and the checks. My job was deciding what it was allowed to touch, and reading what came back.

One bug is worth telling, because it only shows up live. A stray apostrophe in the page's inline script shipped as a syntax error that silently killed every button, while the HTML still rendered perfectly. CI now parses that script the way a browser would.

Along the way the zone got better for this site too. From its first day online it has had HTTPS everywhere, TLS 1.2 as the minimum, HSTS, and a WAF rule that turns away the bots probing every new domain for `/wp-admin`.

---

*Live: [edge-guard.diogodebastos.com](https://edge-guard.diogodebastos.com/). The repo, with the full README and every check: [github.com/diogodebastos/cf-edge-guard](https://github.com/diogodebastos/cf-edge-guard).*
