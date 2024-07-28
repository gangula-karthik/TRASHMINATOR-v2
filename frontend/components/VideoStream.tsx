"use client"

import React, { useEffect, useRef, useState } from "react"
import * as tf from "@tensorflow/tfjs"

import "@tensorflow/tfjs-backend-webgl"
import ButtonHandler from "@/components/btn-handler"

import { detectVideo } from "@/utils/detect"
import { ScanEye } from 'lucide-react';


interface ModelState {
  net: tf.GraphModel | null
  inputShape: number[]
}

const App: React.FC = () => {
  const [model, setModel] = useState<ModelState>({
    net: null,
    inputShape: [1, 640, 640, 3],
  })
  const [liveWebcam, setLiveWebcam] = useState(true)
  const [loading, setLoading] = useState(0)

  const cameraRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    setLoading(0)
    tf.ready().then(async () => {
      setLoading(50)
      const yolov8 = await tf.loadGraphModel("/model/best_web_model/model.json")
      setLoading(75)
      const dummyInput = tf.ones(yolov8.inputs[0].shape as number[])
      const warmupResults = yolov8.execute(dummyInput)

      setModel({
        net: yolov8,
        inputShape: yolov8.inputs[0].shape as number[],
      })

      setLoading(100)
      tf.dispose([warmupResults, dummyInput])
    })
  }, [])

  return (
    <div className="App">
      <div className="relative aspect-video lg:col-span-3 lg:aspect-auto">
        <video
          ref={cameraRef}
          className="bg-card text-card-foreground block w-full rounded-lg border shadow-sm"
          autoPlay
          playsInline
          muted
          onPlay={() =>
            cameraRef.current &&
            detectVideo(cameraRef.current, model, canvasRef.current)
          }
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          className="rounded-lg"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>
      <div className="relative mt-4">
        <div className="mt-2">
          <ButtonHandler cameraRef={cameraRef} />
        </div>
      </div>
    </div>
  )
}

export default App
