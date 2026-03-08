
export default function AgentLogList({ agentLogs }) {
    return (
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
    );
}
