"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera } from "lucide-react";
import { validateAadharAction, createInterviewSession } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getMockCandidate } from "@/lib/mock-db";

export default function VerifyAadharPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [uniqueId, setUniqueId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      router.push("/login");
      return;
    }
    setUniqueId(id);

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Camera access denied:", error);
        setHasCameraPermission(false);
      }
    }
    setupCamera();

    return () => {
      // Cleanup camera stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [router, searchParams]);

  const handleCaptureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current || !uniqueId) return;

    setIsCapturing(true);

    try {
      // 1. Capture Frame
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL("image/jpeg", 0.8);

      // 2. OCR Verification via Server Action
      const ocrResult = await validateAadharAction({ imageUri: dataUri });
      
      if (!ocrResult.success || !ocrResult.data?.verified) {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: ocrResult.data?.message || "Could not find a valid 12-digit Aadhar number in the frame. Please hold the card clearly to the camera.",
        });
        setIsCapturing(false);
        return;
      }

      toast({
        title: "Verification Successful",
        description: `Verified Aadhar Number: ************`,
      });

      // 3. Create Interview Session and Redirect
      const candidate = getMockCandidate(uniqueId);
      if (!candidate) throw new Error("Invalid Candidate Session State");

      const sessionResult = await createInterviewSession({
        role: candidate.role,
        score: 0,
        duration: "0",
      });

      if (!sessionResult.success || !sessionResult.id) {
        throw new Error("Could not create interview session on the server.");
      }

      const params = new URLSearchParams({
        role: candidate.role,
        difficulty: candidate.difficulty,
        interviewId: sessionResult.id,
      });
      if (candidate.topics) {
        params.append("topics", candidate.topics.join(","));
      }

      router.push(`/interview?${params.toString()}`);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred during verification.",
      });
      setIsCapturing(false);
    }
  };

  return (
    <AppShell>
      <div className="flex justify-center max-w-2xl mx-auto">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Mandatory ID Verification</CardTitle>
            <CardDescription>
              Please hold your Aadhar card up to the camera. We need to verify your 12-digit Aadhar Number before proceeding to the interview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            {!hasCameraPermission && (
              <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                  Please allow camera permissions in your browser. We need it to verify your ID and record the interview.
                </AlertDescription>
              </Alert>
            )}

            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden border">
              <video autoPlay playsInline muted ref={videoRef} className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Optional UI Overlay for guiding the user */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                 <div className="w-3/4 h-1/2 border-2 border-dashed border-primary rounded-lg opacity-50" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              disabled={!hasCameraPermission || isCapturing}
              onClick={handleCaptureAndVerify}
            >
              {isCapturing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" /> Capture & Verify
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}
