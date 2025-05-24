// 📁 langchain_lambda_agent/image_gen.js

import fetch from "node-fetch";
import "dotenv/config";

const OPENAI_IMAGE_API = "https://api.openai.com/v1/images/generations";

export async function text2im({ prompt, size = "1024x1024", n = 1 }) {
  const response = await fetch(OPENAI_IMAGE_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      n,
      size,
      response_format: "b64_json"
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image generation failed: ${error}`);
  }

  return await response.json();
}
