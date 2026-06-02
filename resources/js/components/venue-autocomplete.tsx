import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type NominatimResult = {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
};

type Props = {
    name: string;
    latName?: string;
    lngName?: string;
    defaultValue?: string;
    defaultLat?: number | null;
    defaultLng?: number | null;
    placeholder?: string;
    onCoordsChange?: (coords: { lat: number; lng: number } | null) => void;
    className?: string;
};

export default function VenueAutocomplete({
    name,
    latName,
    lngName,
    defaultValue = '',
    defaultLat = null,
    defaultLng = null,
    placeholder,
    onCoordsChange,
    className,
}: Props) {
    const [query, setQuery] = useState(defaultValue);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
        defaultLat !== null && defaultLng !== null
            ? { lat: defaultLat, lng: defaultLng }
            : null,
    );
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const trimmed = query.trim();
        if (trimmed.length < 3) {
            setSuggestions([]);
            setOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&countrycodes=ph&format=json&limit=6&addressdetails=1`,
                    { headers: { Accept: 'application/json' } },
                );
                const data: NominatimResult[] = await res.json();
                setSuggestions(data);
                setOpen(data.length > 0);
            } catch {
                setSuggestions([]);
                setOpen(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateCoords = (next: { lat: number; lng: number } | null) => {
        setCoords(next);
        onCoordsChange?.(next);
    };

    const handleSelect = (result: NominatimResult) => {
        setQuery(result.display_name);
        updateCoords({
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        });
        setOpen(false);
        setSuggestions([]);
    };

    const handleInputChange = (value: string) => {
        setQuery(value);
        // Once the user edits the text manually, the previous coords no longer match.
        if (coords !== null) {
            updateCoords(null);
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                name={name}
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                placeholder={placeholder}
                autoComplete="off"
                className={
                    className ??
                    'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                }
            />
            {latName && (
                <input
                    type="hidden"
                    name={latName}
                    value={coords?.lat ?? ''}
                />
            )}
            {lngName && (
                <input
                    type="hidden"
                    name={lngName}
                    value={coords?.lng ?? ''}
                />
            )}
            {open && suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
                    {suggestions.map((s) => (
                        <li
                            key={s.place_id}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelect(s);
                            }}
                            className="flex cursor-pointer items-start gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="line-clamp-2">
                                {s.display_name}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
