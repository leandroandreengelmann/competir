import { Suspense } from "react"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { LoginForm } from "./login-form"

export default async function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col bg-brand-50">
            <PublicHeader />

            <main className="flex-1 flex items-center justify-center p-4 py-16">
                <div className="w-full flex justify-center">
                    <Suspense fallback={<div className="w-full max-w-sm h-[400px] bg-white/50 animate-pulse rounded-lg" />}>
                        <LoginForm />
                    </Suspense>
                </div>
            </main>

            <PublicFooter />
        </div>
    )
}
