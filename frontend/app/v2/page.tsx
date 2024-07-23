"use client";

import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import ButtonHandler from "@/components/btn-handler";
import { detectVideo } from "../../utils/detect";
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
];

const chartConfig = {
  desktop: { label: "Desktop", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

interface ModelState {
  net: tf.GraphModel | null;
  inputShape: number[];
}

const App: React.FC = () => {
  const [model, setModel] = useState<ModelState>({
    net: null,
    inputShape: [1, 640, 640, 3],
  });

  const cameraRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel('/model/best_web_model/model.json');

      const dummyInput = tf.ones(yolov8.inputs[0].shape as number[]);
      const warmupResults = yolov8.execute(dummyInput);

      setModel({
        net: yolov8,
        inputShape: yolov8.inputs[0].shape as number[],
      });

      tf.dispose([warmupResults, dummyInput]);
    });
  }, []);

  return (
    <div className="App min-h-screen p-4">
      <h1 className="mb-4 text-2xl font-extrabold leading-tight tracking-tighter md:text-3xl lg:text-4xl">
        Real-Time Trash Detection
      </h1>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-5">
        <div className="relative aspect-video lg:col-span-3 lg:aspect-auto">
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute left-0 top-0 size-full"
          />
          <video
            autoPlay
            muted
            ref={cameraRef}
            onPlay={() => cameraRef.current && detectVideo(cameraRef.current, model, canvasRef.current)}
            className="size-full rounded-lg object-cover"
            playsInline
          />
          <div className="absolute bottom-4 left-4">
            <ButtonHandler cameraRef={cameraRef} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
          <PieChartCard />
          <BarChartCard chartData={chartData} chartConfig={chartConfig} />
        </div>
      </div>
    </div>
  );
};

export default App;