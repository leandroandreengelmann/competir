/**
 * Helper para centralização de rotas do sistema.
 * Focado em evitar bugs de 404 e garantir tipagem correta (UUID string).
 */

export const routes = {
    /**
     * Rota para a página de inscrição de um atleta em um evento específico.
     */
    athleteEventRegistration: (eventId: string): string => {
        if (!eventId) {
            console.warn('athleteEventRegistration: eventId ausente');
            return '/painel/atleta';
        }
        return `/painel/atleta/eventos/${eventId}/inscricao`;
    },

    /**
     * Rota de login com parâmetro para redirecionamento pós-autenticação.
     */
    loginWithNext: (nextUrl: string): string => {
        const encodedNext = encodeURIComponent(nextUrl);
        return `/login?next=${encodedNext}`;
    },

    forgotPassword: () => '/forgot-password',
    resetPassword: () => '/reset-password',
    authCallback: () => '/auth/callback'
};
