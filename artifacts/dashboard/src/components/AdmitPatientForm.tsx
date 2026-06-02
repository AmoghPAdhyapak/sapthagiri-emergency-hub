import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useAdmitPatient, getListPatientsQueryKey, getGetPatientStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Patient name is required"),
  room_no: z.string().min(1, "Room number is required"),
  bed_no: z.string().optional(),
  symptoms: z.string().min(5, "Please describe symptoms in detail"),
});

export function AdmitPatientForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      room_no: "",
      bed_no: "",
      symptoms: "",
    },
  });

  const admitPatient = useAdmitPatient({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPatientStatsQueryKey() });
        toast({
          title: "Patient Admitted",
          description: `${data.name} triaged as ${data.priority}.`,
          variant: data.priority === "RED" ? "destructive" : "default"
        });
        form.reset();
      },
      onError: (error) => {
        toast({
          title: "Admission Failed",
          description: error.error || "An unknown error occurred.",
          variant: "destructive"
        });
      }
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    admitPatient.mutate({ data: values });
  }

  return (
    <Card className="border-border bg-card shadow-lg sticky top-6">
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="text-lg font-bold flex items-center uppercase tracking-wider text-primary">
          <UserPlus className="w-5 h-5 mr-2" />
          Admit Patient
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase text-muted-foreground font-bold">Patient Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last, First" {...field} className="font-mono bg-background border-border" data-testid="input-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="room_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs uppercase text-muted-foreground font-bold">Room No.</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. ER-1" {...field} className="font-mono bg-background border-border uppercase" data-testid="input-room" />
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
                    <FormLabel className="text-xs uppercase text-muted-foreground font-bold">Bed No. (Opt)</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. B" {...field} className="font-mono bg-background border-border uppercase" data-testid="input-bed" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs uppercase text-muted-foreground font-bold">Symptoms & Observations</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Chest pain, shortness of breath, 102F fever..." 
                      {...field} 
                      className="min-h-[100px] resize-none font-mono bg-background border-border" 
                      data-testid="input-symptoms"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full font-bold uppercase tracking-widest" 
              disabled={admitPatient.isPending}
              data-testid="button-submit-admit"
            >
              {admitPatient.isPending ? "Admitting..." : "Admit & Triage"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}