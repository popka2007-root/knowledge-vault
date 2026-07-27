import React, { useState } from 'react';
import { Image as ImageIcon, Palette, Sparkles, Sliders, X } from 'lucide-react';
import { PageBanner as PageBannerType } from '../../types';

interface PageBannerProps {
  banner?: PageBannerType;
  onUpdateBanner: (banner: PageBannerType | undefined) => void;
}

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #1f6feb 0%, #a371f7 100%)',
  'linear-gradient(135deg, #2ea043 0%, #388bfd 100%)',
  'linear-gradient(135deg, #f0883e 0%, #f85149 100%)',
  'linear-gradient(135deg, #0d1117 0%, #161b22 100%)'
];

export const PageBanner: React.FC<PageBannerProps> = ({ banner, onUpdateBanner }) => {
  const [showConfig, setShowConfig] = useState(false);

  if (!banner) {
    return (
      <button 
        className="btn"
        onClick={() => onUpdateBanner({ type: 'gradient', color: PRESET_GRADIENTS[0], overlayOpacity: 0.2, blur: 0 })}
        style={{ fontSize: '11px', padding: '3px 8px', marginBottom: '12px', opacity: 0.7 }}
      >
        <ImageIcon size={12} />
        <span>Add Banner</span>
      </button>
    );
  }

  const getBackgroundStyle = () => {
    if (banner.type === 'gradient' || banner.type === 'color') {
      return { background: banner.color || PRESET_GRADIENTS[0] };
    }
    if (banner.type === 'image' || banner.type === 'gif') {
      return {
        backgroundImage: `url(${banner.url || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: banner.blur ? `blur(${banner.blur}px)` : 'none'
      };
    }
    return { background: PRESET_GRADIENTS[0] };
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: '24px' }}>
      {/* Main Banner Visual Container */}
      <div 
        style={{
          width: '100%',
          height: '160px',
          borderRadius: `${banner.borderRadius || 12}px`,
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          ...getBackgroundStyle()
        }}
      >
        {/* Dark Overlay Layer */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `rgba(0,0,0,${banner.overlayOpacity || 0.2})` }} />

        {/* Action Controls */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px', zIndex: 10 }}>
          <button className="btn-icon" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }} onClick={() => setShowConfig(!showConfig)} title="Configure Banner">
            <Sliders size={14} />
          </button>
          <button className="btn-icon" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }} onClick={() => onUpdateBanner(undefined)} title="Remove Banner">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Banner Configuration Panel */}
      {showConfig && (
        <div style={{ position: 'absolute', top: '170px', right: '0', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px', zIndex: 100, width: '280px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', fontSize: '12px' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>Banner Settings</div>

          <label style={{ display: 'block', margin: '6px 0 2px 0' }}>Image URL / GIF:</label>
          <input
            type="text"
            className="input"
            placeholder="Paste image URL..."
            value={banner.url || ''}
            onChange={(e) => onUpdateBanner({ ...banner, type: 'image', url: e.target.value })}
            style={{ fontSize: '11px', marginBottom: '8px' }}
          />

          <label style={{ display: 'block', margin: '6px 0 2px 0' }}>Presets:</label>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            {PRESET_GRADIENTS.map((g, idx) => (
              <div 
                key={idx} 
                onClick={() => onUpdateBanner({ ...banner, type: 'gradient', color: g })} 
                style={{ width: '24px', height: '24px', borderRadius: '4px', background: g, cursor: 'pointer', border: '1px solid #fff' }} 
              />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span>Blur:</span>
            <input type="range" min="0" max="10" value={banner.blur || 0} onChange={(e) => onUpdateBanner({ ...banner, blur: parseInt(e.target.value, 10) })} />
          </div>
        </div>
      )}
    </div>
  );
};
