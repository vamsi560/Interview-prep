
"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getInitialQuestion, saveInterviewSession, checkProctoring, generateAndSaveSummaryReport, uploadRecordingChunk, processInterviewTurn } from "@/app/actions";
import { FALLBACK_QUESTIONS } from "@/lib/interview-constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Volume2, VolumeX, Loader2, Send } from "lucide-react";
import type { InterviewSettings, Message, Feedback } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAzureSpeech } from "@/hooks/use-azure-speech";
import { UserResponseIndicator } from "@/components/user-response-indicator";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function InterviewView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [settings, setSettings] = useState<InterviewSettings | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allFeedback, setAllFeedback] = useState<Feedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [userText, setUserText] = useState("");
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const interviewStartTime = useRef<Date | null>(null);
  const proctoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunkIndexRef = useRef<number>(0);
  const violationsRef = useRef<{ timestamp: string; message: string }[]>([]);
  const isMountedRef = useRef(true);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [activeFallbackIndex, setActiveFallbackIndex] = useState(-1);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  const handleInterviewCompletion = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (!interviewId || !interviewStartTime.current) return;
  
    const endTime = new Date();
    const durationInMinutes = Math.round((endTime.getTime() - interviewStartTime.current.getTime()) / 60000);
  
    const finalScore = allFeedback.length > 0 ? Math.round(allFeedback.reduce((sum, f) => sum + f.score, 0) / allFeedback.length) : 0;
  
    const sessionData = {
      score: finalScore,
      duration: durationInMinutes.toString(),
      feedback: allFeedback,
      transcript: messages,
      violations: violationsRef.current,
    };
  
    const result = await saveInterviewSession(interviewId, sessionData);
  
    if (result.success) {
      toast({
        title: "Interview Complete!",
        description: "Your session has been saved. Generating summary report...",
      });
      // Generate summary report in the background
      generateAndSaveSummaryReport(interviewId).then(reportResult => {
        if(reportResult.success) {
            toast({
                title: "Report Ready",
                description: "Your post-interview summary report is ready.",
              });
        } else {
            toast({
                title: "Report Failed",
                description: "Could not generate your summary report.",
                variant: "destructive",
            });
        }
      });
      router.push("/dashboard");
    } else {
      toast({
        title: "Error",
        description: "Could not save your interview session. Please try again.",
        variant: "destructive",
      });
    }
  }, [interviewId, allFeedback, messages, router, toast]);

  const processUserResponse = useCallback(async (responseText: string, speakCallback: (text: string) => void) => {
    if (!responseText.trim() || !settings) return;

    setIsThinking(true);
    setCurrentFeedback(null);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: responseText };
    setMessages(prev => [...prev, userMessage]);

    // Consolidate current transcript for AI context
    const currentTranscript = messages.map(m => ({ role: m.role as 'user' | 'ai', content: m.content }));

    try {
        const result = await processInterviewTurn({
            role: settings.role,
            difficulty: settings.difficulty,
            questionBank: settings.questionBank,
            transcript: currentTranscript,
            userResponse: responseText
        });

        if (result.success && result.data) {
            const data = result.data;
            setCurrentFeedback({
                feedback: data.feedback,
                suggestions: data.suggestions,
                score: data.score
            });
            setAllFeedback(prev => [...prev, {
                feedback: data.feedback,
                suggestions: data.suggestions,
                score: data.score
            }]);

            const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: data.nextQuestion };
            setMessages(prev => [...prev, aiMessage]);
            speakCallback(aiMessage.content);

            if (data.isComplete || data.nextQuestion.toLowerCase().includes("complete")) {
                handleInterviewCompletion();
            }
            
            setIsFallbackMode(false); // Clear fallback if AI recovers
        } else {
            throw new Error(result.error || "AI turn failed");
        }
    } catch (error) {
        console.error("Switching to fallback mode:", error);
        setIsFallbackMode(true);
        
        // Fallback Logic: Take the next question from the hardcoded list
        const nextIndex = activeFallbackIndex + 1;
        if (nextIndex < FALLBACK_QUESTIONS.length) {
            const fallbackQuestion = FALLBACK_QUESTIONS[nextIndex];
            setActiveFallbackIndex(nextIndex);
            
            const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: fallbackQuestion };
            setMessages(prev => [...prev, aiMessage]);
            speakCallback(aiMessage.content);
            
            toast({
                title: "Network Congestion",
                description: "AI is slow. Continuing with standard interview questions.",
            });
        } else {
            // End interview if fallbacks are also exhausted
            const endMessage: Message = { id: Date.now().toString(), role: 'ai', content: "Thank you. The interview is now complete." };
            setMessages(prev => [...prev, endMessage]);
            speakCallback(endMessage.content);
            handleInterviewCompletion();
        }
    } finally {
        setIsThinking(false);
    }
  }, [messages, settings, toast, handleInterviewCompletion, activeFallbackIndex]);

  const { 
    isListening, 
    isSpeaking, 
    isVoiceEnabled, 
    currentTranscript, 
    toggleVoice, 
    speak, 
    startContinuous 
  } = useAzureSpeech(
    (text) => processUserResponse(text, speak), 
    toast
  );

  const runProctoring = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (videoRef.current && videoRef.current.readyState >= 3) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg");
        const res = await checkProctoring({ videoFrameDataUri: dataUri });
        if (res.success && res.data?.hasViolation) {
          const timestamp = interviewStartTime.current
            ? new Date(Date.now() - interviewStartTime.current.getTime()).toISOString().substring(14, 19)
            : "00:00";
            
          violationsRef.current.push({ timestamp, message: res.data.warningMessage });
          
          toast({
            title: "Proctoring Warning",
            description: res.data.warningMessage,
            variant: "destructive",
          });
        }
      }
    }
  }, [toast]);

  useEffect(() => {
    const id = searchParams.get("interviewId");

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        if (id) {
            let mediaRecorder;
            try {
                mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
            } catch (e) {
                mediaRecorder = new MediaRecorder(stream);
            }
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (e) => {
                if (e.data.size > 0 && id) {
                    const formData = new FormData();
                    formData.append("interviewId", id);
                    formData.append("chunkIndex", chunkIndexRef.current.toString());
                    formData.append("chunk", new File([e.data], "chunk.webm", { type: e.data.type }));
                    chunkIndexRef.current++;
                    
                    uploadRecordingChunk(formData).catch(err => console.error("Upload chunk error:", err));
                }
            };
            mediaRecorder.start(10000); // 10 sec chunks
        }

        proctoringIntervalRef.current = setInterval(runProctoring, 5000);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
        isMountedRef.current = false;
        if(proctoringIntervalRef.current) {
            clearInterval(proctoringIntervalRef.current);
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
    }
  }, [toast, runProctoring, searchParams]);


  useEffect(() => {
    const role = searchParams.get("role");
    const difficulty = searchParams.get("difficulty") as InterviewSettings['difficulty'] | null;
    const topics = searchParams.get("topics") || "";
    const questionBank = searchParams.get("questionBank") || "";
    const id = searchParams.get("interviewId");

    if (role && difficulty && id) {
      setInterviewId(id);
      const newSettings = { role, difficulty, topics, questionBank };
      setSettings(newSettings);
      interviewStartTime.current = new Date();
      
      const fetchFirstQuestion = async () => {
        setIsLoading(true);
        
        try {
          const questionPromise = getInitialQuestion({ 
            role: newSettings.role, 
            difficulty: newSettings.difficulty, 
            questionBank: newSettings.questionBank
          });

          const res = await questionPromise;
          
          if(res.success && res.data){
            const firstMessage: Message = { id: Date.now().toString(), role: "ai", content: res.data.nextQuestion };
            setMessages([firstMessage]);
            speak(firstMessage.content);
            setActiveFallbackIndex(0); // Mark that we've used the first "logical" slot
            // Start listening after AI speaks the first question
          } else {
            throw new Error(res.error || "Failed to generate first question.");
          }
        } catch (error) {
          console.error('Error fetching first question:', error);
          
          const fallbackQuestion = FALLBACK_QUESTIONS[0];
          setActiveFallbackIndex(0);
          setIsFallbackMode(true);
          
          const firstMessage: Message = { id: Date.now().toString(), role: "ai", content: fallbackQuestion };
          setMessages([firstMessage]);
          speak(fallbackQuestion);
          
          toast({ 
            title: "Using Fallback Track", 
            description: "AI is busy. Started with a standard interview question.",
            variant: "default"
          });
        } finally {
          setIsLoading(false);
          // Small delay before starting continuous listening
          setTimeout(startContinuous, 4000); 
        }
      };
      fetchFirstQuestion();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, toast]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const aiAvatar = PlaceHolderImages.find(img => img.id === 'ai-avatar');
  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-full space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center">
          <p className="text-lg font-medium">Preparing your interview...</p>
          <p className="text-sm text-muted-foreground">This may take up to 45 seconds</p>
        </div>
      </div>
    );
  }

  const isLastMessageFromAI = messages.length > 0 && messages[messages.length - 1].role === 'ai';
  const isInterviewComplete = messages.findLast(m => m.content.includes("The interview is now complete")) !== undefined;


  return (
    <div className="grid md:grid-cols-3 gap-6 h-full">
      <div className="md:col-span-2 flex flex-col h-full bg-card p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-2xl font-bold mb-1">{settings?.role} Interview</h1>
                <p className="text-muted-foreground">Difficulty: {settings?.difficulty}</p>
            </div>
            <div className="w-1/4">
                 <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted />
                 { !(hasCameraPermission) && (
                    <Alert variant="destructive" className="mt-2">
                              <AlertTitle>Camera Access Required</AlertTitle>
                              <AlertDescription>
                                Please allow camera access to use this feature.
                              </AlertDescription>
                      </Alert>
                )
                }
            </div>
        </div>
        <ScrollArea className="flex-grow mb-4 pr-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'ai' && (
                  <Avatar className={isSpeaking && isLastMessageFromAI && message.id === messages[messages.length-1].id ? "ring-4 ring-primary animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]" : ""}>
                    <AvatarImage src={aiAvatar?.imageUrl} data-ai-hint={aiAvatar?.imageHint} />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-prose rounded-lg p-3 ${message.role === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                  <p>{message.content}</p>
                </div>
                 {message.role === 'user' && (
                  <Avatar>
                    <AvatarImage src={userAvatar?.imageUrl} data-ai-hint={userAvatar?.imageHint} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isThinking && (
                 <div className="flex items-start gap-4">
                    <Avatar>
                        <AvatarImage src={aiAvatar?.imageUrl} data-ai-hint={aiAvatar?.imageHint}/>
                        <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="max-w-prose rounded-lg p-3 bg-muted">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                </div>
            )}
            {isLastMessageFromAI && !isThinking && !isSpeaking && !isInterviewComplete && (
              <div className="flex justify-center">
                  <UserResponseIndicator />
              </div>
            )}
          </div>
        </ScrollArea>
        {!isInterviewComplete && (
            <div className="flex flex-col gap-4 mt-6">
                <div className={`p-4 rounded-xl border-2 transition-all duration-500 ${isListening ? "border-primary bg-primary/5 animate-pulse" : "border-muted bg-muted/20"}`}>
                   <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`size-3 rounded-full ${isListening ? "bg-red-500 animate-ping" : "bg-muted-foreground"}`} />
                        <span className="text-sm font-semibold tracking-wider uppercase opacity-70">
                          {isListening ? "Live Transcribing" : "Microphone Paused"}
                        </span>
                      </div>
                      {currentTranscript.length > 5 && !isThinking && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          onClick={() => processUserResponse(currentTranscript, speak)}
                          className="h-8 text-xs font-bold"
                        >
                          Submit Now
                        </Button>
                      )}
                   </div>
                   <p className="text-xl font-medium min-h-[3rem] text-foreground/80 italic">
                      {currentTranscript || "Waiting for your response..."}
                   </p>
                </div>

                <div className="flex items-center justify-between">
                    <Button onClick={toggleVoice} variant="ghost" size="icon" disabled={isSpeaking}>
                        {isVoiceEnabled ? <Volume2 className="h-5 w-5"/> : <VolumeX className="h-5 w-5"/>}
                    </Button>
                    <div className="flex gap-2">
                        <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                            Voice Only Mode Active
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Real-time Feedback</CardTitle>
          <CardDescription>AI analysis of your latest response.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isThinking && !currentFeedback && (
            <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-6 w-1/4 mt-4" />
                <Skeleton className="h-20 w-full" />
            </div>
          )}
          {currentFeedback && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-accent">Feedback</h3>
                <p className="text-sm text-muted-foreground">{currentFeedback.feedback}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-accent">Suggestions</h3>
                <p className="text-sm text-muted-foreground">{currentFeedback.suggestions}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-accent">Score</h3>
                <p className="text-sm text-muted-foreground">{currentFeedback.score}/100</p>
              </div>
            </div>
          )}
          {!isThinking && !currentFeedback && (
              <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center">
                  <p>{isInterviewComplete ? "Interview has ended." : "Your feedback will appear here after you respond."}</p>
                  {isFallbackMode && (
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs">
                      AI is busy. Switched to standard interview track.
                    </div>
                  )}
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
