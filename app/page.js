// app/page.js
"use client";

import { useState, useRef, useEffect } from 'react';

export default function HomePage() {
  const [originalImagePreview, setOriginalImagePreview] = useState(null);
  const [redesignPrompt, setRedesignPrompt] = useState("Rediseña esta habitación con un estilo moderno y minimalista, con una paleta de colores neutros. Añade muebles limpios y contemporáneos y una gran obra de arte abstracta en una pared.");
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (useCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [useCamera]);

  const startCamera = async () => {
    setError(null);
    setCameraActive(false); 
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setCameraActive(true);
        };
      }
    } catch (err) {
      console.error("Error al acceder a la cámara:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraActive(true);
            setError(null);
          };
        }
      } catch (frontErr) {
        setError("No se encontró ninguna cámara disponible o el acceso fue denegado.");
        setUseCamera(false);
        setCameraActive(false);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
        videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    if (video && cameraActive) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setOriginalImagePreview(dataUrl);
      setUseCamera(false);
    } else {
      setError("La cámara no está activa o lista para capturar.");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    setUseCamera(false);
    stopCamera();
  };

  const handleGenerateImage = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);

    try {
      if (!originalImagePreview) {
        throw new Error("Por favor, sube una imagen o captura una foto.");
      }

      const analysisResponse = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: originalImagePreview }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Error al analizar la imagen. Inténtalo de nuevo.");
      }

      const { analysis } = await analysisResponse.json();

      const generateResponse = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, redesignPrompt }),
      });

      if (!generateResponse.ok) {
        throw new Error("Error al generar la imagen. Inténtalo de nuevo.");
      }

      const { imageUrl } = await generateResponse.json();
      setGeneratedImageUrl(imageUrl);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setOriginalImagePreview(null);
    setGeneratedImageUrl(null);
    setError(null);
    setUseCamera(false);
    stopCamera();
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900 text-white p-4 lg:p-8">
      
      {/* Panel de Controles (Columna Izquierda) */}
      <div className="flex-1 lg:w-1/2 flex flex-col p-4 lg:p-8 bg-gray-800 rounded-lg lg:rounded-l-lg lg:rounded-r-none shadow-lg">
        <h1 className="text-2xl lg:text-4xl font-bold mb-2 lg:mb-4 text-cyan-400">DesignAI</h1>
        <p className="text-sm lg:text-base text-gray-300 mb-4 lg:mb-8">
          Rediseña cualquier espacio con inteligencia artificial.
        </p>

        {/* Contenedor que crece y se desplaza */}
        <div className="flex-grow pr-0 lg:pr-4 overflow-y-auto">
          <div className="mb-4 lg:mb-6">
            <label className="block text-gray-400 mb-2 text-sm lg:text-base">
              1. Sube una imagen o toma una foto:
            </label>
            <div className="flex space-x-2 lg:space-x-4">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                ref={fileInputRef}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-sm lg:text-base py-2 px-3 lg:px-4 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600"
              >
                Subir Imagen
              </label>
              <button
                onClick={() => setUseCamera(true)}
                className={`text-sm lg:text-base py-2 px-3 lg:px-4 rounded transition-colors ${
                  useCamera ? "bg-red-500 hover:bg-red-600" : "bg-cyan-500 hover:bg-cyan-600 text-black"
                }`}
              >
                Tomar Foto
              </button>
            </div>
            {error && (
                <div className="mt-4 p-3 bg-red-500 rounded text-sm text-center">
                {error}
                </div>
            )}
            {/* Lógica para mostrar la cámara o la imagen capturada */}
            <div className="mt-4">
                {useCamera ? (
                    <>
                        {!cameraActive && !error && (
                            <p className="text-gray-400 mb-2">Iniciando cámara... Por favor, espera.</p>
                        )}
                        <video 
                            ref={videoRef} 
                            autoPlay 
                            className="w-full h-auto rounded" 
                            playsInline 
                            muted 
                            style={{ display: cameraActive ? 'block' : 'none' }}
                        />
                        <button
                            onClick={capturePhoto}
                            className="mt-2 w-full py-2 bg-green-500 hover:bg-green-600 rounded font-bold"
                            disabled={!cameraActive}
                        >
                            Capturar
                        </button>
                    </>
                ) : (
                    originalImagePreview && (
                        <div className="mt-4">
                            <img src={originalImagePreview} alt="Imagen Original" className="object-contain w-full h-full rounded" />
                        </div>
                    )
                )}
            </div>
          </div>

          <div className="mb-4 lg:mb-6">
            <label className="block text-gray-400 mb-2 text-sm lg:text-base">
              2. Describe cómo quieres rediseñar el espacio:
            </label>
            <textarea
              className="w-full h-32 lg:h-40 p-2 bg-gray-700 border border-gray-600 rounded resize-none text-sm lg:text-base"
              value={redesignPrompt}
              onChange={(e) => setRedesignPrompt(e.target.value)}
            />
          </div>
        </div>
        
        {/* Contenedor de botones fijo */}
        <div className="flex-none pt-4">
          <div className="flex space-x-2 lg:space-x-4">
              <button
              onClick={handleGenerateImage}
              disabled={isLoading || !originalImagePreview}
              className="flex-1 py-2 lg:py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-bold rounded shadow-md transition-colors duration-200 disabled:bg-gray-600 text-sm lg:text-base"
              >
              {isLoading ? "Generando..." : "Rediseñar Espacio"}
              </button>
              <button
              onClick={handleReset}
              className="flex-1 py-2 lg:py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded shadow-md transition-colors duration-200 disabled:bg-gray-600 text-sm lg:text-base"
              disabled={isLoading}
              >
              Reiniciar
              </button>
          </div>
        </div>
      </div>

      {/* Panel de visualización (Columna Derecha) */}
      <div className="flex-1 lg:w-1/2 flex items-center justify-center bg-gray-700 rounded-lg lg:rounded-r-lg lg:rounded-l-none shadow-lg mt-8 lg:mt-0 p-4 lg:p-8">
        {isLoading ? (
          <div className="text-base lg:text-xl text-gray-400 animate-pulse">Generando tu nuevo diseño...</div>
        ) : generatedImageUrl ? (
          <div className="relative w-full h-full">
            <img src={generatedImageUrl} alt="Imagen Rediseñada" className="object-contain w-full h-full rounded" />
            <a 
              href={generatedImageUrl} 
              download 
              className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-200 transition-colors"
              title="Descargar imagen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        ) : originalImagePreview ? (
          <div className="text-base lg:text-xl text-gray-400 relative">
            <img src={originalImagePreview} alt="Imagen Original" className="object-contain w-full h-full rounded" />
          </div>
        ) : (
          <div className="text-base lg:text-xl text-gray-400">
            Tu imagen original y la rediseñada aparecerán aquí.
          </div>
        )}
      </div>
    </div>
  );
}