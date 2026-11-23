```json
{"title": "Protecting your brand from lookalike domains", "description": "How typosquatting and lookalike domains are used for phishing and fraud, how to find them, which names to register defensively, and how to take down or recover abusive domains.", "order": 8, "minutes": 9, "published": "2026-11-23", "updated": "2026-11-23", "tools": ["lookalike-finder", "domain-health", "domain-lookup"]}
```

A lookalike domain is cheap to register and can cost a business dearly. One letter changed in an invoice email can redirect a payment; a convincing login page on a near-identical domain can harvest passwords. You can't register every variation of your name, but you can find the dangerous ones and make your real domain hard to impersonate.

## How lookalikes are built

- **Typos:** a missing, doubled or swapped letter, or a neighbouring key (exampel.com, exampe.com).
- **Look-alike characters:** `rn` for `m`, `vv` for `w`, `0` for `o`, `1` for `l`. On a phone screen these are hard to spot.
- **Internationalized lookalikes:** letters from other scripts that look identical, such as Cyrillic `а` in place of Latin `a`. Modern browsers show many of these as `xn--` codes, but not always.
- **Added words:** your name plus *login*, *secure*, *support*, *pay* or *invoice*.
- **Other extensions:** your exact name on .co, .net or a new extension.
- **Subdomain tricks:** `example.com.account-check.net`, where the real domain is the part at the end.

Our [lookalike finder](../../tools/lookalike-finder/) builds these variations for your domain and checks which are registered.

## What attackers do with them

- **Business email compromise:** a fake supplier or executive address asks for a payment to a new bank account.
- **Credential phishing:** a copied login page collects passwords.
- **Ad and affiliate fraud:** mistyped traffic is sent to ads or competitors.
- **Brand damage:** counterfeit shops and fake support lines.

The most dangerous lookalikes are those that can send and receive email. The lookalike finder flags any registered variant with mail (MX) records.

## Make your real domain hard to spoof

Before chasing lookalikes, close the easiest door: someone sending email as your exact domain. Publish SPF, DKIM and a DMARC policy at enforcement, and protect every domain you own, including parked ones. Our [guide to SPF, DKIM and DMARC](../email-authentication-spf-dkim-dmarc/) shows how, and the [health check](../../tools/domain-health/) confirms it.

## Find lookalikes early

- **Scan regularly.** Run the lookalike finder on each brand name every month, or have it monitored.
- **Watch certificate transparency logs.** Every public TLS certificate is logged. A new certificate for a name containing your brand is often the first sign a phishing site is going live.
- **Listen to your customers and staff.** Make it easy to forward suspicious emails to one address.

## Decide what to register defensively

You can't buy every variation, and you shouldn't try. Prioritize:

1. Your exact name on your main country code and the extensions your customers would guess.
2. The one or two most likely typos of your main domain.
3. Names combining your brand with *login*, *pay* or *support* if you run accounts or payments online.

Point them all at your main site and give them the non-sending email records, so they can't be used for mail either.

## When you find a malicious one

1. **Collect evidence.** Screenshots, the full web address, email headers and dates.
2. **Report to the registrar.** Our [domain lookup](../../tools/domain-lookup/) shows the registrar and its abuse contact. Registrars act on phishing and malware quickly.
3. **Report to the host.** The site's hosting provider can take the content down even if the domain stays registered.
4. **Report to browser blocklists.** Google Safe Browsing and Microsoft's reporting tools put warnings in front of visitors within hours.
5. **Warn your customers** if the domain is being used against them.

## Recovering the domain

Takedowns remove content; to get the domain itself, use a dispute process:

- **UDRP**, the Uniform Domain-Name Dispute-Resolution Policy, applies to generic extensions and many country codes. You must show that the domain is identical or confusingly similar to your trademark, that the holder has no rights or legitimate interests in it, and that it was registered and is being used in bad faith. Cases are decided by providers such as WIPO, usually within about two months; WIPO's fee for one to five domains before a single panelist is USD 1,500. A successful complaint transfers or cancels the domain.
- **URS**, the Uniform Rapid Suspension System, is a faster, cheaper process for clear-cut cases on newer generic extensions. It suspends the domain rather than transferring it.
- **Country-code policies** vary; many follow UDRP-like rules.

Disputes require a trademark. Registering your brand as a trademark in your main markets is one of the best protections you can buy.

## A monthly routine

1. Run the lookalike finder on each brand.
2. Review new registrations that accept email.
3. Check DMARC reports for unknown senders.
4. Renew and lock your own domains.

If you'd rather not do this yourself, our [monitoring service](../../services/#monitoring) watches your brands and alerts a person when something changes.
