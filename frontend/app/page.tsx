"use client"

import React, { useState, useEffect } from "react"
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
  // State to hold the detection data
  const [detectionData, setDetectionData] = useState<DetectionData | null>(null);
  // State to persist the detection data as an array
  const [persistDetectionData, setPersistDetectionData] = useState<PersistDetectionData[]>([]);

  const handleDetectionData = (data: DetectionData) => {
    setDetectionData(data);

    // Map the detection data to the format we want to persist
    const newData = Object.keys(data.count).map((key) => ({
      object: key,
      count: data.count[key]
    }));

    setPersistDetectionData((prevData) => {
      let hasChanges = false;
      let updatedData = [...prevData];

      newData.forEach((newItem) => {
        const prevItemIndex = updatedData.findIndex(item => item.object === newItem.object);

        if (prevItemIndex !== -1) {
          // Item exists in previous data
          const prevItem = updatedData[prevItemIndex];

          if (prevItemIndex === updatedData.length - 1) {
            // It's the last item, apply max rule
            if (newItem.count > prevItem.count) {
              hasChanges = true;
              updatedData[prevItemIndex] = { ...prevItem, count: newItem.count };
            }
          } else {
            // Not the last item, add counts
            hasChanges = true;
            updatedData[prevItemIndex] = { ...prevItem, count: prevItem.count + newItem.count };
          }
        } else {
          // New item
          hasChanges = true;
          updatedData.push(newItem);
        }
      });

      // Handle empty object case
      if (updatedData.length >= 2) {
        const lastItem = updatedData[updatedData.length - 1];
        const secondLastItem = updatedData[updatedData.length - 2];

        if (lastItem.object === '' && secondLastItem.object !== '') {
          hasChanges = true;
          updatedData[updatedData.length - 2] = {
            ...secondLastItem,
            count: secondLastItem.count + lastItem.count
          };
          updatedData.pop(); // Remove the last item (empty object)
        }
      }

      // If there are no changes, return the previous data (no update)
      if (!hasChanges) {
        return prevData;
      }

      // Return the updated data
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