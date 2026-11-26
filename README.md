# QPH CRM - Demo for Quick Path Horizon

Static demo CRM for a UAE business-setup company. Open `index.html` or host with GitHub Pages. No server needed; all data stays in the browser (localStorage). **Settings → Data → Reset demo data** restores the sample data.

## Logins (demo: pick a user)
| User | Role | Sees |
|---|---|---|
| Faisal Rahman | Admin | Company dashboard, all leads, Campaigns & UTM, operations, settings |
| Aisha Khan, Rohan Verma | Sales | Sales dashboard (own leads), follow-ups, duplicates, WhatsApp, calculator |
| Sara Ali, Imran Sheikh | Operations | Ops dashboard, ops board, documents, licences, customers, renewals |

## Features
- **Separate dashboards** for Admin, Sales and Operations
- **Lead source tracking:** Meta / Google / Website / WhatsApp, with campaign name, ad set, ad name, form, `utm_source/medium/campaign/term/content`, gclid/fbclid and landing page on every lead
- **Duplicate check:** phone (last 9 digits, so +971 / 00971 / 05… all match) or email. Tags the lead *Duplicate*, links it to the original, assigns the same owner, and offers Merge or Not a duplicate
- **Stage rules (SOP):** New → Contacted → … → Payment Received → Closed Won → automatic Operations case
- **Cost calculator** for 12 free zones, mainland and offshore: visas, activities, add-ons, service fee, VAT, zone comparison, save to lead, print/PDF, WhatsApp quote
- **WhatsApp inbox (demo):** templates, 24-hour window, AI reply, Polish
- **AI Agent (demo):** Hinglish notes → English, AI next step, tags
- **Campaigns & UTM report:** leads, duplicates, qualified, won, revenue, spend, CPL, cost per client, ROAS by campaign / ad set / ad / source / keyword
- **Operations:** 9-stage board, documents checklist, licence & visas, customers, renewals with reminders
- CSV export with all UTM columns

Prices are indicative demo values and can be edited in **Settings → Price list**.
