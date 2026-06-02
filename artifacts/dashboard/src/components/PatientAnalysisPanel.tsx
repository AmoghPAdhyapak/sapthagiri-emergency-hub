import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAdmitPatient,
  getListPatientsQueryKey,
  getGetPatientStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Activity,
  HeartPulse,
  AlertTriangle,
  ClipboardList,
  Stethoscope,
  CheckCircle2,
  Droplets,
  Thermometer,
} from "lucide-react";

const schema = z.object({
  name:                z.string().min(1, "Patient name is required"),
  age:                 z.string().optional(),
  gender:              z.string().optional(),
  phone:               z.string().optional(),
  room_no:             z.string().min(1, "Room / ward is required"),
  bed_no:              z.string().optional(),
  blood_pressure:      z.string().optional(),
  oxygen_level:        z.string().optional(),
  pulse_rate:          z.string().optional(),
  temperature:         z.string().optional(),
  weight:              z.string().optional(),
  diabetes_status:     z.string().optional(),
  allergies:           z.string().optional(),
  heart_condition:     z.string().optional(),
  existing_diseases:   z.string().optional(),
  current_symptoms:    z.string().optional(),
  emergency_notes:     z.string().min(3, "Emergency notes required for triage"),
});

type FormValues = z.infer<typeof schema>;

function buildSymptoms(v: FormValues): string {
  const parts: string[] = [];
  if (v.emergency_notes)    parts.push(`Emergency: ${v.emergency_notes}`);
  if (v.current_symptoms)   parts.push(`Symptoms: ${v.current_symptoms}`);
  const vitals: string[] = [];
  if (v.blood_pressure)     vitals.push(`BP ${v.blood_pressure} mmHg`);
  if (v.pulse_rate)         vitals.push(`Pulse ${v.pulse_rate} bpm`);
  if (v.oxygen_level)       vitals.push(`SpO2 ${v.oxygen_level}%`);
  if (v.temperature)        vitals.push(`Temp ${v.temperature}°F`);
  if (vitals.length)        parts.push(`Vitals: ${vitals.join(" | ")}`);
  if (v.age || v.weight)    parts.push(`Age ${v.age ?? "—"} | Weight ${v.weight ?? "—"} kg`);
  if (v.heart_condition && v.heart_condition !== "none") parts.push(`Heart: ${v.heart_condition}`);
  if (v.diabetes_status && v.diabetes_status !== "none") parts.push(`Diabetes: ${v.diabetes_status}`);
  if (v.existing_diseases)  parts.push(`Conditions: ${v.existing_diseases}`);
  if (v.allergies)          parts.push(`Allergies: ${v.allergies}`);
  return parts.join(" | ");
}

const PRIORITY_CONFIG = {
  RED:    { label: "CRITICAL", bg: "bg-red-500/15",    border: "border-red-500/50",    text: "text-red-400" },
  YELLOW: { label: "URGENT",   bg: "bg-amber-500/15",  border: "border-amber-500/50",  text: "text-amber-400" },
  GREEN:  { label: "STABLE",   bg: "bg-emerald-500/15",border: "border-emerald-500/50",text: "text-emerald-400" },
};

interface TriageResult {
  name: string;
  room_no: string;
  priority: "RED" | "YELLOW" | "GREEN";
}

const SH = "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3";

