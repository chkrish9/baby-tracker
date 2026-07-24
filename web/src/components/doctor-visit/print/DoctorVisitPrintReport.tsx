"use client";
import { WeeklyStackedBarChart, ChartDataTable, type ChartDay } from "@/components/charts/WeeklyStackedBarChart";
import { FEED_SERIES, DIAPER_SERIES, FEED_EXTRA_COLUMNS, feedTooltipExtraLines } from "@/lib/charts";
import { formatOz, formatMl, formatMinutes } from "@/lib/utils";
import { DoctorVisitReportHeader } from "./DoctorVisitReportHeader";
import { PrintSection } from "./PrintSection";
import { PrintVisitPrepSection } from "./PrintVisitPrepSection";
import { PrintHealthSection } from "./PrintHealthSection";

interface Appointment { id: string; date: string; notes?: string | null; }

interface DoctorVisitPrintReportProps {
  babyId: string;
  chartRangeLabel: string;
  chartRangePhrase: string;
  feedChartData: ChartDay[];
  diaperChartData: ChartDay[];
  feeds24h: number;
  diapers24h: number;
  avgDiapersPerDay: number;
  avgBottleMlPerDay: number;
  avgBreastLeftMinPerDay: number;
  avgBreastRightMinPerDay: number;
  nextAppt?: Appointment;
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 min-w-0 bg-white rounded-2xl border border-black/10 p-4 text-center">
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-black/40 mt-1">{label}</p>
    </div>
  );
}

export function DoctorVisitPrintReport({
  babyId,
  chartRangeLabel,
  chartRangePhrase,
  feedChartData,
  diaperChartData,
  feeds24h,
  diapers24h,
  avgDiapersPerDay,
  avgBottleMlPerDay,
  avgBreastLeftMinPerDay,
  avgBreastRightMinPerDay,
  nextAppt,
}: DoctorVisitPrintReportProps) {
  return (
    <div className="w-full">
      <DoctorVisitReportHeader babyId={babyId} appointmentDate={nextAppt?.date ?? null} />

      <PrintSection title="Last 24 Hours">
        <div className="flex gap-2">
          <StatBlock value={String(feeds24h)} label="Feeds / 24h" />
          <StatBlock value={String(diapers24h)} label="Diapers / 24h" />
        </div>
      </PrintSection>

      <PrintSection title={`Daily averages · ${chartRangeLabel}`}>
        <div className="flex gap-2">
          <StatBlock value={avgDiapersPerDay > 0 ? avgDiapersPerDay.toFixed(1) : "–"} label="Diapers / day" />
          <StatBlock
            value={avgBottleMlPerDay > 0 ? `${formatOz(avgBottleMlPerDay)} (${formatMl(avgBottleMlPerDay)})` : "–"}
            label="Bottle / day"
          />
          <StatBlock value={avgBreastLeftMinPerDay > 0 ? formatMinutes(avgBreastLeftMinPerDay) : "–"} label="Breast (L) / day" />
          <StatBlock value={avgBreastRightMinPerDay > 0 ? formatMinutes(avgBreastRightMinPerDay) : "–"} label="Breast (R) / day" />
          <StatBlock
            value={
              avgBreastLeftMinPerDay + avgBreastRightMinPerDay > 0
                ? formatMinutes(avgBreastLeftMinPerDay + avgBreastRightMinPerDay)
                : "–"
            }
            label="Breast total (L+R) / day"
          />
        </div>
      </PrintSection>

      <PrintSection title={`Feeding & Diaper Trends · ${chartRangeLabel}`}>
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <WeeklyStackedBarChart
              title="Feedings"
              series={FEED_SERIES}
              data={feedChartData}
              rangeLabel={chartRangeLabel}
              emptyLabel={`No feedings logged ${chartRangePhrase}`}
              tooltipExtraLines={feedTooltipExtraLines}
              extraColumns={FEED_EXTRA_COLUMNS}
            />
            <ChartDataTable series={FEED_SERIES} data={feedChartData} scrollable={false} />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <WeeklyStackedBarChart
              title="Diapers"
              series={DIAPER_SERIES}
              data={diaperChartData}
              rangeLabel={chartRangeLabel}
              emptyLabel={`No diaper changes logged ${chartRangePhrase}`}
            />
            <ChartDataTable series={DIAPER_SERIES} data={diaperChartData} scrollable={false} />
          </div>
        </div>
      </PrintSection>

      <PrintVisitPrepSection babyId={babyId} appointmentId={nextAppt?.id ?? null} />

      <PrintHealthSection babyId={babyId} />
    </div>
  );
}
