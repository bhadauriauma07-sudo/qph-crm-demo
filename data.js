/* QPH CRM demo — constants and seed data */
const TEAM = [
  { id: 'u1', name: 'Faisal Rahman', role: 'admin', title: 'Admin · Manager & Accounts', color: '#1E3A5F' },
  { id: 'u2', name: 'Aisha Khan', role: 'sales', title: 'Sales Executive', color: '#486581' },
  { id: 'u3', name: 'Rohan Verma', role: 'sales', title: 'Sales Executive', color: '#627D98' },
  { id: 'u4', name: 'Sara Ali', role: 'ops', title: 'Operations Executive', color: '#3E6B67' },
  { id: 'u5', name: 'Imran Sheikh', role: 'ops', title: 'Operations Executive', color: '#6B5E7B' },
];

const STAGES = ['New', 'Contacted', 'Not Contacted', 'Follow-up', 'Appointment Booked', 'Qualified', 'Proposal Sent', 'Payment Link Sent', 'Payment Received', 'Closed Won', 'Lost', 'Junk'];
const OPEN_STAGES = STAGES.slice(0, 9);
const FUNNEL = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Payment Received', 'Closed Won'];
const OPS_STAGES = ['Client Account Created', 'Documents Collected', 'Application Started', 'Initial Approval', 'Trade License Issued', 'Establishment Card', 'Visa Processing', 'Visas Stamped', 'Setup Completed'];
const DOCS = ['Passport', 'Photo (white bg)', 'Emirates ID / Visa copy', 'Tourist / Entry stamp', 'Trade name options', 'Signed MOA / application'];
const SOURCES = ['Meta', 'Google', 'Website', 'WhatsApp', 'Referral', 'Walk-in'];
const NOT_CONTACTED_REASONS = ['Not reachable', 'Switched off', 'Busy', 'Wrong number', 'No answer'];
const LOST_REASONS = ['Price too high', 'Went with competitor', 'Not ready / postponed', 'Fake / spam', 'Duplicate', 'Out of UAE scope'];
const SERVICES = ['Free Zone Company', 'Mainland Company', 'Offshore Company', 'Golden Visa', 'Family Visa', 'Employment Visa', 'PRO Services', 'Company Cancellation', 'Ejari', 'Bank Account', 'VAT / Corporate Tax'];
const ACTIVITIES = ['General Trading', 'IT Consultancy', 'E-commerce', 'Marketing Services', 'Management Consultancy', 'Real Estate Brokerage', 'Food Trading', 'Logistics', 'Event Management', 'Beauty Salon'];
const NATIONALITIES = ['Indian', 'Pakistani', 'British', 'Egyptian', 'Filipino', 'Russian', 'Nigerian', 'Lebanese', 'Bangladeshi', 'Emirati'];

