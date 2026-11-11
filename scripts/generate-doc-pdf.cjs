const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 64, bottom: 64, left: 56, right: 56 } });
const outPath = path.join(process.cwd(), 'docs', 'Savings-Dream-App-Documentation.pdf');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

// ---- Color palette ----
const C = {
  ink: '#0f172a',
  body: '#334155',
  muted: '#64748b',
  line: '#e2e8f0',
  emerald: '#059669',
  emeraldDark: '#047857',
  emeraldSoft: '#ecfdf5',
  amber: '#d97706',
  amberSoft: '#fffbeb',
  rose: '#e11d48',
  roseSoft: '#fff1f2',
  blue: '#2563eb',
  blueSoft: '#eff6ff',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  white: '#ffffff',
};

const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;
let y = doc.page.margins.top;

function ensure(space) {
  if (y + space > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
    y = doc.page.margins.top;
  }
}

function gap(h) { y += h; }

function heading(text, size = 16, color = C.ink, spaceBefore = 18, spaceAfter = 6) {
  ensure(spaceBefore + size + spaceAfter + 4);
  y += spaceBefore;
  doc.font('Helvetica-Bold').fontSize(size).fillColor(color).text(text, doc.page.margins.left, y, { width: W });
  y += size + spaceAfter;
  doc.font('Helvetica').fillColor(C.body);
}

function para(text, size = 10.5, color = C.body, lh = 15, spaceAfter = 6) {
  doc.font('Helvetica').fontSize(size).fillColor(color);
  const h = doc.heightOfString(text, { width: W, lineGap: lh - size * 1.15 });
  ensure(h + spaceAfter);
  doc.text(text, doc.page.margins.left, y, { width: W, lineGap: lh - size * 1.15 });
  y += h + spaceAfter;
}

function bullet(text, indent = 0, size = 10.5) {
  doc.font('Helvetica').fontSize(size).fillColor(C.body);
  const bx = doc.page.margins.left + indent + 6;
  const tx = bx + 10;
  const h = doc.heightOfString(text, { width: W - (tx - doc.page.margins.left), lineGap: 3 });
  ensure(h + 4);
  doc.fillColor(C.emerald).font('Helvetica-Bold').text('•', bx, y);
  doc.fillColor(C.body).font('Helvetica').text(text, tx, y, { width: W - (tx - doc.page.margins.left), lineGap: 3 });
  y += h + 4;
}

function numbered(n, text, indent = 0, size = 10.5) {
  doc.font('Helvetica').fontSize(size).fillColor(C.body);
  const bx = doc.page.margins.left + indent;
  const tx = bx + 22;
  const h = doc.heightOfString(text, { width: W - (tx - doc.page.margins.left), lineGap: 3 });
  ensure(h + 4);
  doc.fillColor(C.emerald).font('Helvetica-Bold').text(`${n}.`, bx, y);
  doc.fillColor(C.body).font('Helvetica').text(text, tx, y, { width: W - (tx - doc.page.margins.left), lineGap: 3 });
  y += h + 4;
}

function card(bg, title, bodyLines, opts = {}) {
  const pad = 14;
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(opts.titleColor || C.ink);
  const titleH = doc.heightOfString(title, { width: W - pad * 2 });
  doc.font('Helvetica').fontSize(10).fillColor(C.body);
  let bodyH = 0;
  for (const line of bodyLines) {
    if (line.type === 'sub') {
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(opts.subColor || C.emeraldDark);
      bodyH += doc.heightOfString(line.text, { width: W - pad * 2, lineGap: 3 }) + 3;
      doc.font('Helvetica').fontSize(10).fillColor(C.body);
    } else {
      bodyH += doc.heightOfString(line.text, { width: W - pad * 2, lineGap: 3 }) + (line.gap || 3);
    }
  }
  const cardH = pad + titleH + 8 + bodyH + pad;
  ensure(cardH + 10);
  doc.roundedRect(doc.page.margins.left, y, W, cardH, 12).fillColor(bg).fill();
  let cy = y + pad;
  doc.font('Helvetica-Bold').fontSize(10.5).fillColor(opts.titleColor || C.ink).text(title, doc.page.margins.left + pad, cy, { width: W - pad * 2 });
  cy += titleH + 8;
  for (const line of bodyLines) {
    if (line.type === 'sub') {
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(opts.subColor || C.emeraldDark).text(line.text, doc.page.margins.left + pad, cy, { width: W - pad * 2, lineGap: 3 });
      cy += doc.heightOfString(line.text, { width: W - pad * 2, lineGap: 3 }) + 3;
    } else {
      doc.font('Helvetica').fontSize(10).fillColor(C.body).text(line.text, doc.page.margins.left + pad, cy, { width: W - pad * 2, lineGap: 3 });
      cy += doc.heightOfString(line.text, { width: W - pad * 2, lineGap: 3 }) + (line.gap || 3);
    }
  }
  y += cardH + 10;
}

