import fetch from 'node-fetch';
import 'dotenv/config';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_TOKEN = process.env.JIRA_TOKEN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;

export async function postToJira({ ticketKey, comment }) {
  const url = `${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/comment`;

  const body = {
    body: comment
  };

  console.log("📝 Posting summary to JIRA:", JSON.stringify(body, null, 2));


  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post to JIRA: ${error}`);
  }

  return `📝 Comment posted to ${ticketKey}`;
}
