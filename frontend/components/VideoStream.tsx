"use client";

import LABELS from "datasets/coco/classes.json";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { Button, Spinner } from "@nextui-org/react";
import { TiCameraOutline } from "react-icons/ti";

const ZOO_MODEL = [{ name: "yolov5", child: ["yolov5n", "yolov5s"] }];

const VideoStream: React.FC = () => {
  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [aniId, setAniId] = useState<number | null>(null);
  const [modelName, setModelName] = useState(ZOO_MODEL[0]);
  const [loading, setLoading] = useState(0);
  const [objectCounts, setObjectCounts] = useState<{ [key: string]: number }>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [liveWebcam, setLiveWebcam] = useState(false);

  useEffect(() => {
    tf.loadGraphModel(`/model/${modelName.name}/${modelName.child[1]}/model.json`, {
      onProgress: (fractions: number) => {
        setLoading(fractions);
      },
    }).then(async (mod) => {
      const dummy = tf.ones(mod.inputs[0].shape || [1, 224, 224, 3]);
      const res = await mod.executeAsync(dummy);

      tf.dispose(res);
      tf.dispose(dummy);

      setModel(mod);
    });
  }, [modelName]);

  const renderPrediction = (boxesData: Float32Array, scoresData: Float32Array, classesData: Float32Array) => {
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

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

      ctx.strokeStyle = "#C53030";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, width, height);

      const label = `${klass} - ${score}%`;
      const textWidth = ctx.measureText(label).width;
      const textHeight = parseInt(font, 10); // base 10

      ctx.fillStyle = "#C53030";
      ctx.fillRect(x1 - 1, y1 - (textHeight + 4), textWidth + 6, textHeight + 4);

      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(label, x1 + 2, y1 - (textHeight + 2));
    }
  };

  const doPredictFrame = async () => {
    if (!model || !videoRef.current || !videoRef.current.srcObject) return;

    tf.engine().startScope();

    const [modelWidth, modelHeight] = model?.inputs[0]?.shape?.slice(1, 3) || [0, 0];

    const input = tf.tidy(() => {
      const frameTensor = tf.browser.fromPixels(videoRef.current!);
      return tf.image.resizeBilinear(frameTensor, [modelWidth, modelHeight]).div(255.0).expandDims(0);
    });

    const res = await model.executeAsync(input);
    const [boxes, scores, classes] = res;
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();
    renderPrediction(new Float32Array(boxesData), new Float32Array(scoresData), new Float32Array(classesData));

    tf.dispose(res);

    const reqId = requestAnimationFrame(doPredictFrame);
    setAniId(reqId);

    tf.engine().endScope();
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
        <Spinner label={`Loading model... ${(loading * 100).toFixed(1)}%`} color="success" labelColor="success"/>
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
          <div
            id="image-placeholder"
            style={{
              width: "100%",
              position: "relative",
              display: liveWebcam ? "flex" : "none",
            }}
            className="bg-card text-card-foreground rounded-lg border shadow-sm"
          >
            <video
              ref={videoRef}
              style={{
                width: "100%",
                display: liveWebcam ? "block" : "none",
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
                display: liveWebcam ? "block" : "none",
              }}
              onClick={() => {
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

        <div
        >
          <Button
            disabled={liveWebcam}
            onClick={webcamHandler}
            style={{ gridColumn: "span 1" }}
            color="success"
            variant="shadow"
          >
            Start Webcam <TiCameraOutline size={20} />
          </Button>
        </div>
      </div>
    </>
  );
};


export default VideoStream;