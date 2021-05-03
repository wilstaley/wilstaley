require('dotenv').config();

const Mustache = require("mustache");
const fetch = require("node-fetch");
const fs = require("fs");

const MUSTACHE_MAIN_DIR = "./main.mustache";
const GH_GRAPHQL_URL = "https://api.github.com/graphql";

(async () => {
  console.log("fetching data...");
  const year = new Date().getFullYear();
  const query = `
    query {
      user(login: "wilstaley") {
        contributionsCollection(from: "${year}-01-01T00:00:00Z") {
          totalCommitContributions,
          totalPullRequestContributions,
          totalRepositoriesWithContributedCommits
        }
      }
    }
  `;

  const opts = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${process.env.GH_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  };
  const res = await fetch(GH_GRAPHQL_URL, opts);
  const {
    data: {
      user: { contributionsCollection: ghStats },
    },
  } = await res.json();

  console.log("Creating readme...");
  const DATA = {
    date: new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    year,
    commits: ghStats.totalCommitContributions,
    prs: ghStats.totalPullRequestContributions,
    repos: ghStats.totalRepositoriesWithContributedCommits,
  };

  fs.readFile(MUSTACHE_MAIN_DIR, (err, data) => {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync("README.md", output);
  });
})();

