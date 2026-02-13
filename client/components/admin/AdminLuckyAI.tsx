import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Send, Bot, Sparkles, Settings } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AdminLuckyAIProps {
  token: string;
}

export function AdminLuckyAI({ token }: AdminLuckyAIProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm LuckyAI, your casino management assistant. I can help you with player analytics, game management, financial reports, and more. What would you like to do today?",
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/luckyai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "I couldn't process that request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send message");
      // Remove the user message if it failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Show player statistics",
    "Generate revenue report",
    "List active games",
    "Check pending withdrawals",
    "User engagement analytics",
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-500" />
                LuckyAI - Casino Manager
              </CardTitle>
              <CardDescription>
                Your intelligent casino management assistant
              </CardDescription>
            </CardHeader>

            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-2 rounded-lg ${
                          message.role === "user"
                            ? "bg-purple-500 text-white rounded-br-none"
                            : "bg-secondary text-foreground rounded-bl-none"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.role === "user"
                              ? "text-purple-100"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-secondary text-foreground rounded-lg px-4 py-2 rounded-bl-none">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t pt-4 mt-4">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    placeholder="Ask LuckyAI anything..."
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Quick Actions & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="w-full justify-start text-sm h-auto py-2"
                  onClick={() => {
                    setInputValue(action);
                    setTimeout(() => {
                      const event = new KeyboardEvent("keydown", {
                        key: "Enter",
                      });
                      document
                        .querySelector("input")
                        ?.dispatchEvent(event);
                    }, 100);
                  }}
                >
                  {action}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" />
                AI Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Badge className="mb-2">Analytics</Badge>
                <p className="text-sm text-muted-foreground">
                  Player stats, engagement, revenue reports
                </p>
              </div>
              <div>
                <Badge className="mb-2" variant="outline">
                  Management
                </Badge>
                <p className="text-sm text-muted-foreground">
                  User management, game operations
                </p>
              </div>
              <div>
                <Badge className="mb-2" variant="secondary">
                  Financial
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Withdrawals, deposits, transactions
                </p>
              </div>
              <div>
                <Badge className="mb-2">Intelligence</Badge>
                <p className="text-sm text-muted-foreground">
                  Recommendations and insights
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example Queries</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>"How many active players today?"</p>
              <p>"What's our total revenue this month?"</p>
              <p>"List top 5 most played games"</p>
              <p>"Who are our top players?"</p>
              <p>"Pending withdrawals count?"</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
