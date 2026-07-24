"use client";
import { ReportHeader } from "./ReportHeader";
import { PrintSection } from "./PrintSection";
import { PrintVisitPrepSection } from "./PrintVisitPrepSection";

interface Appointment { date: string; notes?: string | null; }

interface AppointmentPrintReportProps {
  babyId: string;
  appointmentId: string;
  appointment: Appointment;
}

function formatApptDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
}

export function AppointmentPrintReport({ babyId, appointmentId, appointment }: AppointmentPrintReportProps) {
  return (
    <div className="w-full">
      <ReportHeader babyId={babyId} title="Appointment Summary" subtitle={formatApptDate(appointment.date)} />

      {appointment.notes && (
        <PrintSection title="Notes">
          <p className="text-sm">{appointment.notes}</p>
        </PrintSection>
      )}

      <PrintVisitPrepSection babyId={babyId} appointmentId={appointmentId} />
    </div>
  );
}
