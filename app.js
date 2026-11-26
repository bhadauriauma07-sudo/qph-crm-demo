/* QPH CRM demo — app */
const KEY = 'qph_crm_demo_v3';
let S = load();
let ME = null;
let route = 'dashboard';
let period = '30';
let drawer = null; // {kind:'lead'|'case', id}
const APP_V = 8;
const BLANK_LF = () => ({ stage: [], source: [], campaign: [], owner: [], temp: [], dup: false, pay: false });
let leadFilter = BLANK_LF(); let opsFilter = { stage: [], owner: [] }; let openMs = null; const MS = {};
let C = { leadId: '', type: 'Free Zone', zone: 'ifza', acts: 3, visas: 2, addons: ['medical'], disc: 0 };
let waOpen = null;
let setTab = 'team', campTab = 'campaign', opsMine = false;

/* ---------------- utils ---------------- */
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.leads) return s; } catch (e) { } const s = buildSeed(); localStorage.setItem(KEY, JSON.stringify(s)); return s; }
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const aed = n => 'AED ' + Math.round(n || 0).toLocaleString('en-US');
const H = 3600e3, D = 24 * H;
const user = id => TEAM.find(t => t.id === id) || { name: id === 'system' ? 'System' : id === 'auto' ? 'Auto-reply' : id === 'ai' ? 'AI Agent' : '—', color: '#8A99A8' };
const initials = n => n.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
const av = (id, size = 28) => { const u = user(id); return `<span class="av" style="background:${u.color};width:${size}px;height:${size}px;font-size:${size / 2.4}px" title="${esc(u.name)}">${initials(u.name)}</span>`; };
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
const pill = (t, cls) => `<span class="pill ${cls || 'p-' + slug(t)}">${esc(t)}</span>`;
const zoneOf = id => S.zones.find(z => z.id === id) || S.zones[0];
function fmtDate(ts, withTime = true) { if (!ts) return '—'; const d = new Date(ts); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + (withTime ? ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''); }
function ago(ts) { const m = Math.round((Date.now() - ts) / 60e3); if (m < 1) return 'just now'; if (m < 60) return m + 'm ago'; const h = Math.round(m / 60); if (h < 24) return h + 'h ago'; return Math.round(h / 24) + 'd ago'; }
function fu(ts) { if (!ts) return ''; const diff = ts - Date.now(); const today = new Date().toDateString() === new Date(ts).toDateString(); if (diff < 0) return `<span class="pill p-lost">Overdue · ${fmtDate(ts)}</span>`; if (today) return `<span class="pill p-follow-up">Today ${new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>`; return `<span class="pill">${fmtDate(ts)}</span>`; }
function toInput(ts) { const d = new Date(ts || Date.now() + D); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); }
function toast(t) { const el = $('toast'); el.innerHTML = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3200); }
function normPhone(p) { const d = String(p || '').replace(/\D/g, ''); return d.slice(-9); }
function findDup(phone, email, excludeId) {
  const np = normPhone(phone), ne = String(email || '').trim().toLowerCase();
  return S.leads.find(l => l.id !== excludeId && !l.dupOf && ((np.length >= 8 && normPhone(l.phone) === np) || (ne && l.email && l.email.toLowerCase() === ne)));
}
function dupsOf(id) { return S.leads.filter(l => l.dupOf === id); }
function log(l, text, by) { l.activity.push({ at: Date.now(), by: by || ME.id, text }); l.updatedAt = Date.now(); }
function inPeriod(ts) { if (period === 'all') return true; if (period === 'today') return new Date(ts).toDateString() === new Date().toDateString(); return ts >= Date.now() - (+period) * D; }
function visibleLeads() { if (!ME) return []; if (ME.role === 'admin') return S.leads; if (ME.role === 'sales') return S.leads.filter(l => l.owner === ME.id); return []; }
function visibleCases() { const f = opsFilter; return S.cases.filter(c => (!(ME.role === 'ops' && opsMine) || c.owner === ME.id) && (!f.stage.length || f.stage.includes(c.stage)) && (!f.owner.length || f.owner.includes(c.owner))); return S.cases; }
function unread(l) { const c = S.chats[l.id]; if (!c || !c.length) return 0; const r = S.read[l.id] || 0; return c.filter(m => m.from === 'in' && m.at > r).length; }
function waLink(phone, text) { return 'https://wa.me/' + String(phone).replace(/\D/g, '').replace(/^00/, '').replace(/^0(?=5)/, '971') + '?text=' + encodeURIComponent(text || ''); }

/* ---------------- AI (demo mode) ---------------- */
const POLISHED = {
  'client ne bola 2 visa chahiye, IFZA ya meydan dono ka rate bhejo. kal call karna hai 4 baje': 'Client needs 2 visas. Send rates for both IFZA and Meydan. Call back tomorrow at 4 PM.',
  'call kiya, busy tha. bola sham ko whatsapp pe baat karenge': 'Called – client was busy. Will continue the conversation on WhatsApp this evening.',
  'budget 15k tak hai, general trading activity, family visa bhi chahiye baad mein': 'Budget up to AED 15k, General Trading activity. Will also need a family visa later.',
  'proposal bhej diya, partner se discuss karke batayega. friday tak follow up': 'Proposal sent. Client will discuss with partner and revert. Follow up by Friday.',
  'office visit kiya aaj, documents ready hai, payment next week karega': 'Client visited the office today. Documents are ready; payment expected next week.',
  'price zyada laga, shams ka option diya, soch ke batayega': 'Client found the price high. Offered SHAMS as a lower-cost option; will think and revert.',
  'india se hai, abhi tourist visa pe dubai mein hai, jaldi setup chahiye': 'Client is from India, currently in Dubai on a tourist visa. Needs an urgent setup.',
};
const DICT = [[/client ne bola/gi, 'Client said'], [/call kiya/gi, 'Called'], [/call karna hai/gi, 'need to call'], [/bhej diya/gi, 'sent'], [/soch ke batayega/gi, 'will think and revert'], [/discuss karke batayega/gi, 'will discuss and revert'], [/zyada laga/gi, 'felt too high'], [/baat karenge/gi, 'will talk'], [/sham ko/gi, 'in the evening'], [/ke liye/gi, 'for'], [/\bchahiye\b/gi, 'needs'], [/\bbhejo\b/gi, 'send'], [/\bbola\b/gi, 'said'], [/\bkal\b/gi, 'tomorrow'], [/\baaj\b/gi, 'today'], [/\bbaje\b/gi, "o'clock"], [/\bdono\b/gi, 'both'], [/\bya\b/gi, 'or'], [/\bhai\b/gi, 'is'], [/\btha\b/gi, 'was'], [/\bnahi\b/gi, 'not'], [/\bhaan\b/gi, 'yes'], [/\baur\b/gi, 'and'], [/\bbhi\b/gi, 'also'], [/\bmein\b/gi, 'in'], [/\bpe\b/gi, 'on'], [/\bka\b/gi, 'of'], [/\bki\b/gi, 'of'], [/\bse\b/gi, 'from'], [/\babhi\b/gi, 'currently'], [/\bjaldi\b/gi, 'urgently'], [/\bkarega\b/gi, 'will do'], [/\bkarna\b/gi, 'to do'], [/\bpaise\b/gi, 'payment'], [/\btak\b/gi, 'by'], [/\bbaad mein\b/gi, 'later'], [/\bthoda\b/gi, 'a little'], [/\bmilna\b/gi, 'meet'], [/\bbatayega\b/gi, 'will confirm'], [/\bkoi\b/gi, 'any']];
function polish(t) {
  t = String(t || '').trim(); if (!t) return t;
  if (POLISHED[t]) return POLISHED[t];
  let o = t; DICT.forEach(([r, w]) => o = o.replace(r, w));
  o = o.replace(/\s+/g, ' ').replace(/\s+([,.])/g, '$1');
  o = o.split(/(?<=[.!?])\s+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  if (!/[.!?]$/.test(o)) o += '.';
  return o;
}
function aiNext(l) {
  const z = zoneOf(l.req.zone), first = l.name.split(' ')[0];
  const est = estimate({ zone: z.id, visas: l.req.visas, acts: 3, addons: ['medical'], disc: 0 }).total;
  const last = l.notes.length ? (l.notes[l.notes.length - 1].polished ? l.notes[l.notes.length - 1].text : polish(l.notes[l.notes.length - 1].text)) : '';
  const tips = {
    'New': `Call ${first} within 15 minutes (leads called in the first hour convert ~3x better). Send the WhatsApp welcome template, then confirm visas, activity and budget.`,
    'Contacted': `Qualify ${first}: confirm ${l.req.visas} visa(s), activity "${l.req.activity}" and Free Zone vs Mainland. Book an office or Zoom appointment.`,
    'Not Contacted': `Retry at a different time of day and send the follow-up WhatsApp template. After 3 failed attempts, move to Lost with reason "Not reachable".`,
    'Follow-up': `Follow up as promised. Lead with value: share the 3 cheapest zones for "${l.req.activity}" from the calculator comparison.`,
    'Appointment Booked': `Send a reminder 2 hours before the meeting with the office location pin. Prepare a proposal for ${z.name} in advance.`,
    'Qualified': `Create a proposal for ${z.name} with ${l.req.visas} visa(s) — estimated ${aed(est)}. Also offer SHAMS / SPC as a budget option.`,
    'Proposal Sent': `Follow up within 24h. Handle price objection with a payment split (licence now, visas next month). Quote valid 7 days creates urgency.`,
    'Payment Link Sent': `Check if payment link opened. Call to help complete payment; offer bank transfer as alternative.`,
    'Payment Received': `Move to Closed Won so Operations can open the case, and send the documents checklist template.`,
    'Closed Won': `Hand-over done. Ask for a Google review and a referral in 7 days; upsell VAT / Corporate Tax registration and bank account.`,
    'Lost': `Add to the 60-day re-engagement list with the new offer.`, 'Junk': `No action.`,
  };
  return { summary: last ? 'Last note: ' + last : 'No notes yet.', next: tips[l.stage] || '', temp: l.temp };
}
function aiReply(l) {
  const c = S.chats[l.id] || []; const lastIn = [...c].reverse().find(m => m.from === 'in'); const t = (lastIn ? lastIn.text : '').toLowerCase();
  const first = l.name.split(' ')[0]; const z = zoneOf(l.req.zone);
  const est = estimate({ zone: z.id, visas: l.req.visas, acts: 3, addons: ['medical'], disc: 0 });
  if (/price|cost|rate|kitna|charges|fee/.test(t)) return `Hi ${first}, for a ${z.name} licence with ${l.req.visas} visa(s) the all-inclusive estimate is ${aed(est.total)} (licence, establishment card, visas, medical & Emirates ID). Shall I send the detailed proposal?`;
  if (/document|docs|papers/.test(t)) return WA_TEMPLATES[4].text.replace('{name}', first);
  if (/time|days|how long|kitne din/.test(t)) return `Hi ${first}, the licence is usually issued in 3–5 working days after documents, and visas take around 2–3 weeks in total.`;
  return `Hi ${first}, thanks for your message! I'd be happy to help with your ${l.req.type.toLowerCase()} setup. Are you available for a quick call today?`;
}

/* ---------------- calculator ---------------- */
function estimate(c) {
  const z = zoneOf(c.zone); const visas = Math.min(+c.visas || 0, z.maxVisas); const rows = [];
  rows.push([`${z.name} licence & registration (${z.type})`, z.licence]);
  const extra = Math.max(0, (+c.acts || 0) - z.inclActs);
  if (extra && z.extraAct) rows.push([`Extra activities × ${extra}`, extra * z.extraAct]);
  if (visas > 0) { rows.push(['Establishment / immigration card', z.estCard]); rows.push([`Visa allocation & processing × ${visas}`, visas * z.perVisa]); }
  (c.addons || []).forEach(id => { const a = S.addons.find(x => x.id === id); if (!a) return; if (a.per === 'visa') { if (visas > 0) rows.push([`${a.name} × ${visas}`, a.price * visas]); } else rows.push([a.name, a.price]); });
  const govt = rows.reduce((s, r) => s + r[1], 0);
  const fee = S.serviceFee; const disc = Math.round(fee * (+c.disc || 0) / 100); const feeNet = fee - disc; const vat = Math.round(feeNet * 0.05);
  return { z, visas, rows, govt, fee, disc, feeNet, vat, total: govt + feeNet + vat };
}

/* ---------------- lead ingest (Meta / Google / Website / manual) ---------------- */
function nextId() { S.seq = (S.seq || 1200) + 1; return 'L' + S.seq; }
function ingest(d) {
  const dup = findDup(d.phone, d.email);
  const mem = S.rrMembers && S.rrMembers.length ? S.rrMembers : TEAM.filter(t => t.role === 'sales').map(t => t.id);
  const owner = dup ? dup.owner : (d.owner || mem[(S.rr++) % mem.length]);
  const z = S.zones.find(x => x.type === (d.reqType || 'Free Zone')) || S.zones[0];
  const l = { id: nextId(), name: d.name, phone: d.phone, email: d.email || '', nationality: d.nationality || '', source: d.source, stage: 'New', temp: 'Warm', owner, createdAt: Date.now(), updatedAt: Date.now(),
    service: d.service || 'Free Zone Company', req: { type: d.reqType || 'Free Zone', zone: '', activity: d.activity || '', visas: +d.visas || 1 }, value: 0, followUp: null,
    tags: [], notes: [], activity: [], proposals: [], dupOf: null, payment: null, reason: '', contact: {}, interested: '', appt: {}, payLink: null, ncReason: '', retryAt: null, attr: d.attr || { platform: '', campaign: '', adset: '', ad: '', form: '', utm: {}, clickId: '', landing: '' } };
  l.value = estimate({ zone: z.id, visas: l.req.visas, acts: 3, addons: [] }).total;
  if (d.source === 'WhatsApp' || d.sendWelcome) l.contact.wa = false;
  if (d.note) l.notes.push({ by: ME.id, at: Date.now(), text: d.note, polished: false });
  l.activity.push({ at: Date.now(), by: 'system', text: `Lead created from ${d.source}${l.attr.campaign && l.attr.campaign !== '(none)' ? ' · ' + l.attr.campaign : ''}${l.attr.adset ? ' › ' + l.attr.adset : ''}${l.attr.ad ? ' › ' + l.attr.ad : ''}` });
  if (dup) {
    l.dupOf = dup.id; l.tags.push('Duplicate');
    l.activity.push({ at: Date.now(), by: 'system', text: `⚠ Duplicate of ${dup.id} (${dup.name}) — matched on ${normPhone(dup.phone) === normPhone(d.phone) ? 'phone' : 'email'}. Assigned to same owner: ${user(owner).name}` });
    dup.tags.includes('Re-enquired') || dup.tags.push('Re-enquired');
    log(dup, `Re-enquired via ${d.source}${l.attr.campaign ? ' · ' + l.attr.campaign : ''} → duplicate ${l.id}`, 'system');
  } else {
    l.activity.push({ at: Date.now(), by: 'system', text: `Auto-assigned to ${user(owner).name} (round robin)` });
  }
  if (d.source === 'WhatsApp' || d.sendWelcome) { S.chats[l.id] = [{ from: 'in', text: d.firstMsg || 'Hi, I need information about business setup', at: Date.now() - 30e3 }, { from: 'out', text: WA_TEMPLATES[0].text.replace('{name}', l.name.split(' ')[0]), at: Date.now(), by: 'auto' }]; l.activity.push({ at: Date.now(), by: 'auto', text: 'WhatsApp auto-welcome sent' }); }
  if (S.email && S.email.autoWelcome && l.email) { const t = S.emailTpl[0]; l.emails = [{ at: Date.now(), to: l.email, subject: fillTpl(t.subject, l), by: 'auto', att: '' }]; l.contact.email = false; l.activity.push({ at: Date.now(), by: 'auto', text: `Auto welcome email sent to ${l.email}` }); }
  S.leads.unshift(l);
  const camp = l.attr.campaign && l.attr.campaign !== '(none)' ? ' · ' + l.attr.campaign : '';
  notify(owner, `${dup ? '⚠ Duplicate' : '🆕 New'} ${d.source} lead assigned to you: ${l.name}${camp}${S.email && S.email.staffAlerts ? ' (email alert sent)' : ''}`, l.id);
  if (owner !== 'u1') notify('u1', `${dup ? '⚠ Duplicate' : '🆕 New'} ${d.source} lead ${l.name} → ${user(owner).name}${dup ? '' : ' (round robin)'}`, l.id);
  save();
  return { l, dup };
}

/* ---------------- boot / login ---------------- */
function boot() {
  const uid = sessionStorage.getItem('qph_uid');
  ME = TEAM.find(t => t.id === uid) || null;
  if (!ME) { $('login').hidden = false; $('app').hidden = true; $('loginUsers').innerHTML = TEAM.map(t => `<button class="login-user" onclick="login('${t.id}')">${av(t.id, 36)}<div><b>${esc(t.name)}</b><span class="muted small">${esc(t.title)}</span></div><span class="role pill ${t.role === 'admin' ? 'p-qualified' : t.role === 'sales' ? 'p-new' : 'p-contacted'}">${t.role === 'ops' ? 'Operations' : t.role === 'admin' ? 'Admin' : 'Sales'}</span></button>`).join(''); return; }
  $('login').hidden = true; $('app').hidden = false;
  $('me').innerHTML = `${av(ME.id, 32)}<div style="min-width:0"><b>${esc(ME.name)}</b><span>${esc(ME.title)}</span></div>`;
  $('simBtn').hidden = ME.role === 'ops'; $('addLeadBtn').hidden = ME.role === 'ops';
  route = (location.hash.slice(1) || 'dashboard'); if (!navItems().some(n => n.id === route)) route = 'dashboard';
  render();
}
function login(id) { sessionStorage.setItem('qph_uid', id); location.hash = 'dashboard'; boot(); toast('Logged in as ' + user(id).name); }
$('logoutBtn').onclick = () => { sessionStorage.removeItem('qph_uid'); closeDrawer(); boot(); };
$('menuBtn').onclick = () => { $('side').classList.toggle('open'); $('scrim').classList.toggle('open'); };
$('scrim').onclick = () => { $('side').classList.remove('open'); $('scrim').classList.remove('open'); };
$('addLeadBtn').onclick = () => addLeadModal();
$('simBtn').onclick = () => simModal();
$('bellBtn').onclick = () => alertsModal();
$('q').oninput = () => { if (!['leads', 'newleads', 'contacted'].includes(route) && ME.role !== 'ops') go('leads'); else { drawer = null; render(); } };
$('drawerBg').onclick = e => { if (e.target.id === 'drawerBg') closeDrawer(); };
$('modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };
window.onhashchange = () => { const r = location.hash.slice(1); if (r && r !== route && navItems().some(n => n.id === r)) { route = r; render(); } };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeModal(); closeDrawer(); } });

function navItems() {
  const L = visibleLeads();
  const fuDue = L.filter(l => l.followUp && OPEN_STAGES.includes(l.stage) && l.followUp < Date.now() + (new Date().setHours(23, 59) - Date.now())).length;
  const dups = L.filter(l => l.dupOf).length;
  const unreadN = L.filter(l => unread(l) > 0).length;
  const newN = L.filter(l => l.stage === 'New').length;
  const renew = S.cases.filter(c => c.licenceExpiry && c.licenceExpiry < Date.now() + 60 * D).length;
  const apptN = L.filter(l => l.stage === 'Appointment Booked' && l.appt && l.appt.at && new Date(l.appt.at).toDateString() === new Date().toDateString()).length;
  const contactedN = L.filter(l => ['Contacted', 'Follow-up', 'Not Contacted'].includes(l.stage)).length;
  const custN = S.cases.filter(c => !(acctComplete(c) && c.stage === 'Setup Completed')).length, acctN = S.cases.filter(c => acctComplete(c) && c.stage === 'Setup Completed').length;
  const items = {
    admin: [['h', 'Overview'], ['dashboard', '📊', 'Dashboard'], ['campaigns', '🎯', 'Campaigns & UTM'], ['h', 'Leads'], ['newleads', '🆕', 'New Leads', newN, 'hot'], ['leads', '👥', 'All Leads', L.length, ''], ['contacted', '📞', 'Contacted', contactedN, ''], ['appointments', '📅', 'Appointments', apptN, 'hot'], ['followups', '⏰', 'Follow-ups', fuDue, 'hot'], ['whatsapp', '💬', 'WhatsApp', unreadN, 'wab'], ['calculator', '🧮', 'Cost Calculator'], ['h', 'Operations'], ['customers', '🏢', 'Customers', custN, ''], ['operations', '🗂️', 'Operations Board'], ['accounts', '✅', 'Accounts', acctN, ''], ['renewals', '🔁', 'Renewals', renew, 'hot'], ['h', 'Admin'], ['settings', '⚙️', 'Settings']],
    sales: [['h', 'My leads'], ['dashboard', '📊', 'My Dashboard'], ['newleads', '🆕', 'New Leads', newN, 'hot'], ['leads', '👥', 'All My Leads', L.length, ''], ['contacted', '📞', 'Contacted', contactedN, ''], ['appointments', '📅', 'Appointments', apptN, 'hot'], ['followups', '⏰', 'Follow-ups', fuDue, 'hot'], ['whatsapp', '💬', 'WhatsApp', unreadN, 'wab'], ['h', 'Tools'], ['calculator', '🧮', 'Cost Calculator']],
    ops: [['h', 'Operations'], ['dashboard', '📊', 'Ops Dashboard'], ['customers', '🏢', 'Customers', custN, ''], ['operations', '🗂️', 'Operations Board', S.cases.filter(c => c.stage !== 'Setup Completed' && c.owner === ME.id).length, ''], ['accounts', '✅', 'Accounts', acctN, ''], ['renewals', '🔁', 'Renewals', renew, 'hot'], ['h', 'Tools'], ['calculator', '🧮', 'Cost Calculator']],
  }[ME.role];
  return items.map(i => i[0] === 'h' ? { h: i[1] } : { id: i[0], ic: i[1], label: i[2], badge: i[3], cls: i[4] });
}
function go(r) { drawer = null; route = r; location.hash = r; $('side').classList.remove('open'); $('scrim').classList.remove('open'); render(); window.scrollTo(0, 0); }

