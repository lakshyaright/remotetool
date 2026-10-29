import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Clipboard,
  X,
  Check,
  Copy,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { ChatMessage } from '../types/remote';
import { soundManager } from '../utils/audio';

interface SessionChatProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  remoteClipboard: string;
  onUpdateRemoteClipboard: (text: string) => void;
}

export const SessionChat: React.FC<SessionChatProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  remoteClipboard,
  onUpdateRemoteClipboard,
}) => {
  const [inputText, setInputText] = useState('');
  const [localClipboardText, setLocalClipboardText] = useState('');
  const [copiedRemote, setCopiedRemote] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'clipboard'>('chat');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
    soundManager.playNotification();
  };

  const handlePushClipboard = () => {
    if (!localClipboardText.trim()) return;
    onUpdateRemoteClipboard(localClipboardText.trim());
    soundManager.playConnectChime();
    setLocalClipboardText('');
  };

  const handleCopyRemoteClipboard = () => {
    navigator.clipboard.writeText(remoteClipboard);
    setCopiedRemote(true);
    soundManager.playClickSound();
    setTimeout(() => setCopiedRemote(false), 2000);
  };

  return (
    <div className="fixed bottom-14 right-4 z-40 w-96 max-w-[calc(100vw-32px)] h-[520px] rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Technician Support Bridge</h3>
            <p className="text-[10px] text-slate-400">Encrypted in-session chat & clipboard</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-2 border-b border-slate-800 flex gap-4 text-xs font-semibold bg-slate-950/60">
        <button
          onClick={() => setActiveTab('chat')}
          className={`pb-2 border-b-2 transition ${
            activeTab === 'chat' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Direct Messages
        </button>
        <button
          onClick={() => setActiveTab('clipboard')}
          className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'clipboard' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clipboard className="w-3.5 h-3.5" />
          Clipboard Sync
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg) => {
              const isTech = msg.sender === 'technician';
              const isSys = msg.sender === 'system';

              if (isSys) {
                return (
                  <div key={msg.id} className="text-center my-1">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[10px] text-slate-400 font-mono inline-block">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isTech ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-500 mb-0.5 px-1 font-mono">
                    {msg.senderName} • {msg.timestamp}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      isTech
                        ? 'bg-cyan-600 text-white rounded-br-xs'
                        : 'bg-slate-800 text-slate-200 rounded-bl-xs border border-slate-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Quick preset message shortcuts */}
          <div className="px-3 py-1 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => onSendMessage("I'm running a diagnostic check on your machine now.")}
              className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white whitespace-nowrap"
            >
              Diagnostic check
            </button>
            <button
              onClick={() => onSendMessage("Please accept the administrator prompt if one appears on your screen.")}
              className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white whitespace-nowrap"
            >
              Elevation prompt
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Send message to remote host..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        /* Clipboard Synchronization Tab */
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Remote Host Current Clipboard */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Remote Machine Clipboard
              </label>
              <button
                onClick={handleCopyRemoteClipboard}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                {copiedRemote ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedRemote ? 'Copied!' : 'Copy to My System'}
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 break-all max-h-28 overflow-y-auto">
              {remoteClipboard || <span className="text-slate-600 italic">No text copied on remote host yet.</span>}
            </div>
          </div>

          {/* Push Local Text to Remote Clipboard */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300">
              Send Text to Remote Clipboard
            </label>
            <textarea
              rows={3}
              value={localClipboardText}
              onChange={(e) => setLocalClipboardText(e.target.value)}
              placeholder="Paste password, command, script, or URL to push directly to remote machine's clipboard..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
            />
            <button
              onClick={handlePushClipboard}
              disabled={!localClipboardText.trim()}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              Push to Remote System Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
