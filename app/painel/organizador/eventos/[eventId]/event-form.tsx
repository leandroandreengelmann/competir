"use client"

import * as React from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EventImageUpload } from "@/components/event-image-upload"
import { updateEventAction } from "@/app/actions/events"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AddressPicker } from "@/components/AddressPicker"
import { useState } from "react"

interface Event {
    id: string
    name: string
    address: string
    address_text?: string
    address_formatted?: string
    lat?: number
    lng?: number
    place_id?: string
    date: string
    image_url?: string
}

export function EventForm({ event }: { event: Event }) {
    const router = useRouter()
    const [imageFile, setImageFile] = React.useState<File | null>(null)
    const [removeImage, setRemoveImage] = React.useState(false)
    const [addressData, setAddressData] = useState({
        address_text: event.address_text || event.address || '',
        address_formatted: event.address_formatted || '',
        lat: event.lat || 0,
        lng: event.lng || 0,
        place_id: event.place_id || ''
    })

    async function formAction(prevState: any, formData: FormData) {
        // Anexar arquivo de imagem se existir
        if (imageFile) {
            formData.set('eventImage', imageFile)
        }

        // Flag para remover imagem
        if (removeImage) {
            formData.set('removeImage', 'true')
        }

        // Anexar dados do endereço
        formData.set('address_text', addressData.address_text)
        formData.set('address_formatted', addressData.address_formatted)
        formData.set('lat', addressData.lat.toString())
        formData.set('lng', addressData.lng.toString())
        formData.set('place_id', addressData.place_id)

        const result = await updateEventAction(event.id, prevState, formData)
        if (result.success) {
            toast.success(result.message)
            router.push('/painel/organizador/eventos')
        }
        return result
    }

    const [state, action, isPending] = useActionState(formAction, { success: false })

    function handleImageChange(file: File | null) {
        if (file) {
            setImageFile(file)
            setRemoveImage(false)
        } else {
            setImageFile(null)
            setRemoveImage(true)
        }
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <form action={action} className="space-y-6">
                    {/* Campos de texto em coluna única */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="eventName">Nome do Evento</Label>
                            <Input
                                id="eventName"
                                name="eventName"
                                placeholder="Ex: Open Matupá Jiu-jitsu"
                                defaultValue={event.name}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="eventDate">Data do Evento</Label>
                            <Input
                                id="eventDate"
                                name="eventDate"
                                type="date"
                                defaultValue={event.date}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <AddressPicker
                                onAddressSelect={setAddressData}
                                initialData={{
                                    address_text: event.address_text || event.address,
                                    address_formatted: event.address_formatted,
                                    lat: event.lat,
                                    lng: event.lng,
                                    place_id: event.place_id
                                }}
                            />
                        </div>
                    </div>

                    {/* Upload de imagem (full width) */}
                    <EventImageUpload
                        currentImageUrl={event.image_url}
                        onImageChange={handleImageChange}
                    />

                    {state?.error && (
                        <p className="text-sm font-medium text-destructive">{state.error}</p>
                    )}

                    <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                            disabled={isPending}
                            className="w-full md:w-auto order-2 md:order-1"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending} className="w-full md:w-auto order-1 md:order-2">
                            {isPending ? "Salvando..." : "Salvar Informações"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
