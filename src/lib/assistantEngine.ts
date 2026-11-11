import { ASSUMED_ANNUAL_INFLATION, type ForecastCenterData } from '@/lib/forecastEngine';
import { formatMoney } from '@/lib/format';
import type { GoalWithSaved } from '@/types';

export interface AssistantContext {
  protectedSavings: number;
  spendableBalance: number;
  forecast: ForecastCenterData;
  goals: GoalWithSaved[];
  now: Date;
}

export interface AssistantState {
  goalId: string | null;
}

export interface AssistantReply {
  text: string;
  followUps: string[];
  goalId: string | null;
}

type Draft = { text: string; followUps?: string[]; goalId?: string };

const DAY_MS = 86_400_000;
const AVG_DAYS_PER_MONTH = 30.4;
const WEEKS_PER_MONTH = 4.3;
const SALE_DISCOUNT_ESTIMATE = 0.1;
const SALE_LOOKAHEAD_DAYS = 120;
const NO_DATA_TEXT = 'I need your numbers before I can answer that. Connect your PayPal account or set up your budget first.';
const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
export const DEFAULT_FOLLOW_UPS = [
  'How much can I save by Christmas?',
  'Why did my savings forecast change?',
  'How will inflation affect my savings?',
];

export function buildOpeningReply(ctx: AssistantContext): AssistantReply {
  if (!ctx.forecast.hasData) {
    return { text: `Hi, I am your DreamBank AI Assistant. ${NO_DATA_TEXT}`, followUps: [], goalId: null };
  }
  const next = ctx.forecast.upcomingEvents[0];
  const alert = next && next.daysAway <= SALE_LOOKAHEAD_DAYS
    ? ` ${next.event.name} is in ${next.daysAway} days, so seasonal spending is coming. Ask me how to prepare.`
    : '';
  return {
    text: `Hi, I am your DreamBank AI Assistant. Based on your current habits you can save about ${formatMoney(ctx.forecast.formula.predictedSavings)} this month.${alert} Ask me anything about your money, goals or future.`,
    followUps: DEFAULT_FOLLOW_UPS,
    goalId: null,
  };
}

export function answerQuestion(question: string, ctx: AssistantContext, state: AssistantState): AssistantReply {
  if (!ctx.forecast.hasData) return { text: NO_DATA_TEXT, followUps: [], goalId: state.goalId };
  const q = question.toLowerCase();
  const goal = focusGoal(ctx, state, findGoal(q, ctx.goals));
  const draft = routeQuestion(q, ctx, goal);
  return {
    text: draft.text,
    followUps: draft.followUps ?? DEFAULT_FOLLOW_UPS,
    goalId: draft.goalId ?? goal?.id ?? null,
  };
}

function routeQuestion(q: string, ctx: AssistantContext, goal: GoalWithSaved | null): Draft {
  if (/inflation/.test(q) && /(rise|rises|increase|higher|goes up|jump|spike)/.test(q)) return inflationRiseDraft(q, ctx);
  if (/(fuel|petrol|gas price)/.test(q) && /(increase|rise|rises|go up|higher|spike)/.test(q)) return fuelDraft(q, ctx);
  if (/\bsave\b/.test(q) && /(daily|a day|per day|every day)/.test(q)) return dailySaveDraft(q, ctx, goal);
  if (/(eat|food|grocer|dining|restaurant|takeout|take-out)/.test(q) && /(reduc|cut|less|lower|skip|stop)/.test(q)) return foodDraft(q, ctx, goal);
  if (/afford/.test(q)) return affordDraft(q, ctx, goal);
  if (/\bwhy\b/.test(q)) return whyDraft(ctx);
  if (/(reach|achiev|complet|how long|when will|before|finish)/.test(q) && goal) return timelineDraft(q, ctx, goal);
  if (/weekend/.test(q)) return weekendDraft(ctx, goal);
  if (/inflation/.test(q)) return inflationDraft(ctx);
  if (/(\bnow\b|\bwait|good time|should i buy|sale|discount)/.test(q)) return timingDraft(q, ctx, goal);
  if (/\bsav(e|ing|ings)\b/.test(q) && (targetDateIn(q, ctx.now) || /how much/.test(q))) return savingsByDateDraft(q, ctx);
  if (/(alert|opportunit|tip|advice|suggest)/.test(q)) return timingDraft('', ctx, goal);
  return fallbackDraft();
}

function inflationRiseDraft(q: string, ctx: AssistantContext): Draft {
  const f = ctx.forecast.formula;
  const rate = percentIn(q) ?? 5;
  const totalExpenses = f.regularExpenses + f.irregularAllowance;
  const newImpact = (totalExpenses * rate) / 100 / 12;
  const newSavings = Math.max(0, Math.round(f.predictedSavings + f.inflationImpact - newImpact));
  return {
    text: `If inflation ran at ${rate}% a year, the monthly inflation impact on your costs would move from ${formatMoney(f.inflationImpact)} to ${formatMoney(Math.round(newImpact))}. That changes your predicted savings from ${formatMoney(f.predictedSavings)} to ${formatMoney(newSavings)}.`,
    followUps: ['Why did my savings forecast change?', 'What if fuel prices increase?'],
  };
}

