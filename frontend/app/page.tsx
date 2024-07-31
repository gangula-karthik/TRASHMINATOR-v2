"use client"

import React, { useState } from "react"
import { ChartConfig } from "@/components/ui/chart"
import BarChartCard from "@/components/BarChart"
import { PieChartCard } from "@/components/PieChart"
import VideoStream from "@/components/VideoStream";

const chartConfig: ChartConfig = {
  count: { label: "Count", color: "hsl(var(--chart-1))" },
}

interface DetectionData {
  filteredData: {
    [key: string]: [string, number];
  };
  count: {
    [key: string]: number;
  };
}

const App: React.FC = () => {
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);

  const handleDetectionData = (data: DetectionData) => {
    setDetectionData(data);
  };

  const chartData = detectionData ? Object.keys(detectionData.count).map((key) => ({
    object: key,
    count: detectionData.count[key]
  })) : [];

  console.log(chartData);

  return (
    <div className="App min-h-screen p-4 md:p-6 lg:p-8">
      <h1 className="mb-6 text-xl font-extrabold leading-tight tracking-tighter md:text-2xl lg:text-3xl">
        Real-Time Trash Detection
      </h1>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-3/5 xl:w-2/3">
          <div className="aspect-video w-full">
            <VideoStream onDetectionData={handleDetectionData} />
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:w-2/5 xl:w-1/3">
          <PieChartCard />
          <BarChartCard chartData={chartData.map(data => ({...data, object: data.object, count: data.count}))} chartConfig={chartConfig} />
        </div>
        {/* {detectionData && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Detection Results from Page:</h2>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-gray-100 p-4">
            {JSON.stringify(detectionData, null, 2)}
          </pre>
        </div>
      )} */}
      </div>
    </div>
  )
}

export default App