import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, AlertCircle, Camera } from "lucide-react";

const ARFrameScanner = () => {
  const { frameId } = useParams<{ frameId: string }>();
  const navigate = useNavigate();
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [isTargetDetected, setIsTargetDetected] = useState(false);
  const [arMode, setArMode] = useState<"popup" | "3d">("popup");
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  // Inject custom CSS to isolate A-Frame / MindAR and prevent Vite root container offsets or transition delays
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.id = "ar-single-scanner-styles";
    styleEl.innerHTML = `
      #root {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      body, html {
        overflow: hidden !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background-color: #000000 !important;
      }
      /* Prevent CSS transition properties from lagging MindAR position updates */
      * {
        transition: none !important;
      }
      /* Suppress only for A-Frame canvas updates, but let our scanner guide fade nicely */
      .ar-guide-fade, .ar-guide-fade * {
        transition: opacity 0.4s ease-in-out, transform 0.4s ease-in-out !important;
      }
      /* Force MindAR webcam video tag to be absolutely fullscreen and aligned */
      video:not(.ar-popup-video) {
        max-width: none !important;
        max-height: none !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        z-index: -100 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      /* Force A-Frame canvas to be perfectly aligned */
      .a-canvas {
        width: 100% !important;
        height: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      @keyframes ar-scan-line {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(280px);
        }
      }
      .ar-scanner-line {
        animation: ar-scan-line 3s ease-in-out infinite !important;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      styleEl.remove();
    };
  }, []);

  // 1. Synchronously load script tags and handle sequential initialization
  useEffect(() => {
    // Function to dynamically load a single external script tag
    const loadScript = (url: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
          resolve(true); // Don't reload if it already exists
          return;
        }
        const script = document.createElement("script");
        script.src = url;
        script.async = false; // Maintain execution order
        script.onload = () => resolve(true);
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    // Enforce sequence: A-Frame MUST execute before MindAR
    Promise.all([
      loadScript("https://aframe.io/releases/1.5.0/aframe.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js")
    ]).then(() => {
      setScriptsLoaded(true); // Signal React that compilation parameters are safe
    }).catch(err => console.error("AR script initialization failed", err));

    return () => {
      console.log("Unmounting AR Scanner: Performing full environment cleanup...");
      
      // Cleanup settings: Shut off tracking systems on exit
      const sceneEl = document.querySelector('a-scene') as any;
      if (sceneEl && sceneEl.systems && sceneEl.systems['mindar-image-system']) {
        try {
          sceneEl.systems['mindar-image-system'].stop();
        } catch (err) {
          console.warn("Failed to stop MindAR system process:", err);
        }
      }

      // Explicitly pause and clean the target video element
      const video = document.getElementById("frameVideo") as HTMLVideoElement;
      if (video) {
        try {
          video.pause();
          video.src = "";
          video.load();
        } catch (e) {
          console.warn("Error releasing video source:", e);
        }
      }

      // Shut down the camera stream tracks (turns off web cam light)
      const allVideos = document.querySelectorAll("video");
      allVideos.forEach((v) => {
        if (v.srcObject) {
          const stream = v.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            console.log(`Stopping video track: ${track.label}`);
            track.stop();
          });
        }
      });

      // Wipe injected UI nodes, canvases and styles added by A-Frame/MindAR to body
      const mindarUI = document.querySelectorAll(".mindar-ui-overlay");
      mindarUI.forEach((el) => el.remove());

      const aframeElements = document.querySelectorAll(".a-canvas, .a-loader-title, .a-enter-vr");
      aframeElements.forEach((el) => el.remove());

      // Reset body and html layout properties to original values to restore normal scrolling and layout
      const cleanAllLayouts = () => {
        console.log("Restoring document scroll layout parameters...");
        
        // Remove properties from body
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("height");
        document.body.style.removeProperty("width");
        document.body.style.removeProperty("margin");
        document.body.style.removeProperty("padding");
        document.body.classList.remove("a-body");
        
        // Remove properties from html documentElement
        document.documentElement.style.removeProperty("overflow");
        document.documentElement.style.removeProperty("height");
        document.documentElement.style.removeProperty("width");
        document.documentElement.style.removeProperty("margin");
        document.documentElement.style.removeProperty("padding");
        document.documentElement.classList.remove("a-html");

        // Force browser layout reflow with scroll enabled
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
      };

      // Call immediately on unmount
      cleanAllLayouts();

      // Trigger delayed cleanup steps to catch asynchronous A-Frame thread style re-injections
      setTimeout(cleanAllLayouts, 100);
      setTimeout(cleanAllLayouts, 300);
      setTimeout(cleanAllLayouts, 800);
      setTimeout(cleanAllLayouts, 1500);
    };
  }, []);

  // Fetch the tracking frame configuration details from public.video_frames
  const { data, isLoading, error: dbError } = useQuery({
    queryKey: ["video_frame", frameId],
    queryFn: async () => {
      if (!frameId) throw new Error("Frame identifier is missing from parameter path.");
      
      const { data, error } = await supabase
        .from("video_frames" as any)
        .select("*")
        .eq("id", frameId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("No AR Frame matching the requested target was found.");
      return data;
    },
    enabled: !!frameId,
  });

  // Bind the target detection handler on the target anchor element
  useEffect(() => {
    if (!scriptsLoaded || !data) return;

    const anchor = document.getElementById("targetAnchor");

    if (!anchor) return;

    const handleFound = () => {
      console.log("AR Target detected! Mode active: " + arMode);
      setIsTargetDetected(true);
    };

    const handleLost = () => {
      console.log("AR Target lost.");
      setIsTargetDetected(false);
    };

    anchor.addEventListener("targetFound", handleFound);
    anchor.addEventListener("targetLost", handleLost);

    return () => {
      anchor.removeEventListener("targetFound", handleFound);
      anchor.removeEventListener("targetLost", handleLost);
    };
  }, [scriptsLoaded, data, arMode]);

  // Coordinate mode changes and target detections seamlessly
  useEffect(() => {
    if (!scriptsLoaded || !data) return;

    const video3d = document.getElementById("frameVideo") as HTMLVideoElement;

    if (isTargetDetected) {
      if (arMode === "popup") {
        // Pause 3D video if active
        if (video3d) {
          try {
            video3d.pause();
          } catch (e) {}
        }
        // Open premium React Pop-up player
        setIsTracking(true);
      } else {
        // arMode === "3d"
        // Hide React Pop-up
        setIsTracking(false);
        // Play 3D video
        if (video3d) {
          video3d.play().catch((err) => {
            console.warn("Seamless AR video play failed:", err);
          });
        }
      }
    } else {
      // Target lost
      setIsTracking(false);
      if (video3d) {
        try {
          video3d.pause();
        } catch (e) {}
      }
    }
  }, [scriptsLoaded, data, isTargetDetected, arMode]);

  const totalError = dbError instanceof Error ? dbError.message : dbError ? String(dbError) : null;

  // Don't render the scene layout elements until scripts are completely ready
  if (!scriptsLoaded || isLoading) {
    return (
      <div className="w-screen h-screen absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white p-6">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-[100] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Exit Scanner
        </button>
        <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
        <p className="text-sm font-medium tracking-wide">Initializing Camera Lens...</p>
        <p className="text-xs text-muted-foreground mt-2">Please grant camera permissions when prompted.</p>
      </div>
    );
  }

  // Render Error fallback UI
  if (totalError || !data) {
    return (
      <div className="w-screen h-screen absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">Scanner Initialization Failed</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {totalError || "Could not retrieve the target AR information from our database."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-transform hover:scale-105 active:scale-95 shadow-md shadow-rose/25 flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  // Render A-Frame Scene once ready with top-level container matching raw screen bounds for maximum overlay z-index visibility
  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] bg-black overflow-visible">
      {/* Upper Control Bar (Exit navigation & AR Switch) */}
      <div className="absolute top-4 left-4 z-[10000] flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all shadow-md hover:scale-105 active:scale-95 flex items-center justify-center text-sm font-semibold"
          title="Exit Scanner"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Dynamic Mode Switch Capsule */}
        <div className="bg-black/60 border border-white/20 p-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-md">
          <button
            onClick={() => {
              setArMode("popup");
              setIsTracking(false);
              const v = document.getElementById("frameVideo") as HTMLVideoElement;
              if (v) try { v.pause(); } catch(e){}
            }}
            className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
              arMode === "popup"
                ? "bg-rose-500 text-white shadow-rose"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span>📱 Pop-up</span>
          </button>
          <button
            onClick={() => {
              setArMode("3d");
              setIsTracking(false);
            }}
            className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
              arMode === "3d"
                ? "bg-rose-500 text-white shadow-rose"
                : "text-white/60 hover:text-white"
            }`}
          >
            <span>🕶️ 3D Mode</span>
          </button>
        </div>
      </div>

      {/* Dynamic glassmorphic scanning box guide overlay - hidden when target is active */}
      <div className={`ar-guide-fade absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-[9000] ${
        isTargetDetected ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}>
        <div className="relative w-64 h-[280px] flex items-center justify-center">
          {/* Glassmorphic Box container */}
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[1px] border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center shadow-2xl">
            <Camera className="w-8 h-8 text-primary mb-3 animate-pulse" />
            <p className="text-white font-semibold text-sm tracking-wide font-sans">Align Photo Frame</p>
            <p className="text-white/40 text-[10px] mt-2 leading-relaxed max-w-[180px] font-sans">
              Point your camera at the physical photo target frame to unlock your gift video
            </p>
          </div>

          {/* Bracket Corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl"></div>

          {/* Glowing Animated Scanning Line */}
          <div className="ar-scanner-line absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_8px_rgba(235,116,98,0.6)]"></div>
        </div>
        <p className="text-white/60 font-body text-xs font-semibold tracking-wider mt-6 animate-pulse uppercase">
          LENS ACTIVE • SEARCHING TARGET
        </p>
      </div>

      {/* A-Frame AR Engine */}
      <a-scene
        mindar-image={`imageTargetSrc: ${data.target_mind_url}; autoStart: true;`}
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        <a-assets>
          <video
            id="frameVideo"
            src={data.video_url}
            preload="auto"
            loop
            playsInline
            webkit-playsinline="true"
            crossOrigin="anonymous"
            onLoadedMetadata={(e) => {
              const vid = e.currentTarget;
              if (vid.videoWidth && vid.videoHeight) {
                const ratio = vid.videoWidth / vid.videoHeight;
                console.log(`[ARFrameScanner] Aspect ratio loaded: ${vid.videoWidth}x${vid.videoHeight} = ${ratio}`);
                setAspectRatio(ratio);
              }
            }}
          />
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false" />

        {/* Target Entity */}
        <a-entity mindar-image-target="targetIndex: 0" id="targetAnchor">
          <a-video
            src="#frameVideo"
            width="1"
            height={String(1 / aspectRatio)}
            position="0 0 0"
            rotation="0 0 0"
            visible={arMode === "3d" ? "true" : "false"}
          />
        </a-entity>
      </a-scene>

      {/* Fullscreen Video Player Pop-up in natural ratio with active camera background */}
      {isTracking && (
        <div className="fixed inset-0 z-[100000] bg-black/10 backdrop-blur-[2px] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-black/85 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-4 flex flex-col items-center">
            {/* Upper Header Control */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <h4 className="text-white font-display text-sm font-bold truncate max-w-[150px]">
                  {data.frame_name}
                </h4>
              </div>
              <button
                onClick={() => setIsTracking(false)}
                className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all font-semibold text-xs flex items-center gap-1 active:scale-95 shadow-md"
              >
                ✕ Close Player
              </button>
            </div>

            {/* Video element container (block layout, immune to mobile height collapse) */}
            <div className="w-full border border-white/10 rounded-xl overflow-hidden bg-black/60 shadow-inner">
              <video
                src={data.video_url}
                autoPlay
                loop
                playsInline
                preload="auto"
                className="ar-popup-video w-full h-auto block max-h-[50vh] rounded-xl"
                style={{ display: "block" }}
              />
            </div>

            {/* Prompt */}
            <p className="text-white/40 text-[9px] font-sans mt-3 uppercase tracking-widest animate-pulse">
              Zero Gifts • Premium AR Experience
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARFrameScanner;