function render() {
  const items = navItems();
  $('nav').innerHTML = items.map(n => n.h ? `<div class="nav-h">${n.h}</div>` : `<a class="nav-i ${route === n.id ? 'on' : ''}" onclick="go('${n.id}')"><span class="ic">${n.ic}</span>${n.label}${n.badge ? `<span class="badge ${n.cls || ''}">${n.badge}</span>` : ''}</a>`).join('');
  const cur = items.find(n => n.id === route); $('pageTitle').textContent = cur ? cur.label : '';
  $('bellCount').textContent = (myNotifs().filter(n => !n.read).length + alerts().length) || '';
  const V = { dashboard: ME.role === 'admin' ? vAdminDash : ME.role === 'sales' ? vSalesDash : vOpsDash, leads: vLeads, newleads: vLeads, contacted: vLeads, appointments: vAppointments, accounts: vAccounts, followups: vFollowups, whatsapp: vWhatsApp, calculator: vCalc, campaigns: vCampaigns, operations: vOps, customers: vCustomers, renewals: vRenewals, settings: vSettings }[route] || vAdminDash;
  if (drawer && drawer.kind === 'lead') { $('pageTitle').textContent = 'Lead'; $('view').innerHTML = leadPage(); return; }
  $('view').innerHTML = V();
  if (route === 'whatsapp') { const m = document.querySelector('.wa-msgs'); if (m) m.scrollTop = m.scrollHeight; }
  if (drawer && drawer.kind === 'case') renderDrawer();
}

