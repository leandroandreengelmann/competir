"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useActionState } from "react"

import { createEventAction } from "@/app/actions/events"
import { AddressPicker } from "@/components/AddressPicker"
import { useState } from "react"

const initialState = {
    success: false,
    message: '',
    error: ''
}

export default function NewEventPage() {
    const [state, action, isPending] = useActionState(createEventAction, initialState)
    const [addressData, setAddressData] = useState({
        address_text: '',
        address_formatted: '',
        lat: 0,
        lng: 0,
        place_id: ''
    })

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Cadastro de Evento</h1>
                <p className="text-muted-foreground">
                    Preencha as informações abaixo para criar um novo evento.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Dados do Evento</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={action} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="eventName">Nome do Evento</Label>
                            <Input
                                id="eventName"
                                name="eventName"
                                placeholder="Ex: Campeonato Regional 2026"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <AddressPicker onAddressSelect={setAddressData} />

                            {/* Hidden inputs to send data via FormAction */}
                            <input type="hidden" name="address_text" value={addressData.address_text} />
                            <input type="hidden" name="address_formatted" value={addressData.address_formatted} />
                            <input type="hidden" name="lat" value={addressData.lat || ''} />
                            <input type="hidden" name="lng" value={addressData.lng || ''} />
                            <input type="hidden" name="place_id" value={addressData.place_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="eventDate">Data do Evento</Label>
                            <Input
                                id="eventDate"
                                name="eventDate"
                                type="date"
                                required
                            />
                        </div>


                        <div className="flex justify-end pt-4">
                            <Button type="submit" size="lg" disabled={isPending}>
                                {isPending ? "Salvando..." : "Salvar"}
                            </Button>
                        </div>

                        {state.success && (
                            <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm mb-4">
                                {state.message}
                            </div>
                        )}

                        {state.error && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm mb-4">
                                {state.error}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
