import React from "react";
import { useGetPatientStats, getGetPatientStatsQueryKey } from "@workspace/api-client-react";
import { Activity, Users, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

export function StatsBar() {
  const { data: stats } = useGetPatientStats({
    query: { refetchInterval: 5000, queryKey: getGetPatientStatsQueryKey() }
  });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-6 gap-4" data-testid="stats-bar">
      <StatCard 
        label="Total Admitted" 
        value={stats.total} 
        icon={<Users className="w-5 h-5 text-blue-400" />} 
        borderColor="border-blue-500/50"
        valueColor="text-blue-100"
      />
      <StatCard 
        label="Active Cases" 
        value={stats.active} 
        icon={<Activity className="w-5 h-5 text-indigo-400" />} 
        borderColor="border-indigo-500/50"
        valueColor="text-indigo-100"
      />
      <StatCard 
        label="Handled" 
        value={stats.handled} 
        icon={<CheckCircle className="w-5 h-5 text-slate-400" />} 
        borderColor="border-slate-500/50"
        valueColor="text-slate-300"
      />
      <StatCard 
        label="Critical (RED)" 
        value={stats.red} 
        icon={<ShieldAlert className={`w-5 h-5 text-red-500 ${stats.red > 0 ? "animate-pulse" : ""}`} />} 
        borderColor="border-red-500"
        valueColor="text-red-400"
        pulse={stats.red > 0}
      />
      <StatCard 
        label="Caution (YELLOW)" 
        value={stats.yellow} 
        icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />} 
        borderColor="border-yellow-500/70"
        valueColor="text-yellow-400"
      />
      <StatCard 
        label="Stable (GREEN)" 
        value={stats.green} 
        icon={<Activity className="w-5 h-5 text-emerald-500" />} 
        borderColor="border-emerald-500/50"
        valueColor="text-emerald-400"
      />
    </div>
  );
}

function StatCard({ label, value, icon, borderColor, valueColor, pulse }: any) {
  return (
    <div className={`bg-card rounded-md border-t-2 ${borderColor} p-4 flex flex-col justify-center relative overflow-hidden`}>
      {pulse && <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
        {icon}
      </div>
      <div className={`text-3xl font-mono font-black ${valueColor}`} data-testid={`stat-${label.split(' ')[0].toLowerCase()}`}>
        {value}
      </div>
    </div>
  );
}