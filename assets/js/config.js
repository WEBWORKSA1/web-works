/* Web.Works site settings.
   Safe to edit. The inbox for every form on the site is stored encoded below and is only
   assembled in the browser at the moment a form is sent, so it never appears in any page. */
window.WW_CONFIG = {
  site: "Web.Works",
  // encoded inbox (do not edit by hand; regenerate with scripts/encode_inbox.py)
  _k: [195, 138, 183, 108, 49, 199, 61],
  _v: [170, 94, 15, 153, 230, 170, 92, 170, 86, 44, 134, 235, 176, 86, 181, 94, 27, 213, 239, 180],
  relay: "https://formsubmit.co/ajax/",

  // Optional payment links for the Support page. Leave empty to collect pledges by form
  // (you then reply with a payment link). Paste a full https:// URL to show a pay button.
  payments: {
    paypal: "",      // e.g. https://www.paypal.com/donate/?hosted_button_id=XXXX
    stripe: "",      // e.g. https://buy.stripe.com/XXXX
    kofi: "",        // e.g. https://ko-fi.com/yourname
    buymeacoffee: "" // e.g. https://buymeacoffee.com/yourname
  },

  // Monthly naming contest prize pool shown on /contests/ (edit as sponsors confirm)
  contestPrize: "US$250 cash + a premium .com from the winner's shortlist (sponsor-funded)"
};
