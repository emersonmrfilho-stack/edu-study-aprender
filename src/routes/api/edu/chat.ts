import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM = `Você é o Edu, um macaco professor simpático do aplicativo Edu Study, um curso escolar
gamificado em português do Brasil (do 1º ano do Fundamental ao 3º ano do Ensino Médio).

Como você responde:
- Sempre em português do Brasil, com linguagem simples e adequada à série do aluno.
- Curto e direto: no máximo ~200 palavras, com passos numerados quando explicar um cálculo ou processo.
- Use markdown leve (negrito com **, listas com -) sem emojis.
- Ao corrigir um erro, primeiro diga o que o aluno acertou, depois onde errou e por quê, e então a forma certa.
- Ao criar exercícios, gere 3 questões numeradas do assunto pedido e, no final, uma seção "**Gabarito**" com as respostas.
- Nunca invente conteúdo fora do tema escolar; se a pergunta não for de estudo, traga o aluno de volta ao aprendizado com bom humor.`;

export const Route = createFileRoute("/api/edu/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response("A IA do Edu não está configurada.", { status: 500 });
        }

        let body: { messages?: ChatMessage[]; context?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("Requisição inválida.", { status: 400 });
        }

        const messages = (body.messages ?? [])
          .filter((m) => typeof m?.content === "string" && m.content.trim().length > 0)
          .slice(-16);
        if (messages.length === 0) return new Response("Sem mensagens.", { status: 400 });

        const input = [
          {
            role: "system" as const,
            content: [
              {
                type: "input_text" as const,
                text: body.context ? `${SYSTEM}\n\nContexto do aluno: ${body.context}` : SYSTEM,
              },
            ],
          },
          ...messages.map((m) => ({
            role: m.role,
            content: [
              m.role === "assistant"
                ? { type: "output_text" as const, text: m.content }
                : { type: "input_text" as const, text: m.content },
            ],
          })),
        ];

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
            "X-Lovable-AIG-SDK": "fetch",
          },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            input,
            stream: true,
            store: false,
            reasoning: { effort: "low", summary: "auto" },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          const message =
            upstream.status === 429
              ? "O Edu está com muitos alunos agora. Tente de novo em alguns segundos."
              : upstream.status === 402
                ? "Os créditos de IA do aplicativo acabaram. Avise o administrador."
                : upstream.status === 403
                  ? "A IA do Edu está bloqueada nas configurações do aplicativo."
                  : `O Edu não conseguiu responder agora. ${detail.slice(0, 200)}`;
          return new Response(message, { status: upstream.status || 500 });
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const parts = buffer.split("\n\n");
                buffer = parts.pop() ?? "";
                for (const part of parts) {
                  for (const line of part.split("\n")) {
                    if (!line.startsWith("data:")) continue;
                    const data = line.slice(5).trim();
                    if (!data || data === "[DONE]") continue;
                    try {
                      const evt = JSON.parse(data) as { type?: string; delta?: string };
                      if (evt.type === "response.output_text.delta" && evt.delta) {
                        controller.enqueue(encoder.encode(evt.delta));
                      }
                    } catch {
                      /* ignora eventos parciais */
                    }
                  }
                }
              }
            } finally {
              controller.close();
              reader.releaseLock();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
