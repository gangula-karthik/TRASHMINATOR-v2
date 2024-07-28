"use client"
import React, { useState } from "react";
import VideoStream from "@/components/VideoStream";
import BarChartCard from "@/components/BarChart";
import { ChartConfig } from "@/components/ui/chart";
import { PieChartCard } from "@/components/PieChart";

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
  const [cameraOn, setCameraOn] = useState(true);

  return (
    <section className="container mx-auto grid items-center gap-4 pb-6 pt-4 md:py-8">
      <div className="mb-4 flex max-w-[980px] flex-col items-start gap-2">
        <h1 className="text-2xl font-extrabold leading-tight tracking-tighter md:text-3xl">
          Real-Time Trash Detection
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 w-full h-[80vh]">
      <div className="col-span-1 row-span-2 flex flex-col">
          <div className="flex-1">
            <VideoStream />
          </div>
        </div>
        <div className="col-span-1 row-span-1 flex flex-col">
          <BarChartCard chartData={chartData} chartConfig={chartConfig}/>
        </div>
        {/* <div className="col-span-1 row-span-1 flex flex-col">
          <PieChartCard/>
        </div> */}
      </div>
    </section>
  )
}
