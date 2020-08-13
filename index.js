const core = require('@actions/core');
const github = require('@actions/github');
const fetch = require('node-fetch');

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const circleApiToken = core.getInput('circleci-token', { required: true });
    const retryLabelName = "retried tests";
    const checkSuiteName = 'CircleCI Checks';
    const context = github.context;
    const checkSuite = context.payload.check_suite;
    const octokit = github.getOctokit(token);

    console.log(`The check suite name (id): ${checkSuite.app.name} (${checkSuite.id})`);
    console.log(`The check suite conclusion: ${checkSuite.conclusion}`);

    if (checkSuite.app.name == checkSuiteName && checkSuite.conclusion == 'failure') {
      console.log(`The check suite "${checkSuiteName}" failed`);

      const pullRequests = checkSuite.pull_requests;
      if (pullRequests.length != 0) {
        const issueNumber = pullRequests[0].number;
        console.log(`Detected PR #${issueNumber}`);

        const { data: labels } = await octokit.issues.listLabelsOnIssue({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issueNumber,
        });

        const labelNames = labels.map(label => {
          return label.name
        });
        console.log(`Labels: ${labelNames}`);

        if (!labelNames.includes(retryLabelName)) {
          console.log(`Adding label ${retryLabelName} to PR #${issueNumber}`);
          await octokit.issues.addLabels({
            issue_number: issueNumber,
            owner: context.repo.owner,
            repo: context.repo.repo,
            labels: [retryLabelName],
          });

          const { data: check_runs } = await octokit.checks.listForSuite({
            owner: context.repo.owner,
            repo: context.repo.repo,
            check_suite_id: checkSuite.id,
          });
          const { "workflow-id": workflowId } = JSON.parse(check_runs[0].external_id)

          console.log(`Rerunning failed tests for CircleCI workflow ${workflowId}`);
          const url = `https://circleci.com/api/v2/workflow/${workflowId}/rerun`;
          await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Circle-Token': circleApiToken
            },
            body: JSON.stringify({ "from_failed": true })
          });
        } else {
          console.log(`Not retrying tests since "${retryLabelName}" label was found`);
        }
      } else {
        console.log("No pull request found");
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
