// 📁 langchain_lambda_agent/tool-impl/git.js

import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import { createPullRequest } from './pull-requests.js';
import 'dotenv/config';

const REPO_URL = process.env.REPO_URL;
const CLONE_DIR = '/tmp/agent-repo';

export async function createGitBranch({ ticketKey, summary }) {
  const branchName = `${ticketKey.toLowerCase()}_${summary.replace(/\s+/g, '_').toLowerCase()}`;
  const git = simpleGit();

  if (!fs.existsSync(CLONE_DIR)) {
    await git.clone(REPO_URL, CLONE_DIR);
  }

  const repo = simpleGit(CLONE_DIR);
  const localBranches = await repo.branchLocal();
  if (localBranches.all.includes(branchName)) {
    await repo.checkout(branchName);
    return `🔁 Branch '${branchName}' already exists. Checked it out.`;
  }

  await repo.checkoutLocalBranch(branchName);
  return `✅ Branch '${branchName}' created.`;
}

export async function commitAndPushChanges({ ticketKey, summary, commitMessage }) {
  const branchName = `${ticketKey.toLowerCase()}_${summary.replace(/\s+/g, '_').toLowerCase()}`;
  const filePath = path.join(CLONE_DIR, `${branchName}.ts`);
  await fs.writeFile(filePath, `// TODO: Implement feature for ${summary}`);

  const repo = simpleGit(CLONE_DIR);
  await repo.add('.');
  await repo.commit(commitMessage || `feat(${ticketKey}): ${summary}`);
  await repo.push(['--set-upstream', 'origin', branchName]);
  console.log(`✅ Branch '${branchName}' pushed to origin.`);
  const remotes = await repo.getRemotes(true);
  console.log('🌐 Git remotes:', remotes);
  console.log(`✅ Branch '${branchName}' pushed to origin.`);
  await new Promise(r => setTimeout(r, 1500)); // delay for GitHub branch sync

  const match = process.env.REPO_URL.match(/github\.com[:/]([^/]+)\/([^.]+)(\.git)?$/);
  if (!match) {
    throw new Error('Invalid REPO_URL format. Cannot extract GitHub owner/repo.');
  }
  const owner = match[1];
  const repoName = match[2];

  console.log('🔍 Creating PR with:', { owner, repo: repoName, head: branchName, base: 'main' });
  return await createPullRequest({
  owner,
  repo: repoName,
  head: branchName, // <-- just the branch name, not owner:branch
  base: 'main',
  title: commitMessage || `feat(${ticketKey}): ${summary}`,
  body: `Auto-generated pull request for ${summary}`
});

}
