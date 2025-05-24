// 📁 langchain_lambda_agent/tool-impl/design-research-summary.js

import fs from "fs";
import path from "path";
import { ChatOpenAI } from "@langchain/openai";
import { postImageToJira } from "./jira-image.js";
import { postToJira } from "./jira.js";
import { text2im } from "./img-gen.js";
import "dotenv/config";

const IMAGE_DIR = path.resolve("./images");

export async function designResearchSummary({ ticketKey, summary, description }) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.4,
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  // Step 1: Generate the research outcome from the description
  const researchPrompt = `You are a senior software architect. Based on the following ticket description, generate a detailed system design summary including:
- Problem statement
- Key architectural considerations
- High-level component breakdown
- Recommended technologies, protocols, or design patterns

Description:
${description}`;

  const researchResult = await llm.call([{ role: "user", content: researchPrompt }]);
  const summaryText = researchResult.content;

  // Step 2: Generate a visual prompt and image separately
  const imagePrompt = `Generate an image:

${description}`;

  const imagePromptResult = await llm.call([{ role: "user", content: imagePrompt }]);
  const visualPrompt = imagePromptResult.content.trim();

  const imageResult = await text2im({ prompt: visualPrompt, size: "1024x1024" });
  const imageBase64 = imageResult?.data?.[0]?.b64_json;
  const imageFilePath = path.join(IMAGE_DIR, `design-${ticketKey}.png`);

  if (!fs.existsSync(IMAGE_DIR)) fs.mkdirSync(IMAGE_DIR);
  if (imageBase64) {
    fs.writeFileSync(imageFilePath, Buffer.from(imageBase64, "base64"));
  }

  // Step 3: Upload image and post combined comment
  if (fs.existsSync(imageFilePath)) {
    await postImageToJira({
      ticketKey,
      filePath: imageFilePath,
      commentText: summaryText
    });
  } else {
    const commentBody = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: summaryText || "[System design summary missing]" }
          ]
        }
      ]
    };
    await postToJira({ ticketKey, comment: commentBody });
  }

  return {
    status: "posted",
    ticketKey,
    visualPrompt,
    researchSummary: summaryText,
    imagePosted: !!imageBase64
  };
}
