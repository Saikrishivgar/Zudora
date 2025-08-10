import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Send, Volume2, MessageCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import collegesData from '@/data/colleges.json';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: CollegeSuggestion[];
}

interface CollegeSuggestion {
  college_name: string;
  branch_name: string;
  cutoff: number;
  address: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onNewChat: () => void;
  onDeleteHistory: () => void;
  chatHistory: { id: string; title: string; timestamp: Date }[];
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ isOpen, onNewChat, onDeleteHistory, chatHistory }) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">Z</span>
          </div>
          <span className="text-sm text-muted-foreground">Chat History</span>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search chats..." 
            className="pl-10 bg-muted border-muted text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="mb-4">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Today</span>
          </div>
          
          <Button
            onClick={onNewChat}
            variant="ghost"
            className="w-full justify-start mb-2 text-left h-auto p-3"
          >
            <MessageCircle className="h-4 w-4 mr-3 shrink-0" />
            <span className="text-sm">New Chat</span>
          </Button>

          {chatHistory.map((chat) => (
            <Button
              key={chat.id}
              variant="ghost"
              className="w-full justify-start mb-1 text-left h-auto p-3 hover:bg-accent"
            >
              <span className="text-sm truncate">{chat.title}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button className="w-full chat-gradient text-primary-foreground">
          <span className="text-sm">Upgrade to Zudora Pro</span>
        </Button>
        <Button 
          variant="ghost" 
          className="w-full mt-2 text-sm hover:bg-destructive/10 hover:text-destructive"
          onClick={onDeleteHistory}
        >
          Delete Chat History
        </Button>
      </div>
    </div>
  );
};

const CollegeSuggestionCard: React.FC<{ suggestion: CollegeSuggestion }> = ({ suggestion }) => (
  <Card className="mb-3 bg-accent/50 border-accent animate-slide-up">
    <CardContent className="p-4">
      <h4 className="font-semibold text-sm mb-2 text-primary">{suggestion.college_name}</h4>
      <p className="text-sm mb-2">{suggestion.branch_name}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Required Cutoff</span>
        <span className="font-bold text-primary">{suggestion.cutoff}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{suggestion.address}</p>
    </CardContent>
  </Card>
);

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm Zudora, your college suggestion assistant. I can help you find the best engineering colleges based on your cutoff marks and category. Please share your marks and category (OC, BC, BCM, MBC, SC, SCA, ST) to get personalized suggestions!",
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: '1', title: 'College suggestions for CSE', timestamp: new Date() },
    { id: '2', title: 'Cutoff marks query', timestamp: new Date() },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findCollegesByMarks = (marks: number, category: string): CollegeSuggestion[] => {
    const suggestions: CollegeSuggestion[] = [];
    
    collegesData.tnea_colleges.forEach(college => {
      college.branches.forEach(branch => {
        const cutoff = branch.cutoffs_2024[category as keyof typeof branch.cutoffs_2024];
        if (cutoff && typeof cutoff === 'number' && marks >= cutoff) {
          suggestions.push({
            college_name: college.college_name,
            branch_name: branch.branch_name,
            cutoff: cutoff,
            address: college.address
          });
        }
      });
    });

    return suggestions
      .sort((a, b) => b.cutoff - a.cutoff)
      .slice(0, 10); // Top 10 suggestions
  };

  const generateAIResponse = (userInput: string): { content: string; suggestions?: CollegeSuggestion[] } => {
    const input = userInput.toLowerCase();
    
    // Greetings
    if (input.includes('hi') || input.includes('hello') || input.includes('hey')) {
      return {
        content: "Hello! Great to meet you! I'm Zudora, your AI college counselor. I specialize in helping students find the perfect engineering colleges based on their TNEA cutoff marks and category. How can I assist you today?"
      };
    }

    if (input.includes('how are you') || input.includes('how do you do')) {
      return {
        content: "I'm doing wonderful, thank you for asking! I'm here and ready to help you navigate the college selection process. Whether you need college suggestions, cutoff information, or guidance about engineering branches, I'm here to help!"
      };
    }

    // Extract marks and category from input
    const marksMatch = input.match(/\b(\d{1,3}(?:\.\d+)?)\b/);
    const categoryMatch = input.match(/\b(oc|bc|bcm|mbc|sc|sca|st)\b/i);

    if (marksMatch && categoryMatch) {
      const marks = parseFloat(marksMatch[1]);
      const category = categoryMatch[1].toUpperCase();
      
      const suggestions = findCollegesByMarks(marks, category);
      
      if (suggestions.length > 0) {
        return {
          content: `Great! Based on your cutoff marks of ${marks} and ${category} category, I found ${suggestions.length} excellent college options for you. Here are the top colleges where you have a good chance of admission:`,
          suggestions
        };
      } else {
        return {
          content: `I understand you have ${marks} marks in ${category} category. Unfortunately, I couldn't find colleges that match these specific criteria in my current database. You might want to consider:
          
          1. Checking if there are any updates to cutoffs
          2. Looking at colleges with slightly lower requirements
          3. Exploring different engineering branches
          
          Would you like me to help you with a different marks range or category?`
        };
      }
    }

    // College-related queries without specific marks
    if (input.includes('college') || input.includes('engineering') || input.includes('cutoff')) {
      return {
        content: "I'd be happy to help you with college suggestions! To provide you with the most relevant recommendations, I'll need to know:\n\n1. Your cutoff marks (TNEA score)\n2. Your category (OC, BC, BCM, MBC, SC, SCA, or ST)\n\nFor example, you can say: 'I scored 185 marks in BC category' or 'My cutoff is 170 and I'm in MBC category.'"
      };
    }

    // Default response
    return {
      content: "I'm here to help you find the best engineering colleges based on your TNEA cutoff marks and category. You can ask me things like:\n\n• 'I scored 185 marks in BC category'\n• 'What colleges can I get with 175 cutoff in OC?'\n• 'Show me CSE colleges for MBC category'\n\nFeel free to share your marks and category, and I'll provide personalized college suggestions!"
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast({
        title: "Voice input error",
        description: "Could not capture voice input. Please try again.",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    // Save current conversation to history if it has user messages
    const userMessages = messages.filter(msg => msg.type === 'user');
    if (userMessages.length > 0) {
      const newChat = {
        id: Date.now().toString(),
        title: userMessages[0].content.slice(0, 30) + (userMessages[0].content.length > 30 ? '...' : ''),
        timestamp: new Date()
      };
      setChatHistory(prev => [newChat, ...prev]);
    }

    // Reset to initial state
    setMessages([
      {
        id: '1',
        type: 'ai',
        content: "Hello! I'm Zudora, your college suggestion assistant. I can help you find the best engineering colleges based on your cutoff marks and category. Please share your marks and category (OC, BC, BCM, MBC, SC, SCA, ST) to get personalized suggestions!",
        timestamp: new Date(),
      }
    ]);
    setInputValue('');
    
    toast({
      title: "New chat started",
      description: "Previous conversation saved to history",
    });
  };

  const handleDeleteHistory = () => {
    setChatHistory([]);
    toast({
      title: "Chat history cleared",
      description: "All previous conversations have been deleted",
      variant: "destructive",
    });
  };

  return (
    <div className="h-screen flex bg-background">
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onNewChat={handleNewChat}
        onDeleteHistory={handleDeleteHistory}
        chatHistory={chatHistory}
      />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center p-6 border-b border-border bg-card/50">
          <h1 className="text-4xl font-bold text-primary">Ask Zudora</h1>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="animate-fade-in">
                <div
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.type === 'ai' && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                        >
                          <Volume2 className="h-3 w-3 mr-1" />
                          Listen
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {message.suggestions && (
                  <div className="mt-4 space-y-2">
                    {message.suggestions.map((suggestion, index) => (
                      <CollegeSuggestionCard
                        key={index}
                        suggestion={suggestion}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-border bg-card/30">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything"
                className="pr-20 py-6 text-base bg-input border-input rounded-2xl"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleVoiceInput}
                  disabled={isLoading}
                  className={`h-8 w-8 p-0 ${isListening ? 'bg-destructive text-destructive-foreground' : ''}`}
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="h-8 w-8 p-0 chat-gradient"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;