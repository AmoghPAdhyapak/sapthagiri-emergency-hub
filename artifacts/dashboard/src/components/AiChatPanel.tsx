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
import { MessageSquare, X, Plus, Send, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AiChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTION_PILLS = [
  { emoji: "✨", label: "Scan Emergency Queue", text: "Scan the current emergency queue and summarize all active RED alert patients." },
  { emoji: "🔍", label: "Search Patient", text: "Help me search for a patient by name or ID in the system." },
  { emoji: "📝", label: "Summarize Notes", text: "Summarize the latest medical notes and doctor observations." },
  { emoji: "💼", label: "Help Staff", text: "What can you help hospital staff with in this system?" },
];

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
        if (activeConversationId === id) handleNewChat();
      }
    });
  };

  const handleClearAll = () => {
    if (!conversations?.length) return;
    conversations.forEach((conv) => {
      deleteConversation.mutate({ id: conv.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGeminiConversationsQueryKey() });
        }
      });
    });
    handleNewChat();
  };

  const handleSend = async (text?: string) => {
    const messageToSend = text ?? inputValue;
    if (!messageToSend.trim() || isStreaming) return;

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
      } catch {
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

      if (!response.ok) throw new Error("Failed to send message");

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
          }
        }
      }
    } catch {
      // silent
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  const inChat = activeConversationId !== null || localMessages.length > 0;

  return (
    <div
      className="fixed inset-y-0 right-0 w-[380px] flex flex-col z-50 shadow-2xl"
      style={{ background: "#0d1117", borderLeft: "1px solid #21262d" }}
      data-testid="ai-chat-panel"
    >
      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-3.5 flex items-center justify-between" style={{ background: "#161b22", borderBottom: "1px solid #21262d" }}>
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2 tracking-wide">
            AI Clinical Assistant
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isStreaming ? "Generating response…" : "Connected to Hospital Queue"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-200 hover:bg-slate-800"
            onClick={handleNewChat}
            data-testid="button-new-chat"
            title="New conversation"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-500 hover:text-slate-200 hover:bg-slate-800"
            onClick={onClose}
            data-testid="button-close-chat"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Conversation list (home screen) */}
        {!inChat && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Welcome block */}
            <div className="px-5 py-6">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-400">
                  <path d="M12 2a8 8 0 0 1 8 8c0 5-8 13-8 13S4 15 4 10a8 8 0 0 1 8-8z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-100">How can I help you today?</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Ask about patients, triage queues, medical notes, or clinical decisions.</p>
            </div>

            {/* Recent chats */}
            <div className="px-4 pb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Recent Consults</p>
              {conversations && conversations.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-[10px] text-slate-700 hover:text-red-400 transition-colors font-medium"
                  title="Delete all chat history"
                >
                  Clear all
                </button>
              )}
            </div>
            <ScrollArea className="flex-1 px-2">
              {isLoadingConversations ? (
                <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-slate-600" /></div>
              ) : conversations?.length === 0 ? (
                <p className="text-[11px] text-slate-600 text-center py-6">No recent consults</p>
              ) : (
                <div className="space-y-0.5 pb-4">
                  {conversations?.map((conv) => (
                    <div
                      key={conv.id}
                      className="group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-slate-800/60"
                      onClick={() => setActiveConversationId(conv.id)}
                      data-testid={`item-conversation-${conv.id}`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span className="text-xs text-slate-300 truncate">{conv.title}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 hover:bg-transparent transition-opacity shrink-0"
                        onClick={(e) => handleDelete(conv.id, e)}
                        data-testid={`button-delete-conversation-${conv.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Active chat messages */}
        {inChat && (
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-5 space-y-4 text-xs leading-relaxed"
          >
            {isLoadingMessages && activeConversationId && !localMessages.length ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
              </div>
            ) : (
              <>
                {localMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-slate-800 text-slate-100 rounded-br-sm border border-slate-700/50"
                        : "bg-slate-950/60 text-slate-200 rounded-bl-sm border border-slate-800"
                    )}>
                      {msg.role === "model" && (
                        <span className="text-[10px] text-teal-400 font-semibold block mb-1.5 tracking-wider uppercase">Gemini Clinical Sync</span>
                      )}
                      <p className="text-slate-300 font-normal whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isStreaming && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <span className="text-[10px] text-teal-400 font-semibold block mb-1.5 tracking-wider uppercase">Gemini Clinical Sync</span>
                      {streamingContent || (
                        <span className="text-slate-600">Thinking<span className="animate-pulse">…</span></span>
                      )}
                      {streamingContent && (
                        <span className="inline-block w-1 h-3 ml-0.5 bg-teal-400 animate-pulse align-middle rounded-sm" />
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Suggestion Pills ── */}
      <div
        className="shrink-0 px-4 pt-2 pb-1 flex gap-1.5 overflow-x-auto scrollbar-none"
        style={{ borderTop: inChat ? "1px solid #21262d" : "none" }}
      >
        {SUGGESTION_PILLS.map((pill) => (
          <button
            key={pill.label}
            onClick={() => handleSend(pill.text)}
            disabled={isStreaming}
            className="whitespace-nowrap px-2.5 py-1 text-[10px] text-slate-400 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pill.emoji} {pill.label}
          </button>
        ))}
      </div>

      {/* ── Input Tray ── */}
      <div className="shrink-0 px-4 pt-2 pb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center rounded-xl border border-slate-800 focus-within:border-teal-500/50 transition-colors pl-3.5 pr-2 py-1.5"
          style={{ background: "#0a0d12" }}
        >
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about patients, queue, triage, or medical notes..."
            className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none py-1"
            disabled={isStreaming}
            data-testid="input-chat-message"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isStreaming}
            className="ml-2 p-1.5 rounded-lg text-teal-400 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="button-send-message"
          >
            {isStreaming
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
        <p className="text-[9px] text-slate-700 text-center mt-1.5 tracking-wide uppercase">Not a medical diagnosis tool</p>
      </div>
    </div>
  );
}