/* Indicative demo prices (AED). Editable in Settings → Price list. */
const DEFAULT_ZONES = [
  { id: 'ifza', name: 'IFZA', emirate: 'Dubai', type: 'Free Zone', licence: 12900, perVisa: 3750, estCard: 2000, inclActs: 3, extraAct: 1000, maxVisas: 6 },
  { id: 'meydan', name: 'Meydan Free Zone', emirate: 'Dubai', type: 'Free Zone', licence: 12500, perVisa: 3600, estCard: 2000, inclActs: 3, extraAct: 1000, maxVisas: 6 },
  { id: 'dmcc', name: 'DMCC', emirate: 'Dubai', type: 'Free Zone', licence: 24500, perVisa: 4200, estCard: 2500, inclActs: 3, extraAct: 2000, maxVisas: 6 },
  { id: 'dafza', name: 'DAFZA', emirate: 'Dubai', type: 'Free Zone', licence: 18500, perVisa: 4000, estCard: 2200, inclActs: 3, extraAct: 1500, maxVisas: 6 },
  { id: 'jafza', name: 'JAFZA', emirate: 'Dubai', type: 'Free Zone', licence: 19500, perVisa: 4000, estCard: 2200, inclActs: 3, extraAct: 1500, maxVisas: 6 },
  { id: 'dsouth', name: 'Dubai South', emirate: 'Dubai', type: 'Free Zone', licence: 13000, perVisa: 3800, estCard: 2000, inclActs: 3, extraAct: 1000, maxVisas: 6 },
  { id: 'shams', name: 'SHAMS', emirate: 'Sharjah', type: 'Free Zone', licence: 5750, perVisa: 3500, estCard: 1800, inclActs: 5, extraAct: 500, maxVisas: 6 },
  { id: 'spc', name: 'SPC Free Zone', emirate: 'Sharjah', type: 'Free Zone', licence: 5750, perVisa: 3500, estCard: 1800, inclActs: 3, extraAct: 500, maxVisas: 6 },
  { id: 'rakez', name: 'RAKEZ', emirate: 'Ras Al Khaimah', type: 'Free Zone', licence: 6500, perVisa: 3300, estCard: 1700, inclActs: 3, extraAct: 500, maxVisas: 6 },
  { id: 'afz', name: 'Ajman Free Zone', emirate: 'Ajman', type: 'Free Zone', licence: 6900, perVisa: 3400, estCard: 1700, inclActs: 3, extraAct: 500, maxVisas: 6 },
  { id: 'uaq', name: 'UAQ FTZ', emirate: 'Umm Al Quwain', type: 'Free Zone', licence: 5500, perVisa: 3300, estCard: 1600, inclActs: 3, extraAct: 500, maxVisas: 6 },
  { id: 'fcc', name: 'Fujairah Creative City', emirate: 'Fujairah', type: 'Free Zone', licence: 8500, perVisa: 3500, estCard: 1800, inclActs: 3, extraAct: 800, maxVisas: 6 },
  { id: 'dxbml', name: 'Dubai Mainland (DET)', emirate: 'Dubai', type: 'Mainland', licence: 15500, perVisa: 4500, estCard: 2500, inclActs: 3, extraAct: 1500, maxVisas: 10 },
  { id: 'shjml', name: 'Sharjah Mainland (SEDD)', emirate: 'Sharjah', type: 'Mainland', licence: 11000, perVisa: 4200, estCard: 2200, inclActs: 3, extraAct: 1000, maxVisas: 10 },
  { id: 'rakicc', name: 'RAK ICC Offshore', emirate: 'Ras Al Khaimah', type: 'Offshore', licence: 8500, perVisa: 0, estCard: 0, inclActs: 3, extraAct: 0, maxVisas: 0 },
];

const DEFAULT_ADDONS = [
  { id: 'office', name: 'Office / Flexi-desk (yearly)', price: 6000, per: 'once' },
  { id: 'medical', name: 'Medical + Emirates ID', price: 1200, per: 'visa' },
  { id: 'changeStatus', name: 'Change of status (inside UAE)', price: 1600, per: 'visa' },
  { id: 'bank', name: 'Corporate bank account assistance', price: 1500, per: 'once' },
  { id: 'vat', name: 'VAT registration', price: 1000, per: 'once' },
  { id: 'ct', name: 'Corporate Tax registration', price: 750, per: 'once' },
  { id: 'pro', name: 'PRO services (annual)', price: 3500, per: 'once' },
  { id: 'ejari', name: 'Ejari registration', price: 450, per: 'once' },
];
const DEFAULT_SERVICE_FEE = 2500;