function fuelDraft(q: string, ctx: AssistantContext): Draft {
  const f = ctx.forecast.formula;
  const rate = percentIn(q) ?? 15;
  const fuel = categoryTotal(ctx, ['Transportation']);
  if (fuel === 0) {
    return { text: `I have no transportation spending recorded this month, so a ${rate}% rise in fuel prices would not change your forecast yet.` };
  }
  const extra = Math.round((fuel * rate) / 100);
  const newSavings = Math.max(0, f.predictedSavings - extra);
  return {
    text: `If fuel prices rose ${rate}%, your transportation costs would increase by about ${formatMoney(extra)} a month. Your predicted savings would move from ${formatMoney(f.predictedSavings)} to ${formatMoney(newSavings)}.`,
    followUps: ['What if inflation rises?', 'What if I reduce eating out by 20%?'],
  };
}

function dailySaveDraft(q: string, ctx: AssistantContext, goal: GoalWithSaved | null): Draft {
  const match = q.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:extra\s*)?(?:daily|a day|per day|every day)/);
  if (!match) return fallbackDraft();
  const perDay = Number(match[1].replace(/,/g, ''));
  const base = ctx.forecast.formula.predictedSavings;
  const extra = Math.round(perDay * 30);
  return {
    text: `Saving an extra ${formatMoney(perDay)} a day adds about ${formatMoney(extra)} a month. Your predicted savings would rise from ${formatMoney(base)} to ${formatMoney(base + extra)}.${timelineNote(goal, base, extra)}`,
    goalId: goal?.id,
    followUps: ['What if I reduce eating out by 20%?', 'Can I reach my goal before next year?'],
  };
}

function foodDraft(q: string, ctx: AssistantContext, goal: GoalWithSaved | null): Draft {
  const base = ctx.forecast.formula.predictedSavings;
  const rate = percentIn(q) ?? 20;
  const spend = categoryTotal(ctx, ['Groceries', 'Entertainment']);
  const extra = Math.round((spend * rate) / 100);
  return {
    text: `Cutting food and eating-out spending by ${rate}% frees up about ${formatMoney(extra)} a month. Your monthly savings would rise from ${formatMoney(base)} to ${formatMoney(base + extra)}.${timelineNote(goal, base, extra)} Small changes in everyday spending are the fastest way to speed up your goals.`,
    goalId: goal?.id,
    followUps: ['What if I save 100 extra daily?', 'Why did my savings forecast change?'],
  };
}

function affordDraft(q: string, ctx: AssistantContext, goal: GoalWithSaved | null): Draft {
  const price = amountIn(q) ?? goal?.targetAmount ?? null;
  if (price === null) {
    return { text: 'Tell me the price, for example "Can I afford a $1,200 laptop by June?"', goalId: goal?.id };
  }
  const base = ctx.forecast.formula.predictedSavings;
  const target = targetDateIn(q, ctx.now) ?? { date: ctx.now, label: 'right now' };
  const available = ctx.spendableBalance + base * monthsBetween(target.date, ctx.now);

  if (available >= price) {
    return {
      text: `Yes. You could have about ${formatMoney(Math.round(available))} available ${target.label}, which covers the ${formatMoney(price)} cost with ${formatMoney(Math.round(available - price))} to spare.`,
      goalId: goal?.id,
    };
  }

  const shortfall = Math.round(price - available);
  const monthsNeeded = base > 0 ? Math.ceil((price - ctx.spendableBalance) / base) : null;
  const pace = monthsNeeded !== null
    ? ` At your current pace, you would have enough in about ${monthsNeeded} months.`
    : ' Your predicted savings are currently zero, so you would need to increase your savings first.';
  return {
    text: `Not yet. You would have about ${formatMoney(Math.round(available))} available ${target.label}, which is ${formatMoney(shortfall)} short.${pace}`,
    goalId: goal?.id,
    followUps: ['What if I reduce eating out by 20%?', 'Is now a good time to buy this?'],
  };
}

