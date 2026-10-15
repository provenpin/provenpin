import { Octokit } from "@octokit/rest";

export function makeClient(token: string, baseUrl = "https://api.github.com") {
  return new Octokit({ auth: token, baseUrl, userAgent: "provenpin-recipe/1.0", request: { retries: 0 } });
}

/** All open issues (not PRs) across every page, following the Link header. */
export async function listOpenIssues(gh: Octokit, owner: string, repo: string) {
  const items = await gh.paginate(gh.rest.issues.listForRepo, { owner, repo, state: "open", per_page: 2 });
  return items.filter((i) => !i.pull_request).map((i) => ({ number: i.number, title: i.title }));
}

/** Stop paging early once we find a label, using paginate's done() callback. */
export async function firstWithLabel(gh: Octokit, owner: string, repo: string, label: string) {
  let hit: number | null = null;
  await gh.paginate(gh.rest.issues.listForRepo, { owner, repo, per_page: 2 }, (res, done) => {
    const f = res.data.find((i) => i.labels.some((l) => (typeof l === "string" ? l : l.name) === label));
    if (f) { hit = f.number; done(); }
    return [];
  });
  return hit;
}

export async function openIssue(gh: Octokit, owner: string, repo: string, title: string, labels: string[]) {
  const { data, status } = await gh.rest.issues.create({ owner, repo, title, labels });
  return { status, number: data.number, url: data.html_url };
}

export async function repoExists(gh: Octokit, owner: string, repo: string) {
  try {
    await gh.rest.repos.get({ owner, repo });
    return true;
  } catch (e) {
    if ((e as { status?: number }).status === 404) return false;
    throw e;
  }
}
