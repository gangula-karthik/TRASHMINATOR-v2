"use client"

import React, { useEffect, useRef, useState } from "react"
import * as tf from "@tensorflow/tfjs"
import "@tensorflow/tfjs-backend-webgl"
import { ChartConfig } from "@/components/ui/chart"
import BarChartCard from "@/components/BarChart"
import { PieChartCard } from "@/components/PieChart"
import VideoStream from "@/components/VideoStream";

const chartData = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 73 },
  { month: "May", desktop: 209 },
  { month: "June", desktop: 214 },
]

const chartConfig: ChartConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--chart-1))" },
}

interface ModelState {
  net: tf.GraphModel | null
  inputShape: number[]
}

const App: React.FC = () => {
  return (
    <div className="App min-h-screen p-4 md:p-5">
      <h1 className="mb-4 text-xl font-extrabold leading-tight tracking-tighter md:text-2xl lg:text-3xl">
        Real-Time Trash Detection
      </h1>
      <div className="flex flex-col gap-4">
        <div className="aspect-video w-full">
          <VideoStream />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <PieChartCard />
          <BarChartCard chartData={chartData} chartConfig={chartConfig} />
        </div>
      </div>
    </div>
  )
}

export default App