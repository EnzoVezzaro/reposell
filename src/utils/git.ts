/**
 * Git utility functions
 */

import { execSync } from 'child_process';

export interface GitInfo {
  provider: string;
  owner: string;
  repo: string;
  providerRepositoryId: string;
}

export async function detectGitInfo(cwd: string, _preferredProvider: string): Promise<GitInfo> {
  let remoteUrl = '';
  try {
    remoteUrl = execSync('git config --get remote.origin.url', { cwd, encoding: 'utf-8' }).trim();
  } catch {
    // Ignore errors
  }
  
  if (remoteUrl && remoteUrl.includes('github.com')) {
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match && match[1] && match[2]) {
      return {
        provider: 'github',
        owner: match[1],
        repo: match[2].replace('.git', ''),
        providerRepositoryId: 'github:' + match[1] + '/' + match[2].replace('.git', ''),
      };
    }
  } else if (remoteUrl.includes('gitlab.com')) {
    const match = remoteUrl.match(/gitlab\.com[:/]([^/]+)\/([^/.]+)/);
    if (match && match[1] && match[2]) {
      return {
        provider: 'gitlab',
        owner: match[1],
        repo: match[2].replace('.git', ''),
        providerRepositoryId: 'gitlab:' + match[1] + '/' + match[2].replace('.git', ''),
      };
    }
  }

  // Fallback to directory name
  const segments = cwd.split(/[\\/]/).filter(Boolean);
  const dirName = segments[segments.length - 1] || 'unknown';
  return {
    provider: 'github',
    owner: 'unknown',
    repo: dirName,
    providerRepositoryId: 'github:unknown/' + dirName,
  };
}