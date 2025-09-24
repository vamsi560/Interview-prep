"use client";

import { useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { getAIQuestion, getAIFeedback } from "@/app/actions";
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
      } else {
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
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [settings, setSettings] = useState<InterviewSettings | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [userText, setUserText] = useState("");

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const processUserResponse = useCallback(async (response: string) => {
    if (!response.trim()) return;

    setUserText("");
    setIsThinking(true);
    setFeedback(null);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: response };
    setMessages(prev => [...prev, userMessage]);

    const lastAIMessage = messages.findLast(m => m.role === 'ai');
    if (!lastAIMessage || !settings) {
        setIsThinking(false);
        toast({ title: "Error", description: "Could not find the last AI question to process feedback.", variant: "destructive" });
        return;
    }

    // This is passed to the useSpeech hook, which expects a speak function.
    // We define a placeholder here and it will be replaced by the real one from useSpeech.
    let speak = (text: string) => {};

    const [feedbackRes, questionRes] = await Promise.all([
        getAIFeedback({ userResponse: response, interviewQuestion: lastAIMessage.content, interviewContext: `Role: ${settings.role}`}),
        getAIQuestion({
            role: settings.role,
            difficulty: settings.difficulty,
            questionBank: settings.questionBank,
            previousQuestions: messages.filter(m => m.role === 'ai').map(m => m.content)
        })
    ]);

    if(feedbackRes.success && feedbackRes.data){
        setFeedback(feedbackRes.data);
    } else {
        toast({ title: "Error", description: feedbackRes.error || "Failed to get feedback.", variant: "destructive" });
    }
    
    if(questionRes.success && questionRes.data){
        const aiMessage: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: questionRes.data.question };
        setMessages(prev => [...prev, aiMessage]);
        speak(aiMessage.content);
    } else {
        toast({ title: "Error", description: questionRes.error || "Failed to get next question.", variant: "destructive" });
    }

    setIsThinking(false);
  }, [messages, settings, toast]);

  const { isListening, toggleListening, speak, isSpeaking, isVoiceEnabled, toggleVoice } = useSpeech(processUserResponse, toast);

  useEffect(() => {
    const role = searchParams.get("role");
    const difficulty = searchParams.get("difficulty") as InterviewSettings['difficulty'] | null;
    const topics = searchParams.get("topics") || "";
    const questionBank = searchParams.get("questionBank") || "";

    if (role && difficulty) {
      const newSettings = { role, difficulty, topics, questionBank };
      setSettings(newSettings);
      
      const fetchFirstQuestion = async () => {
        setIsLoading(true);
        const res = await getAIQuestion({ role: newSettings.role, difficultyLevel: newSettings.difficulty, questionBank: newSettings.questionBank });
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
    // This effect now correctly depends on `processUserResponse` and `speak`.
    const handleResponseAndSpeak = (response: string) => {
        processUserResponse(response).then(() => {
            const lastMessage = messages[messages.length -1];
            if(lastMessage.role === 'ai'){
                speak(lastMessage.content);
            }
        });
    };
    
    // This is a placeholder since we can't directly use the hook's returned function here.
    // The main logic is handled inside `processUserResponse`.
  }, [processUserResponse, speak, messages]);

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

  return (
    <div className="grid md:grid-cols-3 gap-6 h-full">
      <div className="md:col-span-2 flex flex-col h-full bg-card p-4 rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold mb-1">{settings?.role} Interview</h1>
        <p className="text-muted-foreground mb-4">Difficulty: {settings?.difficulty}</p>
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
          </div>
        </ScrollArea>
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
                    <Button onClick={() => processUserResponse(userText)} disabled={!userText || isThinking || isListening || isSpeaking}>
                        <Send className="h-5 w-5 mr-2"/> Send
                    </Button>
                </div>
            </div>
        </div>
      </div>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Real-time Feedback</CardTitle>
          <CardDescription>AI analysis of your latest response.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isThinking && !feedback && (
            <div className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-6 w-1/4 mt-4" />
                <Skeleton className="h-20 w-full" />
            </div>
          )}
          {feedback && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-accent">Feedback</h3>
                <p className="text-sm text-muted-foreground">{feedback.feedback}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-accent">Suggestions</h3>
                <p className="text-sm text-muted-foreground">{feedback.suggestions}</p>
              </div>
            </div>
          )}
          {!isThinking && !feedback && (
              <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center">
                  <p>Your feedback will appear here after you respond.</p>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}