import { postToJira } from "./jira.js";
import { ChatOpenAI } from "@langchain/openai";
import 'dotenv/config';

const toParagraph = (text) => ({
  type: "paragraph",
  content: [
    {
      type: "text",
      text: text || "-"
    }
  ]
});

export async function postToJiraSummary({ ticketKey, results, validation }) {
  const isValidResults = Array.isArray(results) && results.length > 0;

  const completed = isValidResults
    ? results.filter(r => r.status === "success").map(r => r.tool).join(", ") || "None"
    : "None";
  const failed = isValidResults
    ? results.filter(r => r.status === "error").map(r => `${r.tool}: ${r.error}`).join("\n") || "None"
    : "None";
  const skipped = isValidResults
    ? results.filter(r => r.status === "skipped").map(r => `${r.tool}: ${r.reason}`).join("\n") || "None"
    : "None";

  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.4,
    openAIApiKey: process.env.OPENAI_API_KEY
  });
  
  const summaryPrompt = `Generate a professional JIRA comment summarizing the results of an AI agent's automation run for ticket ${ticketKey}. The comment should include:

        - A brief overview of what the agent did
        - **Completed Tasks** in a bulleted list
        - **Skipped Tasks** in a bulleted list
        - **Failed Tasks** in a bulleted list with reasons
        - **Validation outcome** if present
        Use clear formatting with section headings (e.g., **bold**) and bullet points. Do not include internal AI reasoning or reflections. This is a final comment to be posted on the ticket.
        stop the comment after the validation section. this has to be a professional summary and not a conversation. and not feel like an AI generated this content.
        The comment should be concise and to the point, suitable for a JIRA ticket.write a professional jira comment from this, output should be only the comment. no more extra text.
        if git branch was created or used, mention the branch name.
        Completed:
        ${completed}

        Skipped:
        ${skipped}

        Failed:
        ${failed}

        Validation:
        ${validation || "None"}`;


  const summary = await llm.invoke(summaryPrompt);


  let summaryText;
  if (typeof summary === 'string' && summary.trim()) {
    summaryText = summary;
  } else if (typeof summary?.content === 'string' && summary.content.trim()) {
    summaryText = summary.content;
  } else {
    summaryText = "Summary not available.";
  }

  const body = {
    type: "doc",
    version: 1,
    content: [
      toParagraph(`🧠 Summary of AI Agent Automation for ${ticketKey}`),
      toParagraph(summaryText),
      toParagraph("📝 Please review any skipped or failed tasks to ensure the ticket is fully resolved.")
    ]
  };

  console.log("📝 Posting summary to JIRA:", summaryText);
  return await postToJira({ ticketKey, comment: body });
}
