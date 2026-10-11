import type { NextConfig } from 'next';

const config: NextConfig = {
  // Workspace packages are TypeScript sources using NodeNext imports ("./x.js" → "./x.ts").
  transpilePackages: ['@cuentasbot/conversation', '@cuentasbot/docgen', '@cuentasbot/shared'],
  // Native / sandboxed libraries stay on the Node runtime, outside the bundle.
  serverExternalPackages: ['sharp', 'docx-templates', 'jszip', 'pdf-lib'],
  // Entity formats with logos and the monthly registry Excel are uploaded through Server Actions and
  // easily exceed the 1 MB default.
  experimental: { serverActions: { bodySizeLimit: '25mb' } },
  webpack: (cfg) => {
    cfg.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'] };
    return cfg;
  },
};

export default config;
