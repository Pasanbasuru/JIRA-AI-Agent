// 📁 langchain_lambda_agent/tool-impl/post-image-to-jira.js

import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import "dotenv/config";

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_TOKEN = process.env.JIRA_TOKEN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;

export async function postImageToJira({ ticketKey, filePath, commentText = "Image attached:" }) {
  const uploadUrl = `${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/attachments`;

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64")}`,
      "X-Atlassian-Token": "no-check",
      ...form.getHeaders()
    },
    body: form
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    throw new Error(`Failed to upload image: ${error}`);
  }

  const uploaded = await uploadResponse.json();
  const filename = uploaded[0]?.filename || "uploaded-image";

  const commentBody = {
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: commentText },
            { type: "hardBreak" },
            { type: "text", text: `!${filename}!` }
          ]
        }
      ]
    }
  };

  const commentUrl = `${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/comment`;
  const commentResponse = await fetch(commentUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(commentBody)
  });

  if (!commentResponse.ok) {
    const error = await commentResponse.text();
    throw new Error(`Failed to post comment: ${error}`);
  }

  return { status: "success", filename };
}
