import { BeakerIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import AgentLogList from './components/AgentLogList';
import MetricsChart from './components/MetricsChart';
import NetworkMap from './components/NetworkMap';
import ShipmentTable from './components/ShipmentTable';
import { useAgentTelemetry } from './hooks/useAgentTelemetry';

function App() {
  const { shipments, agentLogs, metrics, metricsHistory, API_URL } = useAgentTelemetry();

  const handleChaosInjection = async () => {
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
  };

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
            onClick={handleChaosInjection}
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

        {/* Left Col: Shipments & Map */}
        <div className="xl:col-span-2 space-y-6">
          <NetworkMap shipments={shipments} />
          <ShipmentTable shipments={shipments} />
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

          <AgentLogList agentLogs={agentLogs} />

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