/* ---------------- dashboards ---------------- */
function periodSeg() { return `<div class="seg">${[['today', 'Today'], ['7', '7 days'], ['30', '30 days'], ['all', 'All time']].map(([k, t]) => `<button class="${period === k ? 'on' : ''}" onclick="period='${k}';render()">${t}</button>`).join('')}</div>`; }
function stat(label, val, sub, onclick, cls = '') { return `<button class="stat ${cls}" onclick="${onclick || ''}"><span>${label}</span><b>${val}</b>${sub ? `<small>${sub}</small>` : ''}</button>`; }
function bars(rows, cls = '') { const max = Math.max(1, ...rows.map(r => r[1])); return `<div class="bars">${rows.map(r => `<div class="row"><span title="${esc(r[0])}">${esc(r[0])}</span><div class="bar ${cls}"><i style="width:${(r[1] / max * 100).toFixed(1)}%"></i></div><b>${r[2] ?? r[1]}</b></div>`).join('')}</div>`; }
function funnel(L) { return bars(FUNNEL.map(st => { const idx = STAGES.indexOf(st); return [st, L.filter(l => { const i = STAGES.indexOf(l.stage); return st === 'New' ? true : (i >= idx && i <= 9); }).length]; })); }
function countBy(arr, fn) { const m = {}; arr.forEach(x => { const k = fn(x); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); }
function leadLi(l, right) { return `<li onclick="openLead('${l.id}')">${av(l.owner, 26)}<div><b>${esc(l.name)}</b> ${l.dupOf ? pill('Duplicate', 'p-dup') : ''}<div class="small muted">${esc(l.source)}${l.attr.campaign && l.attr.campaign !== '(none)' ? ' · ' + esc(l.attr.campaign) : ''}</div></div><div class="r">${right || pill(l.stage)}</div></li>`; }
function filterGo(f) { leadFilter = BLANK_LF(); Object.entries(f || {}).forEach(([k, v]) => { leadFilter[k] = Array.isArray(leadFilter[k]) ? (Array.isArray(v) ? v : v ? [v] : []) : v; }); drawer = null; go('leads'); }
/* multi-select filter dropdown */
const getF = n => n === 'ops' ? opsFilter : leadFilter;
const anyF = f => Object.values(f).some(v => Array.isArray(v) ? v.length : v);
function msel(n, k, opts, label) {
  const f = getF(n); const sel = f[k]; const id = n + '_' + k; MS[id] = opts.map(o => Array.isArray(o) ? o : [o, o]);
  const txt = sel.length ? `${label}: ${sel.length === 1 ? esc((MS[id].find(o => o[0] === sel[0]) || [0, sel[0]])[1]) : sel.length + ' selected'}` : 'All ' + label.toLowerCase();
  return `<div class="ms"><button class="ms-btn ${sel.length ? 'has' : ''}" onclick="event.stopPropagation();openMs=openMs==='${id}'?null:'${id}';render()">${txt} <span class="muted">▾</span></button>${openMs === id ? `<div class="ms-pop" onclick="event.stopPropagation()">${MS[id].map((o, i) => `<label><input type="checkbox" ${sel.includes(o[0]) ? 'checked' : ''} onchange="toggleF('${n}','${k}',${i},this.checked)"> ${esc(o[1])}</label>`).join('')}<div class="ms-f"><button class="btn btn-sm" onclick="getF('${n}')['${k}']=[];render()">Clear</button><button class="btn btn-sm btn-primary" onclick="openMs=null;render()">Done</button></div></div>` : ''}</div>`;
}
function toggleF(n, k, i, on) { const f = getF(n); const v = MS[n + '_' + k][i][0]; f[k] = on ? [...new Set([...f[k], v])] : f[k].filter(x => x !== v); render(); }
document.addEventListener('click', () => { if (openMs) { openMs = null; render(); } });
const passLF = (l, f = leadFilter) => (!f.stage.length || f.stage.includes(l.stage)) && (!f.source.length || f.source.includes(l.source)) && (!f.campaign.length || f.campaign.includes(l.attr.campaign)) && (!f.owner.length || f.owner.includes(l.owner)) && (!f.temp.length || f.temp.includes(l.temp)) && (!f.dup || l.dupOf || dupsOf(l.id).length) && (!f.pay || (l.payment && l.payment.status === 'pending'));
function leadFilterBar(opts = {}) {
  const all = visibleLeads(); const camps = [...new Set(all.map(l => l.attr.campaign).filter(c => c && c !== '(none)'))];
  return `${opts.noStage ? '' : msel('lead', 'stage', opts.stages || STAGES, 'Stages')}${msel('lead', 'source', SOURCES, 'Sources')}${msel('lead', 'campaign', camps, 'Campaigns')}${ME.role === 'admin' ? msel('lead', 'owner', TEAM.filter(t => t.role === 'sales').map(t => [t.id, t.name]), 'Owners') : ''}${msel('lead', 'temp', ['Hot', 'Warm', 'Cold'], 'Hot/Warm/Cold')}${anyF(leadFilter) ? `<button class="btn btn-sm" onclick="leadFilter=BLANK_LF();render()">Clear filters</button>` : ''}`;
}

function vAdminDash() {
  const L = S.leads.filter(l => inPeriod(l.createdAt));
  const won = L.filter(l => l.stage === 'Closed Won');
  const paid = S.leads.filter(l => l.payment && inPeriod(l.payment.date));
  const rev = paid.reduce((s, l) => s + l.payment.amount, 0);
  const spend = Object.values(S.adSpend).reduce((a, b) => a + b, 0) * (period === 'all' ? 1.4 : period === '30' ? 1 : period === '7' ? 0.25 : 0.04);
  const paidLeads = L.filter(l => l.source === 'Meta' || l.source === 'Google').length;
  const dups = L.filter(l => l.dupOf).length;
  const fuDue = S.leads.filter(l => l.followUp && OPEN_STAGES.includes(l.stage) && l.followUp < Date.now() + 12 * H).length;
  const pipe = S.leads.filter(l => ['Qualified', 'Proposal Sent', 'Payment Link Sent'].includes(l.stage)).reduce((s, l) => s + l.value, 0);
  const notC = S.leads.filter(l => l.stage === 'Not Contacted' || (l.stage === 'New' && Date.now() - l.createdAt > 2 * H)).length;
  const camps = countBy(L.filter(l => l.attr.campaign && l.attr.campaign !== '(none)'), l => l.attr.campaign).slice(0, 6);
  const sales = TEAM.filter(t => t.role === 'sales'), ops = TEAM.filter(t => t.role === 'ops');
  return `<div class="hello"><div><h2>Welcome back, ${esc(ME.name.split(' ')[0])} 👋</h2><div class="muted">Whole-company view · sales + operations</div></div>${periodSeg()}</div>
  <div class="stats">
    ${stat('Total leads', L.length, `${paidLeads} from paid ads`, "filterGo({})", 'hero')}
    ${stat('Closed won', won.length, L.length ? Math.round(won.length / L.length * 100) + '% conversion' : '', "filterGo({stage:'Closed Won'})")}
    ${stat('Payments received', aed(rev), paid.length + ' payments', "filterGo({stage:'Payment Received'})")}
    ${stat('Ad spend · CPL', aed(spend), 'CPL ' + aed(paidLeads ? spend / paidLeads : 0), "go('campaigns')")}
    ${stat('Payments to confirm', S.leads.filter(l => l.payment && l.payment.status === 'pending').length, 'Accounts approval', "filterGo({pay:true})", S.leads.some(l => l.payment && l.payment.status === 'pending') ? 'warn' : '')}
    ${stat('Duplicates caught', dups, 'auto-tagged', "filterGo({dup:true})", dups ? 'warn' : '')}
    ${stat('Follow-ups due', fuDue, 'overdue + next 12h', "go('followups')", fuDue ? 'warn' : '')}
    ${stat('Pipeline value', aed(pipe), 'qualified → payment link', "filterGo({stage:'Proposal Sent'})")}
    ${stat('Not contacted', notC, 'untouched > 2h', "filterGo({stage:'New'})", notC ? 'warn' : '')}
  </div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h2>Sales funnel</h2><span class="muted small">${L.length} leads</span></div><div class="card-b">${funnel(L)}</div></div>
    <div class="card"><div class="card-h"><h2>Leads by source</h2></div><div class="card-b">${bars(countBy(L, l => l.source))}</div></div>
  </div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h2>Top campaigns</h2><a class="btn btn-sm" onclick="go('campaigns')">Full UTM report →</a></div><div class="card-b">${camps.length ? bars(camps.map(([c, n]) => [c, n, n + ' · ' + L.filter(l => l.attr.campaign === c && l.stage === 'Closed Won').length + 'W']), 'navy') : '<div class="empty">No campaign leads in this period</div>'}</div></div>
    <div class="card"><div class="card-h"><h2>Team performance</h2></div><div class="card-b tbl-wrap"><table class="tbl"><thead><tr><th>Member</th><th class="num">Leads</th><th class="num">Contacted</th><th class="num">Won</th><th class="num">Revenue</th></tr></thead><tbody>
      ${sales.map(t => { const m = L.filter(l => l.owner === t.id); const c = m.filter(l => l.stage !== 'New').length; const w = m.filter(l => l.stage === 'Closed Won'); return `<tr><td><div style="display:flex;gap:8px;align-items:center">${av(t.id, 24)}<div><b>${esc(t.name)}</b><span class="sub">Sales</span></div></div></td><td class="num">${m.length}</td><td class="num">${m.length ? Math.round(c / m.length * 100) : 0}%</td><td class="num">${w.length}</td><td class="num">${aed(w.reduce((s, l) => s + (l.payment ? l.payment.amount : 0), 0))}</td></tr>`; }).join('')}
      ${ops.map(t => { const m = S.cases.filter(c => c.owner === t.id); return `<tr><td><div style="display:flex;gap:8px;align-items:center">${av(t.id, 24)}<div><b>${esc(t.name)}</b><span class="sub">Operations</span></div></div></td><td class="num" colspan="2">${m.filter(c => c.stage !== 'Setup Completed').length} active cases</td><td class="num" colspan="2">${m.filter(c => c.stage === 'Setup Completed').length} completed</td></tr>`; }).join('')}
    </tbody></table></div></div>
  </div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h2>Latest leads</h2><a class="btn btn-sm" onclick="filterGo({})">View all</a></div><div class="card-b"><ul class="list-plain">${[...S.leads].sort((a, b) => b.createdAt - a.createdAt).slice(0, 7).map(l => leadLi(l, `<span class="small muted">${ago(l.createdAt)}</span><br>${pill(l.stage)}`)).join('')}</ul></div></div>
    <div class="card"><div class="card-h"><h2>Operations snapshot</h2><a class="btn btn-sm" onclick="go('operations')">Board →</a></div><div class="card-b">${bars(OPS_STAGES.map(s => [s, S.cases.filter(c => c.stage === s).length]), 'navy')}</div></div>
  </div>`;
}

function vSalesDash() {
  const L = visibleLeads();
  const now = Date.now(), eod = new Date().setHours(23, 59, 59);
  const open = L.filter(l => OPEN_STAGES.includes(l.stage));
  const overdue = open.filter(l => l.followUp && l.followUp < now).sort((a, b) => a.followUp - b.followUp);
  const today = open.filter(l => l.followUp && l.followUp >= now && l.followUp <= eod).sort((a, b) => a.followUp - b.followUp);
  const fresh = L.filter(l => l.stage === 'New').sort((a, b) => b.createdAt - a.createdAt);
  const hot = open.filter(l => l.temp === 'Hot').length;
  const pipe = L.filter(l => ['Qualified', 'Proposal Sent', 'Payment Link Sent'].includes(l.stage)).reduce((s, l) => s + l.value, 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const wonM = L.filter(l => l.stage === 'Closed Won' && l.payment && l.payment.date >= monthStart);
  const target = 60000; const got = wonM.reduce((s, l) => s + l.payment.amount, 0);
  const hr = new Date().getHours();
  return `<div class="hello"><div><h2>Good ${hr < 12 ? 'morning' : hr < 17 ? 'afternoon' : 'evening'}, ${esc(ME.name.split(' ')[0])} ☀️</h2><div class="muted">Your leads only · clear Overdue first, then Today, then New</div></div></div>
  <div class="stats">
    ${stat('New to contact', fresh.length, 'contact same day', "filterGo({stage:'New'})", 'hero')}
    ${stat('Overdue follow-ups', overdue.length, '', "go('followups')", overdue.length ? 'warn' : '')}
    ${stat('Due today', today.length, '', "go('followups')")}
    ${stat('Hot leads', hot, '', "filterGo({temp:'Hot'})")}
    ${stat('My pipeline', aed(pipe), 'qualified → payment link', "filterGo({stage:'Proposal Sent'})")}
    ${stat('Won this month', aed(got), `target ${aed(target)} · ${Math.round(got / target * 100)}%`, "filterGo({stage:'Closed Won'})")}
  </div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h2>⏰ Today's to-do</h2><a class="btn btn-sm" onclick="go('followups')">All follow-ups</a></div><div class="card-b">
      ${overdue.length + today.length ? `<ul class="list-plain">${[...overdue, ...today].slice(0, 8).map(l => leadLi(l, fu(l.followUp))).join('')}</ul>` : '<div class="empty">🎉 Nothing due. Contact your new leads!</div>'}
    </div></div>
    <div class="card"><div class="card-h"><h2>🆕 New leads (call within 15 min)</h2></div><div class="card-b">
      ${fresh.length ? `<ul class="list-plain">${fresh.slice(0, 8).map(l => leadLi(l, `<span class="small ${now - l.createdAt > 2 * H ? '' : 'muted'}" style="${now - l.createdAt > 2 * H ? 'color:var(--red);font-weight:700' : ''}">${ago(l.createdAt)}</span>`)).join('')}</ul>` : '<div class="empty">No new leads</div>'}
    </div></div>
  </div>
  <div class="grid3">
    <div class="card"><div class="card-h"><h2>My funnel</h2></div><div class="card-b">${funnel(L)}</div></div>
    <div class="card"><div class="card-h"><h2>My leads by source</h2></div><div class="card-b">${bars(countBy(L, l => l.source))}</div></div>
    <div class="card"><div class="card-h"><h2>Monthly target</h2></div><div class="card-b"><div style="font-size:28px;font-weight:800">${aed(got)}</div><div class="muted small">of ${aed(target)}</div><div class="bar" style="height:14px;margin:12px 0"><i style="width:${Math.min(100, got / target * 100)}%"></i></div><div class="small muted">${wonM.length} deals closed this month · ${L.filter(l => l.dupOf).length} duplicate(s) to review</div></div></div>
  </div>`;
}

function vOpsDash() {
  const mine = S.cases.filter(c => c.owner === ME.id);
  const active = mine.filter(c => c.stage !== 'Setup Completed');
  const docsPending = active.filter(c => DOCS.some(d => !c.docs[d]));
  const visasIP = mine.filter(c => c.stage === 'Visa Processing' || c.stage === 'Establishment Card').length;
  const renew = S.cases.filter(c => c.licenceExpiry && c.licenceExpiry < Date.now() + 60 * D).sort((a, b) => a.licenceExpiry - b.licenceExpiry);
  const issued = mine.filter(c => OPS_STAGES.indexOf(c.stage) >= 4).length;
  const caseLi = c => { const l = S.leads.find(x => x.id === c.leadId) || {}; const i = OPS_STAGES.indexOf(c.stage); return `<li onclick="openCase('${c.id}')">${av(c.owner, 26)}<div><b>${esc(c.company)}</b><div class="small muted">${esc(l.name || '')} · ${esc(zoneOf(c.zone).name)}</div></div><div class="r">${pill(c.stage, i >= 8 ? 'p-closed-won' : i >= 4 ? 'p-qualified' : 'p-contacted')}</div></li>`; };
  return `<div class="hello"><div><h2>Hello, ${esc(ME.name.split(' ')[0])} 🗂️</h2><div class="muted">Operations view · your cases, documents and renewals</div></div></div>
  <div class="stats">
    ${stat('My active cases', active.length, mine.length + ' total', "opsMine=true;go('operations')", 'hero')}
    ${stat('Documents pending', docsPending.length, 'cannot pass Documents Collected', "opsMine=true;go('operations')", docsPending.length ? 'warn' : '')}
    ${stat('Licences issued', issued, 'all time', "go('customers')")}
    ${stat('Accounts complete', S.cases.filter(c => acctComplete(c) && c.stage === 'Setup Completed').length, 'licence + visas + docs', "go('accounts')")}
    ${stat('Visas in process', visasIP, '', "opsMine=true;go('operations')")}
    ${stat('Renewals ≤ 60 days', renew.length, 'licence expiry', "go('renewals')", renew.length ? 'warn' : '')}
  </div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h2>My active cases</h2><a class="btn btn-sm" onclick="opsMine=true;go('operations')">Board →</a></div><div class="card-b">${active.length ? `<ul class="list-plain">${active.slice(0, 8).map(caseLi).join('')}</ul>` : '<div class="empty">No active cases</div>'}</div></div>
    <div class="card"><div class="card-h"><h2>Cases by stage (mine)</h2></div><div class="card-b">${bars(OPS_STAGES.map(s => [s, mine.filter(c => c.stage === s).length]), 'navy')}</div></div>
  </div>
  <div class="grid2">
    <div class="card"><div class="card-h"><h2>📄 Missing documents</h2></div><div class="card-b">${docsPending.length ? `<ul class="list-plain">${docsPending.slice(0, 6).map(c => `<li onclick="openCase('${c.id}')"><div><b>${esc(c.company)}</b><div class="small muted">Missing: ${DOCS.filter(d => !c.docs[d]).join(', ')}</div></div></li>`).join('')}</ul>` : '<div class="empty">All documents complete ✅</div>'}</div></div>
    <div class="card"><div class="card-h"><h2>🔁 Upcoming renewals</h2><a class="btn btn-sm" onclick="go('renewals')">All</a></div><div class="card-b">${renew.length ? `<ul class="list-plain">${renew.slice(0, 6).map(c => `<li onclick="openCase('${c.id}')"><div><b>${esc(c.company)}</b><div class="small muted">${esc(c.licenceNo)}</div></div><div class="r">${expiryPill(c.licenceExpiry)}</div></li>`).join('')}</ul>` : '<div class="empty">No renewals in next 60 days</div>'}</div></div>
  </div>`;
}
function expiryPill(ts) { const d = Math.round((ts - Date.now()) / D); return d < 0 ? pill('Expired ' + -d + 'd ago', 'p-lost') : d <= 7 ? pill(d + ' days', 'p-lost') : d <= 30 ? pill(d + ' days', 'p-follow-up') : pill(d + ' days', 'p-new'); }

/* ---------------- leads ---------------- */
function filteredLeads() {
  const q = $('q').value.trim().toLowerCase(); const f = leadFilter; const RS = { newleads: ['New'], contacted: ['Contacted', 'Follow-up', 'Not Contacted'] }[route];
  return visibleLeads().filter(l => (!RS || RS.includes(l.stage)) && passLF(l, f)
    && (!q || [l.name, l.phone, l.email, l.id, l.attr.campaign, l.attr.adset, l.attr.ad, ...(l.tags || [])].join(' ').toLowerCase().includes(q) || normPhone(q).length > 5 && normPhone(l.phone).includes(normPhone(q))))
    .sort((a, b) => b.createdAt - a.createdAt);
}
function setF(k, v) { leadFilter[k] = v; render(); }
function vLeads() {
  const L = filteredLeads(); const all = visibleLeads();
  const camps = [...new Set(all.map(l => l.attr.campaign).filter(c => c && c !== '(none)'))];
  const sel = (k, opts, label) => `<select onchange="setF('${k}',this.value)"><option value="">${label}</option>${opts.map(o => { const [v, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}" ${leadFilter[k] === v ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`;
  return `<div class="toolbar">
    ${leadFilterBar({ stages: route === 'contacted' ? ['Contacted', 'Follow-up', 'Not Contacted'] : STAGES, noStage: route === 'newleads' })}
    <label class="btn btn-sm" style="cursor:pointer"><input type="checkbox" ${leadFilter.dup ? 'checked' : ''} onchange="setF('dup',this.checked)"> Duplicates only</label>
    <span class="count">${L.length} of ${all.length} leads</span>
    <button class="btn btn-sm" onclick="exportCSV()">⬇ Export CSV</button>${vmToggle('leads')}
  </div>
  ${vmOf('leads') === 'grid' ? `<div class="cards">${L.map(l => leadCard(l, OPEN_STAGES.includes(l.stage) && l.followUp ? '⏰ ' + fmtDate(l.followUp) : '')).join('') || '<div class="empty">No leads match</div>'}</div>` : `<div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Lead</th><th>Source · Campaign › Ad set › Ad</th><th>Stage</th><th>Temp</th>${ME.role === 'admin' ? '<th>Owner</th>' : ''}<th>Follow-up</th><th>Created</th></tr></thead><tbody>
  ${L.map(l => `<tr class="click ${l.dupOf ? 'dup' : ''}" onclick="openLead('${l.id}')">
    <td><b>${esc(l.name)}</b><span class="sub">${esc(l.phone)} · ${l.id}</span>${l.dupOf ? ' ' + pill('Duplicate of ' + l.dupOf, 'p-dup') : ''}${dupsOf(l.id).length ? ' ' + pill('Re-enquired ×' + dupsOf(l.id).length, 'p-follow-up') : ''}</td>
    <td>${pill(l.source)} <span class="small">${esc(l.attr.platform || '')}</span><span class="sub">${esc(l.attr.campaign && l.attr.campaign !== '(none)' ? l.attr.campaign : '')}</span>${l.attr.adset ? `<span class="sub">› ${esc(l.attr.adset)} › ${esc(l.attr.ad)}</span>` : ''}</td>
    <td>${pill(l.stage)}</td><td>${pill(l.temp)}</td>${ME.role === 'admin' ? `<td>${av(l.owner, 24)}</td>` : ''}<td>${OPEN_STAGES.includes(l.stage) ? fu(l.followUp) : ''}</td><td class="small muted">${ago(l.createdAt)}</td></tr>`).join('') || `<tr><td colspan="7"><div class="empty">No leads match</div></td></tr>`}
  </tbody></table></div>`}`;
}
function exportCSV() {
  const L = filteredLeads();
  const cols = ['id', 'name', 'phone', 'email', 'nationality', 'source', 'platform', 'campaign', 'adset', 'ad', 'form', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'click_id', 'landing_page', 'stage', 'temp', 'owner', 'duplicate_of', 'created'];
  const rows = L.map(l => [l.id, l.name, l.phone, l.email, l.nationality, l.source, l.attr.platform, l.attr.campaign, l.attr.adset, l.attr.ad, l.attr.form, l.attr.utm.utm_source, l.attr.utm.utm_medium, l.attr.utm.utm_campaign, l.attr.utm.utm_term, l.attr.utm.utm_content, l.attr.clickId, l.attr.landing, l.stage, l.temp, user(l.owner).name, l.dupOf || '', new Date(l.createdAt).toISOString()]);
  const csv = [cols, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'qph-leads.csv'; a.click();
  toast('Exported ' + L.length + ' leads with UTM columns');
}

/* ---------------- duplicates ---------------- */
function vDuplicates() {
  const dups = visibleLeads().filter(l => l.dupOf);
  const rule = `<div class="card" style="margin-bottom:16px"><div class="card-b" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div style="font-size:28px">🧬</div><div style="flex:1;min-width:240px"><b>How duplicate check works</b><div class="small muted">Every incoming lead (Meta, Google, Website, WhatsApp, manual, CSV) is matched on <b>phone (last 9 digits — so +971, 00971 and 05… all match)</b> and <b>email (case-insensitive)</b>. A match is tagged <span class="pill p-dup">Duplicate</span>, linked to the original, assigned to the <b>same salesperson</b>, and the original gets a "Re-enquired" note with the new campaign. Ad spend is not double-counted.</div></div></div></div>`;
  return rule + (dups.length ? `<div class="card tbl-wrap"><table class="tbl"><thead><tr><th>New enquiry (duplicate)</th><th>Original lead</th><th>Matched on</th><th>Owner</th><th></th></tr></thead><tbody>
  ${dups.map(d => { const o = S.leads.find(x => x.id === d.dupOf) || {}; const on = normPhone(o.phone) === normPhone(d.phone) ? 'Phone' : 'Email'; return `<tr>
    <td><b class="click" style="cursor:pointer" onclick="openLead('${d.id}')">${esc(d.name)} · ${d.id}</b><span class="sub">${esc(d.phone)} · ${ago(d.createdAt)}</span><span class="sub">${pill(d.source)} ${esc(d.attr.campaign || '')}${d.attr.adset ? ' › ' + esc(d.attr.adset) : ''}</span></td>
    <td><b style="cursor:pointer" onclick="openLead('${o.id}')">${esc(o.name || '')} · ${o.id || ''}</b><span class="sub">${esc(o.phone || '')} · ${pill(o.stage || '')}</span><span class="sub">${pill(o.source || '')} ${esc((o.attr || {}).campaign || '')}</span></td>
    <td>${pill(on, 'p-dup')}</td><td>${av(d.owner, 24)}</td>
    <td style="white-space:nowrap"><button class="btn btn-sm btn-primary" onclick="mergeDup('${d.id}')">Merge into original</button> <button class="btn btn-sm" onclick="notDup('${d.id}')">Not a duplicate</button></td></tr>`; }).join('')}
  </tbody></table></div>` : '<div class="card"><div class="empty">No duplicates right now 🎉 — try ⚡ Simulate lead → "Make it a duplicate"</div></div>');
}
function mergeDup(id) {
  const d = S.leads.find(l => l.id === id); const o = S.leads.find(l => l.id === d.dupOf); if (!o) return;
  o.notes.push(...d.notes); o.activity.push(...d.activity);
  o.touches = (o.touches || []).concat([{ at: d.createdAt, source: d.source, attr: d.attr }]);
  log(o, `Merged duplicate ${d.id} (${d.source}${d.attr.campaign ? ' · ' + d.attr.campaign : ''}) into this lead`);
  if (S.chats[d.id]) { S.chats[o.id] = (S.chats[o.id] || []).concat(S.chats[d.id]).sort((a, b) => a.at - b.at); delete S.chats[d.id]; }
  S.leads = S.leads.filter(l => l.id !== id); save();
  if (drawer && drawer.id === id) drawer.id = o.id;
  render(); toast('✅ Merged into ' + o.id + ' — campaign touch kept in history');
}
function notDup(id) { const d = S.leads.find(l => l.id === id); log(d, `Marked NOT a duplicate of ${d.dupOf}`); d.dupOf = null; d.tags = d.tags.filter(t => t !== 'Duplicate'); save(); render(); toast('Duplicate tag removed'); }

/* ---------------- stage qualifying criteria ---------------- */
const PIPE = ['New', 'Contacted', 'Follow-up', 'Appointment Booked', 'Qualified', 'Proposal Sent', 'Payment Link Sent', 'Payment Received', 'Closed Won'];
const has = v => v !== undefined && v !== null && String(v).trim() !== '';
const CRIT = {
  'New': () => [],
  'Contacted': l => [
    [normPhone(l.phone).length >= 8, 'Valid phone number on the lead'],
    [l.contact.wa || l.contact.call || l.contact.email, 'Tick at least one: WhatsApp sent, Called or Email sent'],
  ],
  'Not Contacted': l => [[has(l.ncReason), 'Reason (not reachable, switched off, busy…)'], [has(l.retryAt), 'Retry date & time']],
  'Follow-up': l => [...CRIT['Contacted'](l), [has(l.followUp), 'Follow-up date & time']],
  'Appointment Booked': l => [...CRIT['Contacted'](l), [has(l.appt.at), 'Appointment date & time'], [has(l.appt.place), 'Meeting place']],
  'Qualified': l => [...CRIT['Contacted'](l),
    [l.interested === 'Yes', 'Customer confirmed interested'],
    [has(l.req.type), 'Jurisdiction (Free Zone / Mainland / Offshore)'],
    [has(l.req.zone) && zoneOf(l.req.zone).type === l.req.type, l.req.type === 'Free Zone' ? 'Free zone selected' : 'Authority selected'],
    [has(l.req.activity), 'Exact business activity'],
    [has(l.req.visas), 'Number of visas'],
    [has(l.nationality), 'Nationality']],
  'Proposal Sent': l => [...CRIT['Qualified'](l), [l.proposals.some(p => p.pdf), 'Proposal PDF uploaded (or generated from calculator)']],
  'Payment Link Sent': l => [...CRIT['Proposal Sent'](l), [l.payLink && +l.payLink.amount > 0, 'Payment amount'], [l.payLink && has(l.payLink.url), 'Payment link']],
  'Payment Received': l => [...CRIT['Proposal Sent'](l),
    [l.payment && +l.payment.amount > 0, 'Amount received'], [l.payment && has(l.payment.mode), 'Payment mode'],
    [l.payment && has(l.payment.ref), 'Reference / transaction code'],
    [l.payment && l.payment.status === 'confirmed', 'Confirmed by Accounts team']],
  'Closed Won': l => [...CRIT['Payment Received'](l)],
  'Lost': l => [[has(l.reason), 'Lost reason']], 'Junk': l => [[has(l.reason), 'Junk reason']],
};
const missing = (l, s) => (CRIT[s] ? CRIT[s](l) : []).filter(c => !c[0]).map(c => c[1]);
function nextStage(l) { const i = PIPE.indexOf(l.stage); return i >= 0 && i < PIPE.length - 1 ? (l.stage === 'New' ? 'Contacted' : PIPE[i + 1]) : (l.stage === 'Not Contacted' ? 'Contacted' : null); }
function tryStage(id, s) {
  const l = S.leads.find(x => x.id === id); if (s === l.stage) return;
  const back = PIPE.indexOf(s) >= 0 && PIPE.indexOf(l.stage) > PIPE.indexOf(s);
  if (s === 'Lost' || s === 'Junk') return reasonModal(id, s);
  const m = back ? [] : missing(l, s);
  if (m.length) return modal(`<h2>🔒 Can't move to "${s}" yet</h2><div class="muted small">${esc(l.name)} · currently ${esc(l.stage)}</div><p>Fill these first:</p><ul class="crit">${CRIT[s](l).map(c => `<li class="${c[0] ? 'ok' : ''}">${c[0] ? '✅' : '⭕'} ${esc(c[1])}</li>`).join('')}</ul><div class="modal-f"><button class="btn btn-primary" onclick="closeModal()">OK, I'll fill them</button></div>`);
  moveStage(l, s, back ? 'back' : ''); save(); render(); toast('Stage → ' + s);
}
function moveStage(l, s, how) {
  const back = how === 'back';
  if (s === 'Closed Won') openCaseFor(l);
  if (s === 'Payment Received' || s === 'Closed Won' || s === 'Proposal Sent') l.followUp = s === 'Proposal Sent' ? (l.followUp || Date.now() + D) : null;
  if (!back && l.email && S.email && ((s === 'Proposal Sent' && S.email.autoProposal) || (s === 'Payment Link Sent' && S.email.autoPayment))) { const t = S.emailTpl.find(x => x.id === (s === 'Proposal Sent' ? 'proposal' : 'payment')); const att = s === 'Proposal Sent' ? (l.proposals[l.proposals.length - 1] || {}).pdf || '' : ''; l.emails.push({ at: Date.now(), to: l.email, subject: fillTpl(t.subject, l), by: 'auto', att }); log(l, `Auto email: "${fillTpl(t.subject, l)}"${att ? ' + ' + att : ''}`, 'auto'); }
  log(l, `Stage changed ${l.stage} → ${s}${back ? ' (moved back)' : how === 'auto' ? ' (auto — details complete)' : ''}`, how === 'auto' ? 'system' : undefined); l.stage = s;
}
/* Auto-advance: as soon as the details for a later stage are filled, the lead moves there by itself (never backwards, never to Closed Won / Lost / Junk). */
const AUTO_TOP = PIPE.indexOf('Payment Received');
function autoAdvance(l) {
  if (['Lost', 'Junk', 'Closed Won'].includes(l.stage)) return null;
  const cur = l.stage === 'Not Contacted' ? 0 : PIPE.indexOf(l.stage);
  for (let i = AUTO_TOP; i > cur; i--) { const s = PIPE[i]; if (!missing(l, s).length) { const from = l.stage; moveStage(l, s, 'auto'); return [from, s]; } }
  if (l.stage === 'New' && !missing(l, 'Not Contacted').length) { moveStage(l, 'Not Contacted', 'auto'); return ['New', 'Not Contacted']; }
  return null;
}
function autoToast(r) { if (r) setTimeout(() => toast(`✅ Auto-moved ${r[0]} → <b>${r[1]}</b>`), 50); }
function reasonModal(id, s) {
  const l = S.leads.find(x => x.id === id);
  modal(`<h2>Mark ${s}</h2><div class="muted small">${esc(l.name)}</div><div class="form"><div class="full"><label>Reason (required)</label><select id="rsn"><option value="">Select…</option>${LOST_REASONS.map(r => `<option>${r}</option>`).join('')}</select></div></div><div class="modal-f"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-danger" onclick="if(!$('rsn').value)return toast('Pick a reason');const l=S.leads.find(x=>x.id==='${id}');l.reason=$('rsn').value;l.followUp=null;log(l,'Stage changed '+l.stage+' → ${s} · '+l.reason);l.stage='${s}';save();closeModal();render();toast('Marked ${s}')">Mark ${s}</button></div>`);
}

/* ---------------- lead page (Digimac style) ---------------- */
function openLead(id) { drawer = { kind: 'lead', id }; $('drawerBg').classList.remove('open'); render(); window.scrollTo(0, 0); }
function openCase(id) { drawer = { kind: 'case', id }; $('drawerBg').classList.add('open'); renderDrawer(); }
function closeDrawer() { const wasLead = drawer && drawer.kind === 'lead'; drawer = null; $('drawerBg').classList.remove('open'); if (wasLead && ME) render(); }
function renderDrawer() { if (drawer && drawer.kind === 'case') $('drawer').innerHTML = caseDrawer(); }
function leadNavList() { return route === 'leads' ? filteredLeads() : visibleLeads().slice().sort((a, b) => b.createdAt - a.createdAt); }
function navLead(dir) { const L = leadNavList(); const i = L.findIndex(l => l.id === drawer.id); const n = L[i + dir]; if (n) { drawer.id = n.id; render(); window.scrollTo(0, 0); } }
function setL(id, path, val) {
  const l = S.leads.find(x => x.id === id); const keys = path.split('.'); let o = l; keys.slice(0, -1).forEach(k => { o[k] = o[k] || {}; o = o[k]; });
  const k = keys[keys.length - 1]; const old = o[k]; o[k] = val;
  if (path === 'req.type') { const z = S.zones.find(z => z.type === val); l.req.zone = val === 'Free Zone' ? '' : (z ? z.id : ''); }
  if (path === 'phone' || path === 'email') { const d = findDup(l.phone, l.email, l.id); if (d && !l.dupOf && d.id !== l.id) { l.dupOf = d.id; l.tags.push('Duplicate'); toast('⚠ Already exists on ' + d.id + ' — tagged Duplicate'); } }
  if (path.startsWith('req.') && has(l.req.zone)) l.value = estimate({ zone: l.req.zone, visas: l.req.visas, acts: 3, addons: ['medical'] }).total;
  const changed = String(old ?? '') !== String(val ?? '');
  if (changed) log(l, `${path.replace('req.', '').replace('appt.', 'appointment ').replace('contact.', '')} → ${typeof val === 'boolean' ? (val ? 'yes' : 'no') : (/At$|^followUp$|appt\.at/.test(path) && val ? fmtDate(val) : val)}`);
  if (changed) autoToast(autoAdvance(l));
  save(); render();
}
function inp(l, path, type = 'text', extra = '') { const v = path.split('.').reduce((o, k) => (o || {})[k], l); const val = type === 'datetime-local' ? (v ? toInput(v) : '') : (v ?? ''); const conv = type === 'datetime-local' ? 'this.value?new Date(this.value).getTime():null' : type === 'number' ? "this.value===''?'':+this.value" : 'this.value'; return `<input type="${type}" value="${esc(val)}" ${extra} onchange="setL('${l.id}','${path}',${conv})">`; }
function sel(l, path, opts, ph = 'Select…') { const v = path.split('.').reduce((o, k) => (o || {})[k], l) ?? ''; return `<select onchange="setL('${l.id}','${path}',this.value)"><option value="">${ph}</option>${opts.map(o => { const [k, t] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(t)}</option>`; }).join('')}</select>`; }
const req = (label, ok) => `<label>${label}${ok === false ? ' <b style="color:var(--red)">*</b>' : ok ? ' <span style="color:var(--green)">✓</span>' : ''}</label>`;

function leadPage() {
  const l = S.leads.find(x => x.id === drawer.id); if (!l) { drawer = null; return ''; }
  const L = leadNavList(); const pos = L.findIndex(x => x.id === l.id);
  const o = l.dupOf ? S.leads.find(x => x.id === l.dupOf) : null; const kids = dupsOf(l.id);
  const a = l.attr; const u = a.utm || {}; const ci = PIPE.indexOf(l.stage);
  const nx = nextStage(l); const nxCrit = nx ? CRIT[nx](l) : [];
  const isClosed = ['Lost', 'Junk'].includes(l.stage);
  const zonesOfType = S.zones.filter(z => z.type === l.req.type);
  const qmiss = c => !has(c);
  const pay = l.payment || {};
  return `<div class="lp">
  <a class="back" onclick="closeDrawer()">← Back</a>
  <div class="lp-h">
    <div class="lp-av" style="background:${user(l.owner).color}">${initials(l.name)}</div>
    <div style="flex:1;min-width:0"><h2>${esc(l.name)}</h2>
      <div class="lp-meta">📱 ${esc(l.phone)} · ✉ ${esc(l.email || '—')}</div>
      <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">${pill('● ' + l.stage, 'p-' + slug(l.stage))} ${l.temp === 'Hot' ? pill('🔥 Hot', 'p-hot') : pill(l.temp)} ${l.tags.map(t => t === 'Duplicate' ? pill(t, 'p-dup') : `<span class="tag">${esc(t)}</span>`).join('')}<button class="btn btn-sm" style="padding:1px 8px" onclick="tagModal('${l.id}')">+ tag</button></div></div>
    <div class="lp-nav"><button class="btn btn-sm" onclick="navLead(-1)" ${pos <= 0 ? 'disabled' : ''}>‹ Prev</button><span class="muted small">${pos + 1} / ${L.length}</span><button class="btn btn-sm" onclick="navLead(1)" ${pos >= L.length - 1 ? 'disabled' : ''}>Next ›</button><button class="icon-btn" onclick="closeDrawer()">✕</button></div>
  </div>
  <div class="dr-actions">
    <a class="btn btn-sm" href="tel:${esc(l.phone)}" onclick="setL('${l.id}','contact.call',true)">📞 Call</a>
    <button class="btn btn-sm" onclick="openChat('${l.id}')"><span style="color:var(--wa)">●</span> WhatsApp</button>
    <button class="btn btn-sm" onclick="composeEmail('${l.id}')">✉ Email</button>
    <button class="btn btn-sm" onclick="proposalFor('${l.id}')">▤ Create proposal</button>
    <button class="btn btn-sm" onclick="document.getElementById('sec-fu').scrollIntoView({behavior:'smooth'})">⏰ Reminder</button>
    <button class="btn btn-ai btn-sm" onclick="runAI('${l.id}')">✨ AI next step</button>
    <span style="flex:1"></span>
    ${ME.role === 'admin' ? `<select class="btn btn-sm" onchange="assign('${l.id}',this.value)">${TEAM.filter(t => t.role === 'sales').map(t => `<option value="${t.id}" ${l.owner === t.id ? 'selected' : ''}>Owner: ${t.name}</option>`).join('')}</select><button class="btn btn-sm btn-danger" onclick="delLead('${l.id}')">🗑 Delete</button>` : ''}
  </div>
  <div class="pipe">${PIPE.map((s, i) => { const side = s === 'Follow-up' || s === 'Appointment Booked'; const done = !isClosed && ci > i && (!side || !missing(l, s).length); const skipped = !isClosed && ci > i && !done; const cur = l.stage === s; const lock = !done && !cur && !skipped && missing(l, s).length > 0; return `<button class="${done ? 'done' : ''} ${cur ? 'cur' : ''} ${lock ? 'lock' : ''}" onclick="tryStage('${l.id}','${s}')" title="${lock ? 'Locked — needs: ' + esc(missing(l, s).join(', ')) : s}">${lock ? '🔒 ' : done ? '✓ ' : ''}${s}</button>`; }).join('')}</div>
  ${isClosed ? `<div class="dup-box"><b>${esc(l.stage)}</b><span>Reason: ${esc(l.reason)}</span><button class="btn btn-sm" onclick="tryStage('${l.id}','New')">Re-open as New</button></div>` : ''}

  <div class="lp-grid"><div class="lp-main">
    ${o ? `<div class="dup-box"><div style="font-size:22px">⚠️</div><div style="flex:1;min-width:200px"><b>Duplicate lead</b><div class="small">Same ${normPhone(o.phone) === normPhone(l.phone) ? 'phone' : 'email'} as <a onclick="openLead('${o.id}')" style="cursor:pointer;font-weight:700">${o.id} · ${esc(o.name)}</a> (${esc(o.stage)}, first came from ${esc(o.source)} ${ago(o.createdAt)}).</div></div><button class="btn btn-sm btn-primary" onclick="mergeDup('${l.id}')">Merge into original</button><button class="btn btn-sm" onclick="notDup('${l.id}')">Not a duplicate</button></div>` : ''}
    ${kids.length ? `<div class="dup-box" style="background:#FFF8EC;border-color:#F3D19C"><div style="font-size:22px">🔁</div><div style="flex:1"><b style="color:var(--amber)">Re-enquired ${kids.length}×</b><div class="small">${kids.map(k => `<a style="cursor:pointer" onclick="openLead('${k.id}')">${k.id}</a> via ${esc(k.source)} ${esc(k.attr.campaign || '')} (${ago(k.createdAt)})`).join('<br>')}</div></div></div>` : ''}
    ${l.ai ? `<div class="ai-box"><b>✨ AI Agent</b> <span class="small muted">· ${fmtDate(l.ai.at)}</span><div style="margin-top:6px"><b style="color:var(--navy)">Summary:</b> ${esc(l.ai.summary)}</div><div style="margin-top:4px"><b style="color:var(--navy)">Next step:</b> ${esc(l.ai.next)}</div></div>` : ''}

    <div class="card"><div class="card-h"><h2>1 · Contact status</h2><span class="small muted">Unlocks: Contacted</span></div><div class="card-b">
      <div class="cs3">
        <button class="${l.stage === 'New' ? 'on' : ''}" onclick="tryStage('${l.id}','New')">● New</button>
        <button class="${ci >= 1 ? 'on ok' : ''}" onclick="tryStage('${l.id}','Contacted')">✓ Contacted</button>
        <button class="${l.stage === 'Not Contacted' ? 'on bad' : ''}" onclick="tryStage('${l.id}','Not Contacted')">✕ Not contacted</button>
      </div>
      <div class="chk-row">${[['wa', 'WhatsApp sent'], ['call', 'Called'], ['email', 'Email sent']].map(([k, t]) => `<label class="chk ${l.contact[k] ? 'on' : ''}"><input type="checkbox" ${l.contact[k] ? 'checked' : ''} onchange="setL('${l.id}','contact.${k}',this.checked)"> ${t}</label>`).join('')}</div>
      <div class="form" style="margin-top:10px"><div>${req('If not contacted — reason')}${sel(l, 'ncReason', NOT_CONTACTED_REASONS)}</div><div>${req('Retry at')}${inp(l, 'retryAt', 'datetime-local')}</div></div>
      <div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-sm btn-danger" onclick="tryStage('${l.id}','Junk')">🗑 Mark junk</button><button class="btn btn-sm btn-danger" onclick="tryStage('${l.id}','Lost')">Mark lost</button></div>
    </div></div>

    <div class="card"><div class="card-h"><h2>2 · Lead details & qualification</h2><span class="small muted">* required to unlock Qualified</span></div><div class="card-b"><div class="form" style="margin:0;grid-template-columns:repeat(3,1fr)">
      <div>${req('Full name')}${inp(l, 'name')}</div><div>${req('Phone', normPhone(l.phone).length >= 8 || false)}${inp(l, 'phone', 'tel')}</div><div>${req('Email')}${inp(l, 'email', 'email')}</div>
      <div>${req('Source')}<input value="${esc(l.source + (a.platform ? ' – ' + a.platform : ''))}" disabled></div><div>${req('Service / business type')}${sel(l, 'service', SERVICES)}</div><div>${req('Customer interested?', l.interested === 'Yes' || false)}${sel(l, 'interested', ['Yes', 'Not sure', 'No'])}</div>
      <div>${req('Number of visas', !qmiss(l.req.visas) || false)}${inp(l, 'req.visas', 'number', 'min="0" max="10"')}</div>
      <div>${req('Jurisdiction', !qmiss(l.req.type) || false)}${sel(l, 'req.type', ['Free Zone', 'Mainland', 'Offshore'])}</div>
      <div>${req(l.req.type === 'Free Zone' ? 'Free zone' : 'Authority', (has(l.req.zone) && zoneOf(l.req.zone).type === l.req.type) || false)}${sel(l, 'req.zone', zonesOfType.map(z => [z.id, z.name]))}</div>
      <div>${req('Nationality', !qmiss(l.nationality) || false)}${sel(l, 'nationality', NATIONALITIES)}</div>
      <div>${req('Exact business activity', !qmiss(l.req.activity) || false)}<input list="actList" value="${esc(l.req.activity || '')}" placeholder="e.g. General Trading" onchange="setL('${l.id}','req.activity',this.value)"><datalist id="actList">${ACTIVITIES.map(x => `<option>${x}</option>`).join('')}</datalist></div>
      <div>${req('When to start')}${sel(l, 'start', ['Immediately', 'Within 1 month', '1–3 months', 'Just exploring'])}</div>
      <div>${req('Budget (AED)')}${inp(l, 'budget', 'number')}</div><div>${req('Hot / Warm / Cold')}${sel(l, 'temp', ['Hot', 'Warm', 'Cold'], '—')}</div><div>${req('Estimated deal value')}<input value="${aed(l.value)}" disabled></div>
    </div></div></div>

    <div class="card" id="sec-fu"><div class="card-h"><h2>3 · Follow-up & appointment</h2><span class="small muted">Unlocks: Follow-up · Appointment Booked</span></div><div class="card-b"><div class="form" style="margin:0;grid-template-columns:repeat(3,1fr)">
      <div>${req('Follow-up date & time', has(l.followUp) || undefined)}${inp(l, 'followUp', 'datetime-local')}</div>
      <div>${req('Appointment date & time')}${inp(l, 'appt.at', 'datetime-local')}</div>
      <div>${req('Meeting type / place')}${sel(l, 'appt.place', MEET_TYPES.map(t => t[2]))}</div>
      <div class="full" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><button class="btn btn-sm btn-navy" onclick="apptModal('${l.id}')">📅 Schedule meeting & send invite</button>${l.appt && l.appt.link ? `<span class="small">Link: <a href="${esc(l.appt.link)}" target="_blank">${esc(l.appt.link)}</a></span>` : '<span class="small muted">Creates a Zoom / Google Meet link and sends it by email + WhatsApp</span>'}</div>
    </div></div></div>

    <div class="card"><div class="card-h"><h2>4 · Proposal</h2><span class="small muted">Unlocks: Proposal Sent — PDF required</span></div><div class="card-b">
      ${l.proposals.map((p, i) => `<div class="qrow"><span>📄 <b>${esc(p.pdf || 'No PDF')}</b> · ${esc(zoneOf(p.zone).name)} · ${p.visas} visa(s) · ${fmtDate(p.at, false)} ${p.uploaded ? '<span class="tag">uploaded</span>' : '<span class="tag">generated</span>'}</span><span style="display:flex;gap:6px;align-items:center"><b>${p.total ? aed(p.total) : ''}</b><button class="btn btn-sm" onclick="viewProposal('${l.id}',${i})">View</button></span></div>`).join('') || '<div class="muted small">No proposal yet.</div>'}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center"><button class="btn btn-sm btn-primary" onclick="proposalFor('${l.id}')">🧮 Create with calculator</button><label class="btn btn-sm">⬆ Upload proposal PDF<input type="file" accept="application/pdf" hidden onchange="uploadPdf('${l.id}',this)"></label><span class="small muted">or send from WhatsApp after it's attached</span></div>
    </div></div>

    <div class="card"><div class="card-h"><h2>5 · Payment</h2><span class="small muted">Payment Received needs Accounts confirmation</span></div><div class="card-b">
      <div class="small" style="font-weight:700;margin-bottom:6px">Payment link</div>
      <div class="form" style="margin:0"><div>${req('Amount (AED)', (l.payLink && +l.payLink.amount > 0) || undefined)}${inp(l, 'payLink.amount', 'number')}</div><div>${req('Payment link', (l.payLink && has(l.payLink.url)) || undefined)}<div style="display:flex;gap:6px">${inp(l, 'payLink.url', 'url', 'placeholder="https://pay…"')}<button class="btn btn-sm" onclick="setL('${l.id}','payLink.url','https://pay.quickpathhorizon.com/${l.id}')">Generate</button></div></div></div>
      <div class="small" style="font-weight:700;margin:16px 0 6px">Payment received</div>
      ${pay.status === 'confirmed' ? `<div class="ai-box" style="background:var(--green-soft);border-color:#A8DDBC">✅ <b style="color:var(--green)">Confirmed by Accounts</b> · ${aed(pay.amount)} · ${esc(pay.mode)} · Ref <b class="mono">${esc(pay.ref)}</b> · ${fmtDate(pay.date, false)}<div class="small muted">Confirmed by ${esc(user(pay.confirmedBy).name)} · ${fmtDate(pay.confirmedAt)}</div></div>`
      : `<div class="form" style="margin:0;grid-template-columns:repeat(4,1fr)"><div>${req('Amount received')}${inp(l, 'payment.amount', 'number', pay.status === 'pending' ? 'disabled' : '')}</div><div>${req('Mode')}${pay.status === 'pending' ? `<input value="${esc(pay.mode || '')}" disabled>` : sel(l, 'payment.mode', ['Bank transfer', 'Card (payment link)', 'Cash', 'Cheque'])}</div><div>${req('Reference / txn code', has(pay.ref) || false)}${inp(l, 'payment.ref', 'text', (pay.status === 'pending' ? 'disabled ' : '') + 'placeholder="e.g. FT2611…"')}</div><div>${req('Date')}${inp(l, 'payment.date', 'datetime-local', pay.status === 'pending' ? 'disabled' : '')}</div></div>
      ${pay.status === 'pending' ? `<div class="dup-box" style="margin-top:10px;background:#FFF8EC;border-color:#F3D19C"><b style="color:var(--amber)">⏳ Awaiting Accounts confirmation</b><span class="small">Sent by ${esc(user(pay.by).name)} ${ago(pay.sentAt)}</span>${ME.role === 'admin' ? `<button class="btn btn-sm btn-primary" onclick="confirmPay('${l.id}')">✅ Confirm (Accounts)</button><button class="btn btn-sm btn-danger" onclick="rejectPay('${l.id}')">Reject</button>` : '<span class="small muted">Only Accounts (Admin) can confirm</span>'}</div>`
      : `${pay.status === 'rejected' ? `<div class="small" style="color:var(--red);margin-top:8px">✕ Rejected by Accounts: ${esc(pay.rejectNote || '')}</div>` : ''}<button class="btn btn-sm btn-navy" style="margin-top:10px" onclick="sendPay('${l.id}')">Send to Accounts for confirmation</button>`}`}
    </div></div>

    <div class="card notes"><div class="card-h"><h2>📝 Notes</h2><span class="small muted">Type in Hindi / Hinglish → Polish to English</span></div><div class="card-b">
      <textarea id="noteIn" placeholder="e.g. client ne bola 2 visa chahiye, kal call karna hai…"></textarea>
      <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><button class="btn btn-ai btn-sm" onclick="$('noteIn').value=polish($('noteIn').value);toast('✨ Polished by AI Agent')">✨ Polish to English</button><button class="btn btn-primary btn-sm" onclick="addNote('${l.id}')">Save note</button></div>
      ${[...l.notes].reverse().map((n, i) => `<div class="note"><div class="meta">${esc(user(n.by).name)} · ${fmtDate(n.at)} ${n.polished ? '<span class="ai">✨ AI polished</span>' : ''}</div><div>${esc(n.text)}</div>${!n.polished ? `<button class="btn btn-sm" style="margin-top:4px;padding:2px 8px" onclick="polishNote('${l.id}',${l.notes.length - 1 - i})">✨ Polish</button>` : ''}</div>`).join('') || '<div class="muted small" style="margin-top:10px">No notes yet</div>'}
    </div></div>
    <div class="card"><div class="card-h"><h2>🕑 Timeline</h2></div><div class="card-b"><ul class="tl">${[...l.activity].reverse().map(x => `<li><span class="t">${fmtDate(x.at)}</span><span><b>${esc(user(x.by).name)}</b> · ${esc(x.text)}</span></li>`).join('')}</ul></div></div>
  </div>

  <div class="lp-side">
    <div class="card"><div class="card-b"><h3 style="font-size:15px;margin-bottom:10px">Lead overview</h3>
      <div class="ov"><span class="muted small">Current stage</span><div style="display:flex;justify-content:space-between;align-items:center"><b>${esc(l.stage)}</b>${l.temp === 'Hot' ? pill('🔥 Hot', 'p-hot') : pill(l.temp)}</div></div>
      <div class="kv1">${[['Owner', user(l.owner).name], ['Source', l.source + (a.platform ? ' – ' + a.platform : '')], ['Campaign', a.campaign || '—'], ['Ad set', a.adset || '—'], ['Ad name', a.ad || '—'], ['Created', fmtDate(l.createdAt)], ['Last update', ago(l.updatedAt || l.createdAt)]].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('')}</div>
    </div></div>
    ${nx && !isClosed ? `<div class="card"><div class="card-b"><h3 style="font-size:15px;margin-bottom:4px">Next: ${esc(nx)}</h3><div class="small muted" style="margin-bottom:8px">${nxCrit.filter(c => c[0]).length}/${nxCrit.length} criteria met</div><div class="bar" style="margin-bottom:10px"><i style="width:${nxCrit.length ? nxCrit.filter(c => c[0]).length / nxCrit.length * 100 : 100}%"></i></div><ul class="crit">${nxCrit.map(c => `<li class="${c[0] ? 'ok' : ''}">${c[0] ? '✅' : '⭕'} ${esc(c[1])}</li>`).join('')}</ul><button class="btn btn-primary btn-sm" style="width:100%;justify-content:center;margin-top:10px" ${missing(l, nx).length ? 'disabled' : ''} onclick="tryStage('${l.id}','${nx}')">Move to ${esc(nx)} →</button></div></div>` : ''}
    <div class="card"><div class="card-b"><h3 style="font-size:15px;margin-bottom:8px">Contact</h3><ul class="crit">
      <li class="${ci >= 1 ? 'ok' : ''}">${ci >= 1 ? '✓' : '○'} Contacted</li><li class="${l.contact.wa ? 'ok' : ''}">${l.contact.wa ? '✓' : '○'} WhatsApp sent</li><li class="${l.contact.call ? 'ok' : ''}">${l.contact.call ? '✓' : '○'} Called</li><li class="${l.contact.email ? 'ok' : ''}">${l.contact.email ? '✓' : '○'} Email sent</li><li class="${l.notes.length ? 'ok' : ''}">${l.notes.length ? '✓' : '○'} ${l.notes.length} note${l.notes.length === 1 ? '' : 's'}</li><li class="${(l.emails || []).length ? 'ok' : ''}">${(l.emails || []).length ? '✓' : '○'} ${(l.emails || []).length} email(s) sent${(l.emails || []).length ? ' · last: ' + esc(l.emails[l.emails.length - 1].subject) : ''}</li>
    </ul><a class="btn btn-wa btn-sm" style="width:100%;justify-content:center;margin-top:10px" onclick="openChat('${l.id}')">💬 Open WhatsApp chat</a></div></div>
    <div class="card attr"><div class="card-b"><h3 style="font-size:15px;margin-bottom:8px">📍 Source & tracking</h3><div class="kv1">${[['Platform', a.platform], ['Campaign', a.campaign], ['Ad set / group', a.adset], ['Ad name', a.ad], ['Form', a.form], ['Landing page', a.landing], ['utm_source', u.utm_source], ['utm_medium', u.utm_medium], ['utm_campaign', u.utm_campaign], ['utm_term', u.utm_term], ['utm_content', u.utm_content], ['Click ID', a.clickId]].map(([k, v]) => `<div><span>${k}</span><b class="${k.startsWith('utm') || k === 'Click ID' ? 'mono' : ''}">${esc(v || '—')}</b></div>`).join('')}</div>${(l.touches || []).length ? `<div class="small muted" style="margin-top:8px"><b>Merged touches:</b> ${l.touches.map(t => `${esc(t.source)} · ${esc(t.attr.campaign || '')}`).join(' · ')}</div>` : ''}</div></div>
  </div></div></div>`;
}

function uploadPdf(id, input) {
  const f = input.files[0]; if (!f) return; if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) return toast('Please upload a PDF file');
  const l = S.leads.find(x => x.id === id);
  const done = data => { l.proposals.push({ id: 'P' + (2100 + Math.floor(Math.random() * 900)), at: Date.now(), zone: l.req.zone || S.zones[0].id, total: l.value, visas: +l.req.visas || 0, pdf: f.name, uploaded: true, data }); log(l, `Proposal PDF uploaded: ${f.name}`); const r = autoAdvance(l); save(); render(); toast(r ? `📄 PDF attached — auto-moved to <b>${r[1]}</b>` : '📄 PDF attached — fill the qualification details to move to Proposal Sent'); };
  if (f.size < 400e3) { const r = new FileReader(); r.onload = () => done(r.result); r.readAsDataURL(f); } else done(null);
}
function viewProposal(id, i) {
  const l = S.leads.find(x => x.id === id); const p = l.proposals[i];
  if (p.data) { const w = window.open(); w.document.write(`<iframe src="${p.data}" style="border:0;width:100%;height:100%"></iframe>`); return; }
  if (p.uploaded) return toast('Demo: large PDFs are stored by name only (' + p.pdf + ')');
  const keep = C; C = Object.assign({ leadId: id, type: zoneOf(p.zone).type, zone: p.zone, acts: 3, visas: p.visas, addons: ['medical'], disc: 0 }, p.snap || {}); printQuote(); C = keep;
}
function sendPay(id) {
  const l = S.leads.find(x => x.id === id); const p = l.payment || {};
  const m = [[+p.amount > 0, 'Amount received'], [has(p.mode), 'Payment mode'], [has(p.ref), 'Reference / transaction code'], [has(p.date), 'Payment date']].filter(c => !c[0]).map(c => c[1]);
  if (m.length) return toast('Fill: ' + m.join(', '));
  Object.assign(p, { status: 'pending', by: ME.id, sentAt: Date.now() }); l.payment = p; log(l, `Payment ${aed(p.amount)} (ref ${p.ref}) sent to Accounts for confirmation`); notify('u1', `💰 Confirm payment ${aed(p.amount)} · ref ${p.ref} · ${l.name}`, l.id); save(); render(); toast('⏳ Sent to Accounts (Faisal) for confirmation');
}
function confirmPay(id) { const l = S.leads.find(x => x.id === id); Object.assign(l.payment, { status: 'confirmed', confirmedBy: ME.id, confirmedAt: Date.now() }); log(l, `✅ Payment ${aed(l.payment.amount)} ref ${l.payment.ref} confirmed by Accounts`); autoAdvance(l); l.followUp = null; notify(l.owner, `✅ Payment confirmed for ${l.name} — now a customer with Operations`, l.id); openCaseFor(l); save(); render(); toast('✅ Payment confirmed — lead moved to Payment Received & Customers'); }
function rejectPay(id) { const n = prompt('Reason for rejecting (e.g. amount not received in bank)'); if (n === null) return; const l = S.leads.find(x => x.id === id); Object.assign(l.payment, { status: 'rejected', rejectNote: n }); log(l, 'Payment rejected by Accounts: ' + n); save(); render(); }
function addNote(id) { const l = S.leads.find(x => x.id === id); const t = $('noteIn').value.trim(); if (!t) return toast('Write a note first'); const isP = Object.values(POLISHED).includes(t) || (/^[A-Z]/.test(t) && /[.!?]$/.test(t)); l.notes.push({ by: ME.id, at: Date.now(), text: t, polished: isP }); log(l, 'Note added'); save(); render(); toast('Note saved'); }
function polishNote(id, i) { const l = S.leads.find(x => x.id === id); l.notes[i].orig = l.notes[i].text; l.notes[i].text = polish(l.notes[i].text); l.notes[i].polished = true; log(l, 'Note polished to English by AI Agent', 'ai'); save(); render(); toast('✨ Note polished'); }
function runAI(id) { const l = S.leads.find(x => x.id === id); toast('✨ AI Agent reading notes & chat…'); setTimeout(() => { l.ai = Object.assign(aiNext(l), { at: Date.now() }); const nx = nextStage(l); if (nx && missing(l, nx).length) l.ai.next += ` To unlock "${nx}": ${missing(l, nx).join(', ')}.`; log(l, 'AI next step generated', 'ai'); save(); render(); }, 700); }
function assign(id, uid) { const l = S.leads.find(x => x.id === id); l.owner = uid; log(l, 'Reassigned to ' + user(uid).name); save(); render(); toast('Assigned to ' + user(uid).name); }
function delLead(id) { if (!confirm('Delete this lead permanently?')) return; S.leads = S.leads.filter(l => l.id !== id); save(); drawer = null; render(); toast('Lead deleted'); }
function tagModal(id) {
  const l = S.leads.find(x => x.id === id); const opts = ['Hot lead', 'Price asked', 'Interested', 'Family visa', 'Golden visa', 'Call back', 'VIP', 'Budget low', 'Docs ready', 'Not interested'];
  modal(`<h2>Tags · ${esc(l.name)}</h2><div class="opts" style="margin-top:12px">${opts.map(t => `<label class="opt ${l.tags.includes(t) ? 'on' : ''}"><input type="checkbox" value="${t}" ${l.tags.includes(t) ? 'checked' : ''}> ${t} ${['Interested', 'Price asked', 'Hot lead'].includes(t) ? '<em>🤖 AI</em>' : ''}</label>`).join('')}</div><p class="small muted">🤖 tags switch on the AI Agent for this chat — it reads new WhatsApp messages and updates Hot/Warm/Cold and follow-up date.</p><div class="modal-f"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveTags('${id}')">Save</button></div>`);
}
function saveTags(id) { const l = S.leads.find(x => x.id === id); const keep = l.tags.filter(t => ['Duplicate', 'Re-enquired'].includes(t)); l.tags = keep.concat([...document.querySelectorAll('#modalBody input:checked')].map(i => i.value)); log(l, 'Tags updated: ' + l.tags.join(', ')); save(); closeModal(); render(); }
function openCaseFor(l, silent) {
  if (S.cases.some(c => c.leadId === l.id)) return;
  const ops = TEAM.filter(t => t.role === 'ops'); const owner = ops[(S.rrOps++) % ops.length].id;
  const docs = {}; DOCS.forEach(d => docs[d] = false);
  const c = { id: 'C' + (3001 + S.cases.length + Math.floor(Math.random() * 100)), leadId: l.id, company: l.name.split(' ')[0] + ' ' + (l.req.activity || 'Trading').split(' ')[0] + (l.req.type === 'Mainland' ? ' LLC' : ' FZ-LLC'), stage: OPS_STAGES[0], owner, docs, zone: l.req.zone, visas: +l.req.visas || 0, startedAt: Date.now(), licenceNo: '', licenceExpiry: null, visaHolders: [], log: [{ at: Date.now(), by: 'system', text: `Case opened from ${l.id} (payment confirmed, sold by ${user(l.owner).name}) · assigned to ${user(owner).name}` }] };
  S.cases.unshift(c); if (silent) return;
  log(l, `Operations case ${c.id} opened → ${user(owner).name}`, 'system');
  notify(owner, `🏢 New customer case ${c.id}: ${c.company} (paid ${l.payment ? aed(l.payment.amount) : ''})`, 'case:' + c.id); notify('u1', `🏢 ${l.name} is now a customer → ${user(owner).name} (Operations)`, 'case:' + c.id);
  setTimeout(() => toast(`🗂️ Customer case ${c.id} created → ${user(owner).name}`), 1200);
}
function proposalFor(id) { const l = S.leads.find(x => x.id === id); C = { leadId: id, type: l.req.type || 'Free Zone', zone: has(l.req.zone) ? l.req.zone : S.zones.find(z => z.type === (l.req.type || 'Free Zone')).id, acts: 3, visas: +l.req.visas || 1, addons: ['medical'], disc: 0 }; drawer = null; go('calculator'); }

