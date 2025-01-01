import React, { useState, useRef, RefObject } from "react";
import { Webcam } from "@/utils/webcam";
import { HiMiniVideoCamera, HiVideoCameraSlash } from "react-icons/hi2";
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
        variant="flat"
        fullWidth={true}
      >
        {streaming === "camera" ? (<><HiVideoCameraSlash className="text-xl"/><span>Stop Camera</span></>) : (<><HiMiniVideoCamera className="text-xl"/><span>Start Camera</span></>)}

      </Button>
    </div>
  );
};

export default ButtonHandler;
