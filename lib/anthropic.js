// Anthropic API を直接呼び出すシンプルなヘルパー。
// ANTHROPIC_API_KEY は https://console.anthropic.com で発行し、環境変数に設定してください。
export async function getAdvice(systemPrompt, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    })
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Anthropic API error: ${detail}`);
  }

  const data = await res.json();
  return (data.content || []).map((block) => block.text || "").join("\n").trim();
}
