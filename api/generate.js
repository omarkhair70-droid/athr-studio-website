export default async function handler(req, res) {
  try {
    const { imageUrl } = req.body;

    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        images: [
          {
            image_url: imageUrl
          }
        ],
        prompt: "ATHR style interior transformation for a real cafe space. Keep it realistic, premium lighting, emotional atmosphere, no major structural changes."
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(data);
      return res.status(400).json(data);
    }

    return res.status(200).json({
      image: data.data[0].url
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