function whyDraft(ctx: AssistantContext): Draft {
  const f = ctx.forecast.formula;
  const drains = [
    { label: 'regular expenses', amount: f.regularExpenses },
    { label: 'seasonal spending', amount: f.seasonalExpenses },
    { label: 'inflation', amount: f.inflationImpact },
    { label: 'irregular spending', amount: f.irregularAllowance },
  ].sort((a, b) => b.amount - a.amount);
  const top = drains[0];
  const largest = ctx.forecast.spending.categories[0];

  let text = `I don't have last month's forecast saved yet, so I can explain today's drivers. Your predicted savings are ${formatMoney(f.predictedSavings)} this month, and the biggest factor is ${top.label} at ${formatMoney(top.amount)}.`;
  if (largest) text += ` Your largest category is ${largest.label.toLowerCase()} at ${formatMoney(largest.amount)}.`;
  if (f.seasonalExpenses > 0) text += ` Upcoming events add a seasonal reserve of ${formatMoney(f.seasonalExpenses)} a month.`;
  text += ' Lowering irregular spending is usually the quickest way to raise your savings.';
  return { text };
}

function timelineDraft(q: string, ctx: AssistantContext, goal: GoalWithSaved): Draft {
  const base = ctx.forecast.formula.predictedSavings;
  const remaining = Math.max(0, goal.targetAmount - goal.saved);
  if (remaining === 0) return { text: `${goal.name} is already fully funded. Well done.`, goalId: goal.id };
  if (base <= 0) {
    return {
      text: `Your predicted savings are ${formatMoney(0)} this month, so I can't project when ${goal.name} will be reached yet. Reducing spending would create room to save.`,
      goalId: goal.id,
    };
  }

  const months = Math.ceil(remaining / base);
  const finish = addMonths(ctx.now, months);
  let text = `At about ${formatMoney(base)} a month, you could reach ${goal.name} in about ${months} months, around ${formatMonthYear(finish)}, with an estimated confidence of ${confidenceFor(ctx)}%.`;

  const target = targetDateIn(q, ctx.now);
  if (target) {
    const targetMonths = monthsBetween(target.date, ctx.now);
    text += months <= targetMonths
      ? ` You would be on track ${target.label}.`
      : ` You would fall about ${months - targetMonths} months short of your target ${target.label}.`;
  }

  text += ` This assumes your predicted savings go to ${goal.name}. Eating out or weekend spending cuts would bring the date closer.`;
  return {
    text,
    goalId: goal.id,
    followUps: ['What if I reduce eating out by 20%?', 'What if I save 100 extra daily?'],
  };
}

function weekendDraft(ctx: AssistantContext, goal: GoalWithSaved | null): Draft {
  const { weekdayTotal, weekendTotal } = ctx.forecast.spending;
  const spent = weekdayTotal + weekendTotal;
  if (spent === 0) return { text: 'I have no spending recorded this month yet, so I can not compare weekends with weekdays.', goalId: goal?.id };
  const share = Math.round((weekendTotal / spent) * 100);
  const extra = Math.round(weekendTotal * 0.2);
  return {
    text: `${share}% of your spending this month happened on weekends, about ${formatMoney(weekendTotal)}. A weekend budget that is 20% lower would free up about ${formatMoney(extra)} a month.${timelineNote(goal, ctx.forecast.formula.predictedSavings, extra)}`,
    goalId: goal?.id,
    followUps: ['What if I reduce eating out by 20%?', 'Why did my savings forecast change?'],
  };
}

function inflationDraft(ctx: AssistantContext): Draft {
  const f = ctx.forecast.formula;
  return {
    text: `DreamBank AI assumes inflation of ${Math.round(ASSUMED_ANNUAL_INFLATION * 100)}% a year. That adds about ${formatMoney(f.inflationImpact)} to your monthly costs, or ${formatMoney(f.inflationImpact * 12)} over a year, and your predicted savings already account for it.`,
    followUps: ['What if inflation rises to 6%?', 'How much can I save by Christmas?'],
  };
}

function timingDraft(q: string, ctx: AssistantContext, goal: GoalWithSaved | null): Draft {
  const price = amountIn(q) ?? goal?.targetAmount ?? null;
  const next = ctx.forecast.upcomingEvents.find((item) => item.daysAway <= SALE_LOOKAHEAD_DAYS);
  if (next) {
    const priceNote = price !== null
      ? ` On a ${formatMoney(price)} purchase, that is about ${formatMoney(Math.round(price * SALE_DISCOUNT_ESTIMATE))} saved.`
      : '';
    return {
      text: `Waiting until ${next.event.name} in ${next.daysAway} days could lower prices by about ${Math.round(SALE_DISCOUNT_ESTIMATE * 100)}%, based on typical seasonal sales.${priceNote} Keep saving until then, since the money you keep can also bring your goal closer.`,
      goalId: goal?.id,
      followUps: ['How much can I save by Christmas?', 'Can I afford it by Christmas?'],
    };
  }
  const canAfford = price !== null && ctx.spendableBalance >= price;
  return {
    text: canAfford && price !== null
      ? `No major sale period is in the next ${SALE_LOOKAHEAD_DAYS} days, and your spendable balance covers the ${formatMoney(price)} cost. Buying now is reasonable if it fits your plan.`
      : `No major sale period is in the next ${SALE_LOOKAHEAD_DAYS} days. Keep saving, and buy once your spendable balance covers the price.`,
    goalId: goal?.id,
  };
}

