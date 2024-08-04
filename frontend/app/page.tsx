"use client"

import React, { useState, useEffect, useRef } from "react"
import { ChartConfig } from "@/components/ui/chart"
import BarChartCard from "@/components/BarChart"
import { PieChartCard } from "@/components/PieChart"
import VideoStream from "@/components/VideoStream";
import {Button} from "@nextui-org/react";


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

interface PersistDetectionData {
  object: string;
  count: number;
}

const App: React.FC = () => {
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  const [persistDetectionData, setPersistDetectionData] = useState<PersistDetectionData[]>([]);
  const lastUpdateTimeRef = useRef<{ [key: string]: number }>({});
  const stableCountRef = useRef<{ [key: string]: number }>({});

  const handleDetectionData = (data: DetectionData) => {
    console.log("Received detection data:", data);
    setDetectionData(data);

    const currentTime = Date.now();
    const updateInterval = 1000; // Update interval in milliseconds

    setPersistDetectionData((prevData) => {
      let updatedData = [...prevData];
      let hasChanges = false;

      Object.entries(data.count).forEach(([object, count]) => {
        console.log(`Processing object: ${object}, count: ${count}`);
        const lastUpdateTime = lastUpdateTimeRef.current[object] || 0;
        const stableCount = stableCountRef.current[object] || 0;

        console.log(`Last update time: ${lastUpdateTime}, Current time: ${currentTime}`);
        console.log(`Time difference: ${currentTime - lastUpdateTime}`);
        console.log(`Stable count: ${stableCount}, New count: ${count}`);
        console.log(`Count difference: ${Math.abs(count - stableCount)}`);

        if (currentTime - lastUpdateTime > updateInterval) {
          console.log(`Time interval check passed for ${object}`);
          // Check if count has changed significantly
          if (Math.abs(count - stableCount) > 1) {
            console.log(`Significant change detected for ${object}`);
            const existingIndex = updatedData.findIndex((item) => item.object === object);
            if (existingIndex !== -1) {
              console.log(`Updating existing entry for ${object}`);
              updatedData[existingIndex] = { object, count };
            } else {
              console.log(`Adding new entry for ${object}`);
              updatedData.push({ object, count });
            }
            hasChanges = true;
            lastUpdateTimeRef.current[object] = currentTime;
            stableCountRef.current[object] = count;
          } else {
            console.log(`No significant change for ${object}`);
          }
        } else {
          console.log(`Time interval check failed for ${object}`);
        }
      });

      // Remove objects that are no longer detected
      const beforeFilterLength = updatedData.length;
      updatedData = updatedData.filter((item) => item.object in data.count);
      if (updatedData.length !== beforeFilterLength) {
        console.log(`Removed ${beforeFilterLength - updatedData.length} objects`);
        hasChanges = true;
      }

      console.log("Updated data:", updatedData);
      console.log("Has changes:", hasChanges);

      return hasChanges ? updatedData : prevData;
    });
  };

  useEffect(() => {
    console.log("persistDetectionData updated:", persistDetectionData);
  }, [persistDetectionData]);


  return (
    <div className="App min-h-screen p-4 md:p-6 lg:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold leading-tight tracking-tighter md:text-2xl lg:text-3xl">
          Real-Time Trash Detection
        </h1>
        <Button color="danger" onClick={() => setPersistDetectionData([])}>Empty Trash</Button>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-3/5 xl:w-2/3">
          <div className="aspect-video w-full">
            <VideoStream onDetectionData={handleDetectionData} />
          </div>
        </div>
        <div className="flex flex-col gap-6 lg:w-2/5 xl:w-1/3">
          <PieChartCard />
          <BarChartCard chartData={persistDetectionData.map(data => ({ ...data, object: data.object, count: data.count }))} chartConfig={chartConfig} />
        </div>
        {/* {detectionData && (
        <div className="mt-4">
          <h2 className="text-xl font-bold">Detection Results from Page:</h2>
          <pre className="mt-2 max-h-60 overflow-auto rounded bg-gray-100 p-you4">
            {JSON.stringify(detectionData, null, 2)}
          </pre>
        </div>
      )} */}
      </div>
    </div>
  )
}

export default App