const WA_TEMPLATES = [
  { name: 'welcome', text: 'Hi {name}, thank you for contacting Quick Path Horizon! 👋 We help you set up your UAE company fast and fully compliant. When is a good time for a quick call?' },
  { name: 'follow_up', text: 'Hi {name}, just following up on your business setup enquiry. Would you like us to share the best free zone options and cost for your activity?' },
  { name: 'proposal', text: 'Hi {name}, please find your customised business setup proposal attached. The quote is valid for 7 days. Let me know if you have any questions!' },
  { name: 'payment', text: 'Hi {name}, here is your secure payment link to start your company setup. Once paid, our operations team will begin the application the same day.' },
  { name: 'docs', text: 'Hi {name}, to start your application please share: passport copy, a photo with white background, and your current visa / entry stamp.' },
];

const CAMPAIGNS = {
  Meta: [
    { campaign: 'QPH | Freezone Setup | Leads | Nov26', adsets: ['UAE Expats 25-45', 'India Investors – Mumbai/Delhi', 'Lookalike 1% – Customers'], ads: ['Video – 2 Visa Package', 'Carousel – Top 5 Freezones', 'Static – Licence from AED 5,750'], form: 'QPH Freezone Form v2' },
    { campaign: 'QPH | Golden & Family Visa | Leads', adsets: ['UAE Residents – Families', 'Business Owners 30-55'], ads: ['Reel – Family Visa in 7 days', 'Static – Golden Visa Checklist'], form: 'QPH Visa Form' },
    { campaign: 'QPH | Mainland Company | Conversions', adsets: ['Dubai Traders – Interests', 'Retargeting – Site 30d'], ads: ['Video – Mainland vs Freezone', 'Static – 100% Ownership'], form: 'Website (Pixel)' },
  ],
  Google: [
    { campaign: 'QPH Search | Business Setup Dubai', adsets: ['Freezone Licence', 'Company Formation Cost'], ads: ['RSA – Freezone from AED 5,750', 'RSA – Setup in 3 Days'], terms: ['business setup in dubai', 'freezone license cost', 'company formation uae', 'cheapest freezone dubai'] },
    { campaign: 'QPH Search | Mainland & PRO', adsets: ['Mainland Licence', 'PRO Services'], ads: ['RSA – Mainland Experts', 'RSA – PRO & Visa Services'], terms: ['mainland company setup dubai', 'pro services dubai', 'trade license renewal dubai'] },
    { campaign: 'QPH PMax | Leads', adsets: ['Asset Group – Freezone'], ads: ['PMax – Asset Group 1'], terms: [''] },
  ],
};

const FIRST = ['Mohammed', 'Priya', 'James', 'Fatima', 'Arjun', 'Olga', 'Ahmed', 'Sneha', 'David', 'Hina', 'Karan', 'Maria', 'Omar', 'Neha', 'Chinedu', 'Rania', 'Vikram', 'Sophie', 'Bilal', 'Anjali', 'Yusuf', 'Pooja', 'Daniel', 'Ayesha', 'Rahul', 'Elena', 'Tariq', 'Kavya', 'Mark', 'Zainab', 'Sanjay', 'Leila', 'Harsh', 'Grace', 'Imtiaz', 'Riya', 'Ali', 'Meera'];
const LAST = ['Al Hashimi', 'Sharma', 'Wilson', 'Siddiqui', 'Patel', 'Ivanova', 'Hassan', 'Iyer', 'Brown', 'Qureshi', 'Malhotra', 'Santos', 'Farouk', 'Gupta', 'Okafor', 'Haddad', 'Reddy', 'Martin', 'Chaudhry', 'Nair', 'Abdullah', 'Desai', 'Clarke', 'Mirza', 'Kapoor', 'Petrova', 'Aziz', 'Menon', 'Taylor', 'Hussain', 'Joshi', 'Khalil', 'Bansal', 'Mensah', 'Butt', 'Sinha', 'Raza', 'Pillai'];

const HINGLISH_NOTES = [
  'client ne bola 2 visa chahiye, IFZA ya meydan dono ka rate bhejo. kal call karna hai 4 baje',
  'call kiya, busy tha. bola sham ko whatsapp pe baat karenge',
  'budget 15k tak hai, general trading activity, family visa bhi chahiye baad mein',
  'proposal bhej diya, partner se discuss karke batayega. friday tak follow up',
  'office visit kiya aaj, documents ready hai, payment next week karega',
  'price zyada laga, shams ka option diya, soch ke batayega',
  'india se hai, abhi tourist visa pe dubai mein hai, jaldi setup chahiye',
];

