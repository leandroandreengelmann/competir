"use client"

import { useActionState, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CheckCircle2 } from "lucide-react"
import { registerAction, checkCpfAvailableAction, checkEmailAvailableAction } from "@/app/actions/auth"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { InlineNotice } from "@/components/ui/inline-notice"

// Utilitários de Máscara
const maskCpf = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1')
}

const maskPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1')
    }
    return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1')
}

const initialState = {
    error: '',
    success: false
}

export default function SignupPage() {
    const [state, action, isPending] = useActionState(registerAction, initialState)
    const searchParams = useSearchParams()
    const returnEvent = searchParams.get('returnEvent')
    const next = searchParams.get('next')

    // Estado para controlar a etapa atual (1 ou 2)
    const [currentStep, setCurrentStep] = useState<1 | 2>(1)

    // Estado para armazenar dados do formulário
    const [formData, setFormData] = useState({
        // Etapa 1 - Dados pessoais (não enviados ao backend ainda)
        name: '',
        cpf: '',
        phone: '',
        birthDate: '',
        weight: '',
        gender: '',
        // Etapa 2 - Acesso
        email: '',
        password: ''
    })

    // Estados de Validação e Loading
    const [uniquenessErrors, setUniquenessErrors] = useState({
        cpf: '',
        email: ''
    })
    const [isValidating, setIsValidating] = useState({
        cpf: false,
        email: false
    })

    // Atualizar campos com máscaras
    const updateField = (field: string, value: string) => {
        let finalValue = value

        if (field === 'cpf') {
            finalValue = maskCpf(value)
        } else if (field === 'phone') {
            finalValue = maskPhone(value)
        }

        setFormData(prev => ({ ...prev, [field]: finalValue }))

        // Limpar erro de unicidade ao alterar
        if (field === 'cpf' || field === 'email') {
            setUniquenessErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    // Debounce para CPF
    useEffect(() => {
        const cpfDigits = formData.cpf.replace(/\D/g, '')
        if (cpfDigits.length === 11) {
            const timer = setTimeout(async () => {
                setIsValidating(prev => ({ ...prev, cpf: true }))
                const { available } = await checkCpfAvailableAction(cpfDigits)
                setUniquenessErrors(prev => ({ ...prev, cpf: available ? '' : 'Este CPF já está em uso' }))
                setIsValidating(prev => ({ ...prev, cpf: false }))
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [formData.cpf])

    // Debounce para E-mail
    useEffect(() => {
        const email = formData.email.trim().toLowerCase()
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (email && emailRegex.test(email)) {
            const timer = setTimeout(async () => {
                setIsValidating(prev => ({ ...prev, email: true }))
                const { available } = await checkEmailAvailableAction(email)
                setUniquenessErrors(prev => ({ ...prev, email: available ? '' : 'Este e-mail já está em uso' }))
                setIsValidating(prev => ({ ...prev, email: false }))
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [formData.email])

    // Validação da Etapa 1
    const isStep1Valid =
        formData.name.trim() !== '' &&
        formData.cpf.replace(/\D/g, '').length === 11 &&
        uniquenessErrors.cpf === '' &&
        !isValidating.cpf &&
        formData.phone.replace(/\D/g, '').length >= 10 &&
        formData.birthDate !== '' &&
        formData.weight !== '' &&
        formData.gender !== ''

    // Validação da Etapa 2
    const isStep2Valid =
        formData.email.trim() !== '' &&
        uniquenessErrors.email === '' &&
        !isValidating.email &&
        formData.password.trim().length >= 8

    // Router para redirect após sucesso
    const router = useRouter()

    // Redirecionar após 10 segundos quando sucesso
    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => {
                router.push(next || '/painel/atleta')
            }, 10000)  // 10 segundos

            return () => clearTimeout(timer)
        }
    }, [state.success, router])

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicHeader />
            <div className="flex-1 flex items-center justify-center p-4 md:py-8">
                <Card className="w-full max-w-lg border-border">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl font-semibold tracking-tight">
                            Criar conta
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Competir
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                            {currentStep === 1 ? 'Etapa 1 de 2 • Dados pessoais' : 'Etapa 2 de 2 • Criar acesso'}
                        </p>
                    </CardHeader>

                    {state.success ? (
                        <CardContent className="space-y-6 text-center py-10">
                            <div className="mx-auto w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg md:text-xl font-bold leading-relaxed">
                                    Parabéns, sua conta foi criada com sucesso!
                                </h3>
                                <div className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-success animate-pulse">
                                    oss
                                </div>
                            </div>
                            <p className="text-muted-foreground text-sm mt-4">
                                Redirecionando em 10 segundos...
                            </p>
                        </CardContent>
                    ) : (
                        <form action={action}>
                            <CardContent className="space-y-6">

                                {state.error && (
                                    <InlineNotice
                                        variant="error"
                                        message={state.error}
                                    />
                                )}

                                {returnEvent && (
                                    <input type="hidden" name="returnEvent" value={returnEvent} />
                                )}
                                {next && (
                                    <input type="hidden" name="next" value={next} />
                                )}

                                {/* ETAPA 1 - Dados Pessoais */}
                                {currentStep === 1 && (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Nome completo</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                placeholder="Seu nome completo"
                                                value={formData.name}
                                                onChange={(e) => updateField('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor="cpf">CPF</Label>
                                                {isValidating.cpf && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                            </div>
                                            <Input
                                                id="cpf"
                                                type="text"
                                                placeholder="000.000.000-00"
                                                maxLength={14}
                                                value={formData.cpf}
                                                onChange={(e) => updateField('cpf', e.target.value)}
                                                className={uniquenessErrors.cpf ? "border-destructive focus-visible:ring-destructive" : ""}
                                                required
                                            />
                                            {uniquenessErrors.cpf && (
                                                <p className="text-sm font-medium text-destructive">{uniquenessErrors.cpf}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="(00) 00000-0000"
                                                value={formData.phone}
                                                onChange={(e) => updateField('phone', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="birthDate">Data de nascimento</Label>
                                            <Input
                                                id="birthDate"
                                                type="date"
                                                value={formData.birthDate}
                                                onChange={(e) => updateField('birthDate', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="weight">Peso (kg)</Label>
                                            <Input
                                                id="weight"
                                                type="number"
                                                step="0.1"
                                                placeholder="Ex: 72.5"
                                                value={formData.weight}
                                                onChange={(e) => updateField('weight', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label>Sexo</Label>
                                            <RadioGroup
                                                value={formData.gender}
                                                onValueChange={(value) => updateField('gender', value)}
                                                className="flex flex-col space-y-2"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="masculino" id="masculino" />
                                                    <Label htmlFor="masculino" className="font-normal cursor-pointer">
                                                        Masculino
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="feminino" id="feminino" />
                                                    <Label htmlFor="feminino" className="font-normal cursor-pointer">
                                                        Feminino
                                                    </Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="outro" id="outro" />
                                                    <Label htmlFor="outro" className="font-normal cursor-pointer">
                                                        Outro
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>
                                    </div>
                                )}

                                {/* ETAPA 2 - Criar Acesso */}
                                {currentStep === 2 && (
                                    <div className="space-y-4">
                                        {/* Campos hidden para enviar ao backend */}
                                        <input type="hidden" name="name" value={formData.name} />
                                        <input type="hidden" name="cpf" value={formData.cpf} />
                                        <input type="hidden" name="phone" value={formData.phone} />
                                        <input type="hidden" name="birthDate" value={formData.birthDate} />
                                        <input type="hidden" name="weight" value={formData.weight} />
                                        <input type="hidden" name="gender" value={formData.gender} />

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor="email">E-mail</Label>
                                                {isValidating.email && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                                            </div>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="seu@email.com"
                                                value={formData.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                                className={uniquenessErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                                                required
                                            />
                                            {uniquenessErrors.email && (
                                                <p className="text-sm font-medium text-destructive">{uniquenessErrors.email}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Senha</Label>
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                placeholder="Crie uma senha forte"
                                                value={formData.password}
                                                onChange={(e) => updateField('password', e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                {currentStep === 1 ? (
                                    <>
                                        <Button
                                            type="button"
                                            className="w-full font-medium"
                                            size="lg"
                                            disabled={!isStep1Valid}
                                            onClick={() => setCurrentStep(2)}
                                        >
                                            Continuar
                                        </Button>
                                        <div className="text-center text-sm">
                                            <Link
                                                href={next ? `/login?next=${encodeURIComponent(next)}` : returnEvent ? `/login?returnEvent=${returnEvent}` : "/login"}
                                                className="text-muted-foreground hover:text-primary transition-colors hover:underline"
                                            >
                                                Já tem conta? Entrar
                                            </Link>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            type="submit"
                                            className="w-full font-medium"
                                            size="lg"
                                            disabled={isPending || !isStep2Valid}
                                        >
                                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Criar conta
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full font-medium"
                                            size="lg"
                                            onClick={() => setCurrentStep(1)}
                                        >
                                            Voltar
                                        </Button>
                                    </>
                                )}
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
            <PublicFooter />
        </div>
    )
}
