import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

// Vite ships Leaflet's icon paths broken by default — wire them up once.
const defaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

type Props = {
    lat: number;
    lng: number;
    zoom?: number;
    className?: string;
    title?: string;
};

/**
 * Keeps Leaflet's internal pixel size in sync with the actual container.
 * Without this the cached size can stay at 0 (modal open animation) or get
 * stale on layout reflow, which makes tiles render outside the wrapper.
 */
function MapSizeSync({
    lat,
    lng,
    zoom,
}: {
    lat: number;
    lng: number;
    zoom: number;
}) {
    const map = useMap();

    useEffect(() => {
        map.setView([lat, lng], zoom);

        const invalidate = () => map.invalidateSize();

        const t1 = setTimeout(invalidate, 50);
        const t2 = setTimeout(invalidate, 300);
        const t3 = setTimeout(invalidate, 800);

        const observer = new ResizeObserver(invalidate);
        observer.observe(map.getContainer());

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            observer.disconnect();
        };
    }, [lat, lng, zoom, map]);

    return null;
}

export default function VenueMapPreview({
    lat,
    lng,
    zoom = 17,
    className,
    title = 'Venue location',
}: Props) {
    return (
        <div
            className={cn(
                'relative h-48 w-full overflow-hidden rounded-md border bg-muted',
                className,
            )}
            // contain:paint forces the browser to clip any descendant that
            // tries to paint outside this box — defeats Leaflet's cached
            // miscalculations even when its own CSS overrides ours.
            style={{
                contain: 'paint',
                maxWidth: '100%',
            }}
            aria-label={title}
        >
            <MapContainer
                center={[lat, lng]}
                zoom={zoom}
                scrollWheelZoom={false}
                // Inline styles beat Leaflet's `.leaflet-container` rules
                // regardless of CSS bundle order.
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[lat, lng]} />
                <MapSizeSync lat={lat} lng={lng} zoom={zoom} />
            </MapContainer>
        </div>
    );
}
