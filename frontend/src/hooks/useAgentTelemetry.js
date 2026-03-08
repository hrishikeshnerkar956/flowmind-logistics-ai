import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function useAgentTelemetry() {
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

    return { shipments, agentLogs, metrics, metricsHistory, API_URL };
}
