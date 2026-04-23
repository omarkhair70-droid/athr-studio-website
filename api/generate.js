export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { imageDataUrl } = req.body || {};

    if (!imageDataUrl) {
      return res.status(400).json({ error: "No imageDataUrl provided" });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        images: [
          {
            image_url: imageDataUrl
          }
        ],
        prompt:
          "ATHR style interior transformation for a real cafe space. Keep the original architecture and layout recognizable. Do not redesign the whole place unrealistically. Transform only as a believable premium cafe experience. Add warm premium lighting, subtle mural or wall storytelling, elegant poster integration, emotional atmosphere, photogenic but believable visual identity, suitable for a real hospitality brand. No clutter. No fantasy exaggeration. No major structural changes.",
        size: "1536x1024",
        quality: "medium",
        output_format: "png",
        background: "auto",
        input_fidelity: "high"
      }),
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      return res.status(openaiRes.status).json({
        error: "OpenAI request failed",
        details: data,
      });
    }

    const imageBase64 = data?.data?.[0]?.b64_json;

    if (!imageBase64) {
      return res.status(500).json({
        error: "No image returned from OpenAI",
        details: data,
      });
    }

    return res.status(200).json({
      image: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      details: String(error),
    });
  }
}
