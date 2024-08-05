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
  const lastDetectionTimeRef = useRef<{[key: string]: number}>({});

  const handleDetectionData = (data: DetectionData) => {
    setDetectionData(data);

    const currentTime = Date.now();
    const newData = Object.keys(data.count).filter(key => {
      const lastTime = lastDetectionTimeRef.current[key] || 0;
      if (currentTime - lastTime > 5000) {
        lastDetectionTimeRef.current[key] = currentTime;
        return true;
      }
      return false;
    }).map((key) => ({
      object: key,
      count: 1  // Always count as 1 when detected
    }));

    setPersistDetectionData((prevData) => {
      if (newData.length === 0) return prevData;  // No changes if no new detections

      let updatedData = [...prevData];

      newData.forEach((newItem) => {
        const prevItemIndex = updatedData.findIndex(item => item.object === newItem.object);

        if (prevItemIndex !== -1) {
          // Item exists, increment count
          updatedData[prevItemIndex] = {
            ...updatedData[prevItemIndex],
            count: updatedData[prevItemIndex].count + 1
          };
        } else {
          // New item, add to list
          updatedData.push(newItem);
        }
      });

      return updatedData;
    });
  };

  useEffect(() => {
    console.log(persistDetectionData);
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
          <BarChartCard chartData={persistDetectionData} chartConfig={chartConfig} />
        </div>
      </div>
    </div>
  )
}

export default App