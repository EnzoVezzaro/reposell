# release.md — Release a new version

1. Update version in `package.json` (patch/minor/major).
2. Update `CHANGELOG.md` with release notes.
3. Create git tag: `git tag v<version>` and `git push origin main --tags`.
4. GitHub Actions automatically publishes to npm (on tag push).
5. Run `acc check` to validate the repository structure.
6. Run `acc graph` to visualize the impact of the release.
7. Run `acc context` on changed paths to verify contracts.
8. Update `.acc-memory.md` with release-specific lessons learned.

## Pre-release Checklist

- [ ] All tests pass (`bun test`)
- [ ] Lint passes (`bun run lint`)
- [ ] Type check passes (`bun run typecheck`)
- [ ] ACC check passes (`acc check`)
- [ ] Doctor validates no issues (`reposell doctor`)
- [ ] `reposell doctor --fix` runs clean
- [ ] Documentation updated (`IMPLEMENTATION.md`, `CHANGELOG.md`)
- [ ] API.md updated if public endpoints changed
- [ ] Version bump confirmed

## Post-release

- Run `acc discover` to identify any new suggestions.
- Run `acc impact src/` to check for ripple effects.
- Review `.acc-memory.md` and archive old lessons learned.