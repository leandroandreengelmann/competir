/** @type {import('next').NextConfig} */
const nextConfig = {
    // Otimização de Imagens: Permite carregar imagens do Supabase e outros domínios comuns
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
            {
                protocol: 'https',
                hostname: '**.googleusercontent.com',
                port: '',
                pathname: '**',
            }
        ],
    },
    // Segurança: Adiciona headers sugeridos pela skill vercel-deployment
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                ],
            },
        ]
    },
    // Ignora erros de TypeScript durante o build apenas se você quiser garantir que o deploy ocorra
    // mesmo com pequenos erros de tipagem. (Recomendo manter false para segurança, mas true para velocidade)
    typescript: {
        ignoreBuildErrors: false,
    },
};

export default nextConfig;
