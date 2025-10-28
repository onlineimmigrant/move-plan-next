'use client';

import { SignalIcon, XMarkIcon, MinusIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { usePanelManagement } from '../hooks/usePanelManagement';
import { useThemeColors } from '@/hooks/useThemeColors';

interface SettingsPanelProps {
  showSettings: boolean;
  isMobile: boolean;
  videoQuality: 'low' | 'medium' | 'high' | 'ultra' | 'maximum';
  backgroundMode: 'none' | 'blur' | 'color' | 'image';
  backgroundColor: string;
  backgroundImage: string | null;
  networkStats: {
    quality: string;
    downloadSpeed: number;
    uploadSpeed: number;
    latency: number;
    jitter: number;
    packetLoss: number;
    networkQualityLevel: number;
  };
  isPiP: boolean;
  changeVideoQuality: (quality: 'low' | 'medium' | 'high' | 'ultra' | 'maximum') => void;
  setBackgroundMode: (mode: 'none' | 'blur' | 'color' | 'image') => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (image: string | null) => void;
  togglePictureInPicture: () => void;
  panelManagement: ReturnType<typeof usePanelManagement>;
  onClose: () => void;
}

export default function SettingsPanel({
  showSettings,
  isMobile,
  videoQuality,
  backgroundMode,
  backgroundColor,
  backgroundImage,
  networkStats,
  isPiP,
  changeVideoQuality,
  setBackgroundMode,
  setBackgroundColor,
  setBackgroundImage,
  togglePictureInPicture,
  panelManagement,
  onClose
}: SettingsPanelProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const { panels, toggleMinimize, startDrag, bringToFront } = panelManagement;
  const panelState = panels['settings'];

  const isMinimized = panelState?.isMinimized || false;
  const isDragging = panelState?.isDragging || false;
  const position = panelState?.position || { x: 16, y: 80 };
  const zIndex = panelState?.zIndex || 50;

  if (!showSettings) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`absolute ${isMobile ? 'inset-0' : 'w-80 max-h-[80vh]'} bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col z-50 backdrop-blur-sm overflow-hidden transition-all duration-200 ${
        isMinimized ? 'h-12' : ''
      }`}
      style={{
        left: isMobile ? '0' : position.x,
        top: isMobile ? '0' : position.y,
        transform: isMobile ? 'none' : 'none',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'default',
        boxShadow: isDragging ? `0 20px 25px -5px ${primary.base}30, 0 10px 10px -5px ${primary.base}20` : undefined
      }}
      onMouseDown={() => bringToFront('settings')}
    >
      {/* Settings Header */}
      <div
        className={`flex items-center justify-between ${isMinimized ? 'px-3 py-2' : 'p-4'} border-b border-slate-700/50 bg-slate-800/50 rounded-t-xl cursor-grab active:cursor-grabbing`}
        onMouseDown={(e) => {
          e.preventDefault();
          startDrag('settings', e);
        }}
      >
        <div className="flex items-center gap-2">
          <SignalIcon 
            className="w-5 h-5" 
            style={{ color: primary.base }}
          />
          <h3 className="text-base font-semibold text-white">Settings</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleMinimize('settings')}
            className="p-1.5 hover:bg-slate-700/80 rounded-lg transition-colors duration-200"
            title={isMinimized ? 'Restore' : 'Minimize'}
          >
            <MinusIcon className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700/80 rounded-lg transition-colors duration-200"
            title="Close"
          >
            <XMarkIcon className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Settings Content - Only show when not minimized */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Video Quality</label>
          <select
            value={videoQuality}
            onChange={(e) => changeVideoQuality(e.target.value as 'low' | 'medium' | 'high' | 'ultra' | 'maximum')}
            className="w-full bg-slate-700/60 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:bg-slate-700/80 transition-all duration-200 border border-slate-600/50"
            style={{ '--ring-color': `${primary.base}80`, '--border-color': `${primary.base}80` } as React.CSSProperties}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${primary.base}80`;
              e.currentTarget.style.boxShadow = `0 0 0 2px ${primary.base}80`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgb(71 85 105 / 0.5)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="low">Low (240p)</option>
            <option value="medium">Medium (480p)</option>
            <option value="high">High (720p)</option>
            <option value="ultra">Ultra (1080p)</option>
            <option value="maximum">Maximum (Auto-detect)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-white mb-3">Background</label>
          <div className="space-y-4">
            {/* Debug info */}
            {backgroundMode !== 'none' && (
              <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-600/50">
                Active: {backgroundMode}
                {backgroundMode === 'color' && ` - ${backgroundColor}`}
              </div>
            )}

            {/* Background Mode Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setBackgroundMode('none')}
                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg ${
                  backgroundMode === 'none'
                    ? 'text-white'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80 hover:text-white'
                }`}
                style={backgroundMode === 'none' ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  boxShadow: `0 10px 15px -3px ${primary.base}33`
                } : {}}
              >
                None
              </button>
              <button
                onClick={() => setBackgroundMode('blur')}
                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg ${
                  backgroundMode === 'blur'
                    ? 'text-white'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80 hover:text-white'
                }`}
                style={backgroundMode === 'blur' ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  boxShadow: `0 10px 15px -3px ${primary.base}33`
                } : {}}
              >
                Blur
              </button>
              <button
                onClick={() => setBackgroundMode('color')}
                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg ${
                  backgroundMode === 'color'
                    ? 'text-white'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80 hover:text-white'
                }`}
                style={backgroundMode === 'color' ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  boxShadow: `0 10px 15px -3px ${primary.base}33`
                } : {}}
              >
                Color
              </button>
              <button
                onClick={() => setBackgroundMode('image')}
                className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg ${
                  backgroundMode === 'image'
                    ? 'text-white'
                    : 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80 hover:text-white'
                }`}
                style={backgroundMode === 'image' ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  boxShadow: `0 10px 15px -3px ${primary.base}33`
                } : {}}
              >
                Image
              </button>
            </div>

            {/* Color Picker */}
            {backgroundMode === 'color' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Choose Color</label>
                <div className="grid grid-cols-4 gap-3">
                  {['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'].map((color) => (
                    <button
                      key={color}
                      onClick={() => setBackgroundColor(color)}
                      className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 hover:scale-110 shadow-lg ${
                        backgroundColor === color
                          ? 'border-white shadow-white/30'
                          : 'border-slate-600 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full h-12 rounded-xl border border-slate-600 bg-slate-800/50 text-white cursor-pointer"
                />
              </div>
            )}

            {/* Image Upload */}
            {backgroundMode === 'image' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">Upload Background Image</label>
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center bg-slate-800/30 hover:bg-slate-700/30 transition-colors duration-200">
                  <div className="text-slate-400 mb-2">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">Drop an image here or click to browse</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="background-image-upload"
                  />
                  <label
                    htmlFor="background-image-upload"
                    className="inline-block px-4 py-2 text-white rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})` }}
                    onMouseEnter={(e) => e.currentTarget.style.background = `linear-gradient(135deg, ${primary.hover}, ${primary.active})`}
                    onMouseLeave={(e) => e.currentTarget.style.background = `linear-gradient(135deg, ${primary.base}, ${primary.hover})`}
                  >
                    Choose Image
                  </label>
                </div>
                {backgroundImage && (
                  <div className="text-xs text-slate-400 bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-600/50">
                    Image loaded successfully
                  </div>
                )}
              </div>
            )}            {/* Image Upload */}
            {backgroundMode === 'image' && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Upload Background Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {backgroundImage ? (
                    <div className="space-y-2">
                      <img
                        src={backgroundImage}
                        alt="Background preview"
                        className="max-w-full max-h-20 mx-auto rounded"
                      />
                      <button
                        onClick={() => setBackgroundImage(null)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              setBackgroundImage(e.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Recommended: 1920x1080 or higher for best quality
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Network Stats */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Network Quality</label>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/50 space-y-4">
            {/* Video Stream Stats */}
            <div>
              <h4 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: `${primary.base}99` }}
                ></div>
                Video Stream Bitrate
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <ArrowDownIcon 
                    className="w-4 h-4" 
                    style={{ color: `${primary.base}99` }}
                  />
                  <span className="text-white font-medium">
                    {networkStats.downloadSpeed > 0 ? `${networkStats.downloadSpeed} Mbps` : 'Measuring...'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpIcon 
                    className="w-4 h-4" 
                    style={{ color: `${primary.base}99` }}
                  />
                  <span className="text-white font-medium">
                    {networkStats.uploadSpeed > 0 ? `${networkStats.uploadSpeed} Mbps` : 'Measuring...'}
                  </span>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                * Compressed video quality - adapts to network conditions
              </div>
            </div>

            {/* Quality and Other Metrics */}
            <div className="border-t border-slate-600/50 pt-3">
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-slate-400">Latency:</span>
                  <span className="text-white ml-2 font-medium">{networkStats.latency}ms</span>
                </div>
                <div>
                  <span className="text-slate-400">Jitter:</span>
                  <span className="text-white ml-2 font-medium">{networkStats.jitter}ms</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Quality:</span>
                <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                  networkStats.quality === 'excellent' ? 'bg-green-500/20 text-green-400' :
                  networkStats.quality === 'good' ? '' :
                  networkStats.quality === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
                  networkStats.quality === 'poor' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-red-500/20 text-red-400'
                }`}
                style={networkStats.quality === 'good' ? {
                  backgroundColor: `${primary.base}33`,
                  color: `${primary.base}cc`
                } : {}}
                >
                  {networkStats.quality.charAt(0).toUpperCase() + networkStats.quality.slice(1)}
                </span>
              </div>
              {networkStats.packetLoss > 0 && (
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-slate-400">Packet Loss:</span>
                  <span className="text-orange-400 font-medium">{networkStats.packetLoss}%</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={togglePictureInPicture}
          className="w-full py-3 text-white rounded-xl text-sm font-medium shadow-lg transition-all duration-200 hover:scale-105"
          style={{ 
            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            boxShadow: `0 10px 15px -3px ${primary.base}33`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${primary.hover}, ${primary.active})`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${primary.base}, ${primary.hover})`;
          }}
        >
          {isPiP ? 'Exit' : 'Enable'} Picture-in-Picture
        </button>
      </div>
      )}
    </div>
  );
}