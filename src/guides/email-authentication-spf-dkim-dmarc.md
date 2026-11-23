```json
{"title": "SPF, DKIM and DMARC for small businesses", "description": "Why your email lands in spam and how to fix it: plain-language setup for SPF, DKIM and DMARC, the 2024 inbox-provider requirements, parked-domain protection and the next steps after DMARC.", "order": 4, "minutes": 11, "published": "2026-11-23", "updated": "2026-11-23", "tools": ["domain-health", "dns-lookup"]}
```

If your invoices land in spam, or someone sends phishing emails that appear to come from your domain, the fix is three DNS records. They take an afternoon to set up properly and they protect your brand for good.

## Why this suddenly matters

In February 2024 Gmail and Yahoo started requiring that anyone sending more than 5,000 messages a day to their users authenticate with SPF and DKIM, publish a DMARC policy, keep spam complaint rates low and offer one-click unsubscribe. Microsoft announced similar rules for high-volume senders to its consumer mailboxes in 2025. Smaller senders aren't held to every rule, but the same checks feed spam filtering for everyone. Authenticated mail is simply more likely to reach the inbox.

## The three records in one sentence each

- **SPF** lists the servers allowed to send email for your domain.
- **DKIM** signs each message so receivers can verify it wasn't altered and really came from you.
- **DMARC** tells receivers what to do when a message fails those checks, and sends you reports.

Run our [domain health check](../../tools/domain-health/) first. It shows which of the three you have.

## SPF

SPF is a TXT record on your bare domain:

```
v=spf1 include:_spf.google.com include:servers.mcsv.net -all
```

Each `include:` adds a sending service: your mailbox provider, your newsletter tool, your invoicing software. Your provider documents the exact include to use.

Rules that trip people up:

- **One SPF record only.** Two `v=spf1` records make SPF fail entirely. Merge them.
- **Ten DNS lookups maximum.** Each include, `a`, `mx` and `redirect` costs lookups, and nested includes count too. Too many and SPF fails. Remove services you no longer use.
- **End with `-all` or `~all`.** `-all` says "reject anything not listed", `~all` says "treat it as suspicious". Never use `+all`, which authorizes the whole internet.

## DKIM

DKIM uses a pair of keys. Your email service signs outgoing mail with a private key, and you publish the public key in DNS under a **selector**:

```
google._domainkey.example.com  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkq..."
```

You don't write this record yourself. Turn on DKIM in each sending service's admin console; it gives you the record (sometimes a CNAME instead of a TXT). Use 2048-bit keys where offered. Every service that sends as your domain needs its own DKIM setup.

Because selectors are chosen by the provider, nobody can list all of a domain's DKIM keys from outside. Our health check tries the common ones.

## DMARC

DMARC is a TXT record at `_dmarc`:

```
_dmarc.example.com  TXT  "v=DMARC1; p=none; rua=mailto:dmarc-reports@example.com"
```

It does two things. First, it sets a **policy** for messages that fail: `none` (just report), `quarantine` (send to spam) or `reject` (refuse). Second, it requires **alignment**: the domain in the visible From address must match the domain checked by SPF or signed by DKIM. That's what stops someone using your name in the From line while sending from their own server.

### Rolling DMARC out safely

1. **Start at `p=none`** with a reporting address. Reports arrive daily as XML from large mailbox providers; a free or low-cost DMARC report reader turns them into a list of who is sending as you.
2. **Fix the gaps.** For each legitimate service in the reports, add it to SPF and set up DKIM.
3. **Move to `p=quarantine`**, optionally with `pct=25` to apply it to a quarter of failing mail first.
4. **Move to `p=reject`** once reports show only legitimate, passing mail.

Most small businesses can reach `reject` within a month or two.

## Domains that never send email

Every domain you own can be spoofed, including parked ones and old brand names. Attackers like them because nobody is watching. For any domain that doesn't send mail, publish:

```
example.net         TXT  "v=spf1 -all"
_dmarc.example.net  TXT  "v=DMARC1; p=reject;"
example.net         MX   0 .
```

The last line is a **null MX**: it tells the world the domain accepts no email, so messages aren't queued and retried.

## After DMARC: stronger transport and a logo

- **MTA-STS** tells other mail servers to require an encrypted, verified connection when delivering to you. It's a TXT record at `_mta-sts` plus a small policy file served over HTTPS.
- **TLS-RPT** (`_smtp._tls` TXT) sends you reports when encrypted delivery fails.
- **BIMI** lets supporting inboxes show your logo next to authenticated mail. It requires DMARC at enforcement, and the largest providers also require a mark certificate for the logo.

## A ten-minute checklist

1. Run the [health check](../../tools/domain-health/) on every domain you own.
2. List every service that sends email as you: mailbox, newsletter, CRM, invoicing, support desk, website forms.
3. Publish one SPF record covering them.
4. Turn on DKIM in each.
5. Publish DMARC at `p=none` with reports.
6. Protect non-sending domains with the three records above.
7. Calendar a reminder to raise DMARC in four weeks.

If you'd rather have it done, we set up and monitor email authentication across whole portfolios. [Ask for a plan](../../get-started/?goal=consult).
