import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';

// See https://wxt.dev/api/config.html
export default defineConfig({
  vite: () => ({
    plugins: [react()],
    build: {
      sourcemap: true,
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if(warning.code === 'SOURCEMAP_ERROR') {
            return;
          }

          defaultHandler(warning)
        },
      },
    },
    optimizeDeps: {
      include: ['@mui/icons-material'],
    }
  }),
  manifest: {
    action: {
      default_title: 'Truecaller Search',
    },
    permissions: [
      "sidePanel",
      "storage",
      "contextMenus",
    ],
    host_permissions: ["<all_urls>"]
  },
});
