// 📁 langchain_lambda_agent/prompt-templates/plan-prompt.js

import { ChatPromptTemplate } from "@langchain/core/prompts";

export const planPrompt = ChatPromptTemplate.fromTemplate(`You are an AI developer assistant.

Ticket details:
- Key: {key}
- Summary: {summary}
- Description: {description}

Your tools:
{toolsList}

Output a JSON array of steps. Each step must include:
- tool: the tool name to call
- args: the arguments as a JSON object (must include ticketKey, ticket summary for all,  and other required fields as needed, make sure to use the correct format for each tool, do  not change the args names)

Example:
[
  {{
    "tool": "any tool",
    "args": {{ "ticketKey": "AI-123", "summary": "Add login throttling", "description": "Implement a login throttling mechanism to prevent brute-force attacks." }}
  }},
  {{
    "tool": "git_branch",
    "args": {{ "ticketKey": "AI-123", "summary": "Add login throttling"}}
  }},
  {{
    "tool": "code_implementation",
    "args": {{ "ticketKey": "AI-123", "summary": "Add login throttling", "description": "Implement a login throttling mechanism to prevent brute-force attacks." }}
  }},
  {{
    "tool": "jira_status_change",
    "args": {{ "ticketKey": "AI-123", "transitionName": "In Progress" }}
  }},
  ...
]
if the ticket is a design or system design task, then use the tool "design-research-summary" to post the image on the ticket. do not use other tools.git branch is not needed for design tasks.
if the steps include "design_research_summary", remove all other tasks.
the first step should always be "jira_status_change" to "In Progress". and last step should be "change jira status" to "Done".
make sure arguments are in the correct format for the tool.
post_to_jira is not needed unless you have special image to post.
ONLY return the JSON array — do not include explanation or prose.
do not post comment on jira if it is not necessary since the summary of the tasks will be commented on the ticket.
if there are any images , then use the tool "post_to_jira" to post the image on the ticket.
stop outputting when you reach the end of the JSON array.`);