function formulaBox(title, formulaText, explainLines) {
  const pad = 14;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.ink);
  const titleH = doc.heightOfString(title, { width: W - pad * 2 });
  doc.font('Helvetica').fontSize(9).fillColor(C.emeraldDark);
  const formulaH = doc.heightOfString(formulaText, { width: W - pad * 2, lineGap: 3 });
  doc.font('Helvetica').fontSize(9.5).fillColor(C.body);
  let explainH = 0;
  for (const line of explainLines) {
    explainH += doc.heightOfString(line, { width: W - pad * 2, lineGap: 2.5 }) + 2.5;
  }
  const boxH = pad + titleH + 6 + formulaH + 8 + explainH + pad;
  ensure(boxH + 10);
  doc.roundedRect(doc.page.margins.left, y, W, boxH, 10).fillColor(C.slate50).lineWidth(1).strokeColor(C.line).fillAndStroke();
  let cy = y + pad;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.ink).text(title, doc.page.margins.left + pad, cy, { width: W - pad * 2 });
  cy += titleH + 6;
  doc.font('Helvetica').fontSize(9).fillColor(C.emeraldDark).text(formulaText, doc.page.margins.left + pad, cy, { width: W - pad * 2, lineGap: 3 });
  cy += formulaH + 8;
  doc.font('Helvetica').fontSize(9.5).fillColor(C.body);
  for (const line of explainLines) {
    doc.text(line, doc.page.margins.left + pad, cy, { width: W - pad * 2, lineGap: 2.5 });
    cy += doc.heightOfString(line, { width: W - pad * 2, lineGap: 2.5 }) + 2.5;
  }
  y += boxH + 10;
}

function divider() {
  ensure(20);
  y += 8;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + W, y).lineWidth(1).strokeColor(C.line).stroke();
  y += 12;
}

function tableOfEntries(entries) {
  ensure(entries.length * 18 + 20);
  for (const e of entries) {
    doc.font('Helvetica').fontSize(10).fillColor(C.muted).text(e.page, doc.page.margins.left + W - 30, y);
    doc.font('Helvetica').fontSize(10).fillColor(C.blue).text(e.title, doc.page.margins.left, y, { width: W - 50 });
    y += 18;
  }
}

// ============ COVER ============
doc.rect(0, 0, doc.page.width, doc.page.height).fill(C.slate50).fill();

// Decorative header band
doc.rect(0, 0, doc.page.width, 220).fill(C.emerald).fill();
doc.rect(0, 200, doc.page.width, 40).fill(C.emeraldDark).fill();

doc.font('Helvetica-Bold').fontSize(30).fillColor(C.white).text('Savings & Dream', 56, 70, { width: W });
doc.font('Helvetica-Bold').fontSize(30).fillColor(C.white).text('Planner App', 56, 105, { width: W });
doc.font('Helvetica').fontSize(13).fillColor(C.emeraldSoft).text('Complete Technical & Product Documentation', 56, 150, { width: W });
doc.font('Helvetica').fontSize(10).fillColor(C.emeraldSoft).text('AI Prediction Engine  •  Formula Reference  •  Architecture Overview', 56, 175, { width: W });

y = 280;
card(C.white, 'Document Summary', [
  { text: 'This document explains every feature of the Savings & Dream Planner application, what the app is for, how artificial intelligence is used throughout, and the exact mathematical formulas that power each prediction, score, and recommendation shown to the user.' },
  { text: '' },
  { text: 'Every calculation engine is covered in detail with its inputs, the formula, and a worked example so that a reader can verify the numbers the app displays.' },
  { text: '' },
  { text: 'Document version: 1.0', gap: 6 },
  { text: 'Date: November 2026', gap: 6 },
  { text: 'Status: Development / Sandbox mode (PayPal sandbox)', gap: 6 },
]);

card(C.emeraldSoft, 'Contents', [
  { type: 'sub', text: 'Part 1 — Product Overview' },
  { text: '1. What the App Is For', gap: 2 },
  { text: '2. Core Screens & User Journey', gap: 2 },
  { text: '3. PayPal Integration & Sandbox Data', gap: 2 },
  { type: 'sub', text: 'Part 2 — Data Model' },
  { text: '4. Database Tables & Relationships', gap: 2 },
  { text: '5. Row-Level Security & Safety Limits', gap: 2 },
  { type: 'sub', text: 'Part 3 — AI & Prediction Engine' },
  { text: '6. Budget Health Analysis', gap: 2 },
  { text: '7. AI Safe-Savings Prediction', gap: 2 },
  { text: '8. Adaptive AutoPay / AutoSave', gap: 2 },
  { text: '9. Goal Allocation Engine', gap: 2 },
  { text: '10. Completion Probability', gap: 2 },
  { text: '11. Goal Health Score', gap: 2 },
  { text: '12. Dream Planner Calculations', gap: 2 },
  { text: '13. Dream Readiness Score', gap: 2 },
  { text: '14. Protected Balance & Spending Impact', gap: 2 },
  { text: '15. Market Catalog Option Buckets', gap: 2 },
  { type: 'sub', text: 'Part 4 — Reference' },
  { text: '16. Formula Quick-Reference Table', gap: 2 },
  { text: '17. Sandbox Demo Data', gap: 2 },
  { text: '18. Glossary', gap: 2 },
], { titleColor: C.emeraldDark });

// ============ PAGE BREAK ============
doc.addPage();
y = doc.page.margins.top;

// ============ PART 1: PRODUCT OVERVIEW ============
heading('Part 1 — Product Overview', 18, C.emerald);
para('The Savings & Dream Planner is a personal finance application that helps individuals save toward meaningful life goals — a car, a motorbike or scooter, a trip, or any custom dream — by combining real PayPal transaction data with an AI engine that calculates how much they can safely set aside each month, whether they are on track, and when each dream becomes affordable.');

