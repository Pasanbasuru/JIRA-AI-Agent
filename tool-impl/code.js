// 📁 langchain_lambda_agent/tool-impl/code-implementation.js

import fs from "fs-extra";
import path from "path";
import { ChatOpenAI } from "@langchain/openai";
import { TogetherAI } from "@langchain/community/llms/togetherai";
import { glob } from "glob";
import { postToJira } from "./jira.js";
import "dotenv/config";

const CLONE_DIR = "/tmp/agent-repo";

function getProjectStructure(root, maxDepth = 3, depth = 0) {
  if (depth > maxDepth) return "";
  const items = fs.readdirSync(root, { withFileTypes: true });
  return items
    .map(item => {
      const fullPath = path.join(root, item.name);
      if (item.isDirectory()) {
        return `${"  ".repeat(depth)}${item.name}/\n` +
          getProjectStructure(fullPath, maxDepth, depth + 1);
      } else {
        return `${"  ".repeat(depth)}${item.name}`;
      }
    })
    .join("\n");
}

function readImportantFiles(base, patterns = ["package.json", "**/*.ts", "**/*.js"]) {
  const result = {};
  patterns.forEach(p => {
    const files = glob.sync(p, { cwd: base, nodir: true, ignore: "node_modules/**" });
    files.slice(0, 5).forEach(file => {
      const fullPath = path.join(base, file);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).size < 2000) {
        result[file] = fs.readFileSync(fullPath, "utf8");
      }
    });
  });
  return result;
}

export async function codeImplementation({ ticketKey, summary, description }) {
  const llm = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  const folderTree = getProjectStructure(CLONE_DIR);
  const sampleFiles = readImportantFiles(CLONE_DIR);

  const prompt = `You are an expert developer.

    Ticket: ${ticketKey}
    Summary: ${summary}
    Description: ${description}

    Below is the folder structure of the project:
    ${folderTree}

    Some sampled file contents:
    ${Object.entries(sampleFiles)
        .map(([file, content]) => `--- ${file} ---\n${content}\n`)
        .join("\n")}

    Please determine the correct file to create or update. Return ONLY JSON in this exact format:
    identify the file path from the description and the folder structure.
    {
      "filePath": "src/path/filename.ts",
      "mode": "manual",
      "todo": ["Step 1", "Step 2"]
    }

    {
      "filePath": "src/path/filename.ts",
      "mode": "auto",
      "code": "// Your code here"
    }

    IMPORTANT: Do not include any commentary, markdown, or explanation. Just return raw JSON.`;

  const rawResponse = await llm.call([
    { role: "user", content: prompt }
  ]);

  const raw = rawResponse?.content || "";
  console.log("🧠 LLM output (raw):\n", raw);

  let parsed;
  try {
    const jsonRaw = raw.trim().replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1");
    parsed = JSON.parse(jsonRaw);
  } catch (err) {
    console.error("❌ LLM returned invalid JSON:\n", raw);
    throw new Error("LLM did not return valid JSON.");
  }

  const fullPath = path.join(CLONE_DIR, parsed.filePath);
  fs.ensureDirSync(path.dirname(fullPath));

  if (parsed.mode === "manual" || !parsed.code) {
    const todoText = `The following steps should be completed manually for ticket ${ticketKey} (\"${summary}\"):\n\n` +
      (parsed.todo || ["Generate the missing code block for this file."]).map((t, i) => `- ${t}`).join("\n");

    const commentBody = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: todoText }
          ]
        }
      ]
    };

    await postToJira({ ticketKey, comment: commentBody });

    return {
      status: "manual_todo_created",
      filePath: parsed.filePath,
      tool: "code_implementation",
      todo: parsed.todo
    };
  }

  fs.writeFileSync(fullPath, parsed.code);

  return {
    status: "success",
    filePath: parsed.filePath,
    tool: "code_implementation"
  };
}
