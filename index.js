const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const retryLabelName = "retried tests";
    const checkSuiteName = 'CircleCI Checks';
    const context = github.context;
    const payloadString = JSON.stringify(context.payload, undefined, 2);
    console.log(`The event payload: ${payloadString}`);
    const checkSuite = context.payload.check_suite;
    const octokit = github.getOctokit(token);

    console.log(`The repo owner: ${context.repo.owner}`);
    console.log(`The repo: ${context.repo.repo}`);
    console.log(`The check suite app name: ${checkSuite.app.name}`);
    console.log(`The check suite conclusion: ${checkSuite.conclusion}`);
    console.log(`The check suite id: ${checkSuite.id}`);

    if (checkSuite.app.name == checkSuiteName && checkSuite.conclusion == 'failure') {
      console.log(`re-run the suite`);
      const pullRequests = checkSuite.pull_requests;
      if (pullRequests.length != 0) {
        console.log("got a pull request");
        const issueNumber = pullRequests[0].number;
        console.log(`PR #${issueNumber}`);

        const { data: labels } = await octokit.issues.listLabelsOnIssue({
          owner: context.repo.owner,
          repo: context.repo.repo,
          issue_number: issueNumber,
        });

        const labelNames = labels.map(label => {
          return label.name
        });
        console.log(`Labels: ${labelNames}`);

        if (!labelNames.includes(retryLabelName)){
          console.log(`Adding label ${retryLabelName}`);
          await octokit.issues.addLabels({
            issue_number: issueNumber,
            owner: context.repo.owner,
            repo: context.repo.repo,
            labels: [retryLabelName],
          });
        }
      } else {
        console.log("No pull request found but one is required");
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
