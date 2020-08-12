const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
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
  console.log(`The check suite id: ${checkSuite.id}`);

  if(checkSuite.app.name == checkSuiteName && checkSuite.conclusion == 'failure') {
    console.log(`re-run the suite`);
    await octokit.request('POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest', {
      owner: context.repo.owner,
      repo: context.repo.repo,
      check_suite_id: '1041862266',
      mediaType: {
        previews: [
          'antiope'
        ]
      }
    })
    console.log('finished rerequest');
    console.log(`result of request" ${result}`);
  }
}

try {
  run();
} catch (error) {
  core.setFailed(error.message);
}
