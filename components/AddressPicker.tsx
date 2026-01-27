"use client"

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { GoogleMap, Autocomplete, Marker, useJsApiLoader } from '@react-google-maps/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, MapPin } from 'lucide-react'

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"]

interface AddressPickerProps {
    onAddressSelect: (address: {
        address_text: string
        address_formatted: string
        lat: number
        lng: number
        place_id: string
    }) => void
    initialData?: {
        address_text?: string
        address_formatted?: string
        lat?: number
        lng?: number
        place_id?: string
    }
}

const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.5rem',
}

const defaultCenter = {
    lat: -23.55052, // São Paulo
    lng: -46.633309,
}

export function AddressPicker({ onAddressSelect, initialData }: AddressPickerProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
        libraries,
    })

    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [marker, setMarker] = useState<{ lat: number; lng: number }>(
        initialData?.lat && initialData?.lng
            ? { lat: Number(initialData.lat), lng: Number(initialData.lng) }
            : defaultCenter
    )
    const [formattedAddress, setFormattedAddress] = useState(initialData?.address_formatted || '')
    const [inputText, setInputText] = useState(initialData?.address_text || '')
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

    const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete
    }

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace()
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat()
                const lng = place.geometry.location.lng()
                const newPos = { lat, lng }

                setMarker(newPos)
                setFormattedAddress(place.formatted_address || '')
                setInputText(place.name || place.formatted_address || '')

                if (map) {
                    map.panTo(newPos)
                    map.setZoom(17)
                }

                onAddressSelect({
                    address_text: place.name || place.formatted_address || '',
                    address_formatted: place.formatted_address || '',
                    lat,
                    lng,
                    place_id: place.place_id || '',
                })
            }
        }
    }

    const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat()
            const lng = e.latLng.lng()
            const newPos = { lat, lng }
            setMarker(newPos)

            // Reverse geocoding
            const geocoder = new google.maps.Geocoder()
            geocoder.geocode({ location: newPos }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const result = results[0]
                    setFormattedAddress(result.formatted_address)
                    onAddressSelect({
                        address_text: inputText,
                        address_formatted: result.formatted_address,
                        lat,
                        lng,
                        place_id: result.place_id,
                    })
                }
            })
        }
    }

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map)
    }, [])

    if (loadError) {
        return <div className="text-destructive text-sm p-4 border border-destructive rounded-md bg-destructive/10">Erro ao carregar o Google Maps. Verifique sua chave de API nas variáveis de ambiente.</div>
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-[300px] bg-muted rounded-lg border">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="address-search">Endereço do Evento</Label>
                <Autocomplete
                    onLoad={onAutocompleteLoad}
                    onPlaceChanged={onPlaceChanged}
                >
                    <Input
                        id="address-search"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Digite e selecione o endereço..."
                        className="w-full"
                        required
                    />
                </Autocomplete>
            </div>

            <div className="border rounded-lg overflow-hidden relative shadow-sm">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={marker}
                    zoom={initialData?.lat ? 17 : 13}
                    onLoad={onLoad}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                >
                    <Marker
                        position={marker}
                        draggable={true}
                        onDragEnd={onMarkerDragEnd}
                    />
                </GoogleMap>
            </div>

            {formattedAddress && (
                <div className="p-3 bg-muted/50 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span>Endereço que o atleta verá:</span>
                    </p>
                    <p className="text-sm font-medium mt-1 leading-snug">
                        {formattedAddress}
                    </p>
                </div>
            )}
        </div>
    )
}
