// 📁 langchain_lambda_agent/tool-impl/change-jira-status.js

import fetch from "node-fetch";
import "dotenv/config";

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_TOKEN = process.env.JIRA_TOKEN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;

export async function changeJiraStatus({ ticketKey, transitionName }) {
    console.log(`Changing JIRA ticket ${ticketKey} status to ${transitionName}`);
    
  if (!transitionName || typeof transitionName !== "string") {
    throw new Error(`Invalid or missing transition name: ${transitionName}`);
  }
  const transitionsUrl = `${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/transitions`;

  const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64")}`;

  // Step 1: Get list of possible transitions
  const transitionsResp = await fetch(transitionsUrl, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      Accept: "application/json"
    }
  });

  const transitions = await transitionsResp.json();
  if (!transitions.transitions) {
    const error = await transitionsResp.text();
    throw new Error(`Failed to retrieve transitions: ${error}`);
  }


  const transition = transitions.transitions.find(t =>
    typeof t.name === 'string' && t.name === transitionName
  );

  if (!transition) {
    throw new Error(`Transition '${transitionName}' not found for issue ${ticketKey}`);
  }

  // Step 2: Execute the transition
  const response = await fetch(transitionsUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ transition: { id: transition.id } })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to transition ticket: ${error}`);
  }

  return { status: "updated", transition: transitionName };
}
