
"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getAIQuestion, getAIFeedback, saveInterviewSession, checkProctoring, generateAndSaveSummaryReport } from "@/app/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Toast } from "@/components/ui/toast";
import { UserResponseIndicator } from "@/components/user-response-indicator";
import { useRouter } from "next/navigation";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


const useSpeech = (
  onSpeechResult: (result: string) => void,
  toast: (options: Omit<Toast, 'id'>) => void
) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser does not support speech recognition. Please type your responses.",
        variant: "destructive",
      });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onSpeechResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
       if (event.error === 'network') {
        toast({
            title: "Network Error",
            description: "Speech recognition service could not be reached. Please check your network connection or try again.",
            variant: "destructive",
        });
      } else if (event.error === 'no-speech') {
        toast({
            title: "No Speech Detected",
            description: "I didn't hear anything. Please try speaking again.",
            variant: "destructive",
        });
      }
      else {
        toast({
            title: "Speech Recognition Error",
            description: `An error occurred: ${event.error}. Please try again.`,
            variant: "destructive",
        });
      }
      setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onSpeechResult, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        setIsListening(false);
        console.error("Could not start recognition", e);
        toast({
            title: "Could not start listening",
            description: "There was an issue starting the microphone. Please check browser permissions.",
            variant: "destructive",
        })
      }
    }
  };

  const speak = useCallback((text: string) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const indianMaleVoice = voices.find(voice => voice.lang === 'en-IN' && voice.name.includes('Male'));
    if (indianMaleVoice) {
      utterance.voice = indianMaleVoice;
    } else {
        const indianVoice = voices.find(voice => voice.lang === 'en-IN');
        if (indianVoice) {
            utterance.voice = indianVoice;
        }
    }
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isVoiceEnabled]);
  
  const toggleVoice = () => {
      if (isSpeaking) {
          window.speechSynthesis.cancel();
          setIsSpeaking(false);
      }
      setIsVoiceEnabled(prev => !prev);
  }

  return { isListening, toggleListening, speak, isSpeaking, isVoiceEnabled, toggleVoice };
};

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

  const handleInterviewCompletion = useCallback(async () => {
    if (!interviewId || !interviewStartTime.current) return;
  
    const endTime = new Date();
    const durationInMinutes = Math.round((endTime.getTime() - interviewStartTime.current.getTime()) / 60000);
  
    const finalScore = allFeedback.length > 0 ? Math.round(allFeedback.reduce((sum, f) => sum + f.score, 0) / allFeedback.length) : 0;
  
    const sessionData = {
      score: finalScore,
      duration: durationInMinutes.toString(),
      feedback: allFeedback,
      transcript: messages,
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

  const processUserResponse = useCallback(async (response: string, speakCallback: (text: string) => void) => {
    if (!response.trim()) return;

    setUserText("");
    setIsThinking(true);
    setCurrentFeedback(null);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: response };
    setMessages(prev => [...prev, userMessage]);

    const lastAIMessage = messages.findLast(m => m.role === 'ai');
    if (!lastAIMessage || !settings) {
        setIsThinking(false);
        toast({ title: "Error", description: "Could not find the last AI question to process feedback.", variant: "destructive" });
        return;
    }

    const [feedbackRes, questionRes] = await Promise.all([
        getAIFeedback({ userResponse: response, interviewQuestion: lastAIMessage.content, interviewContext: `Role: ${settings.role}`}),
        getAIQuestion({
            role: settings.role,
            difficultyLevel: settings.difficulty,
            questionBank: settings.questionBank,
            previousQuestions: messages.filter(m => m.role === 'ai').map(m => m.content)
        })
    ]);

    if(feedbackRes.success && feedbackRes.data){
        setCurrentFeedback(feedbackRes.data);
        setAllFeedback(prev => [...prev, feedbackRes.data]);
    } else {
        toast({ title: "Error", description: feedbackRes.error || "Failed to get feedback.", variant: "destructive" });
    }
    
    if(questionRes.success && questionRes.data){
      if(questionRes.data.isComplete) {
        const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: questionRes.data.question };
        setMessages(prev => [...prev, aiMessage]);
        speakCallback(aiMessage.content);
        // Don't await this, let it run in the background after the final message is spoken
        handleInterviewCompletion();
      } else {
        const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: questionRes.data.question };
        setMessages(prev => [...prev, aiMessage]);
        speakCallback(aiMessage.content);
      }
    } else {
        toast({ title: "Error", description: questionRes.error || "Failed to get next question.", variant: "destructive" });
    }

    setIsThinking(false);
  }, [messages, settings, toast, handleInterviewCompletion]);

  const { isListening, toggleListening, speak, isSpeaking, isVoiceEnabled, toggleVoice } = useSpeech(
    (text) => processUserResponse(text, speak), 
    toast
  );

  const runProctoring = useCallback(async () => {
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
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
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
        if(proctoringIntervalRef.current) {
            clearInterval(proctoringIntervalRef.current);
        }
    }
  }, [toast, runProctoring]);


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
        const res = await getAIQuestion({ role: newSettings.role, difficultyLevel: newSettings.difficulty, questionBank: newSettings.questionBank, previousQuestions: [] });
        if(res.success && res.data){
            const firstMessage: Message = { id: Date.now().toString(), role: "ai", content: res.data.question };
            setMessages([firstMessage]);
            speak(firstMessage.content);
        } else {
            toast({ title: "Error", description: res.error || "Failed to start interview.", variant: "destructive" });
        }
        setIsLoading(false);
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
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Preparing your interview...</p>
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
                  <Avatar>
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
            <div className="flex flex-col gap-2">
                <Textarea 
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    placeholder="Type your answer here or use the microphone..."
                    className="w-full text-base"
                    rows={3}
                    disabled={isThinking || isListening}
                />
                <div className="flex items-center justify-between">
                    <Button onClick={toggleVoice} variant="ghost" size="icon" disabled={isSpeaking}>
                        {isVoiceEnabled ? <Volume2 className="h-5 w-5"/> : <VolumeX className="h-5 w-5"/>}
                    </Button>
                    <div className="flex gap-2">
                        <Button onClick={toggleListening} variant={isListening ? 'destructive' : 'outline'} size="icon" disabled={isThinking || isSpeaking}>
                            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                        <Button onClick={() => processUserResponse(userText, speak)} disabled={!userText || isThinking || isListening || isSpeaking}>
                            <Send className="h-5 w-5 mr-2"/> Send
                        </Button>
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
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
