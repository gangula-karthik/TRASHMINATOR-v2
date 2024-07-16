"use client";

import LABELS from "datasets/coco/classes.json";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { Button } from "@nextui-org/react";
import { TiCameraOutline } from "react-icons/ti";
import Image from 'next/image'

const ZOO_MODEL = [{ name: "yolov5", child: ["yolov5n", "yolov5s"] }];
// const ZOO_MODEL = [{ name: "yolov8", child: ["yolov8n_web_model"] }];

const VideoStream: React.FC = () => {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [aniId, setAniId] = useState<number | null>(null);
  const [modelName, setModelName] = useState(ZOO_MODEL[0]);
  const [loading, setLoading] = useState(0);
  const [objectCounts, setObjectCounts] = useState<{ [key: string]: number }>({});

  const imageRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputImageRef = useRef<HTMLInputElement>(null);

  const [singleImage, setSingleImage] = useState(false);
  const [liveWebcam, setLiveWebcam] = useState(false);

  useEffect(() => {
    tf.loadGraphModel(`/model/${modelName.name}/${modelName.child[1]}/model.json`, {
    // tf.loadGraphModel(`/model/yolov8n_web_model/model.json`, {
      onProgress: (fractions: number) => {
        setLoading(fractions);
      },
    }).then(async (mod) => {
      // warming up the model before using real data
      const dummy = tf.ones(mod.inputs[0].shape || [1, 224, 224, 3]);
      const res = await mod.executeAsync(dummy);

      // clear memory
      tf.dispose(res);
      tf.dispose(dummy);

      // save to state
      setModel(mod);
    });
  }, [modelName]);

  const renderPrediction = (boxesData: Float32Array, scoresData: Float32Array, classesData: Float32Array) => {
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    // clean canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    for (let i = 0; i < scoresData.length; ++i) {
      const klass = LABELS[classesData[i]];
      const score = (scoresData[i] * 100).toFixed(1);
      let [x1, y1, x2, y2] = Array.from(boxesData.slice(i * 4, (i + 1) * 4));
      x1 *= canvasRef.current!.width;
      x2 *= canvasRef.current!.width;
      y1 *= canvasRef.current!.height;
      y2 *= canvasRef.current!.height;
      const width = x2 - x1;
      const height = y2 - y1;

      // draw the bounding box
      ctx.strokeStyle = "#C53030";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, width, height);

      const label = `${klass} - ${score}%`;
      const textWidth = ctx.measureText(label).width;
      const textHeight = parseInt(font, 10); // base 10

      // draw the label background
      ctx.fillStyle = "#C53030";
      ctx.fillRect(x1 - 1, y1 - (textHeight + 4), textWidth + 6, textHeight + 4);

      // draw the label text
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(label, x1 + 2, y1 - (textHeight + 2));
    }
  };

  const doPredictImage = async () => {
    if (!model || !imageRef.current) return;

    tf.engine().startScope();

    const [modelWidth, modelHeight] = model?.inputs[0].shape?.slice(1, 3) || [0, 0];

    const input = tf.tidy(() => {
      const imageTensor = tf.browser.fromPixels(imageRef.current!);
      return tf.image.resizeBilinear(imageTensor, [modelWidth, modelHeight]).div(255.0).expandDims(0);
    });

    const res = await model.executeAsync(input) as [tf.Tensor, tf.Tensor, tf.Tensor];

    const [boxes, scores, classes] = res;
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();

    renderPrediction(new Float32Array(boxesData), new Float32Array(scoresData), new Float32Array(classesData));

    tf.dispose(res);

    tf.engine().endScope();
  };

  const doPredictFrame = async () => {
    if (!model || !videoRef.current || !videoRef.current.srcObject) return;

    tf.engine().startScope();

    const [modelWidth, modelHeight] = model?.inputs[0]?.shape?.slice(1, 3) || [0, 0];

    const input = tf.tidy(() => {
      const frameTensor = tf.browser.fromPixels(videoRef.current!);
      return tf.image.resizeBilinear(frameTensor, [modelWidth, modelHeight]).div(255.0).expandDims(0);
    });

    const res = await model.executeAsync(input) as [tf.Tensor, tf.Tensor, tf.Tensor];
    console.log(res);
    const [boxes, scores, classes] = res;
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();
    // Convert Int32Array to Float32Array before passing to renderPrediction
    renderPrediction(new Float32Array(boxesData), new Float32Array(scoresData), new Float32Array(classesData));

    // Initializing counts object to keep track of occurrences
    // const objectCounts: { [key: string]: number } = {};
    // const detectedLabels: string[] = [];  // List to keep track of detected labels

    // const detectObjects = () => {
    //   const detectedObjects = [];
    //   const currentTime = new Date().getTime();

    //   for (let i = 0; i < scoresData.length; ++i) {
    //     // 60% threshold
    //     if (scoresData[i] > 0.6) {
    //       const detectedObject = {
    //         label: LABELS[classesData[i]],
    //         score: (scoresData[i] * 100).toFixed(1),
    //         timestamp: currentTime
    //       };

    //       // Append to detectedObjects for logging or other purposes
    //       detectedObjects.push(detectedObject);

    //       // Only append to detectedLabels if it's different from the last appended label
    //       if (detectedLabels.length === 0 || detectedLabels[detectedLabels.length - 1] !== detectedObject.label) {
    //         detectedLabels.push(detectedObject.label);

    //         // Update the count for the detected object
    //         if (objectCounts[detectedObject.label]) {
    //           objectCounts[detectedObject.label]++;
    //         } else {
    //           objectCounts[detectedObject.label] = 1;
    //         }
    //       }
    //     }
    //   }

    //   console.log('Detected Objects:', detectedObjects);
    //   console.log('Object Counts:', objectCounts);
    //   console.log('Detected Labels:', detectedLabels);
    // };

    // // Example of how to use the objectCounts to display counts
    // Object.keys(objectCounts).forEach((label) => {
    //   console.log(`${label}: ${objectCounts[label]}`);
    // });

    
    // detectObjects();

    tf.dispose(res);

    const reqId = requestAnimationFrame(doPredictFrame);
    setAniId(reqId);

    tf.engine().endScope();
  };

  const imageHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const src = window.URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = src;
    setSingleImage(true);

    if (imageRef.current) {
      imageRef.current.onload = () => {
        doPredictImage();
        window.URL.revokeObjectURL(src);
      };
    }
  };

  const webcamHandler = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;

    const media = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "environment",
      },
    });

    (window as any).localStream = media;
    if (videoRef.current) videoRef.current.srcObject = media;
    setLiveWebcam(true);
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        doPredictFrame();
      };
    }
  };

  return (
    <>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: model ? "none" : "flex",
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 999,
          cursor: "progress",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {`Loading model... ${(loading * 100).toFixed(1)}%`}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          marginBottom: "10px",
          maxWidth: "640px",
        }}
      >
        <div style={{ marginBottom: "10px", width: "100%", maxWidth: "640px" }} className="rounded-lg">
          <UploadLayer display={!singleImage && !liveWebcam ? "flex" : "none"} />
          <div
            id="image-placeholder"
            style={{
              width: "100%",
              position: "relative",
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='none' stroke='%23E4E6ED' stroke-width='4' stroke-dasharray='4, 12' stroke-linecap='square'/%3E%3C/svg%3E")`,
              display: singleImage || liveWebcam ? "flex" : "none",
            }}
          >
            <Image
              ref={imageRef}
              src=""
              style={{
                width: "100%",
                display: singleImage && !liveWebcam ? "block" : "none",
              }}
              className="rounded-lg"
              alt="Image Placeholder"
            />
            <video
              ref={videoRef}
              style={{
                width: "100%",
                display: liveWebcam && !singleImage ? "block" : "none",
              }}
              className="rounded-lg"
              autoPlay
              playsInline
              muted
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
            <FaTimes
              style={{
                color: "white",
                backgroundColor: "red",
                width: "24px",
                height: "24px",
                borderRadius: "100%",
                position: "absolute",
                zIndex: 1,
                top: "2%",
                right: "2%",
                cursor: "pointer",
                display: singleImage || liveWebcam ? "block" : "none",
              }}
              onClick={() => {
                if (singleImage) {
                  if (imageRef.current) imageRef.current.src = "#";
                  if (inputImageRef.current) inputImageRef.current.value = "";
                  setSingleImage(false);
                }
                if (liveWebcam && videoRef.current?.srcObject) {
                  if (aniId) cancelAnimationFrame(aniId);
                  setAniId(null);
                  if (videoRef.current) videoRef.current.srcObject = null;
                  if ((window as any).localStream) {
                    (window as any).localStream.getTracks().forEach((track: MediaStreamTrack) => {
                      track.stop();
                    });
                  }
                  setLiveWebcam(false);
                }
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <input ref={inputImageRef} type="file" accept="image/*" onChange={imageHandler} style={{ display: "none" }} />

        <div
        >
          <Button
            disabled={liveWebcam || singleImage}
            onClick={webcamHandler}
            style={{ gridColumn: "span 1" }}
            color="success"
            variant="shadow"
          >
            Start Webcam <TiCameraOutline size={20} />
          </Button>
        {/* <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "20px" }}>
          <h2>Object Counts</h2>
          {Object.keys(objectCounts).map((label) => (
            <div key={label}>{`${label}: ${objectCounts[label]}`}</div>
          ))}
        </div> */}
        </div>
      </div>
    </>
  );
};

type UploadLayerProps = {
  display: string;
};

const UploadLayer: React.FC<UploadLayerProps> = ({ display }) => {
  return (
    <div
      style={{
        width: "100%",
        height: "320px",
        display: display,
        alignItems: "center",
        justifyContent: "center",
      }}
      className="bg-card text-card-foreground rounded-lg border shadow-sm"
    >
      <svg
        focusable="false"
        viewBox="0 0 512 512"
        width="128"
        height="128"
        fill="gray"
        aria-hidden="true"
      >
        <path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-6 336H54a6 6 0 0 1-6-6V118a6 6 0 0 1 6-6h404a6 6 0 0 1 6 6v276a6 6 0 0 1-6 6zM128 152c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zM96 352h320v-80l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L192 304l-39.515-39.515c-4.686-4.686-12.284-4.686-16.971 0L96 304v48z"></path>
      </svg>
    </div>
  );
};

export default VideoStream;