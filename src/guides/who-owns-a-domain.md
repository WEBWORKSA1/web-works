```json
{"title": "How to find out who owns a domain (and how to reach them)", "description": "RDAP replaced WHOIS, and privacy rules hide most owners. Here is what you can still see, and six practical ways to reach the person behind a domain.", "order": 1, "minutes": 8, "published": "2026-11-23", "updated": "2026-11-23", "tools": ["domain-lookup", "dns-lookup", "bulk-checker"]}
```

You found the perfect name, or a site that copies your brand, and you want to know who is behind it. A decade ago you would have run a WHOIS search and seen a name, a postal address and a phone number. Today you will usually see a registrar and a wall of "REDACTED FOR PRIVACY". The owner is still reachable, but you need a different route.

## What changed: from WHOIS to RDAP

WHOIS was a plain-text protocol from the early internet. Each registry and registrar formatted its answers differently, there was no standard way to find the right server, and the data was not structured for software.

**RDAP**, the Registration Data Access Protocol, fixes those problems. It returns structured JSON, works over HTTPS, and uses a bootstrap file published by IANA so any tool can find the right registry server for any extension. On 28 January 2025 RDAP became the definitive source of registration data for generic top-level domains such as .com, .net and .org, and registries and registrars were no longer required to run WHOIS services. Many country-code registries have also added RDAP.

Our [domain lookup](../../tools/domain-lookup/) reads RDAP directly from your browser.

## What you can still see

For almost every registered domain, the public record shows:

| Field | Why it helps |
|---|---|
| Registrar | The company you contact for abuse reports, and often for reaching the owner |
| Creation date | How long the current registration has existed |
| Expiry date | Whether the name may be close to lapsing |
| Status codes | Locks, holds, and whether the name is in redemption or pending delete |
| Nameservers | Who hosts the DNS, which often hints at how the name is used |
| DNSSEC | Whether the zone is signed |

What you usually **cannot** see is the registrant's name, email or address. Since 2018, data-protection rules such as the EU's GDPR led ICANN and registrars to redact personal data by default. Organizations sometimes still appear by name, especially for country-code domains or where the owner opted to publish.

## Six ways to reach an owner

### 1. Look at the domain itself

Type the domain into a browser. Many unused names show a "for sale" page with a price or an offer form. Parking-company nameservers (visible in the lookup) are a strong hint the name is monetized or listed.

### 2. Use the registrar's contact form

Most registrars offer a web form that relays messages to the registrant without revealing their email. The RDAP record often includes a link or note pointing to it. Response rates vary, so keep the message short and specific.

### 3. Check the marketplaces

Search the name on large aftermarket platforms. Listings there come with a buy-now price or an offer button, and the marketplace handles payment and transfer.

### 4. Follow the website

If the domain hosts an active site, its contact page, imprint (common in Europe), social profiles or privacy policy usually name the operator. A company name lets you approach the right person.

### 5. Request non-public data for a legitimate reason

If you have a legal reason, such as a trademark infringement, you can ask the registrar for the redacted data. ICANN's Registration Data Request Service (RDRS), launched in 2023, routes such requests to participating registrars for generic domains. Expect to explain your reason and to wait. Law enforcement and IP counsel use the same route.

### 6. Use a broker

A buy-side broker researches ownership history, contacts the owner through every channel above and negotiates without revealing who you are. This matters when your company's name would push the price up. Our [acquisition service](../../services/#acquisition) works this way.

## Reading the history

Ownership history is not in RDAP, but you can piece it together:

- **The Wayback Machine** shows what the site looked like over the years, which tells you who used it and whether it ever hosted spam.
- **Creation date vs. age of content:** a recent creation date on a name with years of archived content usually means it expired and was re-registered.
- **Commercial historical WHOIS services** keep snapshots of records from before redaction. They are paid, but useful for serious acquisitions.

## A message that gets answers

When you write to an unknown owner, you are competing with spam. A message that gets replies:

1. Uses a real name and a professional email address.
2. Names the domain in the subject line.
3. Asks one question: "Would you consider selling example.com?"
4. Does not name a price or reveal how important the name is to you.

If you hear nothing after two weeks, try a second channel rather than a second message on the same one.

## When the domain is misusing your brand

If the site impersonates you, you don't need the owner's identity to act. Report it to the registrar's abuse contact (shown in our lookup result), to the hosting provider, and to Google Safe Browsing. For trademark abuse, the UDRP process can transfer the domain to you. Our guide to [protecting your brand from lookalike domains](../typosquatting-protection/) walks through the options.

## Quick answers

**Is it legal to look up who owns a domain?** Yes. Registration data is published so that people can contact domain holders and report problems.

**Why does the lookup say "not found" for a domain that loads in my browser?** You may be looking at a subdomain, or at a country-code domain whose registry doesn't publish RDAP. The DNS fallback in our tool still confirms registration.

**Can I see every domain a person owns?** Reverse WHOIS services search historical records by name or email. With today's redaction, results are partial.