function savingsByDateDraft(q: string, ctx: AssistantContext): Draft {
  const target = targetDateIn(q, ctx.now) ?? { date: addMonths(ctx.now, 3), label: 'in 3 months' };
  const base = ctx.forecast.formula.predictedSavings;
  const projected = ctx.protectedSavings + base * monthsBetween(target.date, ctx.now);
  return {
    text: `Based on your current spending habits, you could have about ${formatMoney(Math.round(projected))} saved ${target.label}, with an estimated confidence of ${confidenceFor(ctx)}%. This starts from your ${formatMoney(ctx.protectedSavings)} in protected savings and adds about ${formatMoney(base)} a month after regular bills, seasonal spending and inflation.`,
    followUps: ['Can I afford a new laptop by June?', 'What if I reduce eating out by 20%?'],
  };
}

function fallbackDraft(): Draft {
  return {
    text: 'I can answer questions about your savings, goals, affordability, seasonal spending, inflation and what-if scenarios. Try asking about one of them.',
  };
}

function timelineNote(goal: GoalWithSaved | null, base: number, extra: number): string {
  if (!goal) return '';
  const remaining = Math.max(0, goal.targetAmount - goal.saved);
  if (remaining === 0 || base <= 0) return '';
  const boosted = base + extra;
  const before = Math.ceil(remaining / base);
  const after = boosted > 0 ? Math.ceil(remaining / boosted) : Infinity;
  const weeks = Math.round((before - after) * WEEKS_PER_MONTH);
  if (weeks <= 0) return '';
  return ` That could help you reach ${goal.name} about ${weeks} weeks earlier.`;
}

function confidenceFor(ctx: AssistantContext): number {
  return ctx.forecast.spending.categories.length > 0 ? 87 : 70;
}

function categoryTotal(ctx: AssistantContext, labels: string[]): number {
  return ctx.forecast.spending.categories
    .filter((category) => labels.includes(category.label))
    .reduce((sum, category) => sum + category.amount, 0);
}

function wordsIn(text: string): string[] {
  return text.toLowerCase().split(/[^a-z]+/).filter((word) => word.length > 2);
}

function findGoal(q: string, goals: GoalWithSaved[]): GoalWithSaved | null {
  const words = new Set(wordsIn(q));
  return goals.find((goal) => wordsIn(goal.name).some((word) => words.has(word))) ?? null;
}

function focusGoal(ctx: AssistantContext, state: AssistantState, mentioned: GoalWithSaved | null): GoalWithSaved | null {
  if (mentioned) return mentioned;
  const remembered = ctx.goals.find((goal) => goal.id === state.goalId && goal.saved < goal.targetAmount);
  return remembered ?? ctx.goals.find((goal) => goal.saved < goal.targetAmount) ?? null;
}

function percentIn(q: string): number | null {
  const match = q.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? Number(match[1]) : null;
}

function amountIn(q: string): number | null {
  const cleaned = q
    .replace(/\d+(?:\.\d+)?\s*%/g, ' ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ')
    .replace(/\d+\s*(?:months?|days?)\b/g, ' ');
  const match = cleaned.match(/\d[\d,]*(?:\.\d+)?/);
  return match ? Number(match[0].replace(/,/g, '')) : null;
}

function monthsBetween(target: Date, now: Date): number {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (DAY_MS * AVG_DAYS_PER_MONTH)));
}

function addMonths(now: Date, months: number): Date {
  return new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
}

function nextOccurrence(month: number, day: number, now: Date): Date {
  const thisYear = new Date(now.getFullYear(), month, day);
  return thisYear > now ? thisYear : new Date(now.getFullYear() + 1, month, day);
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function targetDateIn(q: string, now: Date): { date: Date; label: string } | null {
  const monthsMatch = q.match(/(?:next|in)\s+(\d+)\s+months?/);
  if (monthsMatch) {
    const count = Number(monthsMatch[1]);
    return { date: addMonths(now, count), label: `in ${count} months` };
  }
  if (q.includes('christmas')) return { date: nextOccurrence(11, 25, now), label: 'by Christmas' };
  if (q.includes('new year')) return { date: nextOccurrence(0, 1, now), label: "by New Year's Day" };
  if (q.includes('next year')) return { date: nextOccurrence(0, 1, now), label: 'by next year' };
  const monthIndex = MONTH_NAMES.findIndex((name) => new RegExp(`\\b${name}\\b`).test(q));
  if (monthIndex >= 0) {
    const name = MONTH_NAMES[monthIndex];
    return { date: nextOccurrence(monthIndex, 1, now), label: `by ${name[0].toUpperCase()}${name.slice(1)}` };
  }
  return null;
}
