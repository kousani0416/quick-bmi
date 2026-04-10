export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/api/analyze") {
      return json({ error: "Not found" }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    try {
      const body = await request.json();
      const validationError = validatePayload(body);
      if (validationError) {
        return json({ error: validationError }, 400);
      }

      const prompt = buildPrompt(body);
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.4,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiResponse.ok) {
        return json({ error: `Upstream AI error (${aiResponse.status})` }, 502);
      }

      const data = await aiResponse.json();
      const analysis = data?.choices?.[0]?.message?.content?.trim();
      if (!analysis) {
        return json({ error: "AI returned empty content" }, 502);
      }

      return json({ analysis }, 200);
    } catch (error) {
      return json({ error: "Invalid request format" }, 400);
    }
  },
};

function buildPrompt(context) {
  return `You are a health education assistant. Provide concise, non-diagnostic BMI interpretation.
BMI: ${context.bmi.toFixed(1)}
Category: ${context.categoryName}
WHO range: ${context.whoRange}
Risk summary: ${context.risk}
Recommendation baseline: ${context.recommendation}
Return:
1) short interpretation
2) 3 actionable habits
3) caution/disclaimer`;
}

function validatePayload(body) {
  if (!body || typeof body !== "object") return "Payload must be an object";
  if (!Number.isFinite(body.bmi)) return "bmi is required";
  if (typeof body.categoryName !== "string") return "categoryName is required";
  if (typeof body.whoRange !== "string") return "whoRange is required";
  if (typeof body.risk !== "string") return "risk is required";
  if (typeof body.recommendation !== "string") return "recommendation is required";
  return null;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}
