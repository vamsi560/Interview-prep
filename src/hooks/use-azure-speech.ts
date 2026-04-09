"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

export interface SpeechHookResult {
  isListening: boolean;
  isSpeaking: boolean;
  isVoiceEnabled: boolean;
  currentTranscript: string;
  toggleVoice: () => void;
  speak: (text: string) => void;
  startContinuous: () => void;
  stopContinuous: () => void;
}

export const useAzureSpeech = (
  onFinalResult: (text: string) => void,
  toast: (options: any) => void
): SpeechHookResult => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [currentTranscript, setCurrentTranscript] = useState("");
  
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const isStartingRef = useRef<boolean>(false);

  const stopContinuous = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(() => {
        setIsListening(false);
        recognizerRef.current = null;
      });
    }
    if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
    }
  }, []);

  const startContinuous = useCallback(async () => {
    if (recognizerRef.current || isStartingRef.current || isSpeaking) return;
    isStartingRef.current = true;

    try {
      const res = await fetch('/api/speech-token');
      const { token, region } = await res.json();

      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = "en-US";

      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      recognizer.recognizing = (s, e) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setCurrentTranscript(accumulatedTranscriptRef.current + " " + e.result.text);
      };

      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          accumulatedTranscriptRef.current += " " + e.result.text;
          setCurrentTranscript(accumulatedTranscriptRef.current);

          // Reset silence timer on every chunk of recognized speech
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          
          silenceTimerRef.current = setTimeout(() => {
            const final = accumulatedTranscriptRef.current.trim();
            if (final.length > 5) {
                onFinalResult(final);
                accumulatedTranscriptRef.current = ""; // Clear for next answer
                setCurrentTranscript("");
            }
          }, 3500); // 3.5 seconds of silence for auto-submission
        }
      };

      recognizer.canceled = (s, e) => {
        console.warn("Speech recognition canceled:", e.errorDetails);
        setIsListening(false);
      };

      recognizer.startContinuousRecognitionAsync(() => {
        setIsListening(true);
      });

      recognizerRef.current = recognizer;

    } catch (error) {
    } finally {
      isStartingRef.current = false;
    }
  }, [onFinalResult, toast, isSpeaking]);

  const speak = useCallback((text: string) => {
    if (!isVoiceEnabled || !window.speechSynthesis) return;
    
    // Stop listening while AI is speaking to avoid feedback loop
    stopContinuous();

    const utterance = new SpeechSynthesisUtterance(text);
    // Use high quality voices if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Natural"));
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        // Resume listening after AI finishes
        setTimeout(startContinuous, 500);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [isVoiceEnabled, startContinuous, stopContinuous]);

  const toggleVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      startContinuous();
    }
    setIsVoiceEnabled(prev => !prev);
  }

  useEffect(() => {
    return () => {
      stopContinuous();
    };
  }, [stopContinuous]);

  return { 
    isListening, 
    isSpeaking, 
    isVoiceEnabled, 
    currentTranscript, 
    toggleVoice, 
    speak, 
    startContinuous, 
    stopContinuous 
  };
};
