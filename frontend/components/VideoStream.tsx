import React, { useEffect, useRef, useState } from "react"
import * as tf from "@tensorflow/tfjs"
import "@tensorflow/tfjs-backend-webgl"
import ButtonHandler from "@/components/btn-handler"
import { detectVideo } from "@/utils/detect"
import {Spinner} from "@nextui-org/spinner";

interface ModelState {
  net: tf.GraphModel | null
  inputShape: number[]
}

const App: React.FC = () => {
  const [model, setModel] = useState<ModelState>({
    net: null,
    inputShape: [1, 640, 640, 3],
  })
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
    <div className="App mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {loading < 100 ? (
        <div className="flex h-64 items-center justify-center space-x-4">
          <Spinner color="success" />
          <span className="text-lg">Loading model... {loading}%</span>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mb-6 aspect-video w-full max-w-3xl">
            <video
              ref={cameraRef}
              className="bg-card text-card-foreground size-full rounded-lg border object-cover shadow-sm"
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
              className="pointer-events-none absolute left-0 top-0 size-full rounded-lg"
            />
          </div>
          <div className="flex justify-center">
            <ButtonHandler cameraRef={cameraRef} />
          </div>
        </>
      )}
    </div>
  )
}

export default App