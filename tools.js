// 📁 langchain_lambda_agent/tools.js

import { createGitBranch, commitAndPushChanges } from "./tool-impl/git.js";
import { postToJira } from "./tool-impl/jira.js";
import { codeImplementation } from "./tool-impl/code.js";
import { designResearchSummary } from "./tool-impl/design.js";
import { changeJiraStatus } from "./tool-impl/change-jira-status.js";

export const tools = [
  {
    name: "create_git_branch",
    description: "Create a new Git branch for the JIRA ticket",
    func: async (input) => {
      const { ticketKey, summary } = JSON.parse(input);
      return await createGitBranch({ ticketKey, summary });
    }
  },
  {
    name: "commit_and_push_changes",
    description: "Commit and push generated code to the branch",
    func: async (input) => {
      const { ticketKey, summary } = JSON.parse(input);
      return await commitAndPushChanges({ ticketKey, summary });
    }
  },
  {
    name: "post_to_jira",
    description: "Post a comment to the related JIRA ticket",
    func: async (input) => {
      const { ticketKey, comment } = JSON.parse(input);
      return await postToJira({ ticketKey, comment });
    }
  },
  {
    name: "code_implementation",
    description: "Determine the correct file and update or create it based on the JIRA summary and existing repo context.",
    func: async (input) => {
      const { ticketKey, summary, description } = JSON.parse(input);
      return await codeImplementation({ ticketKey, summary, description });
    }
  },
  {
    name: "design_research_summary",
    description: "Generate a design research summary and illustration for UI/system design tickets and post it to the JIRA issue.",
    func: async (input) => {
      const { ticketKey, summary, description } = JSON.parse(input);
      return await designResearchSummary({ ticketKey, summary, description });
    }
  },
  {
    name: "jira_status_change",
    description: "Change the status of a JIRA issue to the specified transition (e.g., In Progress, Done).",
    func: async (input) => {
      const { ticketKey, transitionName } = JSON.parse(input);
      return await changeJiraStatus({ ticketKey, transitionName });
    }
}
];
