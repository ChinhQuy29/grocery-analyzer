"use client"

import { useState, useRef, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InfoIcon, AlertTriangle, ShoppingCart, X, UserIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Message {
  role: "user" | "model" | "system"
  content: string
}

// List of terms to check against for inappropriate requests
const RESTRICTED_TERMS = [
  "ignore",
  "previous instructions",
  "bypass",
  "restrictions",
  "jailbreak",
  "DAN",
  "do anything now",
  "disregard",
  "rules",
  "illegal"
]

export default function HealthChat() {
  const [message, setMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<Message[]>([
    {
      role: "system",
      content: "Welcome to the Health Advisor. I can provide general wellness information, but I cannot diagnose medical conditions or provide medical advice. Always consult healthcare professionals for medical concerns."
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [usePurchaseContext, setUsePurchaseContext] = useState(false)
  const [useMeasurementsContext, setUseMeasurementsContext] = useState(false)
  const [showDisclaimerAlert, setShowDisclaimerAlert] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hideDisclaimer') !== 'true'
    }
    return true
  })
  const [showPurchaseToggle, setShowPurchaseToggle] = useState(true)
  const [showMeasurementsToggle, setShowMeasurementsToggle] = useState(true)
  const [showFooterDisclaimer, setShowFooterDisclaimer] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [chatHistory])

  // Function to check for restricted terms
  const containsRestrictedTerms = (text: string) => {
    const lowerText = text.toLowerCase()
    return RESTRICTED_TERMS.some(term => lowerText.includes(term.toLowerCase()))
  }

  const sendMessage = async () => {
    if (!message.trim()) return
    
    // Client-side safety check
    if (containsRestrictedTerms(message)) {
      setWarningMessage("Your message appears to contain terms that violate our usage policy. The Health Advisor is designed to provide general wellness information only.")
      setShowWarning(true)
      return
    }
    
    const userMessage = { role: "user", content: message } as Message
    setChatHistory([...chatHistory, userMessage])
    setMessage("")
    setIsLoading(true)
    setShowWarning(false)
    
    try {
      // Convert chat history to the format expected by the API
      // Only send relevant conversation history (exclude system messages)
      const apiChatHistory = chatHistory
        .filter(msg => msg.role !== "system")
        .map(msg => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }))
      
      const response = await fetch("/api/health/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          chatHistory: apiChatHistory,
          usePurchaseContext,
          useMeasurementsContext
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to send message")
      }
      
      const data = await response.json()
      setChatHistory(prev => [...prev, { role: "model", content: data.reply }])
    } catch (error) {
      console.error("Error sending message:", error)
      setChatHistory(prev => [
        ...prev,
        { 
          role: "model", 
          content: "I'm sorry, I encountered an error. Please try again." 
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Calculate height based on visible elements
  const calculateChatHeight = () => {
    let baseHeight = "calc(100vh - 12rem)"; // Base height with header
    
    let visibleAlerts = 0;
    if (showDisclaimerAlert) visibleAlerts++;
    if (showWarning) visibleAlerts++;
    if (showPurchaseToggle) visibleAlerts++;
    if (showMeasurementsToggle) visibleAlerts++;
    
    const alertHeight = visibleAlerts * 4; // Each alert is roughly 4rem in height
    
    // Adjust height based on footer disclaimer
    const footerHeight = showFooterDisclaimer ? 2 : 0;
    
    return `calc(100vh - ${12 + alertHeight + footerHeight}rem)`;
  };

  const handleCloseDisclaimer = () => {
    setShowDisclaimerAlert(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hideDisclaimer', 'true')
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden pt-6 px-4 pb-4">
      <PageHeader
        title="Health Advisor"
        description="Chat with our AI health advisor about your wellness concerns"
        className="mb-4"
      />
      
      <div className="space-y-2 mb-4">
        {showDisclaimerAlert && (
          <Alert className="bg-blue-50 border-blue-200 relative py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <InfoIcon className="h-4 w-4 text-blue-600 mr-2" />
                <AlertDescription className="text-blue-700 text-sm">
                  This AI Health Advisor provides general wellness information only. It cannot provide medical diagnoses or advice on serious health conditions.
                </AlertDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                onClick={handleCloseDisclaimer}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </Alert>
        )}
        
        {showWarning && (
          <Alert className="bg-amber-50 border-amber-200 relative py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
                <AlertDescription className="text-amber-700 text-sm">
                  {warningMessage}
                </AlertDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-amber-500 hover:text-amber-700 hover:bg-amber-100"
                onClick={() => setShowWarning(false)}
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </Alert>
        )}

        {showMeasurementsToggle && (
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <UserIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-purple-900">Use Measurements</h3>
                    <p className="text-xs text-purple-700">Enable personalized advice based on your measurements</p>
                  </div>
                </div>
                <Switch
                  id="use-measurements-context"
                  checked={useMeasurementsContext}
                  onCheckedChange={setUseMeasurementsContext}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {showPurchaseToggle && (
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <ShoppingCart className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-900">Use Purchase History</h3>
                    <p className="text-xs text-green-700">Enable personalized advice based on your purchase history</p>
                  </div>
                </div>
                <Switch
                  id="use-purchase-context"
                  checked={usePurchaseContext}
                  onCheckedChange={setUsePurchaseContext}
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Card className="flex-grow flex flex-col overflow-hidden border-0 shadow-sm">
        <CardHeader className="py-2 px-4 border-b">
          <CardTitle className="text-base">Health Chat</CardTitle>
        </CardHeader>
        
        <CardContent className="flex-grow overflow-hidden p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role !== "system" ? (
                    <div
                      className={`flex gap-3 max-w-[80%] ${
                        msg.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        {msg.role === "user" ? (
                          <AvatarFallback>U</AvatarFallback>
                        ) : (
                          <>
                            <AvatarImage src="/health-icon.png" alt="AI" />
                            <AvatarFallback>AI</AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-blue-50 text-blue-700 rounded-lg p-3 text-sm">
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-muted">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        
        <CardFooter className="border-t p-3">
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder="Type your health question here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !message.trim()}>
                Send
              </Button>
            </div>
            {showFooterDisclaimer && (
              <div className="text-xs text-gray-500 relative pr-5">
                By using this Health Advisor, you acknowledge that it provides general information only.
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 absolute top-0 right-0 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowFooterDisclaimer(false)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 