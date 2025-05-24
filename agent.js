// 📁 langchain_lambda_agent/agent.mjs

import { TogetherAI } from "@langchain/community/llms/togetherai";
import { tools } from "./tools.js";
import { planPrompt } from "./prompt-templates/plan-prompt.js";
import { postToJiraSummary } from "./tool-impl/jira-summary.js";
import 'dotenv/config';

export async function runJiraAgent(issue) {
        

  const llm = new TogetherAI({
    model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
    temperature: 0
  });

  console.log("🧠 LLM initialized:");
  let decide = true;

  const toolsList = tools.map(t => `${t.name}: ${t.description}`).join("\n");
  const formattedPrompt = await planPrompt.format({
    key: issue.key,
    summary: issue.summary,
    description: issue.description,
    toolsList
  });

  const result = await llm.invoke(formattedPrompt);
  console.log("🧠 Raw LLM result:", result);

  const rawOutput = typeof result === 'string' ? result : result?.content;
  if (!rawOutput) {
    throw new Error("Empty or malformed response from LLM");
  }

  let steps;
  try {
    const match = rawOutput.match(/\[\s*{[\s\S]*}\s*\]/);
    if (!match) {
      console.error("❌ No JSON array found in output:", rawOutput);
      throw new Error("Failed to extract JSON from LLM output");
    }
    steps = JSON.parse(match[0]);
  } catch (err) {
    console.error("❌ JSON extract/parse failed:", err.message);
    throw new Error("Failed to parse JSON from LLM response");
  }

  // 🧠 Ask LLM to validate plan achievability
  const toolsMentioned = steps.map(s => s.tool).join(", ");
  const validationPrompt = `You planned to use the following tools: [${toolsMentioned}].\nBased on the tools available, is this plan fully achievable without manual work? Answer YES or NO and explain.`;
  const validationResponse = await llm.invoke(validationPrompt);
  const validation = typeof validationResponse === 'string'
    ? validationResponse
    : validationResponse?.content || "No validation response";

  const executionResults = [];

  
  
  if (decide) {
    
    for (const { tool, args } of steps) {
        const match = tools.find(t => t.name === tool);
        if (!match) {
            console.warn(`⚠️ Unknown tool: ${tool}`);
            executionResults.push({ tool, status: "skipped", reason: "Tool not found" });
            continue;
        }
        try {
            const output = await match.func(JSON.stringify(args));
            console.log(`✅ Tool '${tool}' executed →`, output);
            executionResults.push({ tool, status: "success", output });
        } catch (err) {
            console.error(`❌ Error running tool '${tool}':`, err.message);
            executionResults.push({ tool, status: "error", error: err.message });
        }
    }
    decide = false;

    // Call postToJiraSummary after executing all tools
    try {
        if (executionResults.length !== 0) {
            const summaryOutput = await postToJiraSummary({
                ticketKey: issue.key,
                results: executionResults,
                validation
            });
        }
    } catch (err) {
        console.error("❌ Error posting Jira summary:", err.message);
    }
  }

  return {
    plan: steps,
    results: executionResults,
    validation
  };
}