export function PatientAnalysisPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<TriageResult | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", age: "", gender: "unspecified", phone: "", room_no: "", bed_no: "",
      blood_pressure: "", oxygen_level: "", pulse_rate: "", temperature: "", weight: "",
      diabetes_status: "none", allergies: "", heart_condition: "none",
      existing_diseases: "", current_symptoms: "", emergency_notes: "",
    },
  });

  const admitPatient = useAdmitPatient({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
        setResult({ name: data.name, room_no: data.room_no, priority: data.priority as "RED" | "YELLOW" | "GREEN" });
        toast({ title: `Triage complete — ${data.priority}`, description: `${data.name} admitted to Room ${data.room_no}.` });
        form.reset();
      },
      onError: (error) => {
        toast({ title: "Intake Failed", description: (error as { error?: string }).error ?? "Unknown error", variant: "destructive" });
      },
    },
  });

  function onSubmit(values: FormValues) {
    admitPatient.mutate({
      data: { name: values.name, room_no: values.room_no, bed_no: values.bed_no, symptoms: buildSymptoms(values) },
    });
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto w-full">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-primary/20 p-2 rounded-lg">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-foreground">
              Patient Health Analysis
            </h1>
            <p className="text-xs text-muted-foreground">
              Comprehensive medical intake for AI-assisted triage — Sapthagiri NPS University
            </p>
          </div>
        </div>
      </div>

      {/* Triage result banner */}
      {result && (() => {
        const cfg = PRIORITY_CONFIG[result.priority];
        return (
          <div className={`mb-6 rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`w-5 h-5 ${cfg.text}`} />
              <div>
                <p className={`font-black uppercase tracking-wider ${cfg.text}`}>
                  Triage Complete — {cfg.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.name} admitted to Room {result.room_no}
                </p>
              </div>
            </div>
            <Badge className={`${cfg.bg} ${cfg.border} ${cfg.text} border font-black text-sm px-3 py-1`}>
              {result.priority}
            </Badge>
          </div>
        );
      })()}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* ── Section 1: Patient Identity ── */}
            <Card className="border-border bg-card shadow-md">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className={SH}>
                  <User className="w-3.5 h-3.5 text-primary" /> Patient Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-xs text-muted-foreground">Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Last, First" {...field} className="bg-background h-9" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Age (yrs)</FormLabel>
                      <FormControl>
                        <Input placeholder="45" type="number" min="0" max="130" {...field} className="bg-background h-9 font-mono" />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="gender" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unspecified">Unspecified</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" type="tel" {...field} className="bg-background h-9 font-mono" />
                      </FormControl>
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-2 col-span-2">
                    <FormField control={form.control} name="room_no" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Room / Ward *</FormLabel>
                        <FormControl>
                          <Input placeholder="ER-1" {...field} className="bg-background h-9 font-mono uppercase" data-testid="input-room" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="bed_no" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Bed No.</FormLabel>
                        <FormControl>
                          <Input placeholder="B2" {...field} className="bg-background h-9 font-mono uppercase" />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Section 2: Vital Health Analysis ── */}
            <Card className="border-border bg-card shadow-md">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className={SH}>
                  <Activity className="w-3.5 h-3.5 text-emerald-400" /> Vital Health Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: "blood_pressure"  as const, label: "Blood Pressure (mmHg)", placeholder: "120/80" },
                    { name: "oxygen_level"    as const, label: "Oxygen Level — SpO₂ (%)", placeholder: "98" },
                    { name: "pulse_rate"      as const, label: "Pulse Rate (bpm)", placeholder: "72" },
                    { name: "temperature"     as const, label: "Temperature (°F)", placeholder: "98.6" },
                    { name: "weight"          as const, label: "Weight (kg)", placeholder: "70" },
                  ].map(({ name, label, placeholder }) => (
                    <FormField key={name} control={form.control} name={name} render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">{label}</FormLabel>
                        <FormControl>
                          <Input placeholder={placeholder} {...field} className="bg-background h-9 font-mono" data-testid={`input-${name}`} />
                        </FormControl>
                      </FormItem>
                    )} />
                  ))}
                  <FormField control={form.control} name="diabetes_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Diabetes Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background h-9">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="Type 1 Diabetes">Type 1</SelectItem>
                          <SelectItem value="Type 2 Diabetes">Type 2</SelectItem>
                          <SelectItem value="Pre-diabetic">Pre-diabetic</SelectItem>
                          <SelectItem value="Gestational Diabetes">Gestational</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>

            {/* ── Section 3: Medical Conditions ── */}
            <Card className="border-border bg-card shadow-md">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className={SH}>
                  <HeartPulse className="w-3.5 h-3.5 text-red-400" /> Medical Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <FormField control={form.control} name="heart_condition" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Heart Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background h-9" data-testid="select-heart">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="hypertension">Hypertension</SelectItem>
                        <SelectItem value="cardiac arrhythmia">Cardiac Arrhythmia</SelectItem>
                        <SelectItem value="heart failure">Heart Failure</SelectItem>
                        <SelectItem value="coronary artery disease">Coronary Artery Disease</SelectItem>
                        <SelectItem value="prior heart attack">Prior Heart Attack</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="allergies" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-amber-400" /> Allergies
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Penicillin, Latex, Peanuts..." {...field} className="bg-background h-9" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="existing_diseases" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Existing Diseases / Conditions</FormLabel>
                    <FormControl>
                      <Input placeholder="Asthma, Thyroid, CKD..." {...field} className="bg-background h-9" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="current_symptoms" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Current Symptoms</FormLabel>
                    <FormControl>
                      <Input placeholder="Fever, cough, dizziness..." {...field} className="bg-background h-9" />
                    </FormControl>
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            {/* ── Section 4: Emergency Notes & Medical History ── */}
            <Card className="border-border bg-card shadow-md">
              <CardHeader className="pb-3 border-b border-border bg-muted/20">
                <CardTitle className={SH}>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Emergency Notes & Triage
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <FormField control={form.control} name="emergency_notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Chief Complaint / Emergency Observations *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Chest pain radiating to left arm, severe shortness of breath, diaphoresis..."
                        {...field}
                        className="min-h-[100px] resize-none font-mono bg-background text-sm"
                        data-testid="input-symptoms"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-[10px] text-muted-foreground/50">
                      AI triage runs on this field — include all acute symptoms for accurate classification.
                    </p>
                  </FormItem>
                )} />

                {/* Medical History */}
                <div className="rounded-lg border border-border/50 bg-background/30 p-4">
                  <div className={`${SH} mb-2`}>
                    <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" /> Medical History
                  </div>
                  <div className="flex items-center justify-center py-4">
                    <div className="text-center">
                      <Thermometer className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-muted-foreground/40 uppercase tracking-wider">Empty</p>
                      <p className="text-[10px] text-muted-foreground/30 mt-1">
                        No prior observations on record
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="font-black uppercase tracking-wider px-10 shadow-[0_0_20px_hsl(180_70%_50%_/_0.3)]"
              disabled={admitPatient.isPending}
              data-testid="button-submit-admit"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              {admitPatient.isPending ? "Processing Intake…" : "Submit & Run AI Triage"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
