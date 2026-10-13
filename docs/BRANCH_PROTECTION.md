# Branch protection

**Human setup required.** Apply these settings in GitHub repository settings
before relying on automated checks. Confirm that the `ci` check has completed
successfully at least once so it is selectable as a required status check.

Create a ruleset for each of `main` and `develop`, targeting only its branch:

- Require a pull request before merging.
- Require at least one approving review.
- Require the status check named `ci`.
- Block force pushes and branch deletion.
- Require linear history.
- Keep ruleset enforcement active and do not add bypass actors by default.

## Optional GitHub CLI setup

**Human step:** Install and authenticate the GitHub CLI, replace `YOUR-ORG` and
`YOUR-REPO`, review the payload, and run from Bash. The commands create one active
ruleset per branch; verify the resulting rules in GitHub afterwards.

```bash
OWNER=YOUR-ORG
REPO=YOUR-REPO

create_ruleset() {
  branch="$1"
  gh api "repos/${OWNER}/${REPO}/rulesets" --method POST --input - <<JSON
{
  "name": "${branch}-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/${branch}"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "ci" }
        ]
      }
    },
    { "type": "non_fast_forward" },
    { "type": "deletion" },
    { "type": "required_linear_history" }
  ],
  "bypass_actors": []
}
JSON
}

create_ruleset main
create_ruleset develop
```
