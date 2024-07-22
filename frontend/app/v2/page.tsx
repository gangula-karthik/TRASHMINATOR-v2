"use client";

import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
import Loader from "@/components/loader";
import ButtonHandler from "@/components/btn-handler";
import { detect, detectVideo } from "../../utils/detect";
import BarChartCard from "@/components/BarChart";
import { ChartConfig } from "@/components/ui/chart";
import { PieChartCard } from "@/components/PieChart";
import { Spinner } from "@nextui-org/spinner";

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

interface LoadingState {
  loading: boolean;
  progress: number;
}

const App: React.FC = () => {
  const [loading, setLoading] = useState<LoadingState>({ loading: true, progress: 0 }); // loading state
  const [model, setModel] = useState<ModelState>({
    net: null,
    inputShape: [1, 640, 640, 3], // Ensure this matches your model's expected input shape
  }); // init model & input shape

  // references
  const cameraRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // model configs
  const modelName = "yolov8n";
  useEffect(() => {
    tf.ready().then(async () => {
      const yolov8 = await tf.loadGraphModel('/model/yolov8n_web_model/model.json', {
        onProgress: (fractions: number) => {
          setLoading({ loading: true, progress: fractions }); // set loading fractions
        },
      }); // load model

      // warming up model
      const dummyInput = tf.ones(yolov8.inputs[0].shape as number[]);
      const warmupResults = yolov8.execute(dummyInput);

      setLoading({ loading: false, progress: 1 });
      setModel({
        net: yolov8,
        inputShape: yolov8.inputs[0].shape as number[],
      }); // set model & input shape

      tf.dispose([warmupResults, dummyInput]); // cleanup 
    });
  }, []);

  return (
    <div className="App p-4">
      <div className="header mb-4">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Real-Time Trash Detection
        </h1>
      </div>

      <div className="flex">
        <div className="flex flex-1 flex-col space-y-4">
          <BarChartCard chartData={chartData} chartConfig={chartConfig} />
          <PieChartCard />
        </div>

        <div className="relative ml-4 flex-1">
          <div style={{ position: 'absolute', width: '100%', height: '100%', bottom: 0 }}>
            <video
              autoPlay
              muted
              ref={cameraRef as React.RefObject<HTMLVideoElement>}
              onPlay={() => cameraRef.current && detectVideo(cameraRef.current, model, canvasRef.current)}
              className="block rounded-lg"
              playsInline
              style={{ width: '100%', position: 'absolute', left: 0, bottom: 0, zIndex: 0 }}
            />
            <canvas
              ref={canvasRef}
              width={640}
              height={640}
              className="pointer-events-none absolute bottom-0 left-0"
              style={{ zIndex: 1, width: '100%', position: 'absolute', left: 0, bottom: 0 }} // Ensure the canvas is on top of the video
            />
          </div>
          <ButtonHandler cameraRef={cameraRef} />
        </div>
      </div>
    </div>
  );
};

export default App;
