# 🎨 SAEO.ai Frontend - Intelligent Dashboard

The frontend for SAEO.ai is a premium, highly interactive dashboard designed for professional SEO practitioners. It translates complex multi-agent data into actionable, high-density visualizations.

---

## 🛠️ Technology Stack

| Technology | Purpose |
| :--- | :--- |
| **React 18** | UI framework and component logic |
| **Vite** | High-speed build tool and development server |
| **Tailwind CSS** | Utility-first styling with a custom dark-mode design system |
| **Framer Motion** | Advanced micro-animations and layout transitions |
| **Recharts** | Complex data visualization for trends and metrics |
| **Lucide React** | Premium iconography consistent with the platform's aesthetic |

---

## 📁 Project Structure

```text
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/      # Layout and Sidebar navigation
│   │   └── ui/             # Reusable premium UI components
│   ├── contexts/           # Platform state and Auth management
│   ├── lib/                # API client (Axios) configuration
│   └── pages/
│       ├── LandingPage.tsx # Refined 'Agentic' introduction
│       └── dashboard/      # Domain-specific tool dashboards
├── tailwind.config.js       # Custom premium color tokens
└── vite.config.ts           # Build optimization settings
```

---

## ✨ Key UI Principles

### 1. Glassmorphism Design
The dashboard uses a sophisticated "Glass" effect (`backdrop-blur-xl`) across all cards and modals, creating a layered, premium feel that sets it apart from standard SEO tools.

### 2. Unified Sidebar Navigation
Consolidated navigation into a single, comprehensive sidebar. This allows users to move between **AEO Intelligence**, **Technical Audits**, and **Keyword Discovery** without losing context.

### 3. Motion-Optimized Data
Using `framer-motion`, we've implemented progressive loading for data cards. Instead of refreshing the whole page, agents "stream" their findings, creating a living, responsive interface.

---

## 🚦 Getting Started

1. **Install Packages**:
   ```bash
   npm install
   ```
2. **Development Mode**:
   ```bash
   npm run dev
   ```
3. **Build Profile**:
   ```bash
   npm run build
   ```
