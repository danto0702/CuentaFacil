import type { NextConfig } from 'next';

/** Contractor portal host (ADR-061): every path there is served from app/mi-cuenta. */
const PORTAL_HOST = process.env.PORTAL_HOST ?? 'cuenta.pascalia.lat';

const config: NextConfig = {
  // Workspace packages are TypeScript sources using NodeNext imports ("./x.js" → "./x.ts").
  transpilePackages: ['@cuentasbot/conversation', '@cuentasbot/docgen', '@cuentasbot/shared'],
  // Native / sandboxed libraries stay on the Node runtime, outside the bundle.
  serverExternalPackages: ['sharp', 'docx-templates', 'jszip', 'pdf-lib'],
  // Entity formats with logos and the monthly registry Excel are uploaded through Server Actions and
  // easily exceed the 1 MB default.
  experimental: { serverActions: { bodySizeLimit: '25mb' } },
  async rewrites() {
    const onPortal = [{ type: 'host' as const, value: PORTAL_HOST }];
    return {
      beforeFiles: [
        { source: '/', has: onPortal, destination: '/mi-cuenta' },
        // Next's own files and paths already under /mi-cuenta pass through; the staff panel stays unreachable.
        {
          source: '/:path((?!_next/|mi-cuenta(?:/|$)|favicon\\.ico$).+)',
          has: onPortal,
          destination: '/mi-cuenta/:path',
        },
      ],
    };
  },
  webpack: (cfg) => {
    cfg.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'] };
    return cfg;
  },
};

export default config;
