const core = require('@actions/core');
const github = require('@actions/github');

try {
  const token = core.getInput('github-token', { required: true });
  const checkSuiteName = 'CircleCI Checks';
  // Get the JSON webhook payload for the event that triggered the workflow
  const context = github.context;
  const payloadString = JSON.stringify(context.payload, undefined, 2);
  console.log(`The event payload: ${payloadString}`);
  const checkSuite = context.payload.check_suite;

  const octokit = github.getOctokit(token);

  console.log(`The repo owner: ${context.repo.owner}`);
  console.log(`The repo: ${context.repo.repo}`);
  console.log(`The check suite app name: ${checkSuite.app.name}`);
  console.log(`The check suite conclusion: ${checkSuite.conclusion}`);

  if(checkSuite.app.name == checkSuiteName && checkSuite.conclusion == 'failure') {
    console.log(`re-run the suite`);
    octokit.checks.rerequestSuite({
      owner: context.repo.owner,
      repo: context.repo.repo,
      check_suite_id: checkSuite.id,
    });
  }
} catch (error) {
  core.setFailed(error.message);
}
