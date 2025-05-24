// 📁 langchain_lambda_agent/index.js

import { runJiraAgent } from "./agent.js";
import express from "express";
import bodyParser from "body-parser";
import { stat } from "fs";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post("/webhook", async (req, res) => { 
  const issue = req.body.issue || {};

  let status = req.body.issue.fields.status.name;
  let assignee = req.body.issue.fields.assignee.displayName || "";
  
  if(assignee != "AI Agent" && status === "To Do") {

    try {
    const result = await runJiraAgent({ 
      key: issue.key,
      summary: issue.fields?.summary || "",
      description: issue.fields?.description || ""
    });
    res.status(200).json({ message: "Agent completed", result });
  } catch (err) {
    console.error("❌ Handler error:", err);
    res.status(500).json({ error: err.message });
  }

  }
  
});

app.listen(port, () => {
  console.log(`🚀 Agent webhook server running on http://localhost:${port}`);
});
