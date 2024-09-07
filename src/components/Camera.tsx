import React, { useState, useEffect } from "react";

import Webcam from "react-webcam";
type Props = {
  badPhoto: boolean;
  setBadPhoto: React.Dispatch<React.SetStateAction<boolean>>;
  takingPicture: boolean;
  setTakingPicture: React.Dispatch<React.SetStateAction<boolean>>;
  letters: string[][];
  setLetters: React.Dispatch<React.SetStateAction<string[][]>>;
  confirmedLetters: string[][];
};

const Camera = (props: Props) => {
  const {
    badPhoto,
    setBadPhoto,
    setTakingPicture,
    setLetters,
    confirmedLetters,
  } = props;

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState({});
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const handleDevices = React.useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      const videoDevices: MediaDeviceInfo[] = mediaDevices.filter(
        ({ kind }) => kind === "videoinput"
      );
      setDevices(videoDevices);
    },
    [setDevices]
  );

  useEffect(() => {
    async function getDevices() {
      try {
        const deviceInfo = await navigator.mediaDevices.enumerateDevices();
        handleDevices(deviceInfo);
      } catch (err) {
        console.log(err);
      }
    }
    getDevices();
  }, [handleDevices, setDeviceId]);

  const webcamRef = React.useRef<Webcam>(null);

  const capture = React.useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef, setImgSrc]);

  const UploadPhoto = async () => {
    console.log("Uploading photo");
    if (!imgSrc) {
      return;
    }

    const response = await fetch("https://api.scorebble.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Allow requests from any origin
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE", // Allow the specified HTTP methods
        "Access-Control-Allow-Headers": "Content-Type", // Allow the specified headers
      },
      body: JSON.stringify({ image: imgSrc, currentBoard: confirmedLetters }),
    });
    if (!response.ok) {
      setImgSrc(null);
      setBadPhoto(true);
      setTimeout(() => {
        setBadPhoto(false);
      }, 5000); // Hide warning after 5 seconds
      return;
    }
    const data = await response.json();
    console.log(data.board);
    setLetters(data.board); //these need to be confirmed
    setImgSrc(null);
    setTakingPicture(false);
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-md mx-4">
        <div className="px-6 py-4">
          {imgSrc ? (
            <div>
              <img src={imgSrc} />
              <button
                className="m-2"
                onClick={() => {
                  setImgSrc(null);
                }}
              >
                Retake
              </button>
              <button className="m-2" onClick={UploadPhoto}>
                Done
              </button>
            </div>
          ) : (
            <div>
              {badPhoto && (
                <div className="text-xl bg-red-500">
                  Unable to capture board. Try Again
                </div>
              )}
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  height: { min: 720, max: 1920, ideal: 1920 },
                  width: { min: 1280, max: 1920, ideal: 1920 },
                  deviceId: deviceId,
                  facingMode: "environment",
                }}
                forceScreenshotSourceSize={true}
                imageSmoothing={false}
                screenshotQuality={1}
              />
              {devices.length > 1 && (
                <div className="flex flex-row m-2 item-center justify-center">
                  {devices.map((device, idx) => (
                    <button
                      className="m-2 text-sm"
                      key={idx}
                      onClick={() => {
                        setDeviceId(device.deviceId);
                      }}
                    >
                      {device.label}
                    </button>
                  ))}
                </div>
              )}

              <button
                className="m-2"
                onClick={() => {
                  setTakingPicture(false);
                }}
              >
                Cancel
              </button>
              <button className="m-2" onClick={capture}>
                Capture photo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camera;