heading('1. What the App Is For', 13, C.ink);
para('Most savings apps treat goals as static targets. This app goes further: it reads the user\'s actual income and spending behaviour through PayPal, predicts a realistic monthly savings capacity, and tells the user four things for every dream they create:');
numbered(1, 'How much they can realistically save each month toward this dream.');
numbered(2, 'Whether they are on track to reach it by their target date.');
numbered(3, 'The expected affordability date — when they will have saved enough.');
numbered(4, 'What changes would help them reach the dream faster.');
para('The tone is deliberately encouraging. The app never uses phrases like "not reachable," "cannot afford," "unaffordable," "impossible," or "out of reach." Instead it uses motivating language: "Building Towards This Dream," "Future Affordability Forecast," "Projected Ownership Date," "Keep Going — Your Savings Are Growing," and "You\'re Making Progress."', 10.5, C.body, 15, 8);

heading('2. Core Screens & User Journey', 13, C.ink);
para('The app is organised into a dashboard and several focused views, each handling one responsibility:');

card(C.blueSoft, 'Dashboard', [
  { text: 'The home screen. Shows the AI Prediction Center (safe savings for next month, confidence score, reasoning items), a PayPal flow summary (income, expenses, available balance this month), a protected-balance card, goal allocation breakdown, dream readiness scores, and recent activity.' },
], { titleColor: C.blue });
gap(4);
card(C.blueSoft, 'Goals (Dream Folders)', [
  { text: 'Users create up to 5 dream folders. Each folder has a name, icon, colour, dream type (car / bike / travel / other), a target amount, and a target date. Money is deposited into folders via PayPal or manual entry, and can be withdrawn in an emergency. The 5-folder limit is enforced both in the interface and at the database level.' },
], { titleColor: C.blue });
gap(4);
card(C.blueSoft, 'Dream Planner', [
  { text: 'The AI analysis view for a single dream. Shows Saved So Far, Predicted Monthly Savings, Projected Savings by target date, and a Dream Readiness score (0–100) with a status of On Track, Building Momentum, or At Risk. Includes a projected affordability date, recommended monthly saving, an AI insight sentence, a list of ways to get there faster, and market options sorted into Ready Now, Within Your Target Date, and Future Possibilities.' },
], { titleColor: C.blue });
gap(4);
card(C.blueSoft, 'AutoPay / AutoSave', [
  { text: 'A card that calculates how much the user can safely automate per month, shows a safety buffer, and lets the user select up to 5 dream folders to fund automatically. Each selected dream gets its own AI-calculated monthly amount. The dream picker is a multi-select dropdown with checkboxes.' },
], { titleColor: C.blue });
gap(4);
card(C.blueSoft, 'Emergency Withdrawal', [
  { text: 'A controlled flow for withdrawing from a goal in a real emergency. The user picks a goal from a single-select dropdown, enters an amount and a reason, and confirms they understand it reduces progress. The app shows how the withdrawal changes saved-so-far, still-to-save, and the new monthly target, with warnings if the amount is large.' },
], { titleColor: C.blue });
gap(4);
card(C.blueSoft, 'Spending Protection', [
  { text: 'Before a large purchase, the user can check whether it would dip into protected goal savings. The app simulates the shortfall, identifies which goals would be delayed and by how many months, and flags the severity.' },
], { titleColor: C.blue });
gap(4);
card(C.blueSoft, 'Transaction History', [
  { text: 'A full log of every deposit, withdrawal, and emergency transaction across all goals, with PayPal order references where applicable.' },
], { titleColor: C.blue });

heading('3. PayPal Integration & Sandbox Data', 13, C.ink);
para('PayPal is the payment method for making deposits into dream folders. During development and testing the app runs against the PayPal sandbox (client-id "sb"), so no real money moves. When a deposit is approved, the app records a transaction in the database and updates the goal\'s progress; the app is a tracker, not a funds holder.');
para('The sandbox provides a demo account with a $50,000 salary inflow, $2,799 in outflows (Fuel $800, Food $450, Shopping $1,200, Subscription $299), and a PayPal balance of $52,450. This data feeds the AI engines so predictions display even without a real connected account.');
para('To go live, the sandbox client ID is replaced with a real PayPal Business client ID and a real settlement account is connected. The app does not custody money — it logs payment approvals and updates progress.');

// ============ PART 2: DATA MODEL ============
doc.addPage();
y = doc.page.margins.top;
heading('Part 2 — Data Model', 18, C.emerald);

heading('4. Database Tables & Relationships', 13, C.ink);
para('The app persists all data in a Supabase Postgres database. The key tables:');

card(C.slate50, 'savings_goals — Dream Folders', [
  { text: 'Each row is one dream folder. Columns: id (uuid), user_id (owner, defaults to auth.uid()), owner_key (legacy identifier), name, icon, color, dream_type (car | bike | travel | other), target_amount (numeric), target_date (date), created_at.' },
], { titleColor: C.ink });
gap(4);
card(C.slate50, 'goal_transactions — Deposits, Withdrawals, Emergencies', [
  { text: 'Each row is one transaction. Columns: id, goal_id (references savings_goals), kind (deposit | withdrawal | emergency), amount, note, payment_method (manual | paypal), paypal_order_id, created_at. The app sums deposits minus withdrawals to compute each goal\'s "saved" amount.' },
], { titleColor: C.ink });
gap(4);
card(C.slate50, 'autosave_settings — AutoPay Configuration', [
  { text: 'One row per user. Stores enabled, monthly_amount, goal_ids (uuid[] — the selected dreams for AutoPay), safety_buffer, recommended_amount, autopay_enabled, autopay_status, next_run_at, last_recalculated_at, last_transfer_at, transfer_count.' },
], { titleColor: C.ink });
gap(4);
card(C.slate50, 'income_history — Monthly Income Snapshots', [
  { text: 'Stores monthly_income and monthly_expenses per month (month_start). Used for trend analysis and income-stability calculations.' },
], { titleColor: C.ink });
gap(4);
card(C.slate50, 'budget_profiles & paypal_settings', [
  { text: 'budget_profiles stores a user\'s manual monthly income/expenses. paypal_settings stores the connected PayPal account: payer_id, account_name, account_email, avatar_url, account_status, paypal_balance, balance_available, connected_at, and isSandbox.' },
], { titleColor: C.ink });

