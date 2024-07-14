import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as tf from '@tensorflow/tfjs';

const VideoStream: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [objectCounts, setObjectCounts] = useState<{ [key: string]: number }>({});
  const [objectTracker, setObjectTracker] = useState<{ [key: string]: { count: number; timeout: NodeJS.Timeout } }>({});

  useEffect(() => {
    const loadModelAndDetect = async () => {
      const model = await cocoSsd.load();

      const detectObjects = async () => {
        if (videoRef.current) {
          const predictions = await model.detect(videoRef.current);
          updateObjectCounts(predictions);
        }
        requestAnimationFrame(detectObjects);
      };

      detectObjects();
    };

    const updateObjectCounts = (predictions: cocoSsd.DetectedObject[]) => {
      const updatedCounts: { [key: string]: number } = { ...objectCounts };
      const updatedTracker: { [key: string]: { count: number; timeout: NodeJS.Timeout } } = { ...objectTracker };

      predictions.forEach((prediction) => {
        const className = prediction.class;
        const id = prediction.bbox.join(',');

        if (!updatedTracker[id]) {
          if (!updatedCounts[className]) {
            updatedCounts[className] = 0;
          }
          updatedCounts[className]++;
          const timeout = setTimeout(() => {
            const newTracker = { ...updatedTracker };
            delete newTracker[id];
            setObjectTracker(newTracker);
          }, 3000);
          updatedTracker[id] = { count: updatedCounts[className], timeout };
        }
      });

      setObjectCounts(updatedCounts);
      setObjectTracker(updatedTracker);
    };

    if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
            };
          }
        })
        .catch((err) => {
          console.error('Error accessing the camera: ', err);
        });
    }

    loadModelAndDetect();
  }, [objectCounts, objectTracker]);

  return (
    <div>
      <video ref={videoRef} width="640" height="480" autoPlay muted></video>
      <div>
        <h2>Object Counts:</h2>
        {Object.entries(objectCounts).map(([key, value]) => (
          <p key={key}>
            {key}: {value}
          </p>
        ))}
      </div>
    </div>
  );
};

export default VideoStream;
