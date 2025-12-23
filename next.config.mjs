/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
      remotePatterns: [
          {
              protocol: 'https',
              hostname: '**',
          },
      ],
  },
};

export default nextConfig;