heading('5. Row-Level Security & Safety Limits', 13, C.ink);
para('Every table has Row Level Security enabled. Users can only read and modify rows they own (checked via auth.uid() = user_id). Four separate policies per table cover SELECT, INSERT, UPDATE, and DELETE — no "FOR ALL" shortcuts.');
para('A database trigger, enforce_savings_goal_limit, runs BEFORE INSERT on savings_goals. It counts existing folders for the user (by user_id, falling back to owner_key when user_id is null) and raises a goal_limit_reached error if the count is 5 or more. This means the 5-dream-folder limit holds even if the interface is bypassed. The trigger function is SECURITY DEFINER with search_path = public, and EXECUTE is revoked from PUBLIC, anon, and authenticated so it cannot be called directly.');

// ============ PART 3: AI & PREDICTION ENGINE ============
doc.addPage();
y = doc.page.margins.top;
heading('Part 3 — AI & Prediction Engine', 18, C.emerald);
para('This is the core of the app. Every number the user sees is produced by one of the calculation engines below. Each is described with its inputs, the exact formula, and a worked example using the sandbox demo data.');

// --- 6. Budget Health ---
heading('6. Budget Health Analysis', 13, C.ink);
para('The foundation of every prediction. The analyzeBudget function takes monthly income and expenses and produces a health classification plus the safe monthly savings amount that all other engines build on.');

formulaBox(
  'Surplus & Expense Ratio',
  'surplus = monthlyIncome − monthlyExpenses\nexpenseRatio = monthlyExpenses / monthlyIncome  (0 if no income)\nsafeRate = min( max(0, surplus × 0.80) / monthlyIncome, 0.35 )\nsafeMonthlyAmount = monthlyIncome × safeRate',
  [
    'SAFE_CUSHION = 0.80 — only 80% of the surplus is considered safe to save, leaving a 20% buffer.',
    'MAX_SAVINGS_RATE = 0.35 — savings are never allowed to exceed 35% of income, preventing stress.',
    'Health classes: incomplete (no income), deficit (expenseRatio ≥ 1), tight (≥ 0.90), steady (≥ 0.70), strong (< 0.70).',
  ]
);

card(C.amberSoft, 'Worked Example (Sandbox)', [
  { text: 'Income $50,000; Expenses $2,799.' },
  { text: 'Surplus = 50,000 − 2,799 = $47,201' },
  { text: 'ExpenseRatio = 2,799 / 50,000 = 0.056 → health = "strong"' },
  { text: 'safeRate = min( 47,201 × 0.80 / 50,000, 0.35 ) = min(0.7552, 0.35) = 0.35 (capped)' },
  { text: 'safeMonthlyAmount = 50,000 × 0.35 = $17,500/month' },
], { titleColor: C.amber });

// --- 7. AI Safe-Savings Prediction ---
heading('7. AI Safe-Savings Prediction (computeAIPrediction)', 13, C.ink);
para('This engine predicts next month\'s safe savings capacity, a confidence score, and human-readable reasoning. It compares the current month to the previous month and applies trend adjustments.');

formulaBox(
  'Predicted Income & Expenses',
  'incomeDelta = currentIncome − prevIncome\npredictedIncome = round( currentIncome + incomeDelta × 0.3 )\npredictedExpenses = round( currentExpenses × (1 + expenseChangePercent × 0.002) )',
  [
    'Income is projected by carrying 30% of the recent delta forward — a dampened trend.',
    'Expenses use a 0.2% pull toward the expense-change percentage, so spending is assumed nearly stable.',
    'In sandbox mode current and previous income are equal (same month), so predictedIncome = currentIncome.',
  ]
);

formulaBox(
  'Safe Savings & Change',
  'currentSafe = analyzeBudget(current).safeMonthlyAmount\nnextSafe = analyzeBudget(predicted).safeMonthlyAmount\nchangeAmount = nextSafe − currentSafe\nchangePercent = round( changeAmount / currentSafe × 100 )\ndirection = up if > +2%, down if < −2%, else steady',
  [
    'Both the current and predicted budgets are run through analyzeBudget (Section 6).',
    'The change between them is what the dashboard headline reports.',
  ]
);

formulaBox(
  'Confidence Score',
  'baseConfidence = 70\ndataPoints = (transactions ? 8 : 0) + (incomeHistory × 5) + (budget ? 7 : 0)\nconfidenceScore = min( 97, baseConfidence + dataPoints )',
  [
    'Confidence starts at 70% and rises with more data sources.',
    'Each income-history month adds 5 points, a budget adds 7, transaction history adds 8.',
    'Capped at 97% — the model never claims certainty.',
  ]
);

card(C.emeraldSoft, 'Reasoning Items', [
  { text: 'The engine produces natural-language reasoning: income increase/decrease with dollar amount, food and entertainment spending changes (compared to 15% and 8% of prior expenses respectively), days maintaining a positive balance, and a stable-pattern fallback. These appear as the "AI Reasoning" list on the dashboard.' },
], { titleColor: C.emeraldDark });

