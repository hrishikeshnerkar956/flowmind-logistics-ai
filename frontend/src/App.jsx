import { BeakerIcon, ExclamationTriangleIcon, ShieldCheckIcon, TruckIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import MetricsChart from './components/MetricsChart';

const API_URL = "http://localhost:8000/api";

function App() {
  const [shipments, setShipments] = useState([]);
  const [agentLogs, setAgentLogs] = useState([]);
  const [metrics, setMetrics] = useState({ warehouse_load: {}, carrier_reliability: {} });
  const [metricsHistory, setMetricsHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [shipRes, logsRes, metricsRes] = await Promise.all([
          fetch(`${API_URL}/shipments`),
          fetch(`${API_URL}/agent-logs`),
          fetch(`${API_URL}/metrics`)
        ]);
        if (shipRes.ok) setShipments(await shipRes.json());
        if (logsRes.ok) setAgentLogs(await logsRes.json());
        if (metricsRes.ok) {
          const newMetrics = await metricsRes.json();
          setMetrics(newMetrics);

          // Append to history for the chart
          setMetricsHistory(prev => {
            const now = new Date();
            const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

            let maxLoad = 0;
            if (newMetrics.warehouse_load && Object.values(newMetrics.warehouse_load).length > 0) {
              maxLoad = Math.max(...Object.values(newMetrics.warehouse_load)) * 100;
            }
            let minRel = 100;
            if (newMetrics.carrier_reliability && Object.values(newMetrics.carrier_reliability).length > 0) {
              minRel = Math.min(...Object.values(newMetrics.carrier_reliability)) * 100;
            }

            const nextHist = [...prev, { time: timeStr, load: maxLoad, reliability: minRel }];
            if (nextHist.length > 20) return nextHist.slice(nextHist.length - 20); // Keep last 20 ticks
            return nextHist;
          });
        }
      } catch (err) {
        console.error("Agent backend offline", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 selection:bg-cyan-500/30">
      <header className="mb-8 flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3">
            <BeakerIcon className="w-8 h-8 text-cyan-400" />
            FlowMind
          </h1>
          <p className="text-slate-400 mt-1">Autonomous AI Operations Layer for Logistics & Supply Chains</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={async () => {
              try {
                const res = await fetch(`${API_URL}/chaos`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chaos_type: 'warehouse_congestion' })
                });
                if (res.ok) {
                  const data = await res.json();
                  alert(`Chaos Injected: ${data.event}`);
                }
              } catch (e) {
                console.error("Chaos failed", e);
              }
            }}
            className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/50 transition-colors rounded-xl px-4 py-2 flex items-center gap-2 font-bold shadow-lg shadow-rose-500/20"
          >
            <ExclamationTriangleIcon className="w-5 h-5" />
            Inject Chaos
          </button>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2 shadow-lg shadow-black/50">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium">Agent Loop Active</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Col: Shipments */}
        <div className="xl:col-span-2 space-y-6">
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
        </div>

        {/* Right Col: Operations AI Log & Metrics */}
        <div className="space-y-6">

          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-5 shadow-xl relative hover:border-slate-700/80 transition-all duration-300 flex flex-col hidden lg:block">
            <h3 className="text-slate-400 text-sm font-semibold tracking-wide uppercase mb-4 flex justify-between">
              Network Health Telemetry
              <span className="text-cyan-500 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">● Live</span>
            </h3>
            <div className="h-[150px] -ml-2 -mb-2">
              <MetricsChart data={metricsHistory} />
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl p-6 flex flex-col h-[580px] relative hover:border-slate-700/80 transition-all duration-300">
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                Reason, Decide & Act Log
              </h2>
              <div className="text-xs text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">Learning Phase</div>
            </div>

            <div className="flex-1 overflow-y-auto pr-3 space-y-5 custom-scrollbar relative">
              <div className="absolute left-[19px] top-6 bottom-4 w-px bg-slate-800/80"></div>
              {agentLogs.map((log, i) => {
                let badgeColor = "bg-blue-500";
                let textColor = "text-blue-400";
                let borderColor = "border-blue-500";

                if (log.action_taken === "ALERT") { badgeColor = "bg-rose-500"; textColor = "text-rose-400"; borderColor = "border-rose-500"; }
                if (log.action_taken === "PRIORITIZE") { badgeColor = "bg-amber-500"; textColor = "text-amber-400"; borderColor = "border-amber-500"; }
                if (log.action_taken === "SWITCH_CARRIER") { badgeColor = "bg-purple-500"; textColor = "text-purple-400"; borderColor = "border-purple-500"; }

                return (
                  <div key={log.id || i} className="relative pl-12 animate-fade-in-up group/item cursor-default">
                    <div className={`absolute left-[14px] top-3.5 w-2.5 h-2.5 rounded-full ring-4 ring-slate-950 ${badgeColor} shadow-[0_0_12px_rgba(255,255,255,0.15)] group-hover/item:scale-125 transition-transform`}></div>
                    <div className="bg-slate-800/30 hover:bg-slate-800/60 transition-colors border border-slate-700/50 rounded-xl p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className={`${badgeColor} bg-opacity-10 text-xs font-bold px-2 py-0.5 rounded ${borderColor} border border-opacity-30 ${textColor} shadow-sm`}>
                            {log.action_taken}
                          </span>
                          <span className="font-mono text-xs text-slate-400 px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
                            {log.shipment_id}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-900/50 px-2 py-1 rounded uppercase tracking-wider">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        {log.reasoning}
                      </p>
                    </div>
                  </div>
                )
              })}
              {agentLogs.length === 0 && (
                <div className="pl-12 text-slate-500 text-sm font-medium italic mt-4">Monitoring systems... No interventions required currently.</div>
              )}
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.4); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.8); }
      `}} />
    </div>
  );
}

export default App;
