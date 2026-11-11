const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MODEL = "gpt-4o-mini";
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1000;
const MAX_SNAPSHOT_CHARS = 12000;

const SYSTEM_PROMPT = `You are DreamBank AI, a personal financial advisor inside a savings app.
You answer any question about the user's money, purchases, travel, transport, daily life decisions, goals, savings, investments, lifestyle changes, emergencies and future plans.

Rules:
- Ground every answer in the FINANCIAL SNAPSHOT below. Quote its figures exactly and never invent balances, income or goal amounts.
- Show your calculation in plain language, for example "$450 a month over 4 months is $1,800".
- Explain why the prediction is what it is and which factors drive it.
- End with one or two specific, actionable recommendations that would improve the outcome.
- Cost estimates for things outside the snapshot (a bike trip, a PS5, a gym membership) come from general knowledge. Label them as estimates, give a typical range, and suggest checking local prices. You do not have live market, fuel or inflation feeds.
- Amounts are in US dollars unless the snapshot says otherwise. The user's exact country is unknown; use the time zone only as a rough hint.
- Give a confidence level when you project a date or amount, and say what would change it.
- If the snapshot lacks the data needed, say so and explain what would fill the gap.
- You are not a licensed advisor. For investments or large debts, recommend the user consult a qualified professional.
- Keep answers under 180 words, in plain language, without emojis or markdown tables.`;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function parseTurns(value: unknown): ChatTurn[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null;
  const turns: ChatTurn[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const { role, content } = item as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    if (content.length === 0 || content.length > MAX_MESSAGE_CHARS) return null;
    turns.push({ role, content });
  }
  return turns.at(-1)?.role === "user" ? turns : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return json({ error: "not_configured" }, 503);
    }

    const body = (await req.json()) as { messages?: unknown; snapshot?: unknown };
    const turns = parseTurns(body.messages);
    if (!turns) {
      return json({ error: "invalid_messages" }, 400);
    }
    if (!body.snapshot || typeof body.snapshot !== "object") {
      return json({ error: "invalid_snapshot" }, 400);
    }
    const snapshotText = JSON.stringify(body.snapshot).slice(0, MAX_SNAPSHOT_CHARS);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 500,
        messages: [
          { role: "system", content: `${SYSTEM_PROMPT}\n\nFINANCIAL SNAPSHOT (JSON):\n${snapshotText}` },
          ...turns,
        ],
      }),
    });

    if (!response.ok) {
      console.error("OpenAI request failed", response.status);
      return json({ error: "upstream_failed" }, 502);
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      return json({ error: "empty_answer" }, 502);
    }

    return json({ answer });
  } catch (err) {
    console.error("financial-advisor error", err);
    return json({ error: "server_error" }, 500);
  }
});
