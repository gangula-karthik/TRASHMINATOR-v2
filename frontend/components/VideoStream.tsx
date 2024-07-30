"use client"

import React, { useEffect, useRef, useState } from "react"
import * as tf from "@tensorflow/tfjs"
import "@tensorflow/tfjs-backend-webgl"
import ButtonHandler from "@/components/btn-handler"
import { Spinner } from "@nextui-org/spinner"
import labels from "../datasets/taco/classes.json"
import { renderBoxes } from "../utils/renderBox"

const numClass = labels.length

type ClassesData = Record<string, number>
type Labels = string[]

interface MappedClassesData {
  [key: number]: string
}

interface CombinedData {
  [key: string]: (string | number)[]
}

interface FilteredData {
  [key: string]: (string | number)[]
}

interface Count {
  [key: string]: number
}

interface ModelState {
  net: tf.GraphModel | null
  inputShape: number[]
}

const mapClassNumbersToNames = (
  classes_data: ClassesData,
  labels: Labels
): MappedClassesData => {
  const mappedClassesData: MappedClassesData = {}
  for (const [key, value] of Object.entries(classes_data)) {
    if (labels[value]) {
      mappedClassesData[Number(key)] = labels[value]
    }
  }
  return mappedClassesData
}

const preprocess = (
  source: HTMLVideoElement | HTMLImageElement,
  modelWidth: number,
  modelHeight: number
): [tf.Tensor3D, number, number] => {
  let xRatio: number | undefined, yRatio: number | undefined // ratios for boxes

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source)
    const [h, w] = img.shape.slice(0, 2)
    const maxSize = Math.max(w, h)
    const imgPadded: any = img.pad([
      [0, maxSize - h],
      [0, maxSize - w],
      [0, 0],
    ])
    xRatio = maxSize / w
    yRatio = maxSize / h
    return tf.image
      .resizeBilinear(imgPadded, [modelWidth, modelHeight])
      .div(255.0)
      .expandDims(0) as tf.Tensor3D
  })

  if (xRatio === undefined || yRatio === undefined) {
    throw new Error("xRatio or yRatio is undefined")
  }

  return [input, xRatio, yRatio]
}

const detect = async (
  source: HTMLImageElement | HTMLVideoElement,
  model: ModelState,
  canvasRef: HTMLCanvasElement,
): Promise<{ filteredData: FilteredData; count: Count }> => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3)

  tf.engine().startScope()
  const [input, xRatio, yRatio] = preprocess(source, modelWidth, modelHeight)

  const res = model.net!.execute(input) as tf.Tensor
  const transRes = res.transpose([0, 2, 1])
  const boxes: any = tf.tidy(() => {
    const w = transRes.slice([0, 0, 2], [-1, -1, 1])
    const h = transRes.slice([0, 0, 3], [-1, -1, 1])
    const x1 = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2))
    const y1 = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2))
    return tf.concat([y1, x1, tf.add(y1, h), tf.add(x1, w)], 2).squeeze()
  })

  const [scores, classes] = tf.tidy(() => {
    const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze([0])
    return [rawScores.max(1), rawScores.argMax(1)]
  })

  const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, 500, 0.45, 0.2)

  const boxes_data = boxes.gather(nms, 0).dataSync()
  const scores_data = scores.gather(nms, 0).dataSync()
  const classes_data = classes.gather(nms, 0).dataSync()

  const mappedClassesData = mapClassNumbersToNames(classes_data, labels)

  const filteredData: FilteredData = {}
  const count: Count = {}

  for (const key in mappedClassesData) {
    const className = mappedClassesData[key]
    const score = scores_data[key]

    if (score && score > 0.75) {
      filteredData[key] = [className, score]
      count[className] = (count[className] || 0) + 1
    }
  }

  // Assuming renderBoxes is imported or defined elsewhere
  renderBoxes(canvasRef, boxes_data, scores_data, classes_data, [xRatio, yRatio])

  tf.dispose([res, transRes, boxes, scores, classes, nms])
  tf.engine().endScope()

  return { filteredData, count }
}

const App: React.FC<{ onDetectionData: (data: any) => void }> = ({ onDetectionData }) => {
  const [model, setModel] = useState<ModelState>({
    net: null,
    inputShape: [1, 640, 640, 3],
  })
  const [loading, setLoading] = useState(0)
  const [detectionData, setDetectionData] = useState<{ filteredData: FilteredData; count: Count } | null>(null)

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

  const detectVideo = (
    vidSource: HTMLVideoElement,
    model: ModelState,
    canvasRef: HTMLCanvasElement,
    onDetectionData: (data: any) => void
  ) => {
    const detectFrame = async () => {
      if (vidSource.videoWidth === 0 && vidSource.srcObject === null) {
        const ctx = canvasRef.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.width, canvasRef.height);
        return;
      }
  
      const data = await detect(vidSource, model, canvasRef);
      setDetectionData(data);
      onDetectionData(data);
      requestAnimationFrame(detectFrame);
    };
  
    detectFrame();
  };
  

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
                cameraRef.current && canvasRef.current &&
                detectVideo(cameraRef.current, model, canvasRef.current, onDetectionData)
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