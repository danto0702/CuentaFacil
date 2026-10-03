import type { NextConfig } from 'next';

const config: NextConfig = {
  // Workspace packages are TypeScript sources using NodeNext imports ("./x.js" → "./x.ts").
  transpilePackages: ['@cuentasbot/conversation', '@cuentasbot/docgen', '@cuentasbot/shared'],
  // Native / sandboxed libraries stay on the Node runtime, outside the bundle.
  serverExternalPackages: ['sharp', 'docx-templates', 'jszip', 'pdf-lib'],
  webpack: (cfg) => {
    cfg.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'] };
    return cfg;
  },
};

export default config;
