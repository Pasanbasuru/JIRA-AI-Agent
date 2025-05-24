import { Octokit } from "@octokit/rest";
import "dotenv/config";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

export async function createPullRequest({ owner, repo, head, base = "main", title, body }) {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body
  });

  console.log(`📬 PR created: ${data.html_url}`);
  return {
    status: "pull_request_created",
    url: data.html_url
  };
}
