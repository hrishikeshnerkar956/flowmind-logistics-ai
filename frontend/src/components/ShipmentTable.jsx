import { ExclamationTriangleIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/solid';

export default function ShipmentTable({ shipments }) {
    return (
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden p-6 relative h-[800px] flex flex-col hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100 drop-shadow-sm">
                    <TruckIcon className="w-6 h-6 text-blue-400" /> Live Tracking Telemetry
                </h2>
                <div className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">Observe Phase</div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-800/60 text-slate-400 sticky top-0 backdrop-blur-md z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 font-semibold rounded-tl-lg">Shipment ID</th>
                            <th className="px-4 py-3 font-semibold">Route</th>
                            <th className="px-4 py-3 font-semibold">Carrier</th>
                            <th className="px-4 py-3 font-semibold">ETA (hrs)</th>
                            <th className="px-4 py-3 font-semibold">Predicted Risk</th>
                            <th className="px-4 py-3 font-semibold rounded-tr-lg">Priority</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {shipments.map(s => {
                            const riskProxy = s.delay_signals * 10 + (2000 - s.distance_km) / 100;
                            const isHighRisk = riskProxy > 15;
                            return (
                                <tr key={s.shipment_id} className="hover:bg-slate-800/40 transition-colors group">
                                    <td className="px-4 py-4 font-mono text-cyan-400 font-medium group-hover:text-cyan-300">{s.shipment_id}</td>
                                    <td className="px-4 py-4">{s.origin} <span className="text-slate-600 font-bold mx-1">➔</span> {s.destination}</td>
                                    <td className="px-4 py-4">
                                        <span className="bg-slate-950 px-2 py-1 rounded-md text-xs border border-slate-700 font-medium text-slate-300">{s.carrier}</span>
                                    </td>
                                    <td className="px-4 py-4 font-medium text-slate-300">{s.eta_hours}</td>
                                    <td className="px-4 py-4">
                                        {isHighRisk ? (
                                            <span className="bg-rose-500/10 text-rose-400 px-2.5 py-1 rounded border border-rose-500/20 flex items-center gap-1.5 w-fit font-medium">
                                                <ExclamationTriangleIcon className="w-3.5 h-3.5" /> High
                                            </span>
                                        ) : (
                                            <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20 flex items-center gap-1.5 w-fit font-medium">
                                                <ShieldCheckIcon className="w-3.5 h-3.5" /> Safe
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={s.priority === "High" ? "text-amber-400 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] bg-amber-500/10 px-2 py-1 rounded" : "text-slate-500"}>
                                            {s.priority}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {shipments.length === 0 && (
                            <tr><td colSpan="6" className="text-center py-12 text-slate-500">Awaiting Simulation Telemetry...</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
