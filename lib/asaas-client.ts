/**
 * Cliente HTTP para integração com API do Asaas
 * Suporta ambientes sandbox e production
 */

type AsaasEnvironment = 'sandbox' | 'production'

interface AsaasConfig {
    apiKey: string
    environment: AsaasEnvironment
}

interface AsaasCustomer {
    id: string
    name: string
    email?: string
    cpfCnpj?: string
}

interface AsaasPayment {
    id: string
    customer: string
    billingType: string
    value: number
    status: string
    dueDate: string
    invoiceUrl?: string
}

interface AsaasPixQrCode {
    encodedImage: string
    payload: string
    expirationDate: string
}

export class AsaasClient {
    private baseUrl: string
    private apiKey: string

    constructor(config: AsaasConfig) {
        // Endpoints corretos conforme environment
        this.baseUrl = config.environment === 'sandbox'
            ? 'https://sandbox.asaas.com/api/v3'
            : 'https://api.asaas.com/v3'
        this.apiKey = config.apiKey
    }

    /**
     * Método genérico para fazer requests à API do Asaas
     */
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'access_token': this.apiKey,
                    'Content-Type': 'application/json',
                    ...options?.headers
                }
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('Asaas API error:', errorData)
                throw new Error(`Asaas API error: ${response.status} ${response.statusText}`)
            }

            return response.json()
        } catch (error) {
            console.error('Erro ao comunicar com Asaas:', error)
            throw new Error('Erro ao processar pagamento. Tente novamente.')
        }
    }

    /**
     * Criar customer no Asaas
     */
    async createCustomer(data: {
        name: string
        cpfCnpj?: string
        email?: string
    }): Promise<AsaasCustomer> {
        return this.request<AsaasCustomer>('/customers', {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    /**
     * Buscar customer por CPF/CNPJ
     */
    async getCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
        try {
            const response = await this.request<{ data: AsaasCustomer[] }>(
                `/customers?cpfCnpj=${cpfCnpj}&limit=1`
            )
            return response.data[0] || null
        } catch {
            return null
        }
    }

    /**
     * Criar cobrança Pix
     */
    async createPixPayment(data: {
        customer: string
        value: number
        description: string
        dueDate: string
    }): Promise<AsaasPayment> {
        return this.request<AsaasPayment>('/payments', {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                billingType: 'PIX'
            })
        })
    }

    /**
     * Buscar QR Code do Pix
     */
    async getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
        return this.request<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`)
    }

    /**
     * Buscar status de um pagamento
     */
    async getPayment(paymentId: string): Promise<AsaasPayment> {
        return this.request<AsaasPayment>(`/payments/${paymentId}`)
    }
}
