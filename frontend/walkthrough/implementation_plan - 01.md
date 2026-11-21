# Tailwind CSS v4 Configuration Plan

In Tailwind CSS v4, configuration files like `tailwind.config.js` and `postcss.config.js` are no longer needed. The error `npm error could not determine executable to run` occurred because the `init -p` command is not supported or required in Tailwind v4.

Instead, we will configure Tailwind v4 using the official and recommended Vite plugin (`@tailwindcss/vite`) and CSS-first configuration.

## Proposed Changes

### Dependencies

We need to install the Vite plugin for Tailwind CSS v4 as a development dependency.

- Run `npm install -D @tailwindcss/vite`

---

### Configuration Files

#### [MODIFY] [vite.config.ts](file:///c:/Users/marce/OneDrive/MS2 - Material Ditático/Firjan/UC 03.1 - Typescript - Kamikase/Projeto Estoque/front-kamikase/vite.config.ts)

Add the `tailwindcss` plugin from `@tailwindcss/vite` to the Vite configuration.

```diff
 import { defineConfig } from 'vite'
 import react from '@vitejs/plugin-react'
+import tailwindcss from '@tailwindcss/vite'
 
 // https://vite.dev/config/
 export default defineConfig({
-  plugins: [react()],
+  plugins: [
+    react(),
+    tailwindcss()
+  ],
 })
```

#### [MODIFY] [index.css](file:///c:/Users/marce/OneDrive/MS2 - Material Ditático/Firjan/UC 03.1 - Typescript - Kamikase/Projeto Estoque/front-kamikase/src/index.css)

Import Tailwind CSS directly at the top of your main CSS file.

```diff
+@import "tailwindcss";
```

---

## Verification Plan

### Manual Verification
- We will verify that Tailwind CSS compiles successfully by starting the Vite development server using `npm run dev`.
- We will test a basic utility class (like `text-red-500` or `font-bold`) in `src/App.tsx` to verify it styles correctly in the browser.
