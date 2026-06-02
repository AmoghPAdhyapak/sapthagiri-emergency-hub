import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Stethoscope,
  UserPlus,
  HeartPulse,
  Droplets,
  AlertTriangle,
} from "lucide-react";

const formSchema = z.object({
  name:               z.string().min(1, "Patient name is required"),
  room_no:            z.string().min(1, "Room / ward is required"),
  bed_no:             z.string().optional(),
  age:                z.string().optional(),
  weight:             z.string().optional(),
  blood_pressure:     z.string().optional(),
  pulse_rate:         z.string().optional(),
  oxygen_level:       z.string().optional(),
  diabetes_status:    z.string().optional(),
  heart_condition:    z.string().optional(),
  existing_conditions:z.string().optional(),
  allergies:          z.string().optional(),
  emergency_notes:    z.string().min(3, "Emergency notes required for triage"),
});

type FormValues = z.infer<typeof formSchema>;

function buildSymptoms(v: FormValues): string {
  const parts: string[] = [];
  if (v.emergency_notes) parts.push(`Emergency: ${v.emergency_notes}`);

  const vitals: string[] = [];
  if (v.blood_pressure) vitals.push(`BP ${v.blood_pressure} mmHg`);
  if (v.pulse_rate)     vitals.push(`Pulse ${v.pulse_rate} bpm`);
  if (v.oxygen_level)   vitals.push(`SpO2 ${v.oxygen_level}%`);
  if (vitals.length)    parts.push(`Vitals: ${vitals.join(" | ")}`);

  if (v.age || v.weight)
    parts.push(`Patient: Age ${v.age || "N/A"} | Weight ${v.weight || "N/A"} kg`);

  if (v.heart_condition && v.heart_condition !== "none")
    parts.push(`Heart: ${v.heart_condition}`);
  if (v.diabetes_status && v.diabetes_status !== "none")
    parts.push(`Diabetes: ${v.diabetes_status}`);
  if (v.existing_conditions)
    parts.push(`Conditions: ${v.existing_conditions}`);
  if (v.allergies)
    parts.push(`Allergies: ${v.allergies}`);

  return parts.join(" | ");
}

const SECTION = "text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mt-5 mb-2 pb-1 border-b border-border/40";

export function AdmitPatientForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "", room_no: "", bed_no: "",
      age: "", weight: "",
      blood_pressure: "", pulse_rate: "", oxygen_level: "",
      diabetes_status: "none", heart_condition: "none",
      existing_conditions: "", allergies: "", emergency_notes: "",
    },
  });

  const admitPatient = useAdmitPatient({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
        toast({
          title: `Patient Admitted — ${data.priority}`,
          description: `${data.name} triaged and assigned to Room ${data.room_no}.`,
          variant: data.priority === "RED" ? "destructive" : "default",
        });
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Intake Failed",
          description: (error as { error?: string }).error ?? "Unknown error",
          variant: "destructive",
        });
      },
    },
  });

  function onSubmit(values: FormValues) {
    admitPatient.mutate({
      data: {
        name:     values.name,
        room_no:  values.room_no,
        bed_no:   values.bed_no,
        symptoms: buildSymptoms(values),
      },
    });
  }

  return (
    <Card className="border-border bg-card shadow-lg sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <CardHeader className="bg-muted/30 border-b border-border pb-4 sticky top-0 bg-card z-10">
        <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-primary">
          <Stethoscope className="w-4 h-4" />
          Patient Health Analysis Intake
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          Complete medical intake for AI-assisted triage
        </p>
      </CardHeader>

      <CardContent className="pt-4 pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

            {/* ── Patient Identity ── */}
            <div className={SECTION}>
              <UserPlus className="w-3 h-3" /> Patient Identity
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last, First" {...field} className="font-mono bg-background h-8 text-sm" data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="room_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Room</FormLabel>
                    <FormControl>
                      <Input placeholder="ER-1" {...field} className="font-mono bg-background h-8 text-sm uppercase" data-testid="input-room" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bed_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Bed</FormLabel>
                    <FormControl>
                      <Input placeholder="B" {...field} className="font-mono bg-background h-8 text-sm uppercase" data-testid="input-bed" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Age (yrs)</FormLabel>
                    <FormControl>
                      <Input placeholder="45" type="number" min="0" max="130" {...field} className="font-mono bg-background h-8 text-sm" data-testid="input-age" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Weight (kg)</FormLabel>
                  <FormControl>
                    <Input placeholder="70" type="number" min="1" {...field} className="font-mono bg-background h-8 text-sm" data-testid="input-weight" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ── Vital Signs ── */}
            <div className={SECTION}>
              <Activity className="w-3 h-3" /> Vital Signs
            </div>

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="blood_pressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">BP (mmHg)</FormLabel>
                    <FormControl>
                      <Input placeholder="120/80" {...field} className="font-mono bg-background h-8 text-sm" data-testid="input-bp" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pulse_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Pulse (bpm)</FormLabel>
                    <FormControl>
                      <Input placeholder="72" type="number" min="0" {...field} className="font-mono bg-background h-8 text-sm" data-testid="input-pulse" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="oxygen_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">SpO₂ (%)</FormLabel>
                    <FormControl>
                      <Input placeholder="98" type="number" min="0" max="100" {...field} className="font-mono bg-background h-8 text-sm" data-testid="input-o2" />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* ── Medical History ── */}
            <div className={SECTION}>
              <HeartPulse className="w-3 h-3" /> Medical History
            </div>

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="heart_condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Heart Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background h-8 text-sm" data-testid="select-heart">
                          <SelectValue placeholder="Select" />
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
                )}
              />

              <FormField
                control={form.control}
                name="diabetes_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Diabetes</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background h-8 text-sm" data-testid="select-diabetes">
                          <SelectValue placeholder="Select" />
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
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="existing_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Existing Conditions</FormLabel>
                  <FormControl>
                    <Input placeholder="Asthma, Thyroid, Kidney disease..." {...field} className="bg-background h-8 text-sm" data-testid="input-conditions" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-amber-400" /> Allergies
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Penicillin, Latex, Peanuts..." {...field} className="bg-background h-8 text-sm" data-testid="input-allergies" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ── Emergency Notes ── */}
            <div className={SECTION}>
              <AlertTriangle className="w-3 h-3 text-amber-400" /> Emergency Notes & Triage
            </div>

            <FormField
              control={form.control}
              name="emergency_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">
                    Chief Complaint / Emergency Observations
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Chest pain with radiation to left arm, severe shortness of breath, diaphoresis..."
                      {...field}
                      className="min-h-[80px] resize-none font-mono bg-background border-border text-sm"
                      data-testid="input-symptoms"
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-[10px] text-muted-foreground/60">
                    AI triage runs on this field — include all acute symptoms.
                  </p>
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full font-bold uppercase tracking-wider mt-4"
              disabled={admitPatient.isPending}
              data-testid="button-submit-admit"
            >
              <Stethoscope className="w-4 h-4 mr-2" />
              {admitPatient.isPending ? "Processing Intake..." : "Submit & Run AI Triage"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