/* ---------------- add / simulate ---------------- */
function addLeadModal() {
  modal(`<h2>+ Add lead</h2><div class="muted small">Walk-in, call or referral. Duplicate check runs as you type.</div><div class="form">
    <div><label>Full name *</label><input id="nName"></div><div><label>Phone *</label><input id="nPhone" placeholder="+971 5x xxx xxxx" oninput="liveDup()"></div>
    <div><label>Email</label><input id="nEmail" oninput="liveDup()"></div><div><label>Nationality</label><select id="nNat">${NATIONALITIES.map(n => `<option>${n}</option>`).join('')}</select></div>
    <div><label>Source</label><select id="nSrc">${SOURCES.map(n => `<option ${n === 'Walk-in' ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div><label>Service</label><select id="nSvc">${SERVICES.map(n => `<option>${n}</option>`).join('')}</select></div>
    <div><label>Campaign (optional)</label><input id="nCamp" placeholder="e.g. Referral – Ahmed"></div><div><label>Visas</label><input type="number" id="nVisas" value="1"></div>
    <div class="full"><label>Note</label><textarea id="nNote" placeholder="Hinglish is fine — polish later"></textarea></div><div class="full" id="dupWarn"></div>
  </div><div class="modal-f"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNew()">Create lead</button></div>`);
}
function liveDup() { const d = findDup($('nPhone').value, $('nEmail').value); $('dupWarn').innerHTML = d ? `<div class="dup-box"><b>⚠ Already in CRM:</b> <span>${d.id} · ${esc(d.name)} · ${esc(d.stage)} · owner ${esc(user(d.owner).name)}</span><span class="small muted">Saving will tag the new lead as Duplicate.</span></div>` : ''; }
function saveNew() {
  const v = k => $(k).value.trim(); if (!v('nName') || !v('nPhone')) return toast('Name and phone are required');
  const { l, dup } = ingest({ name: v('nName'), phone: v('nPhone'), email: v('nEmail'), nationality: v('nNat'), source: v('nSrc'), service: v('nSvc'), visas: v('nVisas'), note: v('nNote'), owner: ME.role === 'sales' ? ME.id : '', attr: { platform: v('nSrc'), campaign: v('nCamp'), adset: '', ad: '', form: 'Manual entry', utm: {}, clickId: '', landing: '' } });
  closeModal(); render(); openLead(l.id); toast(dup ? '⚠ Saved & tagged DUPLICATE of ' + dup.id : '✅ Lead created → ' + user(l.owner).name);
}
function simModal() {
  modal(`<h2>⚡ Simulate incoming lead</h2><div class="muted small">Shows how a lead lands from Meta Lead Ads, Google Ads or the website with campaign, ad set, ad and UTM parameters — then gets duplicate-checked and auto-assigned.</div>
  <div class="form">
    <div><label>Source</label><select id="sSrc" onchange="simFill()"><option>Meta</option><option>Google</option><option>Website</option><option>WhatsApp</option></select></div>
    <div><label>Campaign</label><select id="sCamp" onchange="simFill(true)"></select></div>
    <div><label>Ad set / Ad group</label><select id="sAdset"></select></div><div><label>Ad name</label><select id="sAd"></select></div>
    <div class="full" id="sUrlWrap"><label>Landing URL with UTM (website leads parse this automatically)</label><input id="sUrl"></div>
    <div><label>Name</label><input id="sName"></div><div><label>Phone</label><input id="sPhone"></div>
    <div class="full"><label class="opt" style="display:flex"><input type="checkbox" id="sDup" onchange="simDup()"> Make it a duplicate (re-use an existing lead's phone in a different format)</label></div>
  </div><div class="modal-f"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="simGo()">Send lead to CRM</button></div>`);
  simFill();
}
function simFill(keepCamp) {
  const src = $('sSrc').value; const list = CAMPAIGNS[src] || [];
  if (!keepCamp) $('sCamp').innerHTML = list.length ? list.map((c, i) => `<option value="${i}">${esc(c.campaign)}</option>`).join('') : `<option value="-1">${src === 'WhatsApp' ? 'Click-to-WhatsApp – Freezone' : '(organic / direct)'}</option>`;
  const c = list[+$('sCamp').value];
  $('sAdset').innerHTML = c ? c.adsets.map(a => `<option>${esc(a)}</option>`).join('') : '<option value="">—</option>';
  $('sAd').innerHTML = c ? c.ads.map(a => `<option>${esc(a)}</option>`).join('') : '<option value="">—</option>';
  const s = x => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const base = 'https://quickpathhorizon.com/business-setup/';
  $('sUrl').value = src === 'Meta' ? `${base}?utm_source=instagram&utm_medium=paid_social&utm_campaign=${s(c.campaign)}&utm_term=${s(c.adsets[0])}&utm_content=${s(c.ads[0])}&fbclid=IwAR${Math.random().toString(36).slice(2, 12)}`
    : src === 'Google' ? `${base}?utm_source=google&utm_medium=cpc&utm_campaign=${s(c.campaign)}&utm_term=${encodeURIComponent(c.terms[0])}&utm_content=${s(c.ads[0])}&gclid=Cj0KCQ${Math.random().toString(36).slice(2, 12)}`
      : src === 'Website' ? `https://quickpathhorizon.com/contact-us/?utm_source=chatgpt.com&utm_medium=referral` : '';
  $('sUrlWrap').style.display = src === 'WhatsApp' ? 'none' : '';
  if (!$('sName').value) { $('sName').value = FIRST[Math.floor(Math.random() * FIRST.length)] + ' ' + LAST[Math.floor(Math.random() * LAST.length)]; $('sPhone').value = '+9715' + Math.floor(10000000 + Math.random() * 89999999); }
}
function simDup() { if ($('sDup').checked) { const o = S.leads.filter(l => !l.dupOf)[Math.floor(Math.random() * 15)]; $('sName').value = o.name; $('sPhone').value = '0' + normPhone(o.phone).replace(/^(\d{2})(\d{3})/, '$1 $2 '); } }
function simGo() {
  const src = $('sSrc').value; const c = (CAMPAIGNS[src] || [])[+$('sCamp').value];
  let utm = {}, clickId = '', landing = '';
  try { const u = new URL($('sUrl').value); u.searchParams.forEach((v, k) => { if (k.startsWith('utm_')) utm[k] = v; if (k === 'gclid' || k === 'fbclid') clickId = k + '=' + v; }); landing = u.origin + u.pathname; } catch (e) { }
  const attr = { platform: src === 'Meta' ? (utm.utm_source === 'facebook' ? 'Facebook' : 'Instagram') : src === 'Google' ? 'Google Search' : src === 'WhatsApp' ? 'WhatsApp +971 58 146 4678' : 'Organic / Referral',
    campaign: c ? c.campaign : (src === 'WhatsApp' ? 'Click-to-WhatsApp – Freezone' : '(none)'), adset: $('sAdset').value, ad: $('sAd').value, form: src === 'Meta' ? (c.form || 'Instant form') : src === 'Google' ? 'Website enquiry form' : src === 'Website' ? 'Contact Us form' : '', utm, clickId, landing: src === 'Meta' && c.form !== 'Website (Pixel)' ? '(Instant form)' : landing };
  const first = $('sName').value.split(' ')[0].toLowerCase();
  const { l, dup } = ingest({ name: $('sName').value, phone: $('sPhone').value, email: dup0($('sPhone').value) || (first + Math.floor(Math.random() * 99) + '@gmail.com'), source: src, attr, visas: 1 + Math.floor(Math.random() * 3), activity: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)], sendWelcome: true, firstMsg: src === 'WhatsApp' ? 'Hi, I saw your ad. What is the cost for freezone licence?' : `New ${src} lead — form submitted` });
  closeModal(); render(); openLead(l.id);
  toast(dup ? `⚠ ${src} lead flagged DUPLICATE of ${dup.id} → ${user(l.owner).name}` : `✅ New ${src} lead → ${user(l.owner).name} · WhatsApp welcome sent`);
}
function dup0(phone) { const d = findDup(phone, ''); return d ? d.email : ''; }

