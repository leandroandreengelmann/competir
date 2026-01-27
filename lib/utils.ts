import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateAuthError(message: string): string {
  const msg = message.toLowerCase()

  if (msg.includes("too many requests") || msg.includes("rate limit exceeded")) {
    return "Muitas solicitações enviadas em pouco tempo. Por favor, aguarde alguns minutos antes de tentar novamente."
  }
  if (msg.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos."
  }
  if (msg.includes("email not confirmed")) {
    return "Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada."
  }
  if (msg.includes("user already registered")) {
    return "Este e-mail já possui um cadastro ativo."
  }
  if (msg.includes("over email send rate limit") || msg.includes("email rate limit exceeded")) {
    return "Limite de envio de e-mails atingido para este endereço. Aguarde alguns minutos e tente novamente."
  }
  if (msg.includes("invalid request")) {
    return "Solicitação inválida. Tente novamente."
  }
  if (msg.includes("session") || msg.includes("link") || msg.includes("expired") || msg.includes("token")) {
    return "O link de recuperação é inválido ou expirou. Por favor, solicite um novo e-mail."
  }

  return "Ocorreu um erro inesperado. Tente novamente."
}