// --- 8. Adaptive AutoPay ---
heading('8. Adaptive AutoPay / AutoSave', 13, C.ink);
para('The Adaptive AutoSave engine (calculateAdaptiveAutoSave) determines how much to automate per month, adjusting for income and expense trends over the last 6 months.');

formulaBox(
  'Base Amount & Safety Buffer',
  'safetyBuffer = max( 500, round( monthlyIncome × 0.10 ) )\nbaseAmount = min( max(0, surplus − safetyBuffer), monthlyIncome × 0.35 )',
  [
    'A safety buffer of at least $500 or 10% of income is reserved first.',
    'The base amount is the surplus minus that buffer, capped at 35% of income.',
  ]
);

formulaBox(
  '6-Month Trend Blend',
  'avgSurplus = avgIncome − avgExpenses  (last 6 months)\navgSafe = min( avgSurplus × 0.80, avgIncome × 0.35 )\nblendedBase = baseAmount × 0.60 + max(0, avgSafe) × 0.40',
  [
    '60% weight on this month\'s base, 40% on the 6-month average — smooths volatility.',
  ]
);

formulaBox(
  'Trend Adjustments',
  'Income drop ≥ 10%:  adjustment = −25% of blendedBase, trend = down\nExpense rise ≥ 15%: adjustment = −20% of blendedBase, trend = down\nIncome up ≥ 5% & expenses stable: adjustment = +15%, trend = up\nAvg surplus > 110% of current: adjustment = +10%, trend = up\nOtherwise: no adjustment, trend = steady\nfinalAmount = max(0, min( blendedBase + adjustment, income × 0.35 ))',
  [
    'The engine protects the user when income falls or spending spikes, and nudges savings up when income grows.',
  ]
);

card(C.amberSoft, 'Worked Example (Sandbox, no history)', [
  { text: 'Income $50,000, Expenses $2,799, surplus $47,201.' },
  { text: 'safetyBuffer = max(500, 5,000) = $5,000' },
  { text: 'baseAmount = min(47,201 − 5,000, 17,500) = min(42,201, 17,500) = $17,500 (capped at 35%)' },
  { text: 'With no income history, trend = steady, adjustment = 0.' },
  { text: 'AutoPay monthly amount = $17,500' },
], { titleColor: C.amber });

// --- 9. Goal Allocation ---
heading('9. Goal Allocation Engine', 13, C.ink);
para('When AutoPay is enabled for multiple dreams, the monthly pool is split across them. The allocation engine (allocateMonthlyContributions) distributes the safe savings capacity proportionally, prioritising goals by remaining amount and urgency.');

formulaBox(
  'Goal Scoring',
  'remaining = max(0, targetAmount − saved)\nmonthsRemaining = ceil( monthsUntil(targetDate) )\nrequiredMonthly = remaining / monthsRemaining\npriorityScore = round( remaining / totalRemaining × 100 )\nurgencyScore = round( min(1, 12 / monthsRemaining) × 100 )',
  [
    'priorityScore: how big this goal\'s gap is relative to all goals combined.',
    'urgencyScore: how soon the deadline is — 12 months or fewer scales up to 100.',
  ]
);

formulaBox(
  'Pool Distribution',
  'IF totalRequired ≤ pool (enough for all):\n  each goal gets requiredMonthly + surplus × (itsRemaining / totalRemaining)\nELSE (pool too small):\n  each goal gets pool × (itsRequiredMonthly / totalRequired)\nResult capped at each goal\'s remaining amount.',
  [
    'When there is enough capacity, each goal gets what it needs plus a share of the leftover.',
    'When there is not enough, capacity is split in proportion to each goal\'s required monthly amount.',
  ]
);

// --- 10. Completion Probability ---
heading('10. Completion Probability', 13, C.ink);
para('A logistic function estimates the likelihood (1–98%) that a goal will be reached given the remaining amount, time left, and the monthly amount being saved.');

formulaBox(
  'Logistic Probability',
  'ratio = (monthlyBudget × months) / remaining\nscore = 100 / (1 + e^( −6 × (ratio − 0.8) ))\nprobability = clamp( round(score), 1, 98 )',
  [
    'A ratio of 0.8 (saving 80% of what is needed) is the midpoint — ~50% probability.',
    'Above 0.8 the curve rises sharply; below it the probability drops.',
    'Capped at 98% so it never reads as guaranteed.',
  ]
);

card(C.amberSoft, 'Example', [
  { text: 'Remaining $10,000, 24 months, saving $500/month.' },
  { text: 'ratio = (500 × 24) / 10,000 = 1.2' },
  { text: 'score = 100 / (1 + e^(−6 × 0.4)) = 100 / (1 + 0.0907) ≈ 92%' },
  { text: 'Goal status: on-track (probability ≥ 70%)' },
], { titleColor: C.amber });

// --- 11. Goal Health Score ---
heading('11. Goal Health Score', 13, C.ink);
para('A composite score (0–100) blending savings consistency, income stability, and goal progress, with a grade of On Track, Needs Attention, or At Risk.');

