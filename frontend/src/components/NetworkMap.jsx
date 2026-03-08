import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';

// Fix Leaflet's default icon path issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CITY_COORDINATES = {
    "Mumbai": [19.0760, 72.8777],
    "Delhi": [28.7041, 77.1025],
    "Bangalore": [12.9716, 77.5946],
    "Hyderabad": [17.3850, 78.4867],
    "Pune": [18.5204, 73.8567]
};

// Dark theme map tiles URL
const MAP_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export default function NetworkMap({ shipments }) {
    // We only want to draw shipments that have valid coordinates
    const activeRoutes = shipments.filter(s => CITY_COORDINATES[s.origin] && CITY_COORDINATES[s.destination]);

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-4 h-[400px] lg:h-[500px] relative overflow-hidden group">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent z-20"></div>

            <div className="absolute top-6 left-6 z-[400] pointer-events-none">
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100 drop-shadow-md bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-700/50 backdrop-blur-md">
                    Geographic Telemetry
                </h2>
            </div>

            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-800/50 relative z-10">
                <MapContainer
                    center={[21.1458, 79.0882]} // Center of India loosely
                    zoom={5}
                    scrollWheelZoom={false}
                    className="w-full h-full bg-slate-950"
                >
                    <TileLayer
                        attribution={MAP_ATTRIBUTION}
                        url={MAP_TILES}
                    />

                    {/* Draw City Markers */}
                    {Object.entries(CITY_COORDINATES).map(([city, coords]) => (
                        <Marker key={city} position={coords}>
                            <Popup className="bg-slate-900 text-slate-200 border-slate-700">
                                <strong className="text-cyan-400">{city} Hub</strong><br />
                                Active Node
                            </Popup>
                        </Marker>
                    ))}

                    {/* Draw Shipment Routes */}
                    {activeRoutes.map(s => {
                        const riskProxy = s.delay_signals * 10 + (2000 - s.distance_km) / 100;
                        const isHighRisk = riskProxy > 15;

                        // Route styling based on AI risk prediction
                        const pathOptions = isHighRisk
                            ? { color: '#f43f5e', weight: 3, opacity: 0.8, dashArray: '5, 8' } // Rose-500, dashed for reroutes/chaos
                            : { color: '#06b6d4', weight: 2, opacity: 0.3 }; // Cyan-500, solid low opacity for safe paths

                        return (
                            <Polyline
                                key={s.shipment_id}
                                positions={[CITY_COORDINATES[s.origin], CITY_COORDINATES[s.destination]]}
                                pathOptions={pathOptions}
                            >
                                <Popup>
                                    <div className="font-sans text-sm">
                                        <span className="font-bold text-cyan-500">{s.shipment_id}</span><br />
                                        {s.origin} ➔ {s.destination}<br />
                                        Status: <span className={isHighRisk ? "text-rose-500 font-bold" : "text-emerald-500"}>{isHighRisk ? "CRITICAL RISK" : "NOMINAL"}</span>
                                    </div>
                                </Popup>
                            </Polyline>
                        );
                    })}
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 right-6 z-[400] bg-slate-900/80 backdrop-blur-md border border-slate-700/50 p-3 rounded-lg text-xs font-medium space-y-2 shadow-xl">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-cyan-500 opacity-60"></div>
                    <span className="text-slate-300">Nominal Route</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-rose-500 border-t-2 border-dashed border-rose-500"></div>
                    <span className="text-slate-300">AI Evaluating Risk</span>
                </div>
            </div>
        </div>
    );
}
