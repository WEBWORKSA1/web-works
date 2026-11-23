```json
{"title": "From domain to an ad-ready website", "description": "How to turn a domain into a website that can earn from ads and leads: setup, the pages reviewers look for, original content, speed, ads.txt, the AdSense application and how to read RPM.", "order": 9, "minutes": 11, "published": "2026-11-23", "updated": "2026-11-23", "tools": ["launch-checklist", "domain-health", "dns-lookup"]}
```

A domain earns nothing parked. Built into a useful website, it can earn from display ads, from leads you pass to service providers, and from sponsors. This guide covers the path from an empty domain to a site that an ad network will approve and that visitors will come back to.

## 1. Secure the foundation

Start with the domain itself:

- Register it in your own account, turn on auto-renew and two-factor authentication, and lock it.
- Point DNS at your host and make sure both the bare domain and `www` work over HTTPS.
- Set up email authentication even if the site only sends contact-form mail.

Our [website launch checklist](../../tools/launch-checklist/) lists every item; the [health check](../../tools/domain-health/) verifies the DNS ones.

## 2. Pick a purpose a visitor can name

Ad networks approve sites that serve people, and people return to sites that do one thing well. Before writing anything, finish this sentence: "This site helps [who] to [do what]." A domain's name often suggests the answer: a city name suits a local guide, a trade term suits a tool or a reference.

The best-earning small sites combine three kinds of pages:

- **Tools** people use repeatedly: calculators, checkers, generators.
- **Reference content** that answers specific questions in depth.
- **Fresh content** that gives a reason to come back: updates, data, news summaries.

## 3. Publish the pages reviewers look for

Every site applying for ads should have:

- **Home page** that says what the site is for.
- **About page** that says who runs it.
- **Contact page** with a working form.
- **Privacy policy** that explains cookies, analytics and third-party advertising, including how visitors can opt out of personalized ads.
- **Terms of use.**
- **Clear navigation** to every section from every page.

## 4. Write content that is genuinely yours

Google's publisher policies reject sites with copied, scraped or auto-generated content that adds no value, and sites with too little content to judge. There is no published minimum, but many successful applications come from sites with 20 to 30 substantial, original pages.

What works:

- Answer the question in the first paragraph, then go deeper than the top results.
- Use your own examples, data and screenshots.
- Update pages when facts change, and show the date.
- Link related pages to each other.

If you aggregate content from elsewhere, such as headlines, add something of your own around it: a summary, a selection, a tool, context. Link to the source and never republish full articles.

## 5. Make it fast and mobile-friendly

Most visitors arrive on phones. Check Core Web Vitals in Search Console or PageSpeed Insights:

- **Largest Contentful Paint** under 2.5 seconds.
- **Cumulative Layout Shift** under 0.1. Reserve space for images and ads.
- **Interaction to Next Paint** under 200 milliseconds.

Static sites hosted on a CDN usually pass easily. Compress images, set their width and height, and load third-party scripts asynchronously.

## 6. Prepare for ads

- **Eligibility.** You must be at least 18, own the site or be able to edit its HTML, and comply with the program policies.
- **ads.txt.** Publish a file at `yourdomain.com/ads.txt` that lists your ad systems. For AdSense, it's one line with your publisher ID.
- **The ad code.** AdSense gives you one script for the `<head>` of every page. With Auto ads, Google places ads for you.
- **Consent.** If you have visitors in the European Economic Area, the UK or Switzerland, Google requires a certified consent management platform for personalized ads. AdSense offers its own consent message that you can turn on in the Privacy & messaging section.

## 7. Apply, then wait

Add your site in AdSense and leave the code in place. Reviews can take from a few days to several weeks. Keep publishing while you wait. If you're turned down, the email names the reason; the usual ones are low-value content, navigation problems and policy issues such as copyrighted material. Fix it and reapply.

## 8. Don't break the rules after approval

- Never click your own ads or ask anyone to.
- Don't use wording like "click the ads below" or place ads where they could be mistaken for navigation.
- Don't place ads on pages with no content, such as thank-you or error pages, if you use manual placements.
- Keep ads from covering content on mobile.

Invalid activity can close an account permanently.

## 9. Understand the numbers

**Page RPM** is earnings per thousand page views. If a site earns $30 from 10,000 page views, page RPM is $3. RPM depends heavily on topic and audience: pages about finance, insurance or software in wealthy markets earn far more than general entertainment.

That's why many small sites add a second income stream. A **lead form** that connects visitors with a service provider can earn more from one visitor than ads earn from a thousand. Combine both: ads for every visitor, a lead offer for the visitor with a real need.

## 10. Keep it growing

- Submit your sitemap in Google Search Console and watch which pages earn impressions.
- Expand the pages that rank on page two.
- Refresh dated pages.
- Add one new useful page a week.

Want it built for you? We build fast, ad-ready sites on domains you own, with every item on the checklist done. [Start a build](../../get-started/?goal=build).
