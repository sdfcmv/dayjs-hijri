# Publishing to npm

The [publish workflow](.github/workflows/publish.yml) publishes `@smedigital/dayjs-hijri` only when a `v<version>` tag points to the result of a PR merged into `master`. It checks the commit's presence on `master` and its merged PR, waits for the CI matrix, validates the tag and package metadata, and publishes using npm trusted publishing (OIDC). GitHub merge, squash, and rebase merges are supported.

## One-time setup

Your npm account needs publishing access to the `smedigital` organization and two-factor authentication for interactive publishing.

If the package does not exist on npm yet, publish its initial version from this checkout:

```sh
npm login --scope=@smedigital --registry=https://registry.npmjs.org/
npm ci
npm publish
```

`publishConfig` selects the public npm registry and public access. The `prepublishOnly` hook runs all checks and builds the distribution before publishing.

In the package's npm settings, add a GitHub Actions **Trusted Publisher** with these values:

| Field                | Value               |
| -------------------- | ------------------- |
| Organization or user | `sdfcmv`            |
| Repository           | `dayjs-hijri`       |
| Workflow filename    | `publish.yml`       |
| Environment          | Leave empty         |
| Allowed actions      | Allow `npm publish` |

The workflow uses GitHub-hosted runners and Node.js 24 with an OIDC-capable npm version. No npm token secret is needed. See [npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/).

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

Check the **Publish to npm** workflow in GitHub Actions for the result. A failed validation or test prevents publishing.