/* ---------------- WhatsApp ---------------- */
function openChat(id) { waOpen = id; closeDrawer(); if (!S.chats[id]) S.chats[id] = []; go('whatsapp'); }
function vWhatsApp() {
  const L = visibleLeads().filter(l => S.chats[l.id] && (!waTagF || l.tags.includes(waTagF))).sort((a, b) => (last(b).at || 0) - (last(a).at || 0));
  if (!waOpen || !L.find(l => l.id === waOpen)) waOpen = L[0] && L[0].id;
  const l = S.leads.find(x => x.id === waOpen);
  if (l) S.read[l.id] = Date.now();
  const msgs = l ? S.chats[l.id] : [];
  const lastIn = [...msgs].reverse().find(m => m.from === 'in');
  const left = lastIn ? 24 * H - (Date.now() - lastIn.at) : -1;
  setTimeout(save, 0);
  return `<div class="toolbar"><span class="small muted">Filter chats by tag:</span><button class="wtag ${!waTagF ? 'on' : ''}" onclick="waTagF='';render()">All</button>${WA_TAGS.map(([t, c]) => `<button class="wtag ${waTagF === t ? 'on' : ''}" onclick="waTagF='${t}';render()"><i style="background:${c}"></i>${t} · ${visibleLeads().filter(x => S.chats[x.id] && x.tags.includes(t)).length}</button>`).join('')}</div><div class="card wa"><div class="wa-list">${L.map(x => { const m = last(x); const un = x.id === waOpen ? 0 : unread(x); return `<div class="wa-item ${x.id === waOpen ? 'on' : ''}" onclick="waOpen='${x.id}';render()">${av(x.owner, 34)}<div style="min-width:0"><b>${esc(x.name)}</b><div class="small muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px">${m.from === 'out' ? '✓✓ ' : ''}${esc(m.text || '')}</div><div>${x.tags.filter(t => WA_TAGS.some(w => w[0] === t)).map(t => `<span class="wtag-mini"><i style="background:${WA_TAGS.find(w => w[0] === t)[1]}"></i>${t}</span>`).join('')}</div></div><div class="r">${m.at ? ago(m.at) : ''}<br>${un ? `<span class="un">${un}</span>` : ''}</div></div>`; }).join('') || '<div class="empty">No chats</div>'}</div>
  <div class="wa-chat">${l ? `<div class="wa-ch">${av(l.owner, 34)}<div><b>${esc(l.name)}</b><div class="small muted">${esc(l.phone)} · ${pill(l.stage)} ${l.dupOf ? pill('Duplicate', 'p-dup') : ''}</div></div><div style="margin-left:auto;display:flex;gap:6px"><button class="btn btn-sm" onclick="openLead('${l.id}')">Open lead</button><a class="btn btn-sm btn-wa" target="_blank" href="${waLink(l.phone, '')}">Open in WhatsApp ↗</a></div></div>
    <div class="wa-tags"><span class="small muted">Tags:</span>${waTagChips(l)}</div>
    ${left > 0 ? `<div class="win24" style="background:var(--green-soft);color:var(--green)">🟢 24-hour window open · ${Math.floor(left / H)}h ${Math.floor(left % H / 60e3)}m left for free replies</div>` : `<div class="win24">⏱ 24-hour window closed — only Meta-approved templates can be sent</div>`}
    <div class="wa-msgs">${msgs.map(m => `<div class="msg ${m.from}">${esc(m.text)}<span class="t">${m.from === 'out' ? esc(user(m.by).name) + ' · ' : ''}${fmtDate(m.at)} ${m.from === 'out' ? '<span style="color:#34B7F1">✓✓</span>' : ''}</span></div>`).join('') || '<div class="empty">No messages yet — send a template to start</div>'}</div>
    <div class="wa-in"><select class="btn btn-sm" onchange="if(this.value){$('waIn').value=WA_TEMPLATES[this.value].text.replace('{name}','${esc(l.name.split(' ')[0])}');this.value=''}"><option value="">📋 Templates</option>${WA_TEMPLATES.map((t, i) => `<option value="${i}">${t.name}</option>`).join('')}</select>
    <input id="waIn" placeholder="Type a message… (Hinglish ok → Polish)" onkeydown="if(event.key==='Enter')waSend('${l.id}')">
    <button class="btn btn-sm btn-ai" onclick="$('waIn').value=aiReply(S.leads.find(x=>x.id==='${l.id}'));toast('✨ AI drafted a reply')">✨ AI reply</button>
    <button class="btn btn-sm" onclick="$('waIn').value=polish($('waIn').value)">Polish</button>
    <button class="btn btn-sm btn-wa" onclick="waSend('${l.id}')">Send ➤</button></div>` : '<div class="empty">Select a chat</div>'}</div></div>
  <p class="small muted" style="margin-top:10px">Demo mode: messages are stored in the CRM only. Live version connects the WhatsApp Business Cloud API (Meta) — auto-welcome for new numbers, templates outside 24h, and the AI Agent on 🤖-tagged chats.</p>`;
}
function last(l) { const c = S.chats[l.id] || []; return c[c.length - 1] || {}; }
function waSend(id) {
  const t = $('waIn').value.trim(); if (!t) return; const l = S.leads.find(x => x.id === id);
  S.chats[id].push({ from: 'out', text: t, at: Date.now(), by: ME.id });
  log(l, 'WhatsApp message sent'); if (!l.contact.wa) { l.contact.wa = true; autoToast(autoAdvance(l)); } save(); render();
  setTimeout(() => { const replies = ['Thank you! Please share the details.', 'Ok, can we talk tomorrow at 11?', 'Is the visa cost included in this?', 'Great, I will send my passport copy.']; S.chats[id].push({ from: 'in', text: replies[Math.floor(Math.random() * replies.length)], at: Date.now() }); save(); if (route === 'whatsapp') render(); }, 2500);
}

/* ---------------- calculator ---------------- */
function vCalc() {
  const e = estimate(C); const z = e.z; const lead = S.leads.find(l => l.id === C.leadId);
  const zones = S.zones.filter(x => x.type === C.type);
  const leads = visibleLeads().filter(l => !['Lost', 'Junk'].includes(l.stage));
  const cmp = zones.map(x => ({ x, t: estimate(Object.assign({}, C, { zone: x.id })).total })).sort((a, b) => a.t - b.t);
  return `<div class="calc"><div class="card"><div class="card-h"><h2>🧮 Business setup cost calculator</h2><span class="small muted">Indicative prices · edit in Settings</span></div><div class="card-b">
    <div class="form" style="margin-top:0">
      <div class="full"><label>Link to lead (fills proposal)</label><select onchange="C.leadId=this.value;const l=S.leads.find(x=>x.id===this.value);if(l){C.type=l.req.type;C.zone=l.req.zone;C.visas=l.req.visas}render()"><option value="">— No lead (quick quote) —</option>${leads.map(l => `<option value="${l.id}" ${l.id === C.leadId ? 'selected' : ''}>${esc(l.name)} · ${l.id} · ${esc(l.stage)}</option>`).join('')}</select></div>
      <div class="full"><label>Jurisdiction</label><div class="seg">${['Free Zone', 'Mainland', 'Offshore'].map(t => `<button class="${C.type === t ? 'on' : ''}" onclick="C.type='${t}';C.zone=S.zones.find(z=>z.type==='${t}').id;render()">${t}</button>`).join('')}</div></div>
      <div class="full"><label>${C.type === 'Free Zone' ? 'Free zone' : 'Authority'}</label><div class="zone-cards">${zones.map(x => `<button class="zc ${x.id === C.zone ? 'on' : ''}" onclick="C.zone='${x.id}';render()"><b>${esc(x.name)}</b><span>${esc(x.emirate)} · from ${aed(x.licence)}</span></button>`).join('')}</div></div>
      <div><label>Business activities</label><input type="number" min="1" max="10" value="${C.acts}" onchange="C.acts=+this.value;render()"><span class="small muted">${z.inclActs} included</span></div>
      <div><label>Visas ${z.maxVisas ? '(max ' + z.maxVisas + ')' : '(not available)'}</label><input type="number" min="0" max="${z.maxVisas}" value="${e.visas}" ${z.maxVisas ? '' : 'disabled'} onchange="C.visas=+this.value;render()"></div>
      <div class="full"><label>Add-ons</label><div class="opts">${S.addons.map(a => `<label class="opt ${C.addons.includes(a.id) ? 'on' : ''}"><input type="checkbox" ${C.addons.includes(a.id) ? 'checked' : ''} onchange="C.addons=this.checked?[...C.addons,'${a.id}']:C.addons.filter(x=>x!=='${a.id}');render()"> ${esc(a.name)}<em>${aed(a.price)}${a.per === 'visa' ? '/visa' : ''}</em></label>`).join('')}</div></div>
      <div><label>Discount on service fee (%)</label><input type="number" min="0" max="100" value="${C.disc}" onchange="C.disc=+this.value;render()"></div>
      <div><label>QPH service fee</label><input value="${aed(S.serviceFee)}" disabled></div>
    </div></div></div>
    <div><div class="card quote"><div class="quote-h"><small>${lead ? 'Proposal for ' + esc(lead.name) : 'Quick quote'} · ${esc(z.name)}</small><div class="total">${aed(e.total)}</div><small>${e.visas} visa(s) · ${C.acts} activit${C.acts > 1 ? 'ies' : 'y'} · ${esc(z.type)}</small></div><div class="card-b">
      ${e.rows.map(r => `<div class="qrow"><span>${esc(r[0])}</span><b>${aed(r[1])}</b></div>`).join('')}
      <div class="qrow sub"><span>Government & third-party fees</span><span>${aed(e.govt)}</span></div>
      <div class="qrow"><span>QPH service fee</span><b>${aed(e.fee)}</b></div>
      ${e.disc ? `<div class="qrow" style="color:var(--green)"><span>Discount ${C.disc}%</span><b>− ${aed(e.disc)}</b></div>` : ''}
      <div class="qrow sub"><span>VAT 5% on service fee</span><span>${aed(e.vat)}</span></div>
      <div class="qrow sum"><span>Total</span><span>${aed(e.total)}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:14px">
        <button class="btn btn-primary" onclick="saveProposal()" ${lead ? '' : 'disabled title="Link a lead first"'}>💾 Save proposal to lead</button>
        <button class="btn" onclick="printQuote()">🖨 Print / PDF</button>
        <a class="btn btn-wa" target="_blank" href="${waLink(lead ? lead.phone : '', quoteText(e, lead))}">💬 Send on WhatsApp</a>
      </div></div></div>
    <div class="card" style="margin-top:16px"><div class="card-h"><h2>Compare ${C.type === 'Free Zone' ? 'free zones' : 'options'}</h2><span class="small muted">same visas & add-ons</span></div><div class="card-b">${bars(cmp.map(({ x, t }) => [x.name, t, aed(t)]))}</div></div></div>
  </div><div id="printArea" hidden></div>`;
}
function quoteText(e, l) { return `Hi ${l ? l.name.split(' ')[0] : ''}, here is your Quick Path Horizon setup estimate:\n\n${e.z.name} (${e.z.type})\n${e.rows.map(r => '• ' + r[0] + ': ' + aed(r[1])).join('\n')}\n• Service fee: ${aed(e.feeNet)} + VAT ${aed(e.vat)}\n\nTOTAL: ${aed(e.total)}\n\nValid for 7 days. Reply YES to proceed!`; }
function saveProposal() {
  const l = S.leads.find(x => x.id === C.leadId); if (!l) return; const e = estimate(C);
  const pid = 'P' + (2100 + Math.floor(Math.random() * 900)); const p = { id: pid, at: Date.now(), zone: C.zone, total: e.total, visas: e.visas, pdf: 'QPH-Proposal-' + pid + '.pdf', snap: Object.assign({}, C) };
  l.proposals.push(p); l.value = e.total; l.req.zone = C.zone; l.req.type = C.type; l.req.visas = e.visas;
  log(l, `Proposal ${p.id} created · ${e.z.name} · ${aed(e.total)}`);
  const r = autoAdvance(l); const before = !!r;
  save(); render(); toast(`💾 Proposal ${p.id} (PDF) saved to ${l.name}${before ? ' · auto-moved to ' + r[1] : missing(l, 'Proposal Sent').length ? ' · qualify the lead first to move to Proposal Sent' : ''}`);
}
function printQuote() {
  const e = estimate(C); const l = S.leads.find(x => x.id === C.leadId); const pa = $('printArea'); pa.hidden = false;
  pa.innerHTML = `<div style="padding:40px;font-family:'Libre Franklin',sans-serif;color:#0E2A47"><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #E46E1B;padding-bottom:16px"><img src="logo.png" style="height:56px"><div style="text-align:right;font-size:12px">Quick Path Horizon Corporate Services<br>Dubai, UAE · 0581464678<br>Info@quickpathhorizon.com</div></div>
  <h1 style="margin:24px 0 4px">Business Setup Proposal</h1><div style="color:#5A6B7D">${l ? 'Prepared for ' + esc(l.name) + ' · ' : ''}${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} · valid 7 days</div>
  <h3 style="margin-top:24px">${esc(e.z.name)} — ${esc(e.z.type)} · ${e.visas} visa(s) · ${C.acts} activities</h3>
  <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:14px">${e.rows.map(r => `<tr><td style="padding:8px;border-bottom:1px solid #E3E8EE">${esc(r[0])}</td><td style="padding:8px;border-bottom:1px solid #E3E8EE;text-align:right">${aed(r[1])}</td></tr>`).join('')}
  <tr><td style="padding:8px;border-bottom:1px solid #E3E8EE">QPH service fee${e.disc ? ' (after ' + C.disc + '% discount)' : ''}</td><td style="padding:8px;border-bottom:1px solid #E3E8EE;text-align:right">${aed(e.feeNet)}</td></tr>
  <tr><td style="padding:8px">VAT 5% on service fee</td><td style="padding:8px;text-align:right">${aed(e.vat)}</td></tr>
  <tr><td style="padding:12px 8px;font-weight:800;font-size:18px;border-top:2px solid #0E2A47">Total</td><td style="padding:12px 8px;font-weight:800;font-size:18px;text-align:right;border-top:2px solid #0E2A47;color:#E46E1B">${aed(e.total)}</td></tr></table>
  <p style="font-size:12px;color:#5A6B7D;margin-top:30px">Government fees are indicative and subject to change by the issuing authority. Demo proposal generated by QPH CRM.</p></div>`;
  setTimeout(() => { window.print(); pa.hidden = true; }, 200);
}

