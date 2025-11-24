# Step 1: Project Initialization

## 1.1. Scaffold Tauri App
We will use the official `create-tauri-app` to set up a Vite + React + TypeScript project.

```bash
npm create tauri-app@latest .
# Select:
# - Package Manager: pnpm (or npm)
# - Language: TypeScript / JavaScript
# - UI Template: React
# - UI Flavor: TypeScript
```

## 1.2. Install Frontend Dependencies
Navigate to the root directory and install the core libraries defined in the spec.

```bash
pnpm install lucide-react \
             clsx tailwind-merge \
             zustand \
             @tanstack/react-query \
             @tanstack/react-router \
             react-hook-form zod @hookform/resolvers \
             react-virtuoso \
             @monaco-editor/react
```

## 1.3. Setup Tailwind CSS
Initialize Tailwind if the template didn't fully configure it.

```bash
pnpm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Add Shadcn/UI specific theme extensions here later
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## 1.4. Initialize Shadcn/UI
We need a consistent component library.

```bash
pnpm dlx shadcn-ui@latest init
# - Style: New York
# - Base Color: Zinc
# - CSS variables: Yes
```

Add essential components immediately:
```bash
pnpm dlx shadcn-ui@latest add button input table dialog sheet toast dropdown-menu scroll-area
```

## 1.5. Rust Dependencies (Backend)
Navigate to `src-tauri` and add the required crates.

```bash
cd src-tauri
cargo add tokio --features full
cargo add serde --features derive
cargo add serde_json
cargo add tauri-plugin-shell
# For Firestore gRPC
cargo add firestore
# For Service Account / Auth handling (if not handled by firestore crate automatically)
cargo add googapis
cargo add tonic
cargo add prost
```

*Note: We might refine the Rust dependencies in Step 2, but this covers the basics.*

## 1.6. Configure `tauri.conf.json`
Ensure permissions are set correctly for development.

```json
{
  "build": {
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "tauri": {
    "bundle": {
      "identifier": "com.firefoo-alt.app",
      "targets": "all"
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "Firefoo Alt",
        "width": 1200,
        "height": 800
      }
    ]
  }
}
```

## 1.7. Verify Setup
1. Run `pnpm tauri dev`.
2. Ensure the app opens and the React standard page is visible.
3. Ensure Rust compiles without errors.
