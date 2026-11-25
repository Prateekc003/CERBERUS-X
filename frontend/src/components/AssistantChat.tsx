import React, { useState } from 'react';
import {
  Bot,
  Send,
  Cpu,
  Link2,
  Paperclip
} from 'lucide-react';
import { AssistantResponse, Investigation } from '../types';

interface AssistantChatProps {
  currentInvestigation: Investigation | null;
  onQuery: (query: string, mode?: string) => Promise<AssistantResponse>;
  loading: boolean;
  initialQuery?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'cerberus';
  text: string;
  responsePayload?: AssistantResponse;
  timestamp: string;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  currentInvestigation,
  onQuery,
  loading,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'cerberus',
      text: `CERBERUS-X Investigation Assistant online. Grounded strictly in active evidence files for Case [${
        currentInvestigation?.case_code || 'ACTIVE'
      }]. All citations are anchored in hash-verified records. Ask me to compare claims, detect quantity variance, evaluate reliability, or audit case consistency.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [reasoningMode, setReasoningMode] = useState<string>('auto');

  const promptSuggestions = [
    'What are the major contradictions in this case?',
    'Were all 1000 medical kits delivered according to the evidence?',
    'Which evidence sources have the lowest reliability?',
    'Why do the delivery receipt and the official report conflict?',
    'Is there sufficient evidence to establish physical receipt of all items?',
  ];

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    try {
      const resp = await onQuery(q, reasoningMode);
      const botMsg: ChatMessage = {
        id: `c-${Date.now()}`,
        sender: 'cerberus',
        text: resp.answer,
        responsePayload: resp,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'cerberus',
        text: `Investigative reasoning failed: ${err.message || 'Error processing inquiry'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  return (
    <div className="p-7 max-w-5xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col space-y-4 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-dark-borderSubtle gap-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <span>AI Investigation Assistant</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic and LLM evidentiary reasoning engine with zero citation fabrication.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Ollama (qwen3.5:4b) Offline</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Model Engine:</span>
            <select
              value={reasoningMode}
              onChange={(e) => setReasoningMode(e.target.value)}
              className="text-xs bg-dark-input border border-dark-cardBorder text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="auto">Qwen 3.5 (Offline Ollama LLM)</option>
              <option value="rule-based">Deterministic Rule-Based Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 shrink-0">
        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold shrink-0">
          Inquiry Templates:
        </span>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="text-xs bg-dark-card hover:bg-dark-cardHover hover:text-white text-slate-400 border border-dark-cardBorder rounded-lg px-3 py-1 whitespace-nowrap transition-colors shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 bg-dark-card border border-dark-cardBorder rounded-xl p-5 overflow-y-auto space-y-4 shadow-sm">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-3xl rounded-xl p-4 space-y-2 text-xs ${
                msg.sender === 'user'
                  ? 'bg-white text-black rounded-br-none shadow'
                  : 'bg-dark-sidebar border border-dark-borderSubtle text-slate-200 rounded-bl-none'
              }`}
            >
              {/* Header for Bot response */}
              {msg.sender === 'cerberus' && msg.responsePayload && (
                <div className="flex items-center justify-between pb-2 border-b border-dark-borderSubtle text-[10px] font-mono">
                  <span className="flex items-center space-x-1.5 font-bold text-blue-400">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>[MODE: {msg.responsePayload.reasoning_mode}]</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      msg.responsePayload.is_sufficient_evidence
                        ? 'bg-accent-greenBadgeBg text-accent-greenBadgeText border border-accent-greenBadgeBorder'
                        : 'bg-amber-950/60 text-amber-300 border border-amber-900/60'
                    }`}
                  >
                    {msg.responsePayload.is_sufficient_evidence
                      ? 'EVIDENCE SUFFICIENT'
                      : 'INSUFFICIENT SPECIFIC DATA'}
                  </span>
                </div>
              )}

              {/* Message text */}
              <div className="leading-relaxed whitespace-pre-wrap font-sans text-xs">
                {msg.text}
              </div>

              {/* Citations & Evidence Breakdown for Assistant Responses */}
              {msg.responsePayload && msg.responsePayload.citations && msg.responsePayload.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-dark-borderSubtle space-y-2 font-sans">
                  <div className="flex items-center space-x-1 text-[10px] font-mono uppercase font-bold text-slate-400">
                    <Link2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Evidence Citations ({msg.responsePayload.citations.length}):</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.responsePayload.citations.map((cite, i) => (
                      <div
                        key={i}
                        className="bg-dark-card border border-dark-cardBorder rounded-lg p-2.5 text-[11px] space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span className="font-bold text-white truncate max-w-[180px]">
                            {cite.filename}
                          </span>
                          <span className="text-slate-400">{cite.page_or_location || 'Page 1'}</span>
                        </div>
                        <p className="text-slate-300 line-clamp-2 italic">“{cite.claim_snippet}”</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className={`text-[10px] font-mono pt-1 text-right ${
                  msg.sender === 'user' ? 'text-slate-500' : 'text-slate-500'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-blue-300 font-mono bg-blue-950/40 border border-blue-900/40 p-3 rounded-xl max-w-sm animate-pulse">
            <Cpu className="w-4 h-4 animate-spin text-blue-400" />
            <span>Qwen 3.5 is reasoning offline over case evidence...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-dark-input border border-dark-cardBorder rounded-full px-4 py-2.5 flex items-center justify-between shadow-lg focus-within:border-slate-500 transition-colors"
      >
        <div className="flex items-center space-x-3 flex-1 mr-3">
          <Paperclip className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask anything about your investigation..."
            className="bg-transparent text-xs text-white placeholder-slate-500 w-full focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="w-7 h-7 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center transition-colors disabled:opacity-40 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
