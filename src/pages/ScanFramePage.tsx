import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, AlertCircle, Sparkles, Image } from "lucide-react";

const ScanFramePage = () => {
  const navigate = useNavigate();
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // 1. Sequentially load script tags to ensure A-Frame loads before MindAR
  useEffect(() => {
    const loadScript = (url: string): Promise<boolean> => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
          resolve(true); // Skip reloading if it already exists in the document
          return;
        }
        const script = document.createElement("script");
        script.src = url;
        script.async = false; // Preserve execution ordering
        script.onload = () => resolve(true);
        script.onerror = () => reject();
        document.head.appendChild(script);
      });
    };

    Promise.all([
      loadScript("https://aframe.io/releases/1.5.0/aframe.min.js"),
      loadScript("https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js")
    ])
      .then(() => {
        setScriptsLoaded(true);
        console.log("A-Frame and MindAR external scripts loaded successfully.");
      })
      .catch((err) => console.error("Error loading AR dependencies:", err));

    return () => {
      console.log("Unmounting Multi-Target Scanner: Executing deep cleanup controls...");

      // Stop tracking engine systems
      const sceneEl = document.querySelector('a-scene') as any;
      if (sceneEl && sceneEl.systems && sceneEl.systems['mindar-image-system']) {
        try {
          sceneEl.systems['mindar-image-system'].stop();
        } catch (err) {
          console.warn("Could not stop MindAR system tracks:", err);
        }
      }

      // Explicitly pause and clear all running video elements to halt sound tracks
      const allVideos = document.querySelectorAll("video");
      allVideos.forEach((v) => {
        try {
          v.pause();
          v.src = "";
          v.load();
        } catch (e) {
          console.warn("Failed to stop video resource track:", e);
        }

        // Shut off active web-camera tracks (turns off phone webcam indicator)
        if (v.srcObject) {
          const stream = v.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            console.log(`Stopping webcam hardware track: ${track.label}`);
            track.stop();
          });
        }
      });

      // Erase injected MindAR/A-Frame elements and overlays from the body context
      const mindarUI = document.querySelectorAll(".mindar-ui-overlay");
      mindarUI.forEach((el) => el.remove());

      const aframeElements = document.querySelectorAll(".a-canvas, .a-loader-title, .a-enter-vr");
      aframeElements.forEach((el) => el.remove());

      // Reset inline and class layouts modified by A-Frame/MindAR to avoid page distortion
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("height");
      document.body.style.removeProperty("width");
      document.body.style.removeProperty("margin");
      document.body.classList.remove("a-body");
      document.documentElement.classList.remove("a-html");
    };
  }, []);

  // 2. Fetch all active video frame targets from the database
  const { data: frames = [], isLoading, error: dbError } = useQuery({
    queryKey: ["active_video_frames"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("video_frames" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  // 3. Register targetFound and targetLost events independently for each frame asset
  useEffect(() => {
    if (!scriptsLoaded || !frames || frames.length === 0) return;

    console.log(`Initializing event tracking for ${frames.length} active frame items...`);
    const cleanups: (() => void)[] = [];

    frames.forEach((frame, index) => {
      const anchor = document.getElementById(`targetAnchor-${index}`);
      const video = document.getElementById(`frameVideo-${index}`) as HTMLVideoElement;

      if (anchor && video) {
        const handleFound = () => {
          console.log(`[Multi-Scanner] Target detected: "${frame.frame_name}" (Index: ${index}). Play video.`);
          
          // Stop all other running overlay video assets to prevent concurrent audio playbacks
          frames.forEach((_, otherIndex) => {
            if (otherIndex !== index) {
              const otherVid = document.getElementById(`frameVideo-${otherIndex}`) as HTMLVideoElement;
              if (otherVid) {
                try {
                  otherVid.pause();
                } catch (e) {
                  console.warn(`Error pausing non-active video (Index: ${otherIndex}):`, e);
                }
              }
            }
          });

          // Play the matching overlay video
          video.play().catch((err) => {
            console.warn(`Media play failed or was delayed by browser context policy:`, err);
          });
        };

        const handleLost = () => {
          console.log(`[Multi-Scanner] Target lost: "${frame.frame_name}" (Index: ${index}). Pause video.`);
          try {
            video.pause();
          } catch (e) {
            console.warn("Error pausing video element:", e);
          }
        };

        anchor.addEventListener("targetFound", handleFound);
        anchor.addEventListener("targetLost", handleLost);

        cleanups.push(() => {
          anchor.removeEventListener("targetFound", handleFound);
          anchor.removeEventListener("targetLost", handleLost);
        });
      }
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [scriptsLoaded, frames]);

  const totalError = dbError instanceof Error ? dbError.message : dbError ? String(dbError) : null;

  // Intercept immediately if the query has finished and no active target frames are found
  if (!isLoading && frames.length === 0) {
    return (
      <div className="w-screen h-screen absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">No active target frames found</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          Please add a frame asset from the dashboard management tab before launching the scanner.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-full border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-transform active:scale-95 flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render Loader screen until dependencies and data are completely loaded
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
        <p className="text-sm font-medium tracking-wide">Booting AR Lens...</p>
        <p className="text-xs text-muted-foreground mt-2">Sequential multi-target scripts loading.</p>
      </div>
    );
  }

  // Render Database Query Error fallback UI
  if (totalError) {
    return (
      <div className="w-screen h-screen absolute inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h3 className="text-lg font-bold text-foreground mb-2">Scanner Initialization Failed</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{totalError}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }
  // Grab the compiled multi-target mind collection URL from the first active database record
  const multiTargetSrc = frames[0]?.target_mind_url;

  return (
    <div className="fixed inset-0 w-screen h-screen z-[9999] bg-black overflow-visible">
      {/* Upper Control Bar (Exit navigation) */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-[10000] p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-2 text-sm font-semibold"
        title="Exit Scanner"
      >
        <ArrowLeft size={18} /> Exit
      </button>

      {/* Floating Status Display */}
      <div className="absolute top-4 right-4 z-[10000] bg-black/60 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-[11px] text-white/90 font-mono tracking-wide uppercase font-semibold">
          Multi-Target Active ({frames.length} Frame{frames.length > 1 ? "s" : ""})
        </span>
      </div>

      {/* Multi-Target MindAR Engine Canvas */}
      <a-scene
        mindar-image={`imageTargetSrc: ${multiTargetSrc}; autoStart: true;`}
        embedded
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
      >
        {/* Dynamic loading of video assets */}
        <a-assets>
          {frames.map((frame, index) => (
            <video
              key={frame.id}
              id={`frameVideo-${index}`}
              src={frame.video_url}
              preload="auto"
              loop={true}
              crossOrigin="anonymous"
              playsInline
              webkit-playsinline="true"
            />
          ))}
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false" />

        {/* Sequential mapping of targets to their matching video overlays */}
        {frames.map((frame, index) => (
          <a-entity
            key={frame.id}
            mindar-image-target={`targetIndex: ${index}`}
            id={`targetAnchor-${index}`}
          >
            <a-video
              src={`#frameVideo-${index}`}
              width="1"
              height="1.4"
              position="0 0 0"
            />
          </a-entity>
        ))}
      </a-scene>
    </div>
  );
};

export default ScanFramePage;