/* ---------------- campaigns ---------------- */
function vCampaigns() {
  const L = S.leads.filter(l => inPeriod(l.createdAt));
  const key = { campaign: l => l.attr.campaign, adset: l => l.attr.adset && (l.attr.campaign + ' › ' + l.attr.adset), ad: l => l.attr.ad && (l.attr.adset + ' › ' + l.attr.ad), utm: l => (l.attr.utm.utm_source || '') && (l.attr.utm.utm_source + ' / ' + (l.attr.utm.utm_medium || '')), term: l => l.attr.utm.utm_term }[campTab];
  const groups = {}; L.forEach(l => { const k = key(l); if (!k || k === '(none)') return; (groups[k] = groups[k] || []).push(l); });
  const rows = Object.entries(groups).map(([k, arr]) => { const won = arr.filter(l => l.stage === 'Closed Won'); const q = arr.filter(l => STAGES.indexOf(l.stage) >= 5 && STAGES.indexOf(l.stage) <= 9); const spend = campTab === 'campaign' ? (S.adSpend[k] || 0) : 0; return { k, n: arr.length, dup: arr.filter(l => l.dupOf).length, q: q.length, won: won.length, rev: won.reduce((s, l) => s + (l.payment ? l.payment.amount : 0), 0), spend, src: arr[0].source }; }).sort((a, b) => b.n - a.n);
  const tot = rows.reduce((s, r) => ({ n: s.n + r.n, won: s.won + r.won, rev: s.rev + r.rev, spend: s.spend + r.spend }), { n: 0, won: 0, rev: 0, spend: 0 });
  return `<div class="hello"><div><h2>Campaigns & UTM tracking</h2><div class="muted">Every lead keeps its campaign, ad set, ad name and UTM parameters — so you see which ad actually brings paying clients.</div></div>${periodSeg()}</div>
  <div class="stats">${stat('Tracked leads', tot.n, 'with campaign data', '', 'hero')}${stat('Won from ads', tot.won, '', '')}${stat('Revenue from ads', aed(tot.rev), '', '')}${campTab === 'campaign' ? stat('ROAS', tot.spend ? (tot.rev / tot.spend).toFixed(1) + 'x' : '—', 'spend ' + aed(tot.spend), '') : ''}</div>
  <div class="tabs">${[['campaign', 'Campaign'], ['adset', 'Ad set / Ad group'], ['ad', 'Ad name'], ['utm', 'utm_source / medium'], ['term', 'Keyword (utm_term)']].map(([k, t]) => `<button class="${campTab === k ? 'on' : ''}" onclick="campTab='${k}';render()">${t}</button>`).join('')}</div>
  <div class="card tbl-wrap"><table class="tbl"><thead><tr><th>${campTab === 'campaign' ? 'Campaign' : campTab === 'adset' ? 'Campaign › Ad set' : campTab === 'ad' ? 'Ad set › Ad' : campTab === 'utm' ? 'Source / Medium' : 'Keyword'}</th><th class="num">Leads</th><th class="num">Duplicates</th><th class="num">Qualified+</th><th class="num">Won</th><th class="num">Conv %</th><th class="num">Revenue</th>${campTab === 'campaign' ? '<th class="num">Spend</th><th class="num">CPL</th><th class="num">Cost / client</th>' : ''}</tr></thead><tbody>
  ${rows.map(r => `<tr class="click" onclick="${campTab === 'campaign' ? `filterGo({campaign:'${esc(r.k).replace(/'/g, "\\'")}'})` : `$('q').value='${esc(r.k.split(' › ').pop().split(' / ')[0]).replace(/'/g, "\\'")}';filterGo({})`}"><td><b>${esc(r.k)}</b><span class="sub">${pill(r.src)}</span></td><td class="num">${r.n}</td><td class="num">${r.dup ? `<span class="pill p-dup">${r.dup}</span>` : 0}</td><td class="num">${r.q}</td><td class="num">${r.won}</td><td class="num">${Math.round(r.won / r.n * 100)}%</td><td class="num">${aed(r.rev)}</td>${campTab === 'campaign' ? `<td class="num">${aed(r.spend)}</td><td class="num">${r.spend ? aed(r.spend / (r.n - r.dup || 1)) : '—'}</td><td class="num">${r.spend && r.won ? aed(r.spend / r.won) : '—'}</td>` : ''}</tr>`).join('') || '<tr><td colspan="10"><div class="empty">No tracked leads in this period</div></td></tr>'}
  </tbody></table></div><p class="small muted">CPL excludes duplicates, so the same person clicking two ads is not counted twice. Ad spend is entered in Settings (or synced from Meta / Google Ads in the live version).</p>`;
}

/* ---------------- operations ---------------- */
function vOps() {
  const cs = visibleCases();
  return `<div class="toolbar"><div class="seg"><button class="${!opsMine ? 'on' : ''}" onclick="opsMine=false;render()">All cases</button><button class="${opsMine ? 'on' : ''}" onclick="opsMine=true;render()">${ME.role === 'ops' ? 'My cases' : 'Ops team'}</button></div>${msel('ops', 'stage', OPS_STAGES, 'Ops stages')}${msel('ops', 'owner', TEAM.filter(t => t.role === 'ops').map(t => [t.id, t.name]), 'Ops owners')}${anyF(opsFilter) ? `<button class="btn btn-sm" onclick="opsFilter={stage:[],owner:[]};render()">Clear filters</button>` : ''}<span class="count">${cs.length} cases · paid customers arrive here automatically</span></div>
  <div class="kanban">${OPS_STAGES.map((s, i) => { const arr = cs.filter(c => c.stage === s); return `<div class="kcol"><h3><span>${s}</span><span>${arr.length}</span></h3>${arr.map(c => { const l = S.leads.find(x => x.id === c.leadId) || {}; const dn = DOCS.filter(d => c.docs[d]).length; return `<div class="kcard" onclick="openCase('${c.id}')"><div style="display:flex;justify-content:space-between;gap:6px"><b>${esc(c.company)}</b>${av(c.owner, 22)}</div><div class="sub">${esc(l.name || '')} · ${esc(zoneOf(c.zone).name)} · ${c.visas} visa</div><div class="sub">📄 ${dn}/${DOCS.length} docs</div><div class="prog"><i style="width:${(i + 1) / OPS_STAGES.length * 100}%"></i></div></div>`; }).join('')}</div>`; }).join('')}</div>`;
}
function caseDrawer() {
  const c = S.cases.find(x => x.id === drawer.id); if (!c) { closeDrawer(); return ''; }
  const l = S.leads.find(x => x.id === c.leadId) || { name: '', phone: '', attr: {} }; const si = OPS_STAGES.indexOf(c.stage); const z = zoneOf(c.zone);
  const canEdit = ME.role !== 'sales';
  return `<div class="dr-h"><div class="top">${av(c.owner, 36)}<div><h2>${esc(c.company)}</h2><div class="small muted">${c.id} · ${esc(l.name)} · ${esc(l.phone)} · ${esc(z.name)}</div></div><button class="icon-btn x" onclick="closeDrawer()">✕</button></div>
  <div style="margin-top:10px" class="stepper">${OPS_STAGES.map((s, i) => `<button class="${i < si ? 'done' : i === si ? 'cur' : ''}" ${canEdit ? `onclick="setOps('${c.id}',${i})"` : 'disabled'}>${i < si ? '✓ ' : ''}${s}</button>`).join('')}</div>
  <div class="dr-actions"><a class="btn btn-wa btn-sm" target="_blank" href="${waLink(l.phone, WA_TEMPLATES[4].text.replace('{name}', l.name.split(' ')[0]))}">💬 Request documents</a>${ME.role === 'admin' ? `<select class="btn btn-sm" onchange="opsAssign('${c.id}',this.value)">${TEAM.filter(t => t.role === 'ops').map(t => `<option value="${t.id}" ${c.owner === t.id ? 'selected' : ''}>Ops: ${t.name}</option>`).join('')}</select>` : ''}${l.id ? `<button class="btn btn-sm" onclick="openLead('${l.id}')">Sales lead ${l.id}</button>` : ''}</div></div>
  <div class="dr-b">
    <div class="card"><div class="card-h"><h2>📄 Documents</h2><span class="small muted">${DOCS.filter(d => c.docs[d]).length}/${DOCS.length} · required to pass "Documents Collected"</span></div><div class="card-b checks">${DOCS.map(d => `<div class="check ${c.docs[d] ? 'done' : ''}" ${canEdit ? `onclick="toggleDoc('${c.id}','${d}')"` : ''}>${c.docs[d] ? '✅' : '⬜'} ${d}</div>`).join('')}</div></div>
    <div class="card"><div class="card-h"><h2>🏛 Licence & visas</h2></div><div class="card-b"><div class="form" style="margin:0">
      <div><label>Trade licence no.</label><input value="${esc(c.licenceNo)}" ${canEdit ? '' : 'disabled'} onchange="caseSet('${c.id}','licenceNo',this.value)"></div>
      <div><label>Licence expiry</label><input type="date" value="${c.licenceExpiry ? new Date(c.licenceExpiry).toISOString().slice(0, 10) : ''}" ${canEdit ? '' : 'disabled'} onchange="caseSet('${c.id}','licenceExpiry',new Date(this.value).getTime())"></div>
      <div><label>Jurisdiction</label><input value="${esc(z.name)} · ${esc(z.type)}" disabled></div><div><label>Visas in package</label><input value="${c.visas}" disabled></div></div>
      ${c.visaHolders.length ? `<table class="tbl" style="margin-top:12px"><thead><tr><th>Visa holder</th><th>Status</th><th>Expiry</th></tr></thead><tbody>${c.visaHolders.map(v => `<tr><td>${esc(v.name)}</td><td>${canEdit ? `<button class="btn btn-sm" onclick="toggleVisa('${c.id}',${c.visaHolders.indexOf(v)})">${v.status === 'Stamped' ? '✅ Stamped' : '⏳ In process'}</button>` : pill(v.status, v.status === 'Stamped' ? 'p-closed-won' : 'p-follow-up')}</td><td>${v.expiry ? fmtDate(v.expiry, false) : '—'}</td></tr>`).join('')}</tbody></table>` : ''}
    </div></div>
    <div class="card"><div class="card-h"><h2>🕑 Case log</h2></div><div class="card-b"><ul class="tl">${[...c.log].reverse().map(x => `<li><span class="t">${fmtDate(x.at)}</span><span><b>${esc(user(x.by).name)}</b> · ${esc(x.text)}</span></li>`).join('')}</ul></div></div>
  </div>`;
}
function toggleDoc(id, d) { const c = S.cases.find(x => x.id === id); c.docs[d] = !c.docs[d]; c.log.push({ at: Date.now(), by: ME.id, text: `${d} ${c.docs[d] ? 'received' : 'marked missing'}` }); save(); render(); }
function caseSet(id, k, v) { const c = S.cases.find(x => x.id === id); c[k] = v; c.log.push({ at: Date.now(), by: ME.id, text: `${k === 'licenceNo' ? 'Licence no.' : 'Licence expiry'} updated` }); save(); render(); }
function opsAssign(id, uid) { const c = S.cases.find(x => x.id === id); c.owner = uid; c.log.push({ at: Date.now(), by: ME.id, text: 'Assigned to ' + user(uid).name }); save(); render(); }

function vRenewals() {
  const cs = S.cases.filter(c => c.licenceExpiry && c.licenceExpiry < Date.now() + 90 * D).sort((a, b) => a.licenceExpiry - b.licenceExpiry);
  return `<div class="card tbl-wrap"><div class="card-h"><h2>Licence renewals · next 90 days</h2><span class="small muted">Alerts at 60, 30 and 7 days</span></div><table class="tbl"><thead><tr><th>Company</th><th>Licence</th><th>Expires</th><th>In</th><th></th></tr></thead><tbody>
  ${cs.map(c => { const l = S.leads.find(x => x.id === c.leadId) || { name: '', phone: '' }; return `<tr><td><b style="cursor:pointer" onclick="openCase('${c.id}')">${esc(c.company)}</b><span class="sub">${esc(l.name)} · ${esc(l.phone)}</span></td><td class="mono">${esc(c.licenceNo)}</td><td>${fmtDate(c.licenceExpiry, false)}</td><td>${expiryPill(c.licenceExpiry)}</td><td style="white-space:nowrap"><a class="btn btn-sm btn-wa" target="_blank" href="${waLink(l.phone, `Hi ${l.name.split(' ')[0]}, your trade licence ${c.licenceNo} for ${c.company} expires on ${fmtDate(c.licenceExpiry, false)}. Shall we start the renewal?`)}">💬 Remind</a> <button class="btn btn-sm" onclick="renew('${c.id}')">Renewed +1yr</button></td></tr>`; }).join('') || '<tr><td colspan="5"><div class="empty">No renewals due</div></td></tr>'}</tbody></table></div>`;
}
function renew(id) { const c = S.cases.find(x => x.id === id); c.licenceExpiry = Math.max(c.licenceExpiry, Date.now()) + 365 * D; c.log.push({ at: Date.now(), by: ME.id, text: 'Licence renewed +1 year' }); save(); render(); toast('🔁 Renewed until ' + fmtDate(c.licenceExpiry, false)); }

/* ---------------- settings ---------------- */
function vSettings() {
  const tabs = [['team', 'Team & roles'], ['assign', 'Round robin & notifications'], ['email', 'Email'], ['integrations', 'Lead sources & integrations'], ['utm', 'UTM tester'], ['prices', 'Price list'], ['spend', 'Ad spend'], ['data', 'Data']];
  let b = '';
  if (setTab === 'team') b = `<div class="card tbl-wrap"><table class="tbl"><thead><tr><th>Member</th><th>Role</th><th>Dashboard</th><th>Can do</th><th>Cannot do</th></tr></thead><tbody>${TEAM.map(t => `<tr><td><div style="display:flex;gap:8px;align-items:center">${av(t.id, 28)}<b>${esc(t.name)}</b></div></td><td>${esc(t.title)}</td><td>${t.role === 'admin' ? 'Company dashboard' : t.role === 'sales' ? 'Sales dashboard (own leads)' : 'Operations dashboard'}</td><td class="small">${t.role === 'admin' ? 'Everything: all leads, campaigns, ops, settings, delete, reassign' : t.role === 'sales' ? 'Own leads, follow-ups, WhatsApp, calculator & proposals, duplicates' : 'Ops board, documents, licences, visas, customers, renewals'}</td><td class="small">${t.role === 'admin' ? '—' : t.role === 'sales' ? "Other reps' leads, operations documents, delete" : 'Sales leads & campaigns, delete'}</td></tr>`).join('')}</tbody></table></div><p class="small muted">Demo: 5 users. Live version uses email OTP login per user. New leads are split round-robin between sales; Closed Won cases round-robin between operations.</p>`;
  if (setTab === 'integrations') b = `<div class="int-grid">
    ${int('🟦 Meta Lead Ads', 'Facebook & Instagram instant forms arrive in seconds via webhook with campaign, ad set, ad name, form name and all form answers.', 'POST /webhooks/meta-leads', 'Connected (demo)')}
    ${int('🟥 Google Ads', 'Google lead-form extensions + website forms with gclid. Campaign, ad group, keyword (utm_term) captured.', 'POST /webhooks/google-leads', 'Connected (demo)')}
    ${int('🌐 Website forms + UTM', 'A small script on quickpathhorizon.com saves utm_* , gclid, fbclid and landing page into hidden fields on every form.', '&lt;script src="qph-utm.js"&gt;', 'Snippet ready')}
    ${int('💬 WhatsApp Business API', 'Shared team inbox on 0581464678. New numbers become leads, auto-welcome, templates, 24h window, ticks.', 'Meta Cloud API · phone_number_id', 'Demo mode')}
    ${int('✨ AI Agent', 'Polish Hinglish notes to English, AI next step per lead, AI WhatsApp reply drafts, auto-update stage on 🤖-tagged chats.', 'Claude / Gemini API key', 'Demo mode')}
    ${int('🧬 Duplicate check', 'Phone (last 9 digits) + email. Duplicate tagged, linked, assigned to same owner, original gets a Re-enquired note.', 'Rule: phone OR email', 'Active')}
  </div>
  <div class="card" style="margin-top:16px"><div class="card-h"><h2>Website UTM capture snippet</h2></div><div class="card-b"><div class="code">&lt;script&gt;(function(){var p=new URLSearchParams(location.search),k=['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'];k.forEach(function(x){if(p.get(x))localStorage.setItem('qph_'+x,p.get(x))});if(!localStorage.qph_landing)localStorage.qph_landing=location.href;document.querySelectorAll('form').forEach(function(f){k.concat('landing').forEach(function(x){var i=document.createElement('input');i.type='hidden';i.name=x;i.value=localStorage.getItem('qph_'+x)||'';f.appendChild(i)})})})();&lt;/script&gt;</div><p class="small muted">Keeps the first-click UTM even if the visitor browses other pages before submitting the form.</p></div></div>`;
  if (setTab === 'assign') b = assignSettings();
  if (setTab === 'email') b = emailSettings();
  if (setTab === 'utm') b = `<div class="card"><div class="card-h"><h2>UTM tester</h2><span class="small muted">Paste any ad URL to see what the CRM will store</span></div><div class="card-b"><input class="inp" id="utmIn" value="https://quickpathhorizon.com/business-setup/?utm_source=facebook&utm_medium=paid_social&utm_campaign=qph_freezone_nov26&utm_term=uae_expats_25_45&utm_content=video_2_visa&fbclid=IwAR2xyz" oninput="utmTest()"><div id="utmOut" style="margin-top:14px"></div></div></div>`;
  if (setTab === 'prices') b = `<div class="card tbl-wrap"><div class="card-h"><h2>Free zone & authority price list (AED)</h2><span class="small muted">Used by the cost calculator · indicative demo values</span></div><table class="tbl price-tbl"><thead><tr><th>Zone</th><th>Type</th><th class="num">Licence</th><th class="num">Per visa</th><th class="num">Est. card</th><th class="num">Incl. activities</th><th class="num">Extra activity</th></tr></thead><tbody>${S.zones.map((z, i) => `<tr><td><b>${esc(z.name)}</b><span class="sub">${esc(z.emirate)}</span></td><td>${esc(z.type)}</td>${['licence', 'perVisa', 'estCard', 'inclActs', 'extraAct'].map(k => `<td class="num"><input type="number" value="${z[k]}" onchange="S.zones[${i}].${k}=+this.value;save()"></td>`).join('')}</tr>`).join('')}</tbody></table>
  <div class="card-b"><h3 style="font-size:14px;margin-bottom:8px">Add-ons & service fee</h3><table class="tbl price-tbl"><tbody>${S.addons.map((a, i) => `<tr><td>${esc(a.name)}</td><td class="sub">${a.per === 'visa' ? 'per visa' : 'one-time'}</td><td class="num"><input type="number" value="${a.price}" onchange="S.addons[${i}].price=+this.value;save()"></td></tr>`).join('')}<tr><td><b>QPH service fee</b></td><td></td><td class="num"><input type="number" value="${S.serviceFee}" onchange="S.serviceFee=+this.value;save()"></td></tr></tbody></table></div></div>`;
  if (setTab === 'spend') b = `<div class="card tbl-wrap"><div class="card-h"><h2>Monthly ad spend per campaign (AED)</h2><span class="small muted">Used for CPL, cost per client and ROAS</span></div><table class="tbl price-tbl"><tbody>${Object.keys(S.adSpend).map(k => `<tr><td><b>${esc(k)}</b></td><td class="num"><input type="number" value="${S.adSpend[k]}" onchange="S.adSpend['${esc(k)}']=+this.value;save()"></td></tr>`).join('')}</tbody></table></div>`;
  if (setTab === 'data') b = `<div class="card"><div class="card-b" style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onclick="exportCSV()">⬇ Export leads CSV (with UTM)</button><button class="btn btn-danger" onclick="if(confirm('Reset all demo data?')){localStorage.removeItem(KEY);S=load();render();toast('Demo data reset')}">↺ Reset demo data</button></div></div>`;
  setTimeout(() => { if ($('utmIn')) utmTest(); }, 0);
  return `<div class="tabs">${tabs.map(([k, t]) => `<button class="${setTab === k ? 'on' : ''}" onclick="setTab='${k}';render()">${t}</button>`).join('')}</div>${b}`;
}
function int(t, d, code, st) { return `<div class="int"><h3>${t}</h3><p>${d}</p><div class="code" style="font-size:11px">${code}</div><div style="margin-top:10px">${pill(st, st === 'Active' || st.startsWith('Connected') ? 'p-closed-won' : 'p-follow-up')}</div></div>`; }
function utmTest() {
  let out = ''; try { const u = new URL($('utmIn').value); const p = {}; u.searchParams.forEach((v, k) => p[k] = v);
    const src = /google/.test(p.utm_source || '') || p.gclid ? 'Google' : /facebook|instagram|meta|fb|ig/.test(p.utm_source || '') || p.fbclid ? 'Meta' : 'Website';
    out = `<div class="kv three">${[['Detected source', src], ['Landing page', u.origin + u.pathname], ['utm_source', p.utm_source], ['utm_medium', p.utm_medium], ['utm_campaign → Campaign', p.utm_campaign], ['utm_term → Ad set / keyword', p.utm_term], ['utm_content → Ad name', p.utm_content], ['Click ID', p.gclid ? 'gclid=' + p.gclid : p.fbclid ? 'fbclid=' + p.fbclid : '']].map(([k, v]) => `<div><span>${k}</span><b class="mono">${esc(v || '—')}</b></div>`).join('')}</div>`;
  } catch (e) { out = '<div class="muted">Enter a full URL starting with https://</div>'; }
  $('utmOut').innerHTML = out;
}

/* ---------------- alerts / modal ---------------- */
function alerts() {
  if (!ME) return []; const a = []; const L = visibleLeads(); const now = Date.now();
  L.filter(l => l.dupOf).forEach(l => a.push(['🧬', `Duplicate: ${l.name} (${l.id}) matches ${l.dupOf}`, `openLead('${l.id}')`]));
  L.filter(l => l.stage === 'New' && now - l.createdAt > 2 * H).slice(0, 6).forEach(l => a.push(['⏳', `${l.name} untouched for ${ago(l.createdAt).replace(' ago', '')}`, `openLead('${l.id}')`]));
  L.filter(l => l.followUp && l.followUp < now && OPEN_STAGES.includes(l.stage)).slice(0, 6).forEach(l => a.push(['🔴', `Overdue follow-up: ${l.name}`, `openLead('${l.id}')`]));
  if (ME.role === 'admin') S.leads.filter(l => l.payment && l.payment.status === 'pending').forEach(l => a.push(['💰', `Confirm payment ${aed(l.payment.amount)} · ref ${l.payment.ref} · ${l.name}`, `openLead('${l.id}')`]));
  L.filter(l => unread(l)).slice(0, 5).forEach(l => a.push(['💬', `Unread WhatsApp from ${l.name}`, `openChat('${l.id}')`]));
  if (ME.role !== 'sales') S.cases.filter(c => c.licenceExpiry && c.licenceExpiry < now + 60 * D).forEach(c => a.push(['🔁', `Licence renewal: ${c.company} (${Math.round((c.licenceExpiry - now) / D)}d)`, `openCase('${c.id}')`]));
  return a;
}
function modal(h) { $('modalBody').innerHTML = h; $('modal').classList.add('open'); }
function closeModal() { $('modal').classList.remove('open'); }

/* ---------------- customers / accounts (operations only) ---------------- */
function acctChecks(c) {
  const vis = +c.visas || 0; const stamped = c.visaHolders.filter(v => v.status === 'Stamped').length;
  return [[!!c.licenceNo, 'Trade licence issued'], [DOCS.every(d => c.docs[d]), 'All documents collected'], [vis === 0 || stamped >= vis, `All visas stamped (${Math.min(stamped, vis)}/${vis})`]];
}
const acctComplete = c => acctChecks(c).every(x => x[0]);
function setOps(id, i) {
  const c = S.cases.find(x => x.id === id); const l = S.leads.find(x => x.id === c.leadId);
  if (i > 1 && DOCS.some(d => !c.docs[d])) return toast('📄 Complete all documents before moving past Documents Collected');
  if (i >= 4 && !c.licenceNo && i > OPS_STAGES.indexOf(c.stage)) { c.licenceNo = zoneOf(c.zone).name.split(' ')[0].toUpperCase() + '-' + Math.floor(40000 + Math.random() * 9999); c.licenceExpiry = Date.now() + 365 * D; }
  const n = +c.visas || 0;
  if (i >= 6) for (let k = c.visaHolders.length; k < n; k++) c.visaHolders.push({ name: k === 0 && l ? l.name : (l ? l.name.split(' ')[0] : 'Client') + ' – Employee ' + k, status: 'In process', expiry: null });
  if (i >= 7) c.visaHolders.forEach(v => { v.status = 'Stamped'; v.expiry = v.expiry || Date.now() + 730 * D; });
  if (i === 8 && !acctComplete(c)) return modal(`<h2>🔒 Can't complete setup yet</h2><ul class="crit">${acctChecks(c).map(x => `<li class="${x[0] ? 'ok' : ''}">${x[0] ? '✅' : '⭕'} ${esc(x[1])}</li>`).join('')}</ul><div class="modal-f"><button class="btn btn-primary" onclick="closeModal()">OK</button></div>`);
  const wasDone = acctComplete(c) && c.stage === 'Setup Completed';
  c.log.push({ at: Date.now(), by: ME.id, text: `Stage → ${OPS_STAGES[i]}` }); c.stage = OPS_STAGES[i]; save(); render();
  if (i === 8 && !wasDone) { notify('u1', `✅ ${c.company} setup complete — moved to Accounts`, 'case:' + c.id); if (l) notify(l.owner, `🎉 Your client ${l.name} (${c.company}) setup is complete`, 'case:' + c.id); }
  toast(i === 4 ? '🏛 Trade licence issued' : i === 8 ? '🎉 Setup completed — client moved to Accounts' : 'Stage → ' + OPS_STAGES[i]);
}
function toggleVisa(id, k) { const c = S.cases.find(x => x.id === id); const v = c.visaHolders[k]; v.status = v.status === 'Stamped' ? 'In process' : 'Stamped'; if (v.status === 'Stamped') v.expiry = v.expiry || Date.now() + 730 * D; c.log.push({ at: Date.now(), by: ME.id, text: `Visa ${v.name} → ${v.status}` }); save(); render(); }
function caseRow(c, mode) {
  const l = S.leads.find(x => x.id === c.leadId) || {}; const i = OPS_STAGES.indexOf(c.stage); const vis = +c.visas || 0; const st = c.visaHolders.filter(v => v.status === 'Stamped').length; const dn = DOCS.filter(d => c.docs[d]).length;
  return `<tr class="click" onclick="openCase('${c.id}')"><td><b>${esc(c.company)}</b><span class="sub">${c.id} · ${esc(zoneOf(c.zone).name)}</span></td><td>${esc(l.name || '')}<span class="sub">${esc(l.phone || '')}</span></td>
  ${mode === 'cust' ? `<td>${l.payment ? aed(l.payment.amount) + `<span class="sub">ref ${esc(l.payment.ref)}</span>` : '—'}</td><td>${pill(c.stage, i >= 4 ? 'p-qualified' : 'p-contacted')}<div class="prog"><i style="width:${(i + 1) / OPS_STAGES.length * 100}%"></i></div></td><td>${dn === DOCS.length ? '✅' : '📄'} ${dn}/${DOCS.length}</td><td>${vis ? (st >= vis ? '✅ ' : '') + st + '/' + vis : '—'}</td><td class="small muted">${ago(c.startedAt)}</td>`
  : `<td class="mono">${esc(c.licenceNo)}</td><td>${c.licenceExpiry ? expiryPill(c.licenceExpiry) : '—'}</td><td>✅ ${st}/${vis}</td><td>✅ ${dn}/${DOCS.length}</td><td>${l.payment ? aed(l.payment.amount) : '—'}</td>`}<td>${av(c.owner, 24)}</td></tr>`;
}
function vCustomers() {
  const cs = visibleCases().filter(c => !acctComplete(c) || c.stage !== 'Setup Completed').sort((a, b) => b.startedAt - a.startedAt);
  return `<div class="card" style="margin-bottom:14px"><div class="card-b small">🏢 <b>Customers</b> = qualified leads whose payment is <b>confirmed by Accounts</b>. From here the <b>Operations team</b> handles licence, documents and visas. When licence + all visas + all documents are complete and setup is marked completed, the client moves to <b>Accounts</b>. Sales staff cannot see this module.</div></div>
  <div class="toolbar">${msel('ops', 'stage', OPS_STAGES, 'Ops stages')}${msel('ops', 'owner', TEAM.filter(t => t.role === 'ops').map(t => [t.id, t.name]), 'Ops owners')}${anyF(opsFilter) ? `<button class="btn btn-sm" onclick="opsFilter={stage:[],owner:[]};render()">Clear filters</button>` : ''}</div>
  <div class="card tbl-wrap"><div class="card-h"><h2>Customers in progress</h2><span class="small muted">${cs.length} paid clients</span></div><table class="tbl"><thead><tr><th>Company</th><th>Client</th><th>Payment</th><th>Ops stage</th><th>Documents</th><th>Visas stamped</th><th>Since</th><th>Ops</th></tr></thead><tbody>
  ${cs.map(c => caseRow(c, 'cust')).join('') || '<tr><td colspan="8"><div class="empty">No customers in progress</div></td></tr>'}</tbody></table></div>`;
}
function vAccounts() {
  const cs = S.cases.filter(c => acctComplete(c) && c.stage === 'Setup Completed');
  const near = S.cases.filter(c => !(acctComplete(c) && c.stage === 'Setup Completed') && OPS_STAGES.indexOf(c.stage) >= 6).length;
  return `<div class="card" style="margin-bottom:14px"><div class="card-b small">✅ <b>Accounts</b> = clients who have <b>paid</b>, have their <b>trade licence</b>, <b>all visas stamped</b> and <b>all documents complete</b>. Use it for renewals, VAT / Corporate Tax and upsell. ${near ? `<b>${near}</b> more client(s) are close (visa stage).` : ''}</div></div>
  <div class="card tbl-wrap"><div class="card-h"><h2>Completed accounts</h2><span class="small muted">${cs.length} clients</span></div><table class="tbl"><thead><tr><th>Company</th><th>Client</th><th>Licence no.</th><th>Licence expiry</th><th>Visas</th><th>Documents</th><th>Paid</th><th>Ops</th></tr></thead><tbody>
  ${cs.map(c => caseRow(c, 'acct')).join('') || '<tr><td colspan="8"><div class="empty">No completed accounts yet</div></td></tr>'}</tbody></table></div>`;
}