formulaBox(
  'Three Sub-Scores (each 0–100)',
  'savingsConsistency = (consistencyRatio × 0.6 + amountRatio × 0.4) × 100\n  consistencyRatio = distinct saving months (last 6) / 6\n  amountRatio = min(1, avgMonthly / targetSafe)\nincomeStability = (1 − incomeVariance) × 100\n  variance = avg of |val − latest| / latest over last 6 incomes\n  (capped at 45 if income dropped ≥ 10%)\ngoalProgress = (avgPercent/100 × 0.5 + onTrackRatio × 0.5 − riskPenalty) × 100\n  riskPenalty = (atRiskGoals / totalGoals) × 0.3',
  [
    'consistencyRatio rewards saving in more distinct months.',
    'incomeStability penalises income volatility.',
    'goalProgress blends average completion % with the ratio of on-track goals, minus a penalty for at-risk goals.',
  ]
);

formulaBox(
  'Final Score & Grade',
  'score = clamp( round( savingsConsistency × 0.35 + incomeStability × 0.30 + goalProgress × 0.35 ), 0, 100 )\ngrade = On Track (≥ 70) | Needs Attention (≥ 40) | At Risk (< 40)',
  [
    'Savings consistency and goal progress carry the most weight (35% each); income stability 30%.',
  ]
);

// --- 12. Dream Planner ---
doc.addPage();
y = doc.page.margins.top;
heading('12. Dream Planner Calculations', 13, C.ink);
para('The Dream Planner (computeDreamPlan) is the most detailed engine. For a single dream it derives a realistic monthly savings rate from actual transaction history, then computes projected savings, readiness, affordability date, an AI insight, and recommended actions.');

heading('Monthly Baseline from Transactions', 11, C.emeraldDark);
formulaBox(
  'baselineFromTransactions',
  'Group transactions by month (YYYY-MM).\nmonthlyIncome = average of per-month income\nmonthlyExpenses = average of per-month expenses\nnets[] = per-month (income − expenses)\ntopExpense = highest single expense category\nmonthsObserved = number of distinct months',
  [
    'When PayPal sandbox is connected, this reads the sandbox transactions.',
    'Otherwise it falls back to the user\'s budget profile, then the last 3 income-history months.',
  ]
);

formulaBox(
  'Predicted Total Monthly Savings',
  'stability = clamp( 1 − coefficientOfVariation(nets), 0.5, 1 )\n  CoV = stdDev(nets) / |mean(nets)|\ncapacity = max(0, income − expenses) × 0.80 × stability\npredictedTotal = round( max( dreamDeposits, capacity ) )',
  [
    'Stability factor: income/expense consistency over observed months. Clamped 0.5–1.0.',
    '80% of the net is considered savable, scaled by how stable the user\'s finances are.',
    'Never falls below what the user is already depositing into dreams.',
  ]
);

formulaBox(
  'Per-Dream Monthly Savings Rate',
  'totalRemaining = Σ max(0, targetAmount − saved) across all goals\nshare = max(0, thisGoalRemaining) / totalRemaining\nIF the goal has an allocated monthly amount (from AutoPay):\n  monthlySavingsRate = round( min(allocated, predictedTotal) )\nELSE:\n  monthlySavingsRate = round( predictedTotal × share )',
  [
    'If AutoPay is active for this dream, its allocation is used (capped at the predicted total).',
    'Otherwise the dream gets its proportional share of the predicted total.',
    'Returns null when there is no transaction history — the UI then shows "Connect transaction history to receive forecast" instead of $0/mo.',
  ]
);

formulaBox(
  'Projected Savings by Target Date',
  'projectedSavingsByTargetDate = round( saved + monthlySavingsRate × monthsUntilTarget )',
  [
    'Linear projection: current savings plus the monthly rate applied for every month remaining.',
  ]
);

formulaBox(
  'Recommended Monthly Saving',
  'remaining = max(0, targetAmount − saved)\nrequiredMonthly = remaining / monthsUntilTarget  (or remaining if deadline passed)',
  [
    'This is the flat amount needed each month to hit the target by the deadline — the "pace" the user is measured against.',
  ]
);

formulaBox(
  'Affordability Date',
  'IF remaining ≤ 0: now (already affordable)\nIF monthlySavingsRate > 0: now + (remaining / monthlySavingsRate) months\nELSE: null (needs data)',
  [
    'The date the user will have saved the full target at their current predicted rate.',
  ]
);

card(C.emeraldSoft, 'AI Insight Sentence', [
  { text: 'Built from the status, rate, required amount, and affordability date. Examples:' },
  { text: 'On Track: "Based on your recent activity, you can realistically save about $X per month toward this dream. You are on track to reach it by [target date]."' },
  { text: 'Building Momentum: "...You are building momentum. Saving $Y each month keeps you on schedule for [target date]."' },
  { text: 'At Risk: "...Every contribution moves you closer. Saving $Y each month would bring [target date] within reach."' },
], { titleColor: C.emeraldDark });

card(C.blueSoft, 'Recommended Actions', [
  { text: 'On Track: keep contributions steady; turn on AutoPay.' },
  { text: 'Building Momentum / At Risk: save an extra $(required − rate) per month; trim top expense category; turn on AutoPay.' },
], { titleColor: C.blue });

// --- 13. Dream Readiness Score ---
heading('13. Dream Readiness Score', 13, C.ink);
para('A 0–100 score shown on the planner with a status pill: On Track, Building Momentum, or At Risk. Five weighted factors compose it.');

