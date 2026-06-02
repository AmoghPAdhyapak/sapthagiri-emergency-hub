import { useState } from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import defaultDoctors from "@/data/doctors.json";

interface Doctor {
  name: string;
  doctor_id: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  action?: string;
}

function getDoctors(): Doctor[] {
  try {
    const stored = localStorage.getItem("sapthagiri_doctors");
    if (stored) return JSON.parse(stored) as Doctor[];
  } catch {
    // fall through to default
  }
  return defaultDoctors as Doctor[];
}

export function DoctorVerificationModal({ open, onClose, onVerified, action = "perform this action" }: Props) {
  const [doctorId, setDoctorId] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setDoctorId("");
    setError("");
    onClose();
  };

  const handleVerify = () => {
    const doctors = getDoctors();
    const match = doctors.find(
      (d) => d.doctor_id.toUpperCase() === doctorId.trim().toUpperCase()
    );
    if (match) {
      setDoctorId("");
      setError("");
      onVerified();
      onClose();
    } else {
      setError(`Invalid Doctor ID. Access denied.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary/20 p-2 rounded-lg shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Doctor Verification Required</DialogTitle>
          </div>
          <DialogDescription>
            A valid Doctor ID is required to {action}. Only authorized medical staff can approve this action.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="doc-id-input">Doctor ID</Label>
            <Input
              id="doc-id-input"
              placeholder="e.g. DOC101"
              value={doctorId}
              onChange={(e) => { setDoctorId(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
              className="font-mono uppercase tracking-widest"
              data-testid="input-doctor-id"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel-verify">
            Cancel
          </Button>
          <Button onClick={handleVerify} data-testid="button-verify-doctor">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Verify & Proceed
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