/* ---------------- notifications ---------------- */
function notify(to, text, link) {
  S.notifs = S.notifs || []; S.notifs.unshift({ id: Math.random().toString(36).slice(2), to, text, link, at: Date.now(), read: false }); S.notifs = S.notifs.slice(0, 300);
  if (ME && to === ME.id) { setTimeout(() => toast('🔔 ' + text), 400); if (window.Notification && Notification.permission === 'granted') { try { new Notification('QPH CRM', { body: text, icon: 'logo.png' }); } catch (e) { } } }
}
const myNotifs = () => (S.notifs || []).filter(n => ME && n.to === ME.id);
function openNotif(id) { const n = S.notifs.find(x => x.id === id); n.read = true; save(); closeModal(); if (!n.link) return render(); if (n.link.startsWith('case:')) { render(); openCase(n.link.slice(5)); } else openLead(n.link); }
function markAllRead() { myNotifs().forEach(n => n.read = true); save(); closeModal(); render(); }
function enableDesktop() { if (!window.Notification) return toast('This browser does not support notifications'); Notification.requestPermission().then(p => toast(p === 'granted' ? '✅ Desktop notifications on' : 'Notifications blocked in browser settings')); }
function alertsModal() {
  const N = myNotifs(); const a = alerts();
  modal(`<h2>🔔 Notifications · ${esc(ME.name)}</h2><div style="display:flex;gap:6px;margin:10px 0;flex-wrap:wrap"><button class="btn btn-sm" onclick="markAllRead()">Mark all read</button><button class="btn btn-sm" onclick="enableDesktop()">🖥 Enable desktop notifications</button></div>
  <ul class="alerts">${N.slice(0, 25).map(n => `<li onclick="openNotif('${n.id}')" style="${n.read ? 'color:var(--muted)' : 'font-weight:600;background:#FFF8F2'}"><span>${n.read ? '○' : '🟠'}</span><span style="flex:1">${esc(n.text)}</span><span class="small muted" style="white-space:nowrap">${ago(n.at)}</span></li>`).join('') || '<li>No notifications yet</li>'}</ul>
  ${a.length ? `<h3 style="font-size:14px;margin-top:18px">⚠️ Needs attention</h3><ul class="alerts">${a.map(([i, t, fn]) => `<li onclick="closeModal();${fn}"><span>${i}</span><span>${esc(t)}</span></li>`).join('')}</ul>` : ''}
  <div class="modal-f"><button class="btn" onclick="closeModal()">Close</button></div>`);
}

/* ---------------- email ---------------- */
const EMAIL_TPL = [
  { id: 'welcome', name: 'Welcome', subject: 'Welcome to Quick Path Horizon, {name}', body: 'Hi {name},\n\nThank you for your enquiry about setting up your business in the UAE. I am {agent}, your dedicated consultant.\n\nCould you share a good time for a quick call? I will walk you through the best free zone / mainland options for your activity.\n\nBest regards,\n{agent}\nQuick Path Horizon · 0581464678' },
  { id: 'proposal', name: 'Proposal', subject: 'Your UAE business setup proposal – {name}', body: 'Hi {name},\n\nPlease find attached your customised business setup proposal. The quote is valid for 7 days.\n\nLet me know if you have any questions.\n\nBest regards,\n{agent}\nQuick Path Horizon' },
  { id: 'payment', name: 'Payment link', subject: 'Payment link to start your company setup', body: 'Hi {name},\n\nHere is your secure payment link: {paylink}\n\nOnce payment is confirmed, our operations team starts your application the same day.\n\nBest regards,\n{agent}' },
  { id: 'docs', name: 'Documents required', subject: 'Documents needed for your application', body: 'Hi {name},\n\nTo start your application please send:\n• Passport copy\n• Photo with white background\n• Current visa / entry stamp\n• 3 trade name options\n\nBest regards,\n{agent}' },
  { id: 'meeting', name: 'Meeting invite', subject: 'Your meeting with Quick Path Horizon – {date}', body: 'Hi {name},\n\nYour consultation with Quick Path Horizon is confirmed.\n\nDate & time: {date}\nMeeting: {meetlink}\n\nA calendar invite is attached. If you need to reschedule, just reply to this email.\n\nBest regards,\n{agent}\nQuick Path Horizon · 0581464678' },
  { id: 'followup', name: 'Follow-up', subject: 'Following up on your business setup enquiry', body: 'Hi {name},\n\nJust following up on our conversation. Would you like me to share the 3 most cost-effective options for your business activity?\n\nBest regards,\n{agent}' },
];
function fillTpl(t, l) { const a = l.appt || {}; t = t.replace(/\{date\}/g, a.at ? fmtDate(a.at) : '').replace(/\{meetlink\}/g, a.link || a.place || ''); return t.replace(/\{name\}/g, l.name.split(' ')[0]).replace(/\{agent\}/g, user(l.owner).name).replace(/\{paylink\}/g, (l.payLink && l.payLink.url) || 'https://pay.quickpathhorizon.com/' + l.id); }
function composeEmail(id) {
  const l = S.leads.find(x => x.id === id); if (!l.email) return toast('Add the lead email first');
  const t = S.emailTpl[0];
  modal(`<h2>✉ Send email</h2><div class="muted small">From ${esc(S.email.fromName)} &lt;${esc(S.email.fromEmail)}&gt; ${S.email.connected ? pill('connected', 'p-closed-won') : pill('demo mode', 'p-follow-up')}</div>
  <div class="form"><div><label>To</label><input id="emTo" value="${esc(l.email)}"></div><div><label>Template</label><select id="emTpl" onchange="const t=S.emailTpl.find(x=>x.id===this.value);const l=S.leads.find(x=>x.id==='${id}');$('emSub').value=fillTpl(t.subject,l);$('emBody').value=fillTpl(t.body,l)">${S.emailTpl.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>
  <div class="full"><label>Subject</label><input id="emSub" value="${esc(fillTpl(t.subject, l))}"></div><div class="full"><label>Message</label><textarea id="emBody" style="min-height:200px">${esc(fillTpl(t.body, l))}</textarea></div>
  ${l.proposals.length ? `<div class="full"><label class="opt"><input type="checkbox" id="emAtt" checked> Attach latest proposal PDF (${esc(l.proposals[l.proposals.length - 1].pdf || '')})</label></div>` : ''}</div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Cancel</button><a class="btn" href="mailto:${esc(l.email)}" onclick="this.href='mailto:'+encodeURIComponent($('emTo').value)+'?subject='+encodeURIComponent($('emSub').value)+'&body='+encodeURIComponent($('emBody').value)">Open in Mail app</a><button class="btn btn-primary" onclick="sendEmail('${id}')">Send email</button></div>`);
}
function sendEmail(id) {
  const l = S.leads.find(x => x.id === id); const sub = $('emSub').value.trim(); if (!sub) return toast('Subject is required');
  const att = $('emAtt') && $('emAtt').checked ? l.proposals[l.proposals.length - 1].pdf : '';
  l.emails = l.emails || []; l.emails.push({ at: Date.now(), to: $('emTo').value, subject: sub, by: ME.id, att });
  l.contact.email = true; log(l, `Email sent: "${sub}"${att ? ' + ' + att : ''} → ${$('emTo').value}`); save(); closeModal(); render();
  toast(S.email.connected ? `📧 Email sent to ${l.email}` : `📧 Email logged (demo — connect email in Settings to deliver)`);
}
const EMAIL_PROVIDERS = { 'Gmail / Google Workspace': ['smtp.gmail.com', 587], 'Microsoft 365 / Outlook': ['smtp.office365.com', 587], 'Zoho Mail': ['smtp.zoho.com', 587], 'Custom SMTP': ['', 587] };
function emailSettings() {
  const e = S.email; const f = (k, label, type = 'text') => `<div><label>${label}</label><input type="${type}" value="${esc(e[k] ?? '')}" onchange="S.email.${k}=this.value;S.email.connected=false;save();render()"></div>`;
  const tg = (k, label) => `<label class="opt ${e[k] ? 'on' : ''}"><input type="checkbox" ${e[k] ? 'checked' : ''} onchange="S.email.${k}=this.checked;save();render()"> ${label}</label>`;
  return `<div class="grid2"><div class="card"><div class="card-h"><h2>📧 Email account</h2>${e.connected ? pill('Connected (demo)', 'p-closed-won') : pill('Not connected', 'p-follow-up')}</div><div class="card-b"><div class="form" style="margin:0">
    <div class="full"><label>Provider</label><select onchange="S.email.provider=this.value;S.email.host=EMAIL_PROVIDERS[this.value][0];S.email.port=EMAIL_PROVIDERS[this.value][1];S.email.connected=false;save();render()">${Object.keys(EMAIL_PROVIDERS).map(p => `<option ${e.provider === p ? 'selected' : ''}>${p}</option>`).join('')}</select></div>
    ${f('fromName', 'From name')}${f('fromEmail', 'From email', 'email')}${f('host', 'SMTP host')}${f('port', 'Port', 'number')}${f('user', 'Username', 'email')}
    <div><label>App password</label><input type="password" placeholder="Not stored in demo" autocomplete="off"></div>${f('replyTo', 'Reply-to (optional)', 'email')}
  </div><button class="btn btn-primary" style="margin-top:14px" onclick="toast('Testing connection…');setTimeout(()=>{S.email.connected=true;save();render();toast('✅ Connected (demo — real sending needs the live server)')},900)">Save & test connection</button>
  <p class="small muted">Live version sends through your mailbox (Gmail / Outlook app password or SMTP), so customers receive emails from ${esc(e.fromEmail)} and replies land in your inbox.</p></div></div>
  <div class="card"><div class="card-h"><h2>Automatic emails</h2></div><div class="card-b" style="display:grid;gap:8px">
    ${tg('autoWelcome', 'Send <b>Welcome</b> email automatically to every new lead with an email')}${tg('autoProposal', 'Email the proposal PDF to the customer when stage → Proposal Sent')}${tg('autoPayment', 'Email the payment link when stage → Payment Link Sent')}${tg('staffAlerts', 'Email the assigned salesperson when a new lead is assigned')}
  </div></div></div>
  <div class="card"><div class="card-h"><h2>Email templates</h2><span class="small muted">{name} {agent} {paylink} are filled automatically</span></div><div class="card-b" style="display:grid;gap:14px">${S.emailTpl.map((t, i) => `<div><b>${esc(t.name)}</b><input class="inp" style="margin:6px 0" value="${esc(t.subject)}" onchange="S.emailTpl[${i}].subject=this.value;save()"><textarea class="inp" style="min-height:110px" onchange="S.emailTpl[${i}].body=this.value;save()">${esc(t.body)}</textarea></div>`).join('')}</div></div>`;
}
function assignSettings() {
  const sales = TEAM.filter(t => t.role === 'sales'); const mem = S.rrMembers; const nextU = mem.length ? mem[S.rr % mem.length] : null;
  const today = id => S.leads.filter(l => l.owner === id && new Date(l.createdAt).toDateString() === new Date().toDateString()).length;
  return `<div class="grid2"><div class="card"><div class="card-h"><h2>🔄 Round robin — sales</h2>${nextU ? pill('Next lead → ' + user(nextU).name, 'p-qualified') : pill('Nobody active', 'p-lost')}</div><div class="card-b">
    <p class="small muted" style="margin-top:0">Every new lead (Meta, Google, Website, WhatsApp) goes to the next active salesperson in turn. Duplicates go to the original owner.</p>
    ${sales.map(t => `<label class="opt ${mem.includes(t.id) ? 'on' : ''}" style="margin-bottom:8px"><input type="checkbox" ${mem.includes(t.id) ? 'checked' : ''} onchange="S.rrMembers=this.checked?[...S.rrMembers,'${t.id}']:S.rrMembers.filter(x=>x!=='${t.id}');save();render()"> ${av(t.id, 24)} <b>${esc(t.name)}</b> — receives new leads <em>${today(t.id)} today · ${S.leads.filter(l => l.owner === t.id && l.stage === 'New').length} new open</em></label>`).join('')}
    <p class="small muted">Untick someone on leave — their share goes to the others automatically.</p></div></div>
  <div class="card"><div class="card-h"><h2>🔔 Who gets notified</h2></div><div class="card-b"><ul class="crit">
    <li class="ok">✅ New lead → assigned salesperson + Admin</li><li class="ok">✅ Duplicate lead → original owner + Admin</li><li class="ok">✅ Payment sent for confirmation → Accounts (Admin)</li><li class="ok">✅ Payment confirmed → salesperson; new customer case → Operations (round robin Sara / Imran)</li><li class="ok">✅ Setup completed → Admin + salesperson</li>
  </ul><p class="small muted">Notifications show in the 🔔 bell for each user, as a pop-up, and as desktop notifications (bell → Enable). ${S.email.staffAlerts ? 'Staff email alerts are ON.' : 'Staff email alerts are OFF (Settings → Email).'}</p></div></div></div>`;
}