formulaBox(
  'Readiness Factors (total 100)',
  'Progress      35 pts — clamp( saved / targetAmount, 0, 1 ) × 35\nPace          30 pts — clamp( rate / requiredMonthly, 0, 1 ) × 30  (30 if remaining = 0)\nStability     15 pts — clamp(1 − CoV(nets), 0, 1) × 15  (10 if < 2 months)\nSpending      10 pts — clamp(1 − expenses/income, 0, 1) × 10\nLiquidity     10 pts — clamp( balance / remaining, 0, 1 ) × 10  (10 if remaining = 0)\nreadinessScore = clamp( round( sum ), 0, 100 )',
  [
    'Progress (35%): how close the saved amount is to the target.',
    'Pace (30%): whether the current monthly rate meets the required monthly rate.',
    'Stability (15%): income/expense consistency from the baseline.',
    'Spending (10%): how much of income is not consumed by expenses.',
    'Liquidity (10%): PayPal balance relative to the remaining gap.',
  ]
);

formulaBox(
  'Status Thresholds',
  'on_track         if remaining ≤ 0 OR score ≥ 75\nbuilding_momentum if score ≥ 45\nat_risk          otherwise',
  [
    'A goal that is fully funded is automatically On Track regardless of other factors.',
  ]
);

card(C.amberSoft, 'Example', [
  { text: 'Saved $5,000 of $15,000 target; rate $1,000/mo; required $650/mo; balance $52,450; stable income.' },
  { text: 'Progress = 0.333 × 35 = 11.7' },
  { text: 'Pace = min(1, 1000/650) × 30 = 30' },
  { text: 'Stability ≈ 15; Spending ≈ 10; Liquidity = min(1, 52450/10000) × 10 = 10' },
  { text: 'Score ≈ 77 → On Track' },
], { titleColor: C.amber });

// --- 14. Protected Balance & Spending Impact ---
heading('14. Protected Balance & Spending Impact', 13, C.ink);
para('Goal savings are "protected" so the app can warn before a large purchase dips into them.');

formulaBox(
  'Protected Balance',
  'totalBalance = paypalBalance\nprotectedBalance = min( totalSaved, totalBalance )\nspendableBalance = max( 0, totalBalance − protectedBalance )',
  [
    'The portion of the PayPal balance that is backed by goal savings is protected.',
    'Only the remainder is freely spendable.',
  ]
);

formulaBox(
  'Spending Impact Simulation',
  'spendableAfter = spendableBalance − purchaseAmount\nwouldBorrowFromGoals = spendableAfter < 0\nshortfall = |spendableAfter|\nGoals sorted by saved (desc); shortfall taken from each in turn.\nFor each affected goal:\n  newSaved = saved − taken\n  newProjectedDate = now + (newRemaining / allocatedMonthly) months\n  delayMonths = newMonths − oldMonths\nseverity = danger if maxDelay ≥ 3 months, else warning',
  [
    'The app tells the user exactly which goals are delayed and by how many months before they spend.',
  ]
);

// --- 15. Market Catalog ---
heading('15. Market Catalog Option Buckets', 13, C.ink);
para('For car, bike, and travel dreams, the planner pulls real market items from a catalog and sorts them into three buckets based on the user\'s monthly savings rate and target date.');

formulaBox(
  'Option Classification',
  'For each candidate item:\n  remaining = itemPrice − currentSaved\n  monthsToAfford = remaining / monthlyRate  (if rate > 0)\n  expectedDate = now + monthsToAfford\n  byTarget = monthsToAfford ≤ monthsUntilTarget\n\nbucket = affordable_now        if remaining ≤ 0\n         affordable_by_target   if byTarget\n         stretch                otherwise',
  [
    'Ready Now: already affordable with current savings.',
    'Within Your Target Date: affordable before the deadline at the current rate.',
    'Future Possibilities: affordable later, shown as aspirational options (capped at 6).',
  ]
);

formulaBox(
  'Option Readiness Score',
  'progressScore = min(100, saved / itemPrice × 100) × 0.4\nneededMonthly = (itemPrice − saved) / monthsToAfford\ncapacityRatio = min(1, monthlyRate / neededMonthly)\nprobabilityScore = capacityRatio × 100 × 0.4\nconsistencyScore = 20 if monthlyRate > 0, else 10\noptionScore = clamp( round( progress + probability + consistency ), 0, 100 )',
  [
    'Each option gets its own readiness score so the user can compare how close each item is.',
  ]
);

// ============ PART 4: REFERENCE ============
doc.addPage();
y = doc.page.margins.top;
heading('Part 4 — Reference', 18, C.emerald);

heading('16. Formula Quick-Reference Table', 12, C.ink);

const rows = [
  ['Safe Monthly Savings', 'income × min( surplus×0.8/income, 0.35 )', 'Cap 35% of income; 80% of surplus'],
  ['Predicted Income', 'currentIncome + incomeDelta × 0.3', '30% of recent change carried forward'],
  ['Confidence Score', 'min( 97, 70 + dataPoints )', 'dataPoints from history, budget, txns'],
  ['AutoPay Base', 'min( surplus − safetyBuffer, income×0.35 )', 'safetyBuffer = max(500, 10% income)'],
  ['AutoPay Blended', 'base×0.6 + avgSafe×0.4', '6-month trend blended with current'],
  ['Completion Probability', '100 / (1 + e^(−6(ratio−0.8)))', 'Logistic; ratio = budget×months/remaining'],
  ['Goal Health', 'consistency×0.35 + stability×0.30 + progress×0.35', 'Clamped 0–100'],
  ['Dream Readiness', 'progress×35 + pace×30 + stability×15 + spending×10 + liquidity×10', 'Clamped 0–100'],
  ['Predicted Total Savings', 'max( deposits, (income−expense)×0.8×stability )', 'Stability = 1 − CoV of monthly nets'],
  ['Monthly Savings Rate', 'min( allocated, predictedTotal ) or predictedTotal × share', 'Per-dream; null without history'],
  ['Projected by Target', 'saved + rate × monthsUntilTarget', 'Linear projection'],
  ['Affordability Date', 'now + remaining / rate', 'When full target is saved'],
  ['Protected Balance', 'min( totalSaved, paypalBalance )', 'Savings-backed portion is locked'],
];

