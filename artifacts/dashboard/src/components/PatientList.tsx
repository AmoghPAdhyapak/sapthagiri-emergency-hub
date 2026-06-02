import React, { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListPatients, useUpdatePatient, useDeletePatient, getListPatientsQueryKey, getGetPatientStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, Clock, Trash2 } from "lucide-react";

export function PatientList() {
  const queryClient = useQueryClient();
  const { data: patients = [] } = useListPatients({
    query: { refetchInterval: 5000, queryKey: getListPatientsQueryKey() }
  });

  const updatePatient = useUpdatePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
      }
    }
  });

  const deletePatient = useDeletePatient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
      }
    }
  });

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a, b) => {
      if (a.status === "handled" && b.status !== "handled") return 1;
      if (a.status !== "handled" && b.status === "handled") return -1;
      
      const priorityWeight = { RED: 3, YELLOW: 2, GREEN: 1 };
      const weightA = priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
      const weightB = priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
      
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [patients]);

  const handleMarkHandled = (id: number) => {
    updatePatient.mutate({ id, data: { status: "handled" } });
  };

  const handleDelete = (id: number) => {
    deletePatient.mutate({ id });
  };

  if (patients.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center border-2 border-dashed border-border rounded-lg" data-testid="empty-patient-list">
        <p className="text-muted-foreground text-lg uppercase tracking-wider font-mono">No active patients</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 flex-1" data-testid="patient-list">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-widest sticky top-0 bg-background/95 z-10 backdrop-blur">
        <div className="col-span-2">Priority</div>
        <div className="col-span-3">Patient Name</div>
        <div className="col-span-1">Location</div>
        <div className="col-span-3">Symptoms</div>
        <div className="col-span-1">Wait Time</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>
      
      {sortedPatients.map(patient => (
        <PatientCard 
          key={patient.id} 
          patient={patient} 
          onMarkHandled={() => handleMarkHandled(patient.id)}
          onDelete={() => handleDelete(patient.id)}
          isUpdating={updatePatient.isPending}
          isDeleting={deletePatient.isPending}
        />
      ))}
    </div>
  );
}

function PatientCard({ patient, onMarkHandled, onDelete, isUpdating, isDeleting }: any) {
  const isRed = patient.priority === "RED" && patient.status === "active";
  const isHandled = patient.status === "handled";
  
  const priorityColorMap = {
    RED: "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]",
    YELLOW: "bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]",
    GREEN: "bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]"
  };
  
  return (
    <Card 
      className={`border-l-4 transition-all duration-300 ${isHandled ? "opacity-50 border-l-gray-600 bg-gray-900/50" : 
        patient.priority === "RED" ? "border-l-red-500 animate-critical" : 
        patient.priority === "YELLOW" ? "border-l-yellow-500 bg-card" : 
        "border-l-emerald-500 bg-card"}`}
      data-testid={`card-patient-${patient.id}`}
    >
      <CardContent className="p-0">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
          
          {/* Priority */}
          <div className="col-span-2 flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`font-mono font-bold text-xs uppercase ${priorityColorMap[patient.priority as keyof typeof priorityColorMap] || "bg-gray-500 text-white"} border-0`}
              data-testid={`badge-priority-${patient.id}`}
            >
              {patient.priority}
            </Badge>
            {isRed && <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />}
          </div>
          
          {/* Patient Name */}
          <div className="col-span-3 font-semibold text-foreground truncate" data-testid={`text-name-${patient.id}`}>
            {isHandled ? <s className="text-muted-foreground">{patient.name}</s> : patient.name}
          </div>
          
          {/* Location */}
          <div className="col-span-1 text-sm text-muted-foreground font-mono" data-testid={`text-location-${patient.id}`}>
            R:{patient.room_no} / B:{patient.bed_no || "N/A"}
          </div>
          
          {/* Symptoms */}
          <div className="col-span-3 text-sm truncate" data-testid={`text-symptoms-${patient.id}`}>
            {patient.symptoms}
          </div>
          
          {/* Time Admitted */}
          <div className="col-span-1 text-xs text-muted-foreground font-mono flex items-center gap-1" data-testid={`text-time-${patient.id}`}>
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(patient.created_at))}
          </div>
          
          {/* Actions */}
          <div className="col-span-2 flex items-center justify-end gap-2">
            {patient.status === "active" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs font-semibold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                onClick={onMarkHandled}
                disabled={isUpdating}
                data-testid={`button-handled-${patient.id}`}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                HANDLE
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
              onClick={onDelete}
              disabled={isDeleting}
              data-testid={`button-delete-${patient.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
        </div>
      </CardContent>
    </Card>
  );
}