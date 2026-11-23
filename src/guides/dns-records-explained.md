```json
{"title": "DNS records explained", "description": "A plain-language guide to DNS: what A, AAAA, CNAME, MX, TXT, NS, SOA, CAA and DS records do, how TTL and propagation work, and a checklist for moving DNS without downtime.", "order": 5, "minutes": 9, "published": "2026-11-23", "updated": "2026-11-23", "tools": ["dns-lookup", "domain-health"]}
```

DNS is the internet's directory. When someone types your domain, their device asks DNS where to go, and DNS answers from the records you publish. Most website and email problems come down to a missing or wrong record, so a little DNS knowledge saves a lot of support tickets.

## How a lookup works

1. Your device asks a **resolver**, usually run by your internet provider or a public service like 1.1.1.1 or 8.8.8.8.
2. If the resolver doesn't have the answer cached, it asks the **root servers**, which point it to the servers for the extension (.com, .ca, .works).
3. Those servers point it to your domain's **authoritative nameservers**, set at your registrar.
4. Your nameservers return the record, and the resolver caches it for the record's **TTL**.

That's why the nameservers in your registry record matter: they decide who holds the truth about your domain.

## The records you'll use

| Record | Example | Use |
|---|---|---|
| A | `@ A 192.0.2.10` | Points a name to an IPv4 address |
| AAAA | `@ AAAA 2001:db8::10` | Points a name to an IPv6 address |
| CNAME | `www CNAME example.com.` | Makes one name an alias of another |
| MX | `@ MX 10 mail.example.com.` | Says which servers receive your email |
| TXT | `@ TXT "v=spf1 -all"` | Text policies and verification codes |
| NS | `@ NS ns1.dnshost.net.` | Names the authoritative nameservers |
| SOA | (one per zone) | Primary server, contact and timers |
| CAA | `@ CAA 0 issue "letsencrypt.org"` | Which authorities may issue certificates |
| SRV | `_sip._tcp SRV 10 5 5060 sip.example.com.` | Locates services like voice or chat |
| DS | (at the registry) | Links your DNSSEC keys to the parent zone |
| HTTPS | `@ HTTPS 1 . alpn="h3,h2"` | Connection hints for faster HTTPS |

`@` means the bare domain itself (example.com).

### A and AAAA

The basic records for a website. Most sites need an A record; an AAAA record adds IPv6 support. Hosting providers give you the values.

### CNAME and the apex problem

A CNAME says "this name is the same as that name". It's perfect for `www` or for pointing `shop.example.com` at a hosted store. But the DNS standard doesn't allow a CNAME on the bare domain, because the bare domain must also hold NS, SOA and usually MX records. Many DNS hosts solve this with an **ALIAS**, **ANAME** or "CNAME flattening" feature that behaves like a CNAME but returns A records.

### MX

MX records list mail servers with a priority number: lower numbers are tried first. A domain that receives no email can publish a single null MX (`MX 0 .`).

### TXT

TXT records hold free text, which is why they carry so many policies: SPF, DMARC (at `_dmarc`), DKIM keys, and verification codes for search consoles and SaaS tools. You can have many TXT records, except that SPF must be a single record. See [SPF, DKIM and DMARC](../email-authentication-spf-dkim-dmarc/).

### NS and SOA

NS records name your authoritative nameservers. The set at the registry is what really counts; the NS records inside your zone should match it. The SOA record holds administrative timers you rarely need to touch.

### CAA

CAA lists which certificate authorities may issue TLS certificates for your domain. Without it, any public authority may. Add one `issue` line per authority you use, and an `iodef` line for reports.

### DS and DNSSEC

DNSSEC signs your records so resolvers can detect forgeries. Your DNS host signs the zone; you publish a **DS** record at your registrar to connect it to the chain of trust from the root. If you move DNS hosts, update or remove the DS record first, or your domain will stop resolving for validating resolvers.

## TTL and "propagation"

Every record has a TTL in seconds. Resolvers cache the answer for that long. "Propagation" is really just caches expiring. To make a change go live fast:

1. A day before, lower the TTL on the records you'll change to 300 seconds.
2. Make the change.
3. Check it with our [DNS lookup](../../tools/dns-lookup/), using **Compare** to see two large resolvers side by side.
4. Raise the TTL back to an hour or more.

Nameserver changes at the registry take longer, because the extension's servers cache NS records too, often for up to two days.

## Moving DNS without downtime

1. **Export the old zone.** Every record, including obscure TXT verification records.
2. **Recreate it at the new host** before you switch anything. Compare record by record.
3. **Lower TTLs** at the old host a day ahead.
4. **Handle DNSSEC:** remove the DS record at the registrar, wait for the old TTL, then switch.
5. **Change nameservers** at the registrar.
6. **Keep the old host running** for at least 48 hours.
7. **Re-enable DNSSEC** at the new host and publish the new DS record.
8. **Run a [health check](../../tools/domain-health/)** to confirm web and email.

Most migration outages are a forgotten record. The export step is the one not to skip.