const colW = [150, 175, 145];
const rowH = 28;
ensure(20 + (rows.length + 1) * rowH);
// header
doc.font('Helvetica-Bold').fontSize(9).fillColor(C.white);
doc.rect(doc.page.margins.left, y, colW[0] + colW[1] + colW[2], rowH).fill(C.emerald);
doc.text('Metric', doc.page.margins.left + 8, y + 9, { width: colW[0] - 12 });
doc.text('Formula', doc.page.margins.left + colW[0] + 8, y + 9, { width: colW[1] - 12 });
doc.text('Notes', doc.page.margins.left + colW[0] + colW[1] + 8, y + 9, { width: colW[2] - 12 });
y += rowH;
doc.font('Helvetica').fontSize(8.5).fillColor(C.body);
for (let i = 0; i < rows.length; i++) {
  const [m, f, n] = rows[i];
  if (i % 2 === 0) {
    doc.rect(doc.page.margins.left, y, colW[0] + colW[1] + colW[2], rowH).fill(C.slate50);
  }
  doc.fillColor(C.ink).font('Helvetica-Bold').text(m, doc.page.margins.left + 8, y + 4, { width: colW[0] - 12 });
  doc.fillColor(C.emeraldDark).font('Helvetica').text(f, doc.page.margins.left + colW[0] + 8, y + 4, { width: colW[1] - 12, lineGap: 2 });
  doc.fillColor(C.muted).font('Helvetica').text(n, doc.page.margins.left + colW[0] + colW[1] + 8, y + 4, { width: colW[2] - 12, lineGap: 2 });
  y += rowH;
}
y += 10;

// --- 17. Sandbox Demo Data ---
heading('17. Sandbox Demo Data', 12, C.ink);
card(C.slate50, 'PayPal Sandbox Demo Account', [
  { type: 'sub', text: 'Account' },
  { text: 'Payer ID: SBXRAHUL0001' },
  { text: 'Status: Verified' },
  { text: 'PayPal Balance: $52,450' },
  { text: '' },
  { type: 'sub', text: 'Transactions' },
  { text: 'Salary Credit: +$50,000 (Nov 1)' },
  { text: 'Fuel: −$800 (Nov 3)' },
  { text: 'Food: −$450 (Nov 4)' },
  { text: 'Shopping: −$1,200 (Nov 5)' },
  { text: 'Subscription: −$299 (Nov 6)' },
  { text: '' },
  { type: 'sub', text: 'Derived' },
  { text: 'Monthly income: $50,000 | Monthly expenses: $2,799 | Net: $47,201' },
], { titleColor: C.ink });

// --- 18. Glossary ---
heading('18. Glossary', 12, C.ink);
const glossary = [
  ['Surplus', 'Monthly income minus monthly expenses.'],
  ['Safe Monthly Amount', 'The amount the AI says can be saved without financial stress (80% of surplus, capped at 35% of income).'],
  ['Coefficient of Variation (CoV)', 'Standard deviation divided by the mean of monthly net amounts. Lower = more stable.'],
  ['Stability Factor', '1 − CoV, clamped to [0.5, 1]. Used to scale predicted savings capacity.'],
  ['Allocated Monthly', 'The amount AutoPay assigns to a specific dream from the shared monthly pool.'],
  ['Required Monthly', 'The flat amount needed each month to hit a goal by its target date.'],
  ['Readiness Score', '0–100 composite score for how ready a dream is, combining progress, pace, stability, spending, and liquidity.'],
  ['Affordability Date', 'The projected date the user will have saved the full target at the current rate.'],
  ['Protected Balance', 'The portion of the PayPal balance backed by goal savings — not freely spendable.'],
  ['Option Bucket', 'Market items classified as Ready Now, Within Target Date, or Future Possibility.'],
  ['Dream Folder', 'A user-created savings goal (car, bike, travel, or other) with a target and deadline. Maximum 5.'],
  ['AutoPay / AutoSave', 'The automated monthly contribution system that splits a safe savings pool across selected dreams.'],
];

for (const [term, def] of glossary) {
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.emeraldDark);
  const termH = doc.heightOfString(term, { width: 130 });
  doc.font('Helvetica').fontSize(10).fillColor(C.body);
  const defH = doc.heightOfString(def, { width: W - 140, lineGap: 3 });
  ensure(Math.max(termH, defH) + 6);
  doc.font('Helvetica-Bold').fontSize(10).fillColor(C.emeraldDark).text(term, doc.page.margins.left, y, { width: 130 });
  doc.font('Helvetica').fontSize(10).fillColor(C.body).text(def, doc.page.margins.left + 140, y, { width: W - 140, lineGap: 3 });
  y += Math.max(termH, defH) + 6;
}

doc.end();
stream.on('finish', () => {
  console.log('PDF written to: ' + outPath);
  const stat = fs.statSync(outPath);
  console.log('Size: ' + (stat.size / 1024).toFixed(1) + ' KB');
});
