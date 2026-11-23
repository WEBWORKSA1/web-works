# Web.Works — benchmark research (November 2026)

## 1. What the current web.works is

The live site is a Hostinger Horizons single-page app. Its sitemap and llms.txt describe a domain-management service:

| Area | Pages |
|---|---|
| Public | Home, Services, Pricing, About, Contact, Login, Sign up, Password reset |
| Customer | Dashboard, Domain Monitoring, Domain Acquisitions, Consulting Projects, Branding Projects, Notifications |
| Admin | Admin dashboard, Client / Domain / Inquiry / Service management, Reports, Send notifications |

Positioning: enterprise domain monitoring, consulting, branding and acquisition. The page body is rendered by JavaScript only (no indexable text in the HTML), there is no content library, no free tools, no ads, no lead funnel beyond a contact page, and the account area depends on a hosted backend.

**Rebuild decision:** keep the four service lines (monitoring, consulting, branding, acquisition), replace the login-gated dashboard with a no-account "Desk" that runs in the browser, and add the free tools, daily content and monetization the old site lacked. Old URLs (/login, /signup, /dashboard, /domainmonitoring, /domainacquisition, …) redirect to their new equivalents.

## 2. The 41 sites opened (38 read in full)

Each site was fetched directly on 23 Nov 2026. "Thin" = the page rendered too little text to read features. "Blocked" = the site refused the fetch.

| # | Site | What it actually does | Worth borrowing |
|---|---|---|---|
| 1 | markmonitor.com | Corporate domain portfolio management for large brands: DomainWatch threat monitoring, recovery, dotBrand, DNS, forwarding. "Connect with an expert" + "Request demo"; no pricing. | Advisor-led framing, threat monitoring as a service line |
| 2 | cscdbs.com | DomainSec SaaS: domain management, fraud and subdomain monitoring, DNS/DDoS, certificates, takedowns. Demo form asks name, title, company, country, phone, email, 250-char need. | Short "describe your need" field in the lead form |
| 3 | comlaude.com | Domain + brand protection firm; portfolio management, watch and enforcement, consultancy; newsletter capture, free "Gazetteer" download, price-transparency promise. | Lead magnet download, transparency pledge |
| 4 | sedo.com | Marketplace with 18M+ listings, fixed price, auctions, anonymous negotiation, broker service, parking; trust badges and case-study carousel. | Buyer vs seller split CTAs |
| 5 | afternic.com | GoDaddy-owned marketplace: free listing, brokerage, parking, landers, fast transfer, lease-to-own; registrar logo strip. | Lease-to-own maths in the deal calculator |
| 6 | atom.com | Marketplace + registrar + naming contests + free AI name tools, trademark screening, API/MCP; FAQ accordions, price-tagged cards. | Naming contest model, trademark-screen reminder |
| 7 | brandbucket.com | Hand-picked brandable domains with sample logos; simple grid, Buy Now, price scale. | Name "chips" with clear status |
| 8 | dnjournal.com | Industry magazine: weekly sales report, Lowdown briefings, YTD charts; banner ads + advertiser rate card; email alerts. | Daily brief format, rate-card style Advertise page |
| 9 | domainnamewire.com | Near-daily industry news, podcast, weekly end-user sales; newsletter; ads between articles; RSS. | News feed source; ad placement between sections |
| 10 | domaininvesting.com | Investor news/commentary blog with sponsor banners and an Advertise waitlist; RSS. | News feed source; sponsor slots |
| 11 | namepros.com | ~1M-member forum: marketplace threads, appraisals, design contests, beginner section. | Community contests, beginner learning path |
| 12 | expireddomains.net | Expired/deleted lists across 669 TLDs with SEO filters, bulk check, watchlist; updates daily. | Watchlist + bulk checker |
| 13 | dropcatch.com | Expiring-domain backorders (thin: JS-rendered). | Expiry lifecycle education |
| 14 | domaintools.com | DNS threat intelligence: passive DNS, risk score, WHOIS history, lookalike monitoring; demos only. | Lookalike/typosquat finder |
| 15 | lookup.icann.org | Official RDAP registration lookup (thin). | Use RDAP, not port-43 WHOIS |
| 16 | whoxy.com | WHOIS, reverse WHOIS, history API; pay-as-you-go credits, sample JSON. | Show raw record for power users |
| 17 | instantdomainsearch.com | As-you-type availability across 800+ TLDs, generator, bulk/CSV, appraisal; referral revenue. | Instant lookup in the hero, CSV export |
| 18 | leandomainsearch.com | Keyword-based domain search by Automattic (thin). | Keyword + affix generator |
| 19 | namelix.com | AI business-name generator with length/keyword/TLD filters; AdSense + logo upsell. | Style filters in the name generator |
| 20 | dynadot.com | Registrar + aftermarket + expired auctions + builder; TLD price carousels. | TLD explorer |
| 21 | porkbun.com | Registrar with free extras and a searchable TLD price table; playful tone. | Plain, human tone |
| 22 | spaceship.com | Domains + hosting + email with "Launchpad" dashboard. | Single dashboard ("Desk") idea |
| 23 | hover.com | Registrar with privacy, 2FA, Hover Connect, testimonial slider. | Search-first hero |
| 24 | namecheap.com | Registrar + hosting + free logo/card makers + AI name generator; deal timers. | Free-tools hub |
| 25 | godaddy.com/domains/domain-broker | Anonymous broker: $99.99 fee + 20% commission, 30-day effort, 3-step flow. | Broker fee defaults in the calculator, 3-step explainer |
| 26 | estibot.com | Appraisals (blocked by a human-verification wall). | — |
| 27 | humbleworth.com | Free valuation by sales channel, bulk 2,000 names, CSV; strong "not an appraisal" disclaimers. | Score with channel bands + disclaimers |
| 28 | efty.com | Premium marketplace: buy now, pay over time, make offer; funds held until delivery. | Make-an-offer CTA on taken domains |
| 29 | namesilo.com | Registrar (fetch failed). | — |
| 30 | tld-list.com | Registrar price comparison per TLD, daily data. | Data freshness stamp on every data page |
| 31 | escrow.com/domains | Domain escrow; tiered fees from 2.6% (min $50); step list, pricing table. | Escrow fee estimate in the calculator |
| 32 | mediaoptions.com | Broker: stealth acquisitions, success-based fees, free valuation with service. | "Stealth acquisition" service copy, free consult CTA |
| 33 | hugedomains.com | Large premium inventory with monthly payment plans and guarantee. | Payment-plan option for sellers |
| 34 | saw.com | Brokerage: buyer rep, naming, brand protection, appraisals from $199. | Combined naming + acquisition offer |
| 35 | looka.com | AI logo maker + brand kit; 3-step flow. | Short stepped flows |
| 36 | 99designs.com | Design contests from $249 + direct hire; 4.8/5 ratings. | Contest packaging with prize tiers |
| 37 | cloudflare.com/products/registrar | At-cost registrar, DNSSEC, registry lock. | Health checks for DNSSEC / registry lock |
| 38 | dnpedia.com | TLD table, daily adds/deletes, new registrations, NS lookup, SSL search. | Daily TLD stats in the brief |
| 39 | uptimerobot.com | Uptime, SSL and domain-expiry monitoring; 50 free monitors. | Expiry alerts + calendar export |
| 40 | domcop.com | Expired domains with SEO metrics, saved searches, drop-alert emails. | Alerts tab in the Desk |
| 41 | brandpa.com | Aged brandable domains since 2007. | Brand naming guide |
| 42 | whois.whoisxmlapi.com | WHOIS/RDAP API, 500 free requests, "Talk to sales" form. | Sales-type dropdown in Advertise form |
| 43 | gandi.net | Registrar + hosting with "No Bullshit" values messaging. | Values statement on About |
| 44 | dofo.com → deepinfo.com | Now a threat-exposure platform: WHOIS/DNS/SSL index, scheduled alerts. | Alert cadence options |
| 45 | namebio.com | Historical domain sales database (blocked: robots.txt disallows fetching). | — |

