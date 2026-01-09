<div align="center">

![Profile View Counter Banner](assets/readme-cover.png)

<div style="margin-top: 20px;">

![Version](https://img.shields.io/badge/version-2.0.0-blue?style=for-the-badge&logo=github&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-passing-success?style=for-the-badge&logo=vitest&logoColor=white)
![Coverage](https://img.shields.io/badge/coverage-100%25-success?style=for-the-badge&logo=vitest&logoColor=white)

</div>

<p align="center">
  A <b>blazing-fast, edge-deployed</b> profile view counter for GitHub.<br>
  Built with <b>Bun</b>, <b>Hono</b>, <b>Cloudflare D1 & KV</b>, and <b>TypeScript</b>.
</p>

[![](https://img.shields.io/badge/Live_Demo-Visit-success?style=for-the-badge&logo=google-chrome&logoColor=white)](https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=tashfiqul-islam)

</div>

---

## 📖 Table of Contents

- [Quick Setup](#-quick-setup)
- [Features](#-features)
- [Documentation](#-documentation)
- [For Developers](#-for-developers)
  - [Tech Stack](#tech-stack)
  - [Development Setup](#development-setup)
- [Contributing](#-contributing)

---

## 🚀 Quick Setup

Add this to your GitHub profile `README.md` to instantly track views:

### Markdown
```markdown
[![Profile View Counter](https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=YOUR_USERNAME)](https://github.com/tashfiqul-islam/profile-view-counter)
```

### HTML
```html
<a href="https://github.com/tashfiqul-islam/profile-view-counter">
  <img src="https://profile-view-counter.tashfiq61.workers.dev/api/view-counter?username=YOUR_USERNAME" alt="Profile View Counter" />
</a>
```

> 💡 **Tip:** Replace `YOUR_USERNAME` with your actual GitHub username to start tracking!

---

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **🎨 Modern Aesthetics** | Glassmorphism 3D badges with dynamic gradients and shadows. |
| **⚡ Zero Latency** | Edge caching via Cloudflare KV for sub-10ms global response times. |
| **🛡️ Atomic Accuracy** | D1 (SQLite) database ensures precise, atomic view increments. |
| **✅ Strict Type Safety** | End-to-end type safety with TypeScript and Valibot validation. |
| **🧪 100% Reliability** | Comprehensive test suite with 100% code coverage. |
| **🚀 State-of-the-Art** | Built with Bun, Biome, and the latest Cloudflare primitives. |

---

## � Documentation

| Document | Description |
|----------|-------------|
| [API Reference](src/docs/API.md) | Endpoints, parameters, responses, error handling |
| [Architecture](src/docs/ARCHITECTURE.md) | System design, flow diagrams, component breakdown |
| [Deployment](src/docs/DEPLOYMENT.md) | Step-by-step Cloudflare Workers deployment guide |

---

## �🛠️ For Developers

If you want to host your own instance or contribute:

### Tech Stack

| Component | Technology | Why? |
|-----------|------------|------|
| **Runtime** | [![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh) | 30x faster installs & script execution |
| **Edge** | [![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-%23F38020.svg?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com) | Global low-latency deployment |
| **Framework** | [![Hono](https://img.shields.io/badge/Hono-%23E36002.svg?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev) | Ultra-lightweight, edge-optimized standard |
| **Database** | [![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-%23F38020.svg?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/) | Serverless, atomic SQLite at the edge |
| **Cache** | [![Cloudflare KV](https://img.shields.io/badge/Cloudflare_KV-%23F38020.svg?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/kv/) | High-performance, distributed key-value store |
| **Validation** | [![Valibot](https://img.shields.io/badge/Valibot-%23326CE5.svg?style=for-the-badge&logo=valibot&logoColor=white)](https://valibot.dev) | Tree-shakeable, tiny schema validation |
| **Testing** | [![Vitest](https://img.shields.io/badge/Vitest-%2344a833.svg?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev) | Native worker testing pool & Istanbul coverage |
| **Tooling** | [![Biome](https://img.shields.io/badge/Biome-%2360a5fa.svg?style=for-the-badge&logo=biome&logoColor=white)](https://biomejs.dev) | Rust-based instant linting & formatting |

### Development Setup

1. **Install Dependencies**
   ```bash
   bun install
   ```

2. **Start Dev Server**
   ```bash
   bun run dev
   ```

3. **Run Tests** (100% Coverage)
   ```bash
   bun run test --coverage
   ```

4. **Deploy**
   ```bash
   bunx wrangler login
   bun run deploy
   ```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork & Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/profile-view-counter.git
   cd profile-view-counter
   bun install
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feat/your-feature
   ```

3. **Make Changes & Test**
   ```bash
   bun run test --coverage   # Must maintain 100% coverage
   bun run lint:fix          # Must pass linting
   bun run typecheck         # Must pass type checks
   ```

4. **Update Documentation** (if adding features)
   - Update `src/docs/API.md` for new endpoints
   - Update `src/docs/ARCHITECTURE.md` for design changes

5. **Commit with Conventional Commits**
   ```bash
   bun run commit            # Interactive commit wizard
   ```

6. **Push & Open PR**
   ```bash
   git push origin feat/your-feature
   ```

---

<div align="center">

  <a href="https://github.com/tashfiqul-islam">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
  </a>
  <a href="https://x.com/_tashfiqulislam">
    <img src="https://img.shields.io/badge/Twitter-000000?style=for-the-badge&logo=x&logoColor=white" alt="X"/>
  </a>

  <h3>Built with ❤️ by Tashfiqul Islam</h3>
  <p>Licensed under MIT • © 2026 Profile View Counter</p>

</div>