function buildSeed() {
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const now = Date.now();
  const H = 3600e3, D = 24 * H;
  const leads = [], cases = [], chats = {};
  const salesIds = ['u2', 'u3'];
  const stageWeights = ['New', 'New', 'New', 'Contacted', 'Contacted', 'Not Contacted', 'Follow-up', 'Follow-up', 'Follow-up', 'Appointment Booked', 'Qualified', 'Qualified', 'Proposal Sent', 'Proposal Sent', 'Payment Link Sent', 'Payment Received', 'Closed Won', 'Closed Won', 'Closed Won', 'Lost', 'Junk'];
  const srcWeights = ['Meta', 'Meta', 'Meta', 'Meta', 'Meta', 'Google', 'Google', 'Google', 'Website', 'WhatsApp', 'WhatsApp', 'Referral', 'Walk-in'];

  for (let i = 0; i < 46; i++) {
    const first = FIRST[i % FIRST.length], last = LAST[(i * 7) % LAST.length];
    const source = pick(srcWeights);
    const PLAN = ['New', 'Contacted', 'Follow-up', 'Appointment Booked', 'Qualified', 'Proposal Sent', 'New', 'Payment Link Sent', 'Closed Won', 'Follow-up', 'Payment Received', 'Not Contacted', 'New', 'Appointment Booked', 'Closed Won', 'Proposal Sent', 'Junk', 'Contacted', 'Qualified', 'Closed Won', 'Lost', 'New', 'Follow-up'];
    const stage = PLAN[i % PLAN.length];
    const created = now - Math.floor(rnd() * 40 * D) - (stage === 'New' ? 0 : 2 * D);
    const zone = pick(DEFAULT_ZONES.slice(0, 14));
    const phone = '+9715' + String(Math.floor(10000000 + rnd() * 89999999)).slice(0, 8);
    const lead = {
      id: 'L' + (1001 + i), name: first + ' ' + last, phone,
      email: (first + '.' + last.split(' ').pop()).toLowerCase() + '@' + pick(['gmail.com', 'outlook.com', 'yahoo.com', 'icloud.com']),
      nationality: pick(NATIONALITIES), source, stage,
      temp: pick(['Hot', 'Warm', 'Warm', 'Cold']),
      owner: salesIds[i % 2], createdAt: created, updatedAt: created + H,
      service: pick(SERVICES.slice(0, 5)),
      req: { type: zone.type, zone: zone.id, activity: pick(ACTIVITIES), visas: Math.floor(rnd() * 4) + (zone.type === 'Offshore' ? 0 : 1) },
      value: 0, followUp: null, tags: [], notes: [], activity: [], proposals: [], dupOf: null, payment: null, reason: '',
      attr: { platform: '', campaign: '', adset: '', ad: '', form: '', utm: {}, clickId: '', landing: '' },
    };
    if (lead.req.type === 'Offshore') lead.req.visas = 0;
    lead.value = zone.licence + zone.perVisa * lead.req.visas + DEFAULT_SERVICE_FEE;
    if (source === 'Meta' || source === 'Google') {
      const c = pick(CAMPAIGNS[source]);
      const adset = pick(c.adsets), ad = pick(c.ads);
      const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      if (source === 'Meta') {
        const plat = pick(['facebook', 'instagram', 'instagram']);
        lead.attr = { platform: plat === 'facebook' ? 'Facebook' : 'Instagram', campaign: c.campaign, adset, ad, form: c.form,
          utm: { utm_source: plat, utm_medium: 'paid_social', utm_campaign: slug(c.campaign), utm_content: slug(ad), utm_term: slug(adset) },
          clickId: 'fbclid=IwAR' + Math.floor(rnd() * 1e9).toString(36) + Math.floor(rnd() * 1e9).toString(36),
          landing: c.form === 'Website (Pixel)' ? 'https://quickpathhorizon.com/business-setup/' : '(Instant form)' };
      } else {
        const term = pick(c.terms);
        lead.attr = { platform: c.campaign.includes('PMax') ? 'Google PMax' : 'Google Search', campaign: c.campaign, adset, ad, form: 'Website enquiry form',
          utm: { utm_source: 'google', utm_medium: 'cpc', utm_campaign: slug(c.campaign), utm_term: term, utm_content: slug(ad) },
          clickId: 'gclid=Cj0KCQ' + Math.floor(rnd() * 1e9).toString(36) + 'EAAYASAA',
          landing: 'https://quickpathhorizon.com/' + (term.includes('mainland') ? 'mainland-company-setup/' : 'business-setup/') };
      }
    } else if (source === 'Website') {
      lead.attr = { platform: 'Organic / Direct', campaign: '(none)', adset: '', ad: '', form: 'Contact Us form',
        utm: { utm_source: pick(['(direct)', 'chatgpt.com', 'bing']), utm_medium: pick(['organic', 'referral', '(none)']) }, clickId: '', landing: 'https://quickpathhorizon.com/contact-us/' };
    } else if (source === 'WhatsApp') {
      lead.attr = { platform: 'WhatsApp +971 58 146 4678', campaign: pick(['Click-to-WhatsApp – Freezone', '(organic chat)']), adset: '', ad: '', form: '', utm: {}, clickId: '', landing: '' };
    }
    if (['Follow-up', 'Not Contacted', 'Contacted', 'Appointment Booked', 'Qualified', 'Proposal Sent', 'Payment Link Sent'].includes(stage)) {
      const off = [-1.5 * D, -3 * H, 1 * H, 3 * H, 1 * D, 2 * D, 4 * D][i % 7];
      lead.followUp = now + off;
    }
    const QP = ['Qualified', 'Proposal Sent', 'Payment Link Sent', 'Payment Received', 'Closed Won'].includes(stage);
    const contacted = !['New', 'Not Contacted'].includes(stage);
    lead.contact = { wa: contacted && rnd() < 0.8, call: contacted, email: contacted && rnd() < 0.3 };
    lead.interested = QP ? 'Yes' : contacted && rnd() < 0.5 ? 'Not sure' : '';
    lead.start = QP ? pick(['Immediately', 'Within 1 month']) : '';
    if (stage === 'Appointment Booked') { buildSeed.ap = (buildSeed.ap || 0) + 1; lead.followUp = now + [2 * H, -1 * D, 1 * D, 3 * D][(buildSeed.ap - 1) % 4]; }
    lead.appt = stage === 'Appointment Booked' ? (i % 2 ? { at: lead.followUp, type: 'meet', place: 'Google Meet', duration: 30, link: 'https://meet.google.com/qph-' + (1000 + i) + '-dxb' } : { at: lead.followUp, type: 'office', place: 'QPH Office, Dubai', duration: 45, link: '' }) : {};
    lead.payLink = ['Payment Link Sent', 'Payment Received', 'Closed Won'].includes(stage) ? { amount: lead.value, url: 'https://pay.quickpathhorizon.com/' + lead.id } : null;
    lead.ncReason = ''; lead.retryAt = null;
    if (!QP) { if (!contacted || rnd() < 0.5) lead.req.activity = ''; if (!contacted) lead.req.zone = ''; }
    if (stage === 'Not Contacted') { lead.ncReason = pick(NOT_CONTACTED_REASONS); lead.retryAt = lead.followUp; }
    if (stage === 'Lost' || stage === 'Junk') lead.reason = pick(LOST_REASONS);
    if (['Payment Received', 'Closed Won'].includes(stage)) lead.payment = { amount: lead.value, mode: pick(['Bank transfer', 'Card (payment link)', 'Cash']), ref: 'FT26' + (115000 + i * 37), date: created + 3 * D, status: 'confirmed', by: lead.owner, sentAt: created + 3 * D, confirmedBy: 'u1', confirmedAt: created + 3 * D + 2 * H };
    if (stage === 'Payment Link Sent' && i < 23) lead.payment = { amount: lead.value, mode: 'Bank transfer', ref: 'FT26' + (220000 + i * 41), date: now - 5 * H, status: 'pending', by: lead.owner, sentAt: now - 4 * H };
    if (stage !== 'New') {
      const n = HINGLISH_NOTES[i % HINGLISH_NOTES.length];
      lead.notes.push({ by: lead.owner, at: created + 2 * H, text: n, polished: false });
    }
    if (['Proposal Sent', 'Payment Link Sent', 'Payment Received', 'Closed Won'].includes(stage)) {
      lead.proposals.push({ id: 'P' + (2000 + i), at: created + D, zone: zone.id, total: lead.value, visas: lead.req.visas, pdf: 'QPH-Proposal-P' + (2000 + i) + '.pdf' });
    }
    lead.tags = [];
    if (lead.temp === 'Hot') lead.tags.push('Hot lead');
    if (i % 5 === 0) lead.tags.push('Price asked');
    if (i % 6 === 0) lead.tags.push('Family visa');
    lead.activity.push({ at: created, by: 'system', text: `Lead created from ${source}${lead.attr.campaign && lead.attr.campaign !== '(none)' ? ' · ' + lead.attr.campaign : ''}` });
    lead.activity.push({ at: created + 60e3, by: 'system', text: `Auto-assigned to ${TEAM.find(t => t.id === lead.owner).name} (round robin)` });
    if (stage !== 'New') lead.activity.push({ at: created + 2 * H, by: lead.owner, text: `Stage changed → ${stage}` });
    leads.push(lead);

    if (stage === 'Closed Won') {
      const opsStage = [8, 2, 5, 8, 0, 7][cases.length % 6];
      const docs = {}; DOCS.forEach((d, k) => docs[d] = opsStage > 1 || k < 3);
      const exp = now + Math.floor((rnd() * 400 - 20) * D);
      cases.push({ id: 'C' + (3001 + cases.length), leadId: lead.id, company: first + ' ' + pick(['Trading', 'Consultancy', 'Technologies', 'Global', 'Ventures']) + ' ' + (zone.type === 'Mainland' ? 'LLC' : 'FZ-LLC'),
        stage: OPS_STAGES[opsStage], owner: ['u4', 'u5'][cases.length % 2], docs, zone: zone.id, visas: lead.req.visas, startedAt: created + 4 * D,
        licenceNo: opsStage >= 4 ? zone.name.split(' ')[0].toUpperCase() + '-' + (40000 + i * 37) : '', licenceExpiry: opsStage >= 4 ? exp : null,
        visaHolders: opsStage >= 6 ? Array.from({ length: lead.req.visas }, (_, k) => ({ name: k ? first + ' – Employee ' + k : lead.name, status: opsStage >= 7 ? 'Stamped' : 'In process', expiry: opsStage >= 7 ? exp + 300 * D : null })) : [],
        log: [{ at: created + 4 * D, by: 'system', text: 'Case opened after Closed Won' }] });
    }
    if (['WhatsApp', 'Meta', 'Google'].includes(source) && i % 3 === 0) {
      chats[lead.id] = [
        { from: 'in', text: 'Hi, I want to know the cost of a ' + (zone.type === 'Mainland' ? 'mainland' : 'freezone') + ' licence with ' + lead.req.visas + ' visa', at: created + 5 * 60e3 },
        { from: 'out', text: WA_TEMPLATES[0].text.replace('{name}', first), at: created + 6 * 60e3, by: 'auto' },
        ...(stage !== 'New' ? [{ from: 'in', text: 'Activity will be ' + lead.req.activity + '. What documents do you need?', at: created + 40 * 60e3 }, { from: 'out', text: WA_TEMPLATES[4].text.replace('{name}', first), at: created + 50 * 60e3, by: lead.owner }] : []),
        ...(i % 2 === 0 ? [{ from: 'in', text: 'Ok, can you share the final price for ' + zone.name + '?', at: now - Math.floor(rnd() * 20) * H }] : []),
      ];
    }
  }

  // Duplicates: same person enquiring again from another campaign
  const dupPlan = [[2, 'Google', 'QPH Search | Business Setup Dubai', 'Freezone Licence', 'RSA – Freezone from AED 5,750'], [5, 'Meta', 'QPH | Golden & Family Visa | Leads', 'UAE Residents – Families', 'Reel – Family Visa in 7 days'], [11, 'Meta', 'QPH | Freezone Setup | Leads | Nov26', 'Lookalike 1% – Customers', 'Carousel – Top 5 Freezones'], [17, 'Website', '(none)', '', '']];
  dupPlan.forEach(([idx, src, camp, adset, ad], k) => {
    const o = leads[idx];
    const phoneVariant = k % 2 ? o.phone.replace('+971', '00971') : o.phone.replace('+971', '0');
    const d = JSON.parse(JSON.stringify(o));
    Object.assign(d, { id: 'L' + (1101 + k), phone: phoneVariant, email: k === 3 ? o.email.toUpperCase() : o.email, source: src, stage: 'New', createdAt: now - (k + 1) * 5 * H, updatedAt: now - (k + 1) * 5 * H, notes: [], proposals: [], payment: null, followUp: null, reason: '',
      tags: ['Duplicate'], dupOf: o.id, owner: o.owner, contact: {}, interested: '', appt: {}, payLink: null, ncReason: '', retryAt: null, start: '',
      attr: { platform: src === 'Google' ? 'Google Search' : src === 'Meta' ? 'Instagram' : 'Organic / Direct', campaign: camp, adset, ad, form: src === 'Website' ? 'Contact Us form' : src === 'Meta' ? 'QPH Visa Form' : 'Website enquiry form',
        utm: src === 'Google' ? { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'qph_search_business_setup_dubai', utm_term: 'freezone license cost' } : src === 'Meta' ? { utm_source: 'instagram', utm_medium: 'paid_social', utm_campaign: 'qph_golden_family_visa_leads' } : { utm_source: '(direct)', utm_medium: '(none)' },
        clickId: src === 'Google' ? 'gclid=Cj0KCQdupEAAYASAA' : '', landing: '' },
      activity: [{ at: now - (k + 1) * 5 * H, by: 'system', text: `Lead created from ${src} · flagged DUPLICATE of ${o.id} (${o.name})` }] });
    o.activity.push({ at: d.createdAt, by: 'system', text: `Re-enquired via ${src}${camp !== '(none)' ? ' · ' + camp : ''} → duplicate ${d.id}` });
    o.tags.includes('Re-enquired') || o.tags.push('Re-enquired');
    leads.push(d);
  });

  const adSpend = { 'QPH | Freezone Setup | Leads | Nov26': 6800, 'QPH | Golden & Family Visa | Leads': 3200, 'QPH | Mainland Company | Conversions': 2900, 'QPH Search | Business Setup Dubai': 5400, 'QPH Search | Mainland & PRO': 2600, 'QPH PMax | Leads': 1800 };
  return { leads, cases, chats, adSpend, zones: JSON.parse(JSON.stringify(DEFAULT_ZONES)), addons: JSON.parse(JSON.stringify(DEFAULT_ADDONS)), serviceFee: DEFAULT_SERVICE_FEE, rr: 0, rrOps: 0, seq: 1200, read: {} };
}
