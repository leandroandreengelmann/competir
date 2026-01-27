'use client'

import * as React from "react"
import { useActionState, useState, useEffect } from "react"
import { saveLoginBackgroundAction, type LoginBackgroundConfig, type ActionState } from "@/app/actions/system-config"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Image as ImageIcon, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

interface LoginConfigClientProps {
    initialConfig: LoginBackgroundConfig
}

const initialState: ActionState = {}

export function LoginConfigClient({ initialConfig }: LoginConfigClientProps) {
    const [state, formAction, isPending] = useActionState(saveLoginBackgroundAction, initialState)
    const [desktopPreview, setDesktopPreview] = useState<string | null>(initialConfig.desktopImageUrl)
    const [mobilePreview, setMobilePreview] = useState<string | null>(initialConfig.mobileImageUrl)

    // Flags para remoção
    const [removeDesktop, setRemoveDesktop] = useState(false)
    const [removeMobile, setRemoveMobile] = useState(false)

    useEffect(() => {
        if (state.success) {
            toast.success(state.message)
        } else if (state.error) {
            toast.error(state.error)
        }
    }, [state])

    const handleDesktopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setDesktopPreview(URL.createObjectURL(file))
            setRemoveDesktop(false)
        }
    }

    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setMobilePreview(URL.createObjectURL(file))
            setRemoveMobile(false)
        }
    }

    const handleRemoveDesktop = () => {
        setDesktopPreview(null)
        setRemoveDesktop(true)
    }

    const handleRemoveMobile = () => {
        setMobilePreview(null)
        setRemoveMobile(true)
    }

    return (
        <form action={(formData) => {
            if (removeDesktop) formData.append('removeDesktop', 'true')
            if (removeMobile) formData.append('removeMobile', 'true')
            formAction(formData)
        }} className="grid gap-6 md:grid-cols-2">

            {/* Desktop Background */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Background Desktop
                    </CardTitle>
                    <CardDescription>
                        Imagem para telas horizontais. Recomendado 1920x1080.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-video relative rounded-md border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/50">
                        {desktopPreview ? (
                            <img
                                src={desktopPreview}
                                alt="Preview Desktop"
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageIcon className="h-8 w-8 opacity-20" />
                                <span className="text-xs">Nenhuma imagem desktop</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="desktopImage" className="sr-only">Upload Desktop</Label>
                            <Input
                                id="desktopImage"
                                name="desktopImage"
                                type="file"
                                accept="image/*"
                                onChange={handleDesktopChange}
                                className="cursor-pointer"
                            />
                        </div>
                        {desktopPreview && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={handleRemoveDesktop}
                                title="Remover imagem"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Background */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Background Mobile
                    </CardTitle>
                    <CardDescription>
                        Imagem para telas verticais. Recomendado 1080x1920.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="aspect-[9/16] max-h-[300px] mx-auto relative rounded-md border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/50">
                        {mobilePreview ? (
                            <img
                                src={mobilePreview}
                                alt="Preview Mobile"
                                className="object-cover w-full h-full"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <ImageIcon className="h-8 w-8 opacity-20" />
                                <span className="text-xs">Nenhuma imagem mobile</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="mobileImage" className="sr-only">Upload Mobile</Label>
                            <Input
                                id="mobileImage"
                                name="mobileImage"
                                type="file"
                                accept="image/*"
                                onChange={handleMobileChange}
                                className="cursor-pointer"
                            />
                        </div>
                        {mobilePreview && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={handleRemoveMobile}
                                title="Remover imagem"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isPending} className="w-full md:w-auto min-w-[200px]">
                    {isPending ? (
                        <>
                            <Upload className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Salvar Alterações
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
