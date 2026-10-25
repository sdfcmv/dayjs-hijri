# Publishing to npm

The [release workflow](.github/workflows/publish.yml) stages `@smedigital/dayjs-hijri` only when a `v<version>` tag points to a PR merge into `master`. It checks the merged PR, runs CI, validates release metadata, and submits the package using OIDC. GitHub merge, squash, and rebase merges are supported. Maintainer approval on npm completes publication.

## One-time setup

Your npm account needs publishing access to the `smedigital` organization and two-factor authentication for interactive publishing.

Use Node.js 22.14 or later and npm 11.21.1. If the package does not exist on npm yet, stage its first version locally:

```sh
npm install --global npm@11.21.1 --ignore-scripts
npm login --scope=@smedigital --registry=https://registry.npmjs.org/
npm ci
npm run check
npm stage publish --ignore-scripts --tag latest
```

Staging a new package creates a public `0.0.0-stage` placeholder. Review and approve the staged version as described below. `publishConfig` selects public access on npm.

In the package's npm settings, add a GitHub Actions **Trusted Publisher** with these values:

| Field                | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| Organization or user | `sdfcmv`                                               |
| Repository           | `dayjs-hijri`                                          |
| Workflow filename    | `publish.yml`                                          |
| Environment          | Leave empty                                            |
| Allowed actions      | Staging only; disable `npm publish` and `npm dist-tag` |

Replace any existing trusted publisher that permits direct publishing with a staging-only entry. This registry setting prevents the workflow from publishing directly. No npm token secret is needed. See [npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/).

The package's `repository.url` must match the GitHub repository running the workflow. If the repository moves, update that field and the npm trusted publisher configuration. npm adds provenance automatically for public source repositories; private source repositories publish without provenance.

## Release a new version

In your release PR, update `CHANGELOG.md` and bump the package version without creating a tag:

```sh
npm version patch --no-git-tag-version
```

Use `minor` or `major` instead of `patch` for the corresponding release. Commit both package manifests and the release notes, then merge the PR into `master`. Each published version must be new.

After the merge, update your local `master` and tag the resulting commit:

```sh
git switch master
git pull --ff-only origin master
release_version=$(node -p "require('./package.json').version")
git tag -a "v$release_version" -m "Release $release_version"
git push origin "v$release_version"
```

The tag must point to the PR's final merge result, including the squash commit or final rebased commit when those merge methods are used. If another commit has landed on `master`, tag the release PR's merge-result SHA explicitly. Tags on feature branches, direct commits, or commits inside a PR do not authorize publishing. A merge without a version tag does not publish.

For a prerelease, run `npm version prerelease --preid=beta --no-git-tag-version` in the release PR, then follow the same merge-and-tag process.

Prereleases publish under the `next` npm tag; stable releases publish under `latest`. Consumers can install a prerelease with:

```sh
npm install @smedigital/dayjs-hijri@next
```

Check **Stage npm release** in GitHub Actions for the staging result. Failed checks prevent submission. A successful run leaves the release awaiting approval on npm.

## Approve the release

In npm's **Staged Packages** tab, inspect the version, source, and tarball, then approve with 2FA. Approval makes the version installable. The workflow never approves releases. See [npm's staged publishing guide](https://docs.npmjs.com/staged-publishing/).

For CLI review, log in with a maintainer account:

```sh
npm stage list @smedigital/dayjs-hijri
npm stage view STAGE_ID
npm stage download STAGE_ID
```

Replace `STAGE_ID` with the ID returned by npm. After reviewing, run `npm stage approve STAGE_ID`; to discard it, run `npm stage reject STAGE_ID`. These maintainer actions require 2FA.
