import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { MessageCircleQuestion, X, Send, Paperclip, Plus, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { chatApi, type ChatConversation, type ChatMessage } from '@/lib/chatApi';
import { useToast } from '@/hooks/use-toast';

export default function HelpChat() {
  const { t, i18n } = useTranslation('chat');
  const location = useLocation();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number>(5);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations on first open
  const initialize = useCallback(async () => {
    if (initialized) return;
    setInitialized(true);
    setLoadingConversations(true);

    const result = await chatApi.getConversations();
    if (result.success && result.data) {
      setConversations(result.data.conversations);
      // Auto-open most recent conversation or create new one
      if (result.data.conversations.length > 0) {
        await loadConversation(result.data.conversations[0].id);
      } else {
        await createNewConversation();
      }
    }
    setLoadingConversations(false);
  }, [initialized]);

  useEffect(() => {
    if (open) initialize();
  }, [open, initialize]);

  async function loadConversation(id: string) {
    setActiveConversation(id);
    setShowConversationList(false);
    const result = await chatApi.getMessages(id);
    if (result.success && result.data) {
      setMessages(result.data.messages);
      setRemainingToday(result.data.remaining_today);
      setDailyLimit(result.data.daily_limit);
    }
  }

  async function createNewConversation() {
    const result = await chatApi.createConversation();
    if (result.success && result.data) {
      setActiveConversation(result.data.id);
      setMessages([]);
      setShowConversationList(false);
      // Refresh conversations list
      const convResult = await chatApi.getConversations();
      if (convResult.success && convResult.data) {
        setConversations(convResult.data.conversations);
      }
    }
  }

  async function handleSend() {
    if (!input.trim() || !activeConversation || loading) return;
    if (remainingToday !== null && remainingToday <= 0) return;

    const userMessage = input.trim();
    setInput('');

    // Upload image first if attached
    let imageUrl: string | undefined;
    if (attachedImage) {
      setUploadingImage(true);
      const uploadResult = await chatApi.uploadImage(attachedImage);
      setUploadingImage(false);
      if (uploadResult.success && uploadResult.data) {
        imageUrl = uploadResult.data.url;
      } else {
        toast({ title: t('errorSending'), variant: 'destructive' });
        setInput(userMessage);
        return;
      }
    }

    // Optimistic: add user message
    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      image_url: imageUrl || (attachedImageUrl ? attachedImageUrl : undefined),
    };
    setMessages(prev => [...prev, userMsg]);
    setAttachedImage(null);
    setAttachedImageUrl(null);
    setLoading(true);

    const result = await chatApi.sendMessage({
      conversationId: activeConversation,
      content: userMessage,
      imageUrl,
      context: {
        current_page: location.pathname,
        language: i18n.language,
      },
    });

    setLoading(false);

    if (result.success && result.data) {
      setMessages(prev => [...prev, result.data!.message]);
      setRemainingToday(result.data.remaining_today);
      setDailyLimit(result.data.daily_limit);
      // Refresh conversation list to update titles
      const convResult = await chatApi.getConversations();
      if (convResult.success && convResult.data) {
        setConversations(convResult.data.conversations);
      }
    } else {
      // Remove optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      setInput(userMessage);
      if (result.error === 'Daily chat limit reached') {
        setRemainingToday(0);
      } else {
        toast({ title: t('errorSending'), variant: 'destructive' });
      }
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Max 5MB', variant: 'destructive' });
      return;
    }
    setAttachedImage(file);
    // Create preview URL
    const url = URL.createObjectURL(file);
    setAttachedImageUrl(url);
  }

  function removeAttachedImage() {
    if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
    setAttachedImage(null);
    setAttachedImageUrl(null);
  }

  const limitReached = remainingToday !== null && remainingToday <= 0;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          aria-label={t('title')}
        >
          <MessageCircleQuestion className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              {showConversationList ? (
                <h3 className="text-sm font-semibold text-foreground">{t('conversations')}</h3>
              ) : (
                <>
                  <button
                    onClick={() => setShowConversationList(true)}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {remainingToday !== null && !showConversationList && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  limitReached
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                )}>
                  {remainingToday}/{dailyLimit}
                </span>
              )}
              {!showConversationList && (
                <button
                  onClick={createNewConversation}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                  title={t('newChat')}
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation list */}
          {showConversationList ? (
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('noConversations')}</p>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        conv.id === activeConversation
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <p className="truncate font-medium">
                        {conv.title || t('newChat')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
              <div className="p-2 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={createNewConversation}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('newChat')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 && !loading && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                    {t('welcomeMessage')}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt={t('imageAttached')}
                          className="max-w-full max-h-40 rounded mb-2"
                        />
                      )}
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t('thinking')}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Limit reached banner */}
              {limitReached && (
                <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs text-center">
                  {t('limitReached')}
                </div>
              )}

              {/* Image preview */}
              {attachedImageUrl && (
                <div className="px-4 py-2 border-t border-border">
                  <div className="relative inline-block">
                    <img
                      src={attachedImageUrl}
                      alt="preview"
                      className="h-16 rounded border border-border"
                    />
                    <button
                      onClick={removeAttachedImage}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={limitReached || loading || uploadingImage}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    title={t('uploadImage')}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={limitReached ? t('limitReached') : t('placeholder')}
                    disabled={limitReached || loading}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleSend}
                    disabled={!input.trim() || limitReached || loading}
                    className="h-8 w-8"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
