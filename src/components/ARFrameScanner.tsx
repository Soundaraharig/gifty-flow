import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

/**
 * Custom hook to dynamically load script elements in sequential order.
 * MindAR depends on A-Frame (AFRAME global context), so they must be appended one after another.
 */
const useMindARScripts = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadScript = (src: string, id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const existing = document.getElementById(id);
        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.id = id;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    };

    const loadSequential = async () => {
      try {
        // 1. Load A-Frame first
        await loadScript("https://aframe.io/releases/1.5.0/aframe.min.js", "aframe-script");
        
        // 2. Load MindAR-image component which registers onto A-Frame
        await loadScript(
          "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
          "mindar-script"
        );
        
        if (active) {
          setLoaded(true);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || "Failed to download AR engine files");
        }
      }
    };

    loadSequential();

    return () => {
      active = false;
    };
  }, []);

  return { loaded, error };
};

const ARFrameScanner = () => {
  const { frameId } = useParams<{ frameId: string }>();
  const navigate = useNavigate();
  const { loaded: scriptsLoaded, error: scriptError } = useMindARScripts();

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

  // Bind the play/pause handlers on the target anchor element
  useEffect(() => {
    if (!scriptsLoaded || !data) return;

    const anchor = document.getElementById("targetAnchor");
    const video = document.getElementById("frameVideo") as HTMLVideoElement;

    if (!anchor || !video) return;

    const handleFound = () => {
      console.log("AR Target detected! Starting media playback.");
      video.play().catch((err) => {
        console.warn("Media playback was interrupted by user or browser rules:", err);
      });
    };

    const handleLost = () => {
      console.log("AR Target lost. Pausing video playback.");
      video.pause();
    };

    anchor.addEventListener("targetFound", handleFound);
    anchor.addEventListener("targetLost", handleLost);

    return () => {
      anchor.removeEventListener("targetFound", handleFound);
      anchor.removeEventListener("targetLost", handleLost);
    };
  }, [scriptsLoaded, data]);

  // Exhaustive cleanup on component unmount to protect page layout and stop webcam
  useEffect(() => {
    return () => {
      console.log("Unmounting AR Scanner: Performing full environment cleanup...");
      
      // 1. Explicitly pause and clean the target video element
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

      // 2. Shut down the camera stream tracks (turns off web cam light)
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

      // 3. Command the MindAR system framework to stop processing
      const sceneEl = document.querySelector("a-scene") as any;
      if (sceneEl && sceneEl.systems && sceneEl.systems["mindar-image-system"]) {
        try {
          sceneEl.systems["mindar-image-system"].stop();
        } catch (err) {
          console.warn("Failed to stop MindAR system process:", err);
        }
      }

      // 4. Wipe injected UI nodes, canvases and styles added by A-Frame/MindAR to body
      const mindarUI = document.querySelectorAll(".mindar-ui-overlay");
      mindarUI.forEach((el) => el.remove());

      const aframeElements = document.querySelectorAll(".a-canvas, .a-loader-title, .a-enter-vr");
      aframeElements.forEach((el) => el.remove());

      // 5. Reset body and html layout properties to original values
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("height");
      document.body.style.removeProperty("width");
      document.body.style.removeProperty("margin");
      document.body.classList.remove("a-body");
      document.documentElement.classList.remove("a-html");
    };
  }, []);

  const totalError = scriptError || (dbError instanceof Error ? dbError.message : dbError ? String(dbError) : null);

  // Render Loader screen during async preparation
  if (isLoading || !scriptsLoaded) {
    return (
      <div className="w-screen h-screen absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-white p-6">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-[100] p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Exit Scanner
        </button>
        <Loader2 className="animate-spin h-10 w-10 text-primary mb-4" />
        <p className="text-sm font-medium tracking-wide">Initializing AR Scanner...</p>
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

  // Render A-Frame Scene once ready
  return (
    <div className="w-screen h-screen absolute inset-0 z-50 bg-black flex items-center justify-center">
      {/* Absolute back controls overlay */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-[100] p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-semibold"
        title="Exit Scanner"
      >
        <ArrowLeft size={18} /> Exit
      </button>

      {/* A-Frame AR Engine */}
      <a-scene
        mindar-image={`imageTargetSrc: ${data.target_mind_url}; autoStart: true;`}
        embedded
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        <a-assets>
          <video
            id="frameVideo"
            src={data.video_url}
            preload="auto"
            loop={true}
            crossOrigin="anonymous"
            playsInline
            webkit-playsinline="true"
          />
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false" />

        <a-entity mindar-image-target="targetIndex: 0" id="targetAnchor">
          <a-video
            src="#frameVideo"
            width="1"
            height="1.4"
            position="0 0 0"
          />
        </a-entity>
      </a-scene>
    </div>
  );
};

export default ARFrameScanner;
