import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Share2,
  ArrowRightLeft,
  Users,
  BarChart2,
  FileCheck,
  Sun,
  Plus,
  ArrowUp,
  Globe,
  Type,
  ChevronRight,
  Upload,
} from 'lucide-react';
import { DashboardOverview as DashboardData, Investigation } from '../types';

interface DashboardOverviewProps {
  data: DashboardData | null;
  currentInvestigation: Investigation | null;
  onNavigate: (tab: any) => void;
  onNewInvestigation: () => void;
  onAskQuery: (query: string) => void;
  onUploadFiles?: (files: FileList) => Promise<void>;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  currentInvestigation,
  onNavigate,
  onNewInvestigation,
  onAskQuery,
  onUploadFiles,
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showScreenshotSubmenu, setShowScreenshotSubmenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const [acceptFilter, setAcceptFilter] = useState<string>('*');

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
        setShowScreenshotSubmenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachMenu]);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    onAskQuery(promptInput.trim());
    setPromptInput('');
  };

  const handleTriggerUpload = (filter: string = '*') => {
    setAcceptFilter(filter);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 50);
  };

  const handleCaptureScreenshot = async () => {
    setShowAttachMenu(false);
    setShowScreenshotSubmenu(false);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 1920;
        canvas.height = video.videoHeight || 1080;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        stream.getTracks().forEach((track) => track.stop());

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
            const dt = new DataTransfer();
            dt.items.add(file);
            if (onUploadFiles) {
              onUploadFiles(dt.files);
            }
          }
        }, 'image/png');
      } else {
        handleTriggerUpload('.png,.jpg,.jpeg');
      }
    } catch (err) {
      console.warn('Screenshot capture fallback or cancelled:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onUploadFiles) {
        onUploadFiles(e.target.files);
      } else {
        onNavigate('repository');
      }
    }
  };

  const cards = [
    {
      id: 'upload',
      title: 'Upload Evidence',
      description: 'PDF, images, tables, datasets and more',
      icon: Upload,
    },
    {
      id: 'analyse',
      title: 'Analyse Evidence',
      description: 'Extract and understand key information',
      icon: Search,
    },
    {
      id: 'graph',
      title: 'Build Knowledge Graph',
      description: 'Connect evidence, people, events and claims',
      icon: Share2,
    },
    {
      id: 'conflicts',
      title: 'Detect Conflicts',
      description: 'Find contradictory or mismatching claims',
      icon: ArrowRightLeft,
    },
    {
      id: 'reliability',
      title: 'Reliability Scoring',
      description: 'Evaluate source trustworthiness',
      icon: ShieldCheck,
    },
    {
      id: 'entities',
      title: 'Entity Resolution',
      description: 'Identify and merge same entities',
      icon: Users,
    },
    {
      id: 'reasoning',
      title: 'Evidence Reasoning',
      description: 'Get AI-based, evidence-grounded answers',
      icon: FileCheck,
    },
    {
      id: 'report',
      title: 'Generate Report',
      description: 'Create a complete investigation report',
      icon: BarChart2,
    },
  ];

  return (
    <div
      style={{ backgroundColor: '#0d0d12' }}
      className="min-h-screen flex flex-col justify-between p-6 md:p-8 max-w-6xl mx-auto text-white bg-[#0d0d12]"
    >
      {/* Hidden file input for quick attachments */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptFilter}
        multiple
        className="hidden"
      />
      {/* Hidden camera input for taking photos */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Top Header: Theme toggle & Avatar */}
      <div className="flex items-center justify-end space-x-3.5 w-full">
        <button
          title="Theme toggle"
          className="p-1.5 rounded-full hover:bg-[#1a1a24] text-slate-400 hover:text-white transition-colors"
        >
          <Sun className="w-4 h-4 stroke-[1.5]" />
        </button>
        <div
          style={{ backgroundColor: '#22222d', borderColor: '#2b2b38' }}
          className="w-7 h-7 rounded-full bg-[#22222d] text-slate-200 text-xs font-semibold flex items-center justify-center border border-[#2b2b38]"
        >
          R
        </div>
      </div>

      {/* Center Section: Logo, Title, Tagline Pill & 8 Cards */}
      <div className="flex-1 flex flex-col items-center justify-center my-6 space-y-6">
        {/* Brand Shield & Titles */}
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Outlined Shield with Checkmark */}
          <div className="w-16 h-16 flex items-center justify-center text-white mb-1">
            <ShieldCheck className="w-16 h-16 stroke-[1.25] text-white" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            CERBERUS-X
          </h1>

          <p className="text-sm text-slate-400 font-sans tracking-wide mt-1">
            Where Evidence Meets Intelligence.
          </p>
        </div>

        {/* Eight Simple Feature Cards in 2 Rows of 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-w-5xl w-full pt-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                style={{ backgroundColor: '#17171e', borderColor: '#23232f' }}
                className="bg-[#17171e] border border-[#23232f] p-5 rounded-2xl flex flex-col items-center text-center cursor-default select-none transition-all shadow-sm min-h-[125px] justify-center"
              >
                <div className="w-8 h-8 flex items-center justify-center text-white mb-2">
                  <Icon className="w-5 h-5 stroke-[1.5] text-white" />
                </div>
                <h3 className="text-xs font-bold text-white tracking-tight">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2 max-w-[190px]">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom: ChatGPT-style AI Input Box with Floating Action Menu */}
      <div className="w-full max-w-4xl mx-auto pt-4 relative">
        <form
          onSubmit={handlePromptSubmit}
          style={{ backgroundColor: '#171720', borderColor: '#262633' }}
          className="rounded-3xl border border-[#262633] p-4 flex flex-col space-y-3.5 shadow-2xl focus-within:border-slate-500 transition-colors relative"
        >
          {/* Top text input with sleek ChatGPT-style typography */}
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            placeholder="Message CERBERUS-X or ask about evidence, claims..."
            className="bg-transparent text-sm text-white placeholder-slate-400 w-full focus:outline-none px-1"
          />

          {/* Bottom actions & send button */}
          <div className="flex items-center justify-between pt-1 relative">
            {/* Attachment triggers: [+] [🌐] [Aa] */}
            <div className="relative flex items-center space-x-2" ref={attachMenuRef}>
              {/* + Action Button */}
              <button
                type="button"
                onClick={() => setShowAttachMenu((prev) => !prev)}
                title="Add attachment"
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  showAttachMenu
                    ? 'bg-[#3b3b48] text-white shadow-sm'
                    : 'bg-[#2a2a35] hover:bg-[#343442] text-slate-200 hover:text-white'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>

              {/* Globe Icon */}
              <button
                type="button"
                title="Search web or intelligence sources"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252530] transition-colors"
              >
                <Globe className="w-4 h-4 stroke-[1.75]" />
              </button>

              {/* Font / Reasoning Icon */}
              <button
                type="button"
                title="Reasoning model / prompt formatting"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#252530] transition-colors"
              >
                <Type className="w-4 h-4 stroke-[1.75]" />
              </button>

              {/* Floating dark popup menu matching ChatGPT desktop */}
              {showAttachMenu && (
                <div
                  style={{ backgroundColor: '#1e1e26', borderColor: '#2e2e3b' }}
                  className="absolute bottom-full mb-3 left-0 w-52 bg-[#1e1e26] border border-[#2e2e3b] rounded-2xl p-1.5 shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  {/* Upload file */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      handleTriggerUpload('.pdf,.docx,.txt,.xlsx,.csv,.json');
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-normal text-slate-100 hover:bg-[#2b2b37] hover:text-white transition-colors"
                  >
                    Upload file
                  </button>

                  {/* Upload photo */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      handleTriggerUpload('.jpg,.jpeg,.png,.webp');
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-normal text-slate-100 hover:bg-[#2b2b37] hover:text-white transition-colors"
                  >
                    Upload photo
                  </button>

                  {/* Take screenshot with submenu */}
                  <div
                    className="relative"
                    onMouseEnter={() => setShowScreenshotSubmenu(true)}
                    onMouseLeave={() => setShowScreenshotSubmenu(false)}
                  >
                    <button
                      type="button"
                      onClick={() => handleCaptureScreenshot()}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-normal text-slate-100 hover:bg-[#2b2b37] hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>Take screenshot</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    {showScreenshotSubmenu && (
                      <div
                        style={{ backgroundColor: '#1e1e26', borderColor: '#2e2e3b' }}
                        className="absolute left-full top-0 ml-1.5 w-48 bg-[#1e1e26] border border-[#2e2e3b] rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in duration-100"
                      >
                        <button
                          type="button"
                          onClick={() => handleCaptureScreenshot()}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#2b2b37] hover:text-white transition-colors"
                        >
                          Capture screen
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAttachMenu(false);
                            setShowScreenshotSubmenu(false);
                            handleTriggerUpload('.png,.jpg,.jpeg');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-[#2b2b37] hover:text-white transition-colors"
                        >
                          Upload screenshot file
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Take photo */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachMenu(false);
                      cameraInputRef.current?.click();
                    }}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-normal text-slate-100 hover:bg-[#2b2b37] hover:text-white transition-colors"
                  >
                    Take photo
                  </button>
                </div>
              )}
            </div>

            {/* Send Button (White circle with up arrow) */}
            <button
              type="submit"
              disabled={!promptInput.trim()}
              className="w-7 h-7 rounded-full bg-white hover:bg-slate-200 text-black flex items-center justify-center transition-colors disabled:opacity-30 shrink-0 shadow"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