Totals: 45 opened, 39 read in full, 3 thin (dropcatch, ICANN Lookup, Lean Domain Search), 3 blocked (EstiBot, NameSilo, NameBio).

## 3. Gaps the new site fills

1. **No one combines free registry-grade tools, a no-login portfolio desk and a human service desk** — enterprise players (MarkMonitor, CSC, Com Laude) hide everything behind demos; registrars bury tools under upsells.
2. **Freshness**: industry news sites update daily but offer no tools; tool sites have no daily content. Web.Works rebuilds a daily brief, news wire and video shelf automatically.
3. **Lookalike monitoring for small brands** is enterprise-only elsewhere; here it runs free in the browser via DNS-over-HTTPS.
4. **Transparent deal maths**: broker, escrow, marketplace and lease-to-own costs in one calculator.

## 4. Revenue model

| Stream | Mechanism |
|---|---|
| Google AdSense | Auto ads on all content pages (ca-pub-6620975821265271) + ads.txt |
| Lead generation | "Start a project" funnel + contextual CTAs inside tool results (taken domain → acquisition, lookalike found → monitoring) |
| Sponsorship / advertising | Tool sponsor, brief sponsor, contest prize sponsor, directory placement |
| Support / donations | Tiered pledges earmarked for operations, promotion, marketing, hiring, contest prizes |
| Domain sale / partnership | Site-wide top bar to web.works/contact |
