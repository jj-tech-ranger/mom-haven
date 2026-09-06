import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
              return 'vendor-firebase-firestore';
            }
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'vendor-firebase-auth';
            }
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'vendor-firebase-common';
            }
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('motion')) {
              return 'vendor-motion';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            return 'vendor-libs';
          }

          if (
            id.includes('/src/components/clinician/ClinicianPatientWorkspace') ||
            id.includes('/src/components/clinician/FacilityRosterView') ||
            id.includes('/src/components/ClinicianShell')
          ) {
            return 'clinician-workspace';
          }
          if (id.includes('/src/components/clinician/')) {
            return 'clinician-modals';
          }
          if (id.includes('/src/components/admin/')) {
            return 'admin-ui';
          }
          if (id.includes('/src/components/records/') || id.includes('/src/components/journey/')) {
            return 'records-journey-ui';
          }
          if (id.includes('/src/components/health/') || id.includes('/src/components/today/')) {
            return 'health-today-ui';
          }
          if (id.includes('/src/components/auth/') || id.includes('/src/components/onboarding/')) {
            return 'auth-onboarding-ui';
          }
          if (id.includes('/src/components/child/') || id.includes('/src/components/profile/')) {
            return 'child-profile-ui';
          }
          if (id.includes('/src/services/')) {
            return 'app-services';
          }
        },
      },
    },
  },
}));
