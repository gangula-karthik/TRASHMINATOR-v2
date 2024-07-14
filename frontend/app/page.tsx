"use client"
import VideoStream from "@/components/VideoStream";
import BarChartCard from "@/components/BarChart";
import { ChartConfig } from "@/components/ui/chart";
import { PieChartCard } from "@/components/PieChart"


const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


export default function IndexPage() {
  return (
    <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
      <div className="flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Real-Time Trash Detection
        </h1>
      </div>
      <div className="flex flex-col justify-between gap-2 md:flex-row">
        <div className="flex-1">
          <VideoStream />
        </div>
        <div className="flex-1">
          <BarChartCard chartData={chartData} chartConfig={chartConfig} />
        </div>
        <div className="flex-1">
          <PieChartCard/>
        </div>
      </div>
    </section>
  )
}