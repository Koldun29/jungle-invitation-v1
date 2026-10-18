/**
 * Optional illustrated pass through the Vercel AI Gateway.
 *
 * The shipped Corina stickers are the cached output of the local pipeline
 * (`scripts/process-sample-photos.py`: grab-cut, posterize, cream stroke),
 * so the invite never waits on a model. When `AI_GATEWAY_API_KEY` and
 * `AI_GATEWAY_IMAGE_MODEL` are both set, the create job may ask the gateway
 * for a jungle-storybook variant and cache that buffer instead.
 *
 * The model id is not hardcoded: pick one from `GET https://ai-gateway.vercel.sh/v1/models`
 * that supports image generation, then set `AI_GATEWAY_IMAGE_MODEL`.
 */
export async function maybeAiStylize(input: { childName: string; kind: "child" | "pet" }): Promise<Buffer | null> {
  const key = process.env.AI_GATEWAY_API_KEY;
  const model = process.env.AI_GATEWAY_IMAGE_MODEL;
  if (!key || !model) return null;

  const prompt =
    input.kind === "child"
      ? `A storybook sticker of a child named ${input.childName}, jungle explorer, thick cream outline, transparent background, friendly dinosaur picture-book style`
      : `A storybook sticker of a grey and white tabby cat, jungle explorer companion, thick cream outline, transparent background, friendly picture-book style`;

  const response = await fetch("https://ai-gateway.vercel.sh/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) return null;
  return Buffer.from(b64, "base64");
}
