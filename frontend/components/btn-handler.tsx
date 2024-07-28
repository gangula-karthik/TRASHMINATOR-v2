import React, { useState, useRef, RefObject } from "react";
import { Webcam } from "@/utils/webcam";
import { Button } from "@nextui-org/react";

interface ButtonHandlerProps {
  cameraRef: RefObject<HTMLVideoElement>;
}

const ButtonHandler: React.FC<ButtonHandlerProps> = ({ cameraRef }) => {
  const [streaming, setStreaming] = useState<string | null>(null); // streaming state
  const webcam = new Webcam(); // webcam handler

  return (
    <div className="btn-container">
      <Button
        onClick={() => {
          // if not streaming
          if (streaming === null) {
            if (cameraRef.current) {
              webcam.open(cameraRef.current); // open webcam
              cameraRef.current.style.display = "block"; // show camera
              setStreaming("camera"); // set streaming to camera
            }
          }
          // closing webcam streaming
          else if (streaming === "camera") {
            if (cameraRef.current) {
              webcam.close(cameraRef.current);
              setStreaming(null);
            }
          }
        }}
        color="success"
        variant="shadow"
        fullWidth
      >
        {streaming === "camera" ? "Close" : "Open"} Webcam
      </Button>
    </div>
  );
};

export default ButtonHandler;