/* ---------------- WhatsApp tags ---------------- */
const WA_TAGS = [['Qualified', '#1E9E55'], ['Interested', '#2F6FB3'], ['Hot lead', '#D64545'], ['Price asked', '#C9820A'], ['Follow-up', '#6B4FBB'], ['Not interested', '#5A6B7D'], ['Junk', '#B42318']];
let waTagF = '';
function waTagChips(l) { return WA_TAGS.map(([t, c]) => { const on = l.tags.includes(t); return `<button class="wtag ${on ? 'on' : ''}" onclick="waTag('${l.id}','${t}')"><i style="background:${c}"></i>${t}</button>`; }).join(''); }
function waTag(id, t) {
  const l = S.leads.find(x => x.id === id); const on = l.tags.includes(t);
  l.tags = on ? l.tags.filter(x => x !== t) : [...l.tags, t]; log(l, `WhatsApp tag ${on ? 'removed' : 'added'}: ${t}`); save(); render();
  if (on) return;
  if (t === 'Junk' && l.stage !== 'Junk') reasonModal(id, 'Junk');
  else if (t === 'Qualified' && PIPE.indexOf(l.stage) < PIPE.indexOf('Qualified')) tryStage(id, 'Qualified');
  else if (t === 'Follow-up' && !l.followUp) toast('Tagged Follow-up — set the follow-up date on the lead');
  else toast('Tag added: ' + t);
}

/* ---------------- list / grid / calendar views ---------------- */
let VM = (() => { try { return JSON.parse(localStorage.getItem('qph_vm')) || {}; } catch (e) { return {}; } })();
const vmOf = r => VM[r] || 'list';
function setVM(r, m) { VM[r] = m; localStorage.setItem('qph_vm', JSON.stringify(VM)); render(); }
function vmToggle(r, modes = ['list', 'grid']) { const lbl = { list: '☰ List', grid: '▦ Grid', calendar: '🗓 Calendar' }; return `<div class="seg">${modes.map(m => `<button class="${vmOf(r) === m ? 'on' : ''}" onclick="setVM('${r}','${m}')">${lbl[m]}</button>`).join('')}</div>`; }
function leadCard(l, extra) {
  return `<div class="lcard" onclick="openLead('${l.id}')">
    <div class="lc-top">${av(l.owner, 30)}<div style="min-width:0;flex:1"><b>${esc(l.name)}</b><div class="sub">${esc(l.phone)}</div></div>${pill(l.stage)}</div>
    <div class="lc-mid"><span>${esc(l.source)}${l.attr.campaign && l.attr.campaign !== '(none)' ? ' · ' + esc(l.attr.campaign) : ''}</span>${l.req.activity ? `<span>${esc(l.req.activity)}${has(l.req.zone) ? ' · ' + esc(zoneOf(l.req.zone).name) : ''}</span>` : ''}</div>
    ${extra ? `<div class="lc-extra">${extra}</div>` : ''}
    <div class="lc-foot">${l.temp === 'Hot' ? pill('Hot', 'p-hot') : ''}${l.dupOf ? pill('Duplicate', 'p-dup') : ''}<span class="small muted" style="margin-left:auto">${ago(l.createdAt)}</span>
      <button class="btn btn-sm" title="WhatsApp" onclick="event.stopPropagation();openChat('${l.id}')">💬</button><a class="btn btn-sm" title="Call" href="tel:${esc(l.phone)}" onclick="event.stopPropagation()">📞</a></div>
  </div>`;
}

/* follow-ups: list or grid (3 columns) */
function vFollowups() {
  const L = visibleLeads().filter(l => l.followUp && OPEN_STAGES.includes(l.stage) && passLF(l));
  const now = Date.now(), eod = new Date().setHours(23, 59, 59);
  const grp = [['Overdue', 'red', L.filter(l => l.followUp < now)], ['Today', 'amber', L.filter(l => l.followUp >= now && l.followUp <= eod)], ['Upcoming', 'blue', L.filter(l => l.followUp > eod)]];
  grp.forEach(g => g[2].sort((a, b) => a.followUp - b.followUp));
  const head = `<div class="toolbar">${leadFilterBar({ stages: OPEN_STAGES })}<span class="count">${L.length} follow-ups</span>${vmToggle('followups')}</div>`;
  if (vmOf('followups') === 'grid') return head + `<div class="kgrid">${grp.map(([t, c, arr]) => `<div class="kcol2"><h3><span class="dot d-${c}"></span>${t}<span class="muted">${arr.length}</span></h3>${arr.map(l => leadCard(l, `⏰ ${fmtDate(l.followUp)}`)).join('') || '<div class="empty small">Nothing here</div>'}</div>`).join('')}</div>`;
  return head + grp.map(([t, c, arr]) => `<div class="card" style="margin-bottom:14px"><div class="card-h"><h2><span class="dot d-${c}"></span>${t}</h2><span class="muted small">${arr.length}</span></div><div class="card-b">${arr.length ? `<ul class="list-plain">${arr.map(l => `<li onclick="openLead('${l.id}')">${av(l.owner, 26)}<div style="min-width:0"><b>${esc(l.name)}</b><div class="small muted">${esc(l.phone)} · ${esc(l.stage)}${l.notes.length ? ' · ' + esc(l.notes[l.notes.length - 1].text.slice(0, 70)) : ''}</div></div><div class="r">${fu(l.followUp)}<div style="margin-top:4px;display:flex;gap:4px;justify-content:flex-end"><button class="btn btn-sm" onclick="event.stopPropagation();openChat('${l.id}')">WhatsApp</button><a class="btn btn-sm" href="tel:${esc(l.phone)}" onclick="event.stopPropagation()">Call</a></div></div></li>`).join('')}</ul>` : '<div class="empty">Nothing here</div>'}</div></div>`).join('');
}

/* appointments: list / grid / calendar + meeting links */
let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
const MEET_TYPES = [['office', 'Office visit', 'QPH Office, Dubai'], ['meet', 'Google Meet', 'Google Meet'], ['zoom', 'Zoom', 'Zoom'], ['phone', 'Phone call', 'Phone call'], ['client', 'Client location', 'Client location']];
const typeOf = a => (MEET_TYPES.find(t => t[0] === a.type) || MEET_TYPES.find(t => t[2] === a.place) || MEET_TYPES[0]);
function genLink(type) {
  const r = n => Math.random().toString(36).replace(/[^a-z]/g, '').padEnd(n, 'x').slice(0, n);
  if (type === 'meet') return `https://meet.google.com/${r(3)}-${r(4)}-${r(3)}`;
  if (type === 'zoom') return `https://zoom.us/j/${Math.floor(8e10 + Math.random() * 1e10)}?pwd=${r(10)}`;
  return '';
}
function gcalLink(l) {
  const a = l.appt; const f = d => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, ''); const end = a.at + (a.duration || 30) * 60e3;
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('QPH meeting – ' + l.name) + '&dates=' + f(a.at) + '/' + f(end) + '&details=' + encodeURIComponent((a.link ? 'Join: ' + a.link + '\n' : '') + (a.agenda || 'Business setup consultation')) + '&location=' + encodeURIComponent(a.link || a.place || '');
}
function apptMsg(l) { const a = l.appt; const t = typeOf(a); return `Hi ${l.name.split(' ')[0]}, your meeting with Quick Path Horizon is confirmed for ${fmtDate(a.at)} (${a.duration || 30} min).\n${a.link ? t[1] + ' link: ' + a.link : 'Place: ' + (a.place || '')}\nSee you then!`; }
function apptCard(l) { const a = l.appt; const t = typeOf(a); return `<div class="ap-line">🕑 <b>${fmtDate(a.at)}</b> · ${t[1]}${a.link ? ` · <a href="${esc(a.link)}" target="_blank" onclick="event.stopPropagation()">Join link</a>` : ''}</div>`; }
function apptModal(leadId, dayTs) {
  const L = visibleLeads().filter(l => !['Lost', 'Junk'].includes(l.stage));
  const l = leadId ? S.leads.find(x => x.id === leadId) : null; const a = (l && l.appt) || {};
  const at = a.at || (dayTs ? new Date(dayTs).setHours(11, 0, 0, 0) : Date.now() + D);
  const type = a.type || (typeOf(a)[0]);
  modal(`<h2>${a.at ? 'Edit appointment' : 'New appointment'}</h2><div class="muted small">Creates the meeting, adds it to the calendar and sends the invite to the customer.</div>
  <div class="form">
    <div class="full"><label>Lead</label><select id="apLead">${L.map(x => `<option value="${x.id}" ${l && x.id === l.id ? 'selected' : ''}>${esc(x.name)} · ${esc(x.phone)} · ${esc(x.stage)}</option>`).join('')}</select></div>
    <div><label>Date & time</label><input type="datetime-local" id="apAt" value="${toInput(at)}"></div>
    <div><label>Duration</label><select id="apDur">${[15, 30, 45, 60, 90].map(m => `<option value="${m}" ${(a.duration || 30) === m ? 'selected' : ''}>${m} min</option>`).join('')}</select></div>
    <div class="full"><label>Meeting type</label><div class="seg" id="apType">${MEET_TYPES.map(t => `<button type="button" class="${type === t[0] ? 'on' : ''}" data-t="${t[0]}" onclick="apSetType('${t[0]}')">${t[1]}</button>`).join('')}</div></div>
    <div class="full" id="apLinkRow" style="${['meet', 'zoom'].includes(type) ? '' : 'display:none'}"><label>Meeting link</label><div style="display:flex;gap:6px"><input id="apLink" value="${esc(a.link || '')}" placeholder="Click Create link"><button class="btn btn-sm btn-navy" type="button" onclick="$('apLink').value=genLink(document.querySelector('#apType .on').dataset.t);toast('Meeting link created')">Create link</button></div><div class="small muted" style="margin-top:4px">Demo creates a sample link. Live version creates a real meeting through your Google / Zoom account.</div></div>
    <div class="full"><label>Agenda (optional)</label><input id="apAgenda" value="${esc(a.agenda || '')}" placeholder="e.g. Free zone options and cost for 2 visas"></div>
    <div class="full" style="display:grid;gap:6px"><label class="opt on"><input type="checkbox" id="apEmail" checked> Email the invite to the customer${l && !l.email ? ' (no email on lead)' : ''}</label><label class="opt on"><input type="checkbox" id="apWa" checked> Send the invite on WhatsApp</label></div>
  </div>
  <div class="modal-f"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveAppt()">Save & send invite</button></div>`);
}
function apSetType(t) { document.querySelectorAll('#apType button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $('apLinkRow').style.display = ['meet', 'zoom'].includes(t) ? '' : 'none'; if (['meet', 'zoom'].includes(t) && !$('apLink').value) $('apLink').value = genLink(t); }
function saveAppt() {
  const l = S.leads.find(x => x.id === $('apLead').value); if (!l) return toast('Pick a lead');
  const t = document.querySelector('#apType .on').dataset.t; const tt = MEET_TYPES.find(x => x[0] === t);
  const link = ['meet', 'zoom'].includes(t) ? $('apLink').value.trim() : '';
  if (['meet', 'zoom'].includes(t) && !link) return toast('Create the meeting link first');
  if (!$('apAt').value) return toast('Pick date & time');
  const wasNew = !(l.appt && l.appt.at);
  l.appt = { at: new Date($('apAt').value).getTime(), duration: +$('apDur').value, type: t, place: tt[2], link, agenda: $('apAgenda').value.trim() };
  log(l, `Appointment ${wasNew ? 'booked' : 'updated'}: ${fmtDate(l.appt.at)} · ${tt[1]}${link ? ' · ' + link : ''}`);
  const sent = [];
  if ($('apEmail').checked && l.email) { const tp = S.emailTpl.find(x => x.id === 'meeting'); l.emails = l.emails || []; l.emails.push({ at: Date.now(), to: l.email, subject: fillTpl(tp.subject, l), by: ME.id, att: 'invite.ics' }); l.contact.email = true; log(l, `Meeting invite emailed to ${l.email}`); sent.push('email'); }
  if ($('apWa').checked) { S.chats[l.id] = S.chats[l.id] || []; S.chats[l.id].push({ from: 'out', text: apptMsg(l), at: Date.now(), by: ME.id }); l.contact.wa = true; log(l, 'Meeting invite sent on WhatsApp'); sent.push('WhatsApp'); }
  notify(l.owner, `📅 Appointment ${fmtDate(l.appt.at)} with ${l.name} (${tt[1]})`, l.id);
  const r = autoAdvance(l); save(); closeModal(); render();
  toast(`📅 Appointment saved${sent.length ? ' · invite sent by ' + sent.join(' + ') : ''}${r ? ' · lead → ' + r[1] : ''}`);
}
function vAppointments() {
  const L = visibleLeads().filter(l => l.appt && l.appt.at && !['Lost', 'Junk'].includes(l.stage) && passLF(l)).sort((a, b) => a.appt.at - b.appt.at);
  const sod = new Date().setHours(0, 0, 0, 0), eod = new Date().setHours(23, 59, 59, 999); const mode = vmOf('appointments');
  const head = `<div class="toolbar"><button class="btn btn-primary btn-sm" onclick="apptModal()">+ New appointment</button>${leadFilterBar()}<span class="count">${L.filter(l => l.appt.at >= sod).length} upcoming · ${L.filter(l => l.appt.at >= sod && l.appt.at <= eod).length} today</span>${vmToggle('appointments', ['list', 'grid', 'calendar'])}</div>`;
  const actions = l => `<button class="btn btn-sm" onclick="event.stopPropagation();apptModal('${l.id}')">Edit / resend</button>${l.appt.link ? `<button class="btn btn-sm" onclick="event.stopPropagation();navigator.clipboard&&navigator.clipboard.writeText('${esc(l.appt.link)}');toast('Link copied')">Copy link</button>` : ''}<a class="btn btn-sm" target="_blank" href="${gcalLink(l)}" onclick="event.stopPropagation()">+ Google Calendar</a>`;
  if (mode === 'calendar') {
    const y = calMonth.getFullYear(), m = calMonth.getMonth(); const start = new Date(y, m, 1); const off = (start.getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate();
    const cells = []; for (let k = 0; k < 42; k++) { const d = new Date(y, m, 1 - off + k); cells.push(d); }
    const evs = d => L.filter(l => new Date(l.appt.at).toDateString() === d.toDateString());
    return head + `<div class="card"><div class="card-h"><div style="display:flex;gap:8px;align-items:center"><button class="btn btn-sm" onclick="calMonth=new Date(${y},${m - 1},1);render()">‹</button><h2 style="min-width:150px;text-align:center">${start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</h2><button class="btn btn-sm" onclick="calMonth=new Date(${y},${m + 1},1);render()">›</button><button class="btn btn-sm" onclick="calMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);render()">Today</button></div><span class="small muted">Click a day to book · click a meeting to edit</span></div>
    <div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="dh">${d}</div>`).join('')}${cells.slice(0, Math.ceil((off + days) / 7) * 7).map(d => { const e = evs(d); const today = d.toDateString() === new Date().toDateString(); return `<div class="dc ${d.getMonth() !== m ? 'other' : ''} ${today ? 'today' : ''}" onclick="apptModal(null,${d.getTime()})"><span class="num">${d.getDate()}</span>${e.map(l => `<div class="ev" onclick="event.stopPropagation();apptModal('${l.id}')" title="${esc(l.name)} · ${typeOf(l.appt)[1]}">${new Date(l.appt.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} ${esc(l.name.split(' ')[0])}${l.appt.link ? ' 🎥' : ''}</div>`).join('')}</div>`; }).join('')}</div></div>`;
  }
  const groups = [['Today', L.filter(l => l.appt.at >= sod && l.appt.at <= eod)], ['Upcoming', L.filter(l => l.appt.at > eod)], ['Past — update the outcome', L.filter(l => l.appt.at < sod && l.stage === 'Appointment Booked')]];
  if (mode === 'grid') return head + groups.map(([t, arr]) => `<h3 class="sec-h">${t} <span class="muted">${arr.length}</span></h3><div class="cards">${arr.map(l => leadCard(l, apptCard(l) + `<div class="lc-act">${actions(l)}</div>`)).join('') || '<div class="empty small">Nothing here</div>'}</div>`).join('');
  return head + groups.map(([t, arr]) => `<div class="card" style="margin-bottom:14px"><div class="card-h"><h2>${t}</h2><span class="small muted">${arr.length}</span></div><div class="card-b">${arr.length ? `<ul class="list-plain appt">${arr.map(l => `<li onclick="openLead('${l.id}')">${av(l.owner, 30)}<div style="flex:1;min-width:0"><b>${esc(l.name)}</b> <span class="small muted">· ${esc(l.stage)}</span><div class="small muted">${fmtDate(l.appt.at)} · ${l.appt.duration || 30} min · ${typeOf(l.appt)[1]}${l.appt.link ? ` · <a href="${esc(l.appt.link)}" target="_blank" onclick="event.stopPropagation()">${esc(l.appt.link)}</a>` : ''}</div></div><div style="display:flex;gap:6px;flex-wrap:wrap">${actions(l)}</div></li>`).join('')}</ul>` : '<div class="empty">Nothing here</div>'}</div></div>`).join('');
}

/* ---------------- migrate / defaults ---------------- */
function migrate() {
  S.notifs = S.notifs || []; S.rrMembers = S.rrMembers || TEAM.filter(t => t.role === 'sales').map(t => t.id);
  S.email = S.email || { provider: 'Gmail / Google Workspace', fromName: 'Quick Path Horizon', fromEmail: 'info@quickpathhorizon.com', host: 'smtp.gmail.com', port: 587, user: '', replyTo: '', connected: false, autoWelcome: true, autoProposal: true, autoPayment: false, staffAlerts: true };
  S.emailTpl = S.emailTpl || JSON.parse(JSON.stringify(EMAIL_TPL)); if (!S.emailTpl.some(t => t.id === 'meeting')) S.emailTpl.splice(1, 0, JSON.parse(JSON.stringify(EMAIL_TPL.find(t => t.id === 'meeting'))));
  S.leads.forEach(l => { l.emails = l.emails || []; l.contact = l.contact || {}; l.appt = l.appt || {}; });
  S.leads.filter(l => l.payment && l.payment.status === 'confirmed').forEach(l => openCaseFor(l, true));
  if (!S.notifs.length) {
    const push = (to, text, link, at) => S.notifs.push({ id: Math.random().toString(36).slice(2), to, text, link, at, read: false });
    [...S.leads].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8).forEach(l => { push(l.owner, `🆕 New ${l.source} lead assigned to you: ${l.name}${l.attr.campaign && l.attr.campaign !== '(none)' ? ' · ' + l.attr.campaign : ''}`, l.id, l.createdAt); push('u1', `🆕 New ${l.source} lead ${l.name} → ${user(l.owner).name}`, l.id, l.createdAt); });
    S.cases.slice(0, 5).forEach(c => push(c.owner, `🏢 New customer case ${c.id}: ${c.company}`, 'case:' + c.id, c.startedAt));
    S.leads.filter(l => l.payment && l.payment.status === 'pending').forEach(l => push('u1', `💰 Confirm payment ${aed(l.payment.amount)} · ref ${l.payment.ref} · ${l.name}`, l.id, l.payment.sentAt));
    S.notifs.sort((a, b) => b.at - a.at);
  }
  save();
}


migrate();
boot();
fetch('version.json?t=' + Date.now()).then(r => r.json()).then(v => { if (v.v > APP_V && sessionStorage.getItem('qph_reloaded') !== String(v.v)) { sessionStorage.setItem('qph_reloaded', String(v.v)); location.replace(location.pathname + '?v=' + v.v + location.hash); } }).catch(() => { });
