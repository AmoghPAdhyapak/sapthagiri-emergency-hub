import { useState, useEffect, useRef, type MouseEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListGeminiConversations, 
  useCreateGeminiConversation, 
  useGetGeminiConversation,
  useDeleteGeminiConversation,
  getListGeminiConversationsQueryKey,
  getGetGeminiConversationQueryKey
} from "@workspace/api-client-react";
import { MessageSquare, X, Plus, Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AiChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiChatPanel({ isOpen, onClose }: AiChatPanelProps) {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [localMessages, setLocalMessages] = useState<Array<{role: string, content: string}>>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: isLoadingConversations } = useListGeminiConversations();
  const createConversation = useCreateGeminiConversation();
  const deleteConversation = useDeleteGeminiConversation();

  const { data: activeConversation, isLoading: isLoadingMessages } = useGetGeminiConversation(
    activeConversationId as number,
    { query: { enabled: !!activeConversationId, queryKey: getGetGeminiConversationQueryKey(activeConversationId as number) } }
  );

  useEffect(() => {
    if (activeConversation) {
      setLocalMessages(activeConversation.messages.map(m => ({ role: m.role, content: m.content })));
    } else {
      setLocalMessages([]);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, streamingContent]);

  const handleNewChat = () => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setStreamingContent("");
  };

  const handleDelete = (id: number, e: MouseEvent) => {
    e.stopPropagation();
    deleteConversation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
        if (activeConversationId === id) {
          handleNewChat();
        }
      }
    });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const messageToSend = inputValue;
    setInputValue("");
    setLocalMessages(prev => [...prev, { role: "user", content: messageToSend }]);
    setIsStreaming(true);
    setStreamingContent("");

    let currentConversationId = activeConversationId;

    if (!currentConversationId) {
      try {
        const title = messageToSend.slice(0, 40) + (messageToSend.length > 40 ? "..." : "");
        const newConv = await createConversation.mutateAsync({ data: { title } });
        currentConversationId = newConv.id;
        setActiveConversationId(newConv.id);
        queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
      } catch (err) {
        setIsStreaming(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/gemini/conversations/${currentConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageToSend }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = JSON.parse(line.slice(6));
            if (json.content) setStreamingContent(prev => prev + json.content);
            if (json.done) {
              queryClient.invalidateQueries({ queryKey: getGetGeminiConversationQueryKey(currentConversationId as number) });
            }
            if (json.error) {
              console.error("Stream error:", json.error);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-y-0 right-0 w-[380px] bg-[#0f1219] border-l border-border shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out"
      data-testid="ai-chat-panel"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-[#161b22] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-md">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary">AI Health Assistant</h3>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", isStreaming ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
              <span className="text-[10px] uppercase font-mono text-muted-foreground">
                {isStreaming ? "Live Output" : "Standby"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleNewChat} data-testid="button-new-chat">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose} data-testid="button-close-chat">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversation List */}
        {!activeConversationId && !localMessages.length && (
          <div className="w-full h-full flex flex-col bg-background/50">
            <div className="p-3 border-b border-border/50">
              <span className="text-xs font-mono text-muted-foreground uppercase">Recent Consults</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {isLoadingConversations ? (
                  <div className="p-4 text-center text-muted-foreground text-sm flex justify-center"><Loader2 className="w-4 h-4 animate-spin" /></div>
                ) : conversations?.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-xs font-mono">No recent consults</div>
                ) : (
                  conversations?.map((conv) => (
                    <div 
                      key={conv.id} 
                      className="group flex items-center justify-between p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setActiveConversationId(conv.id)}
                      data-testid={`item-conversation-${conv.id}`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate text-foreground/90">{conv.title}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity shrink-0"
                        onClick={(e) => handleDelete(conv.id, e)}
                        data-testid={`button-delete-conversation-${conv.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Chat Area */}
        {(activeConversationId || localMessages.length > 0) && (
          <div className="w-full flex flex-col h-full bg-[#0a0c10]">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {isLoadingMessages && activeConversationId && !localMessages.length ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="text-center pb-4">
                    <span className="text-[10px] uppercase font-mono text-muted-foreground border border-border/50 rounded px-2 py-1 bg-muted/20">
                      End-to-end Encrypted Session
                    </span>
                  </div>
                  {localMessages.map((msg, i) => (
                    <div key={i} className={cn("flex flex-col max-w-[85%]", msg.role === "user" ? "ml-auto" : "mr-auto")}>
                      <div className={cn(
                        "p-3 rounded-lg text-sm",
                        msg.role === "user" 
                          ? "bg-slate-800 text-slate-100 rounded-tr-sm" 
                          : "bg-primary/20 text-primary-foreground border border-primary/20 rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                      <span className={cn("text-[10px] text-muted-foreground font-mono mt-1", msg.role === "user" ? "text-right" : "text-left")}>
                        {msg.role === "user" ? "Staff" : "System AI"}
                      </span>
                    </div>
                  ))}
                  {isStreaming && (
                    <div className="flex flex-col max-w-[85%] mr-auto">
                      <div className="p-3 rounded-lg text-sm bg-primary/20 text-primary-foreground border border-primary/20 rounded-tl-sm">
                        {streamingContent}
                        <span className="inline-block w-1.5 h-3 ml-1 bg-primary animate-pulse align-middle" />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono mt-1 text-left">
                        System AI
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#161b22] border-t border-border/50 shrink-0">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex items-end gap-2"
              >
                <div className="relative flex-1">
                  <Input 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Query triage protocols or symptoms..."
                    className="pr-10 bg-[#0a0c10] border-border text-sm focus-visible:ring-primary/50"
                    disabled={isStreaming}
                    data-testid="input-chat-message"
                  />
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!inputValue.trim() || isStreaming}
                  className="shrink-0 h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="mt-2 text-center">
                <span className="text-[10px] uppercase font-mono text-muted-foreground/60">
                  Not a medical diagnosis tool
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
