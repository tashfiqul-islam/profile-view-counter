# Changelog

All notable changes to **Profile View Counter** are documented in this file.

## [2.1.4](https://github.com/tashfiqul-islam/profile-view-counter/compare/v2.1.3...v2.1.4) (2026-04-10)

### Refactoring

* modernize to TypeScript 6 with latest toolchain and patterns ([23db668](https://github.com/tashfiqul-islam/profile-view-counter/commit/23db668a73ca6af975d4abc942adbba92263ac24))

See our [Contribution Guidelines](https://github.com/tashfiqul-islam/profile-view-counter#-contributing) for commit guidelines.

## [2.1.3](https://github.com/tashfiqul-islam/profile-view-counter/compare/v2.1.2...v2.1.3) (2026-03-18)

### 🩹 Fixes

* **deps:** update dependency hono to v4.12.8 ([20319e9](https://github.com/tashfiqul-islam/profile-view-counter/commit/20319e957e29b499996f020894618d9d2eb9abc7))

### 🤖 CI

* harden workflows with SHA pinning, fix frozen lockfile, and gate deploys on CI ([2080006](https://github.com/tashfiqul-islam/profile-view-counter/commit/2080006fa0998157fadb7677db7eec60d4f599f6))

### 🏡 Chore

* **deps:** update commitlint monorepo to v20.4.4 ([7eb5ced](https://github.com/tashfiqul-islam/profile-view-counter/commit/7eb5cedd68e9f9e6d101927b70fb6041036ffc78))
* **deps:** update dependency @biomejs/biome to v2.4.7 ([1e43117](https://github.com/tashfiqul-islam/profile-view-counter/commit/1e43117097ed056fd9a3cb455ac8d0ee55c440a9))
* **deps:** update dependency @types/bun to v1.3.10 ([47f3ab4](https://github.com/tashfiqul-islam/profile-view-counter/commit/47f3ab410c130e5e87b7805685ee2012c09ec210))
* **deps:** update dependency lefthook to v2.1.4 ([cc6b5eb](https://github.com/tashfiqul-islam/profile-view-counter/commit/cc6b5eba2ac0ff5714e739df4108882b8283156e))
* **deps:** update dependency ultracite to v7.3.1 ([b3b089f](https://github.com/tashfiqul-islam/profile-view-counter/commit/b3b089fabc80160f6b3290244e1392dfd85fa888))
* **deps:** update dependency wrangler to v4.73.0 ([c6f9644](https://github.com/tashfiqul-islam/profile-view-counter/commit/c6f964472745289bee34bfdb9a9e907eefe4432e))
* **deps:** upgrade all outdated packages and migrate to vitest 4 ([6466bf8](https://github.com/tashfiqul-islam/profile-view-counter/commit/6466bf8ecafd9c0636cac2d10c371cccf530f97f))

## [2.1.2](https://github.com/tashfiqul-islam/profile-view-counter/compare/v2.1.1...v2.1.2) (2026-03-01)

### 🩹 Fixes

* **ci:** use vars context for CLOUDFLARE_ACCOUNT_ID ([6d24cad](https://github.com/tashfiqul-islam/profile-view-counter/commit/6d24cad8a0f22cd53fa75cac8e03263ea67c52ca))

## [2.1.1](https://github.com/tashfiqul-islam/profile-view-counter/compare/v2.1.0...v2.1.1) (2026-03-01)

### 🩹 Fixes

* **ci:** pass Cloudflare credentials as env vars for preCommands ([defaa1e](https://github.com/tashfiqul-islam/profile-view-counter/commit/defaa1e8211cde76b8c8a97b24022372534a453a))

### 🤖 CI

* **deploy:** add Cloudflare Workers deploy workflow with manual trigger ([3693631](https://github.com/tashfiqul-islam/profile-view-counter/commit/3693631ba213eeb315a20bdae9938481d0ef89d5))

## [2.1.0](https://github.com/tashfiqul-islam/profile-view-counter/compare/v2.0.5...v2.1.0) (2026-03-01)

### 🚀 Features

* **badge:** responsive SVG with viewBox, a11y desc, typed constants ([1019084](https://github.com/tashfiqul-islam/profile-view-counter/commit/1019084c4036183209ed51d62617fcd9ca9be71c))
* modernization — deps, tooling, performance, and AI config ([4b158e2](https://github.com/tashfiqul-islam/profile-view-counter/commit/4b158e22e32f980fbe7e5b8fdac8caa7dfd75b35))

### 🩹 Fixes

* **core:** remove stale version field, add structured error logging ([4ef7cdf](https://github.com/tashfiqul-islam/profile-view-counter/commit/4ef7cdf1148de7fca88f94f59030e68bdadce1dd))

### 📖 Documentation

* **ai:** add CLAUDE.md and AGENTS.md for AI-optimized repo context ([af96b90](https://github.com/tashfiqul-islam/profile-view-counter/commit/af96b907d9495e20250fd1f1a96db81523270753))
* **copilot:** add GitHub Copilot repo configuration ([93e49ac](https://github.com/tashfiqul-islam/profile-view-counter/commit/93e49ac2d520cac820043b37e687685c39cea268))
* rewrite README, update API/architecture/deployment docs ([0c905bb](https://github.com/tashfiqul-islam/profile-view-counter/commit/0c905bb09eb26f013ce3535bb6107ef119cb0ca3))

### 💅 Refactor

* **scripts:** replace biome CLI with ultracite, split test runners ([ee2b1d7](https://github.com/tashfiqul-islam/profile-view-counter/commit/ee2b1d7b1ad1de12095c1e5eadf7b73460bcf29e))

### 🔥 Performance

* **worker:** add waitUntil, security headers, smart placement ([3301e94](https://github.com/tashfiqul-islam/profile-view-counter/commit/3301e9400bc0913c25de228d5e335ab775c880c0))

### ✅ Tests

* **split:** migrate badge tests to bun:test, add responsive assertions ([b2e249c](https://github.com/tashfiqul-islam/profile-view-counter/commit/b2e249c82ee38d14a3c863e13eb835182b139630))

### 📦 Build

* **config:** add ultracite, bunfig.toml, and bun-native tsconfig ([009fa12](https://github.com/tashfiqul-islam/profile-view-counter/commit/009fa12a417f281843fa932633a7f63be7e59fdb))
* **deps:** upgrade all dependencies to latest 2026 versions ([5988c85](https://github.com/tashfiqul-islam/profile-view-counter/commit/5988c85203dd43730712a9f32e64dc9830eab4a0))

### 🤖 CI

* **actions:** upgrade to 2026 action versions, add concurrency guards ([54f7046](https://github.com/tashfiqul-islam/profile-view-counter/commit/54f7046c6f1f29ce1d8e889f686b735d67283b86))

### 🏡 Chore

* **lint:** apply ultracite formatting, add types commit type ([379ae2c](https://github.com/tashfiqul-islam/profile-view-counter/commit/379ae2c8141652527b87a1de3356571fed83b36a))

## <small>2.0.5 (2026-01-09)</small>

* Merge branch 'master' of https://github.com/tashfiqul-islam/profile-view-counter ([93cbcab](https://github.com/tashfiqul-islam/profile-view-counter/commit/93cbcab))
* fix: correct renovate-config-validator syntax ([a981046](https://github.com/tashfiqul-islam/profile-view-counter/commit/a981046))

## <small>2.0.4 (2026-01-09)</small>

* fix: node lts for renovate validator ([9a23d04](https://github.com/tashfiqul-islam/profile-view-counter/commit/9a23d04))

## <small>2.0.3 (2026-01-09)</small>

* Merge branch 'master' of https://github.com/tashfiqul-islam/profile-view-counter ([3674a13](https://github.com/tashfiqul-islam/profile-view-counter/commit/3674a13))
* fix: pinned renovate validator to latest version ([9d48edd](https://github.com/tashfiqul-islam/profile-view-counter/commit/9d48edd))

## <small>2.0.2 (2026-01-09)</small>

* fix: reverted renovate config to use fileMatch ([fbba6f4](https://github.com/tashfiqul-islam/profile-view-counter/commit/fbba6f4))
* Merge pull request #4 from tashfiqul-islam/renovate/pin-dependencies ([6424191](https://github.com/tashfiqul-islam/profile-view-counter/commit/6424191)), closes [#4](https://github.com/tashfiqul-islam/profile-view-counter/issues/4)
* Merge pull request #5 from tashfiqul-islam/renovate/biome ([48746af](https://github.com/tashfiqul-islam/profile-view-counter/commit/48746af)), closes [#5](https://github.com/tashfiqul-islam/profile-view-counter/issues/5)
* Merge pull request #6 from tashfiqul-islam/renovate/migrate-config ([a0913de](https://github.com/tashfiqul-islam/profile-view-counter/commit/a0913de)), closes [#6](https://github.com/tashfiqul-islam/profile-view-counter/issues/6)
* chore(config): migrate config renovate.json ([8ca3f8e](https://github.com/tashfiqul-islam/profile-view-counter/commit/8ca3f8e))
* chore(deps): pin dependencies ([900a475](https://github.com/tashfiqul-islam/profile-view-counter/commit/900a475))
* chore(deps): pin dependency @biomejs/biome to 2.3.11 ([c5ee4cf](https://github.com/tashfiqul-islam/profile-view-counter/commit/c5ee4cf))
* ci: added manual trigger for renovate check ([0083d4b](https://github.com/tashfiqul-islam/profile-view-counter/commit/0083d4b))

## <small>2.0.1 (2026-01-09)</small>

* fix: removed npm cache for release workflow ([ebdfd50](https://github.com/tashfiqul-islam/profile-view-counter/commit/ebdfd50))
* ci: added dependency caching ([f81c43c](https://github.com/tashfiqul-islam/profile-view-counter/commit/f81c43c))
* chore: align version to v2.0.1 ([a3bda7b](https://github.com/tashfiqul-islam/profile-view-counter/commit/a3bda7b))

## <small>1.0.1 (2026-01-09)</small>

* fix: update demo link in README.md ([294f84b](https://github.com/tashfiqul-islam/profile-view-counter/commit/294f84b))

## 1.0.0 (2026-01-09)

* ci: added node lts release workflow ([6011a9b](https://github.com/tashfiqul-islam/profile-view-counter/commit/6011a9b))
* fix: cicd pipeline fix ([57440f7](https://github.com/tashfiqul-islam/profile-view-counter/commit/57440f7))
* feat: v2.0.0 go live! ([52675c3](https://github.com/tashfiqul-islam/profile-view-counter/commit/52675c3))
* additional test ([5a074ed](https://github.com/tashfiqul-islam/profile-view-counter/commit/5a074ed))
* Badge design update ([aa1a3b8](https://github.com/tashfiqul-islam/profile-view-counter/commit/aa1a3b8))
* codecov integration ([2c0b769](https://github.com/tashfiqul-islam/profile-view-counter/commit/2c0b769))
* commit for deploy to heroku ([5aad0d9](https://github.com/tashfiqul-islam/profile-view-counter/commit/5aad0d9))
* Create assets folder ([8f653dc](https://github.com/tashfiqul-islam/profile-view-counter/commit/8f653dc))
* Deleted assets/pvc_banner.png ([cd011e7](https://github.com/tashfiqul-islam/profile-view-counter/commit/cd011e7))
* Deleted assets/pvc_banner.png ([eeb1dc1](https://github.com/tashfiqul-islam/profile-view-counter/commit/eeb1dc1))
* Deleted badge.svg ([2f1f8e6](https://github.com/tashfiqul-islam/profile-view-counter/commit/2f1f8e6))
* enabled ci-cd and enhanced the counter logic ([8553012](https://github.com/tashfiqul-islam/profile-view-counter/commit/8553012))
* Handling cache ([df2e5fa](https://github.com/tashfiqul-islam/profile-view-counter/commit/df2e5fa))
* index.js updates ([f2802d5](https://github.com/tashfiqul-islam/profile-view-counter/commit/f2802d5))
* Initial commit ([4f76111](https://github.com/tashfiqul-islam/profile-view-counter/commit/4f76111))
* Initial commit ([f9d67a9](https://github.com/tashfiqul-islam/profile-view-counter/commit/f9d67a9))
* Merge branch 'master' into number-formatter ([b836ce0](https://github.com/tashfiqul-islam/profile-view-counter/commit/b836ce0))
* Merge branch 'master' of https://github.com/tashfiqul-islam/profile-view-counter ([3026321](https://github.com/tashfiqul-islam/profile-view-counter/commit/3026321))
* Merge branch 'master' of https://github.com/tashfiqul-islam/profile-view-counter ([08c0839](https://github.com/tashfiqul-islam/profile-view-counter/commit/08c0839))
* Merge branch 'master' of https://github.com/tashfiqul-islam/profile-view-counter ([490ed94](https://github.com/tashfiqul-islam/profile-view-counter/commit/490ed94))
* Merge branch 'master' of https://github.com/tashfiqul-islam/profile-view-counter ([4db90f0](https://github.com/tashfiqul-islam/profile-view-counter/commit/4db90f0))
* Merge pull request #1 from tashfiqul-islam/number-formatter ([d58a63c](https://github.com/tashfiqul-islam/profile-view-counter/commit/d58a63c)), closes [#1](https://github.com/tashfiqul-islam/profile-view-counter/issues/1)
* Merge pull request #2 from tashfiqul-islam/tashfiqul-islam-patch-1 ([718b3cc](https://github.com/tashfiqul-islam/profile-view-counter/commit/718b3cc)), closes [#2](https://github.com/tashfiqul-islam/profile-view-counter/issues/2)
* Merge pull request #3 from tashfiqul-islam/tashfiqul-islam-patch-1 ([b2cfb44](https://github.com/tashfiqul-islam/profile-view-counter/commit/b2cfb44)), closes [#3](https://github.com/tashfiqul-islam/profile-view-counter/issues/3)
* new v4 workflow setup ([b9c8757](https://github.com/tashfiqul-islam/profile-view-counter/commit/b9c8757))
* node 16,18&20 and latest v4 for uses ([24b90c1](https://github.com/tashfiqul-islam/profile-view-counter/commit/24b90c1))
* node v20 ([3dbba60](https://github.com/tashfiqul-islam/profile-view-counter/commit/3dbba60))
* node v20 ([6c22c01](https://github.com/tashfiqul-islam/profile-view-counter/commit/6c22c01))
* node v20 ([d0c89f0](https://github.com/tashfiqul-islam/profile-view-counter/commit/d0c89f0))
* number format with decimal ([f0e30a0](https://github.com/tashfiqul-islam/profile-view-counter/commit/f0e30a0))
* pvc banner ([fac4391](https://github.com/tashfiqul-islam/profile-view-counter/commit/fac4391))
* pvc_banner design ([9124e1d](https://github.com/tashfiqul-islam/profile-view-counter/commit/9124e1d))
* pvc_banner1 ([efb5377](https://github.com/tashfiqul-islam/profile-view-counter/commit/efb5377))
* rename job name ([3ee295e](https://github.com/tashfiqul-islam/profile-view-counter/commit/3ee295e))
* Serverless and badge design update ([a32d6bf](https://github.com/tashfiqul-islam/profile-view-counter/commit/a32d6bf))
* Updated as individual serverless function ([af46979](https://github.com/tashfiqul-islam/profile-view-counter/commit/af46979))
* updated badge style ([b59ee5b](https://github.com/tashfiqul-islam/profile-view-counter/commit/b59ee5b))
* Updated badgeGenerator.js ([cdd54bc](https://github.com/tashfiqul-islam/profile-view-counter/commit/cdd54bc))
* Updated badgeGenerator.js ([2caf09c](https://github.com/tashfiqul-islam/profile-view-counter/commit/2caf09c))
* updated cicd node to the latest lts ([0af5439](https://github.com/tashfiqul-islam/profile-view-counter/commit/0af5439))
* updated package.json ([e92e5cc](https://github.com/tashfiqul-islam/profile-view-counter/commit/e92e5cc))
* updated readme file ([90f05b5](https://github.com/tashfiqul-islam/profile-view-counter/commit/90f05b5))
* updated readme with code coverage ([ff88310](https://github.com/tashfiqul-islam/profile-view-counter/commit/ff88310))
* Updated README.md ([12e08d5](https://github.com/tashfiqul-islam/profile-view-counter/commit/12e08d5))
* Updated README.md ([8418585](https://github.com/tashfiqul-islam/profile-view-counter/commit/8418585))
* Updated README.md ([257c36e](https://github.com/tashfiqul-islam/profile-view-counter/commit/257c36e))
* Updated README.md ([80dc8b3](https://github.com/tashfiqul-islam/profile-view-counter/commit/80dc8b3))
* Updated README.md ([6e5e2bb](https://github.com/tashfiqul-islam/profile-view-counter/commit/6e5e2bb))
* Updated README.md ([5b0d77f](https://github.com/tashfiqul-islam/profile-view-counter/commit/5b0d77f))
* Updated README.md ([f689533](https://github.com/tashfiqul-islam/profile-view-counter/commit/f689533))
* Updated README.md ([4f59549](https://github.com/tashfiqul-islam/profile-view-counter/commit/4f59549))
* Updated README.md ([6c0498d](https://github.com/tashfiqul-islam/profile-view-counter/commit/6c0498d))
* Updated README.md ([470f3a3](https://github.com/tashfiqul-islam/profile-view-counter/commit/470f3a3))
* Updated README.md ([ad49fbd](https://github.com/tashfiqul-islam/profile-view-counter/commit/ad49fbd))
* Updated README.md ([c0051f7](https://github.com/tashfiqul-islam/profile-view-counter/commit/c0051f7))
* updated to actions/checkout@v3 ([eb97d1b](https://github.com/tashfiqul-islam/profile-view-counter/commit/eb97d1b))
* Updated to node v21 ([e041801](https://github.com/tashfiqul-islam/profile-view-counter/commit/e041801))
* Updated to node v21 ([d21af15](https://github.com/tashfiqul-islam/profile-view-counter/commit/d21af15))
* updated view-counter function ([d13bdd8](https://github.com/tashfiqul-islam/profile-view-counter/commit/d13bdd8))
* updated view-counter logic ([f68b70f](https://github.com/tashfiqul-islam/profile-view-counter/commit/f68b70f))
* updated with custom icons and demolab badges ([c86e8d6](https://github.com/tashfiqul-islam/profile-view-counter/commit/c86e8d6))
* updated with demo labs and custom icon ([14dcbf6](https://github.com/tashfiqul-islam/profile-view-counter/commit/14dcbf6))
* updated with eslint format ([a1a6f96](https://github.com/tashfiqul-islam/profile-view-counter/commit/a1a6f96))
* updated with eslint format ([fe68fbd](https://github.com/tashfiqul-islam/profile-view-counter/commit/fe68fbd))
* updated with no cache mechanism ([50a72e9](https://github.com/tashfiqul-islam/profile-view-counter/commit/50a72e9))
* updating git ignore ([d989529](https://github.com/tashfiqul-islam/profile-view-counter/commit/d989529))
* updating with gh cacheBuster ([a33bc96](https://github.com/tashfiqul-islam/profile-view-counter/commit/a33bc96))
* uploaded gh icon ([a7b4c7a](https://github.com/tashfiqul-islam/profile-view-counter/commit/a7b4c7a))
* using npm v20 ([2e1adc2](https://github.com/tashfiqul-islam/profile-view-counter/commit/2e1adc2))
* using self hosted gh icon ([1328a6b](https://github.com/tashfiqul-islam/profile-view-counter/commit/1328a6b))


### BREAKING CHANGE

* API simplified to username-only endpoint
