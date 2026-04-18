import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface TileMember { id: number; name: string; photo: string | null; }
interface TileItem { text: string; time: string | null; type: string; nav: string; member_name?: string | null; member_photo?: string | null; }
interface TileData { key: string; title: string; emoji: string; gradient: string; borderColor: string; items: TileItem[]; members: TileMember[]; count: number; nav: string; }

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function MemberNotificationTiles({ mode = 'full', onTileExpand }: { mode?: 'full' | 'sidebar'; onTileExpand?: (tile: TileData | null) => void }) {
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [expandedTile, setExpandedTile] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [marqueeHovered, setMarqueeHovered] = useState(false);
  const [seenCounts, setSeenCounts] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('memberNotifTileSeenCounts') || '{}'); } catch { return {}; }
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState<number | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/dashboard/v2/member-notifications')
      .then(res => setTiles(res.data.tiles || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && gridRef.current) setGridHeight(gridRef.current.offsetHeight);
  }, [loading, tiles, expandedTile]);

  const initials = (n: string) => n.split(' ').filter(w => w).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const MemberAvatar = ({ item, size = 'sm' }: { item: { member_name?: string | null; member_photo?: string | null }; size?: 'sm' | 'xs' }) => {
    if (!item.member_name) return null;
    const s = size === 'sm' ? 'w-6 h-6 text-[7px]' : 'w-5 h-5 text-[6px]';
    return (
      <div className={`${s} rounded-full overflow-hidden bg-purple-100 flex items-center justify-center font-bold text-purple-700 shrink-0 border border-purple-200`}>
        {item.member_photo ? <img src={`${API_BASE}${item.member_photo}`} alt="" className="w-full h-full object-cover" /> : initials(item.member_name)}
      </div>
    );
  };

  const timeAgo = (iso: string | null) => {
    if (!iso) return '';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const itemIcon = (type: string) => {
    const m: Record<string, string> = { upload:'📄', published:'📈', created:'📊', closed:'✅', upcoming:'📅', assigned:'📌', announcement:'📢', cim:'📋', mom:'📝', message:'💬', success_story:'🌟' };
    return m[type] || '🔔';
  };

  const allNotifications = tiles.flatMap(t => t.items.map(i => ({ ...i, tileEmoji: t.emoji, tileTitle: t.title, tileKey: t.key })));

  if (loading) return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" /></div>;
  if (!tiles.length) return null;

  /* ═══ SIDEBAR MODE ═══ */
  if (mode === 'sidebar') {
    const SUBTLE_COLORS = [
      { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca', accent: '#6366f1' },
      { bg: '#fef3c7', border: '#fde68a', text: '#92400e', accent: '#f59e0b' },
      { bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46', accent: '#10b981' },
      { bg: '#fce7f3', border: '#fbcfe8', text: '#9d174d', accent: '#ec4899' },
      { bg: '#f0f9ff', border: '#bae6fd', text: '#075985', accent: '#0ea5e9' },
      { bg: '#faf5ff', border: '#e9d5ff', text: '#6b21a8', accent: '#a855f7' },
      { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', accent: '#f97316' },
    ];
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-gray-700 flex items-center gap-1 sticky top-0 bg-[#eef1f8] z-10 py-1">📬 Notifications</p>
        {tiles.map((tile, tileIdx) => {
          const isActive = expandedTile === tileIdx;
          const c = SUBTLE_COLORS[tileIdx % SUBTLE_COLORS.length];
          return (
            <div key={tile.key}>
              <div
                className={`rounded-xl p-2.5 cursor-pointer border-2 transition-all duration-200 ${isActive ? 'ring-2 ring-indigo-300 scale-[1.02]' : ''}`}
                style={{ background: c.bg, borderColor: isActive ? c.accent : c.border }}
                onClick={() => {
                  const next = isActive ? null : tileIdx;
                  setExpandedTile(next);
                  onTileExpand?.(next !== null ? tile : null);
                  const updated = { ...seenCounts, [tile.key]: tile.count };
                  setSeenCounts(updated);
                  localStorage.setItem('memberNotifTileSeenCounts', JSON.stringify(updated));
                }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base">{tile.emoji}</span>
                    <div className="min-w-0">
                      <h3 className="text-[11px] font-bold truncate" style={{ color: c.text }}>{tile.title}</h3>
                      <p className="text-[9px] opacity-60" style={{ color: c.text }}>{tile.count} update{tile.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tile.count > 0 && tile.count > (seenCounts[tile.key] || 0) && (
                      <span className="text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center text-white animate-pulse" style={{ background: c.accent }}>
                        {tile.count > 9 ? '9+' : tile.count}
                      </span>
                    )}
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-transform duration-300 ${isActive ? 'rotate-45' : ''}`} style={{ background: c.border, color: c.text }}>+</div>
                  </div>
                </div>
                {tile.members.length > 0 && (
                  <div className="flex -space-x-1.5 mt-2">
                    {tile.members.slice(0, 4).map(m => (
                      <div key={m.id} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden flex items-center justify-center text-[7px] font-bold"
                        style={{ background: c.border, color: c.text }} title={m.name}>
                        {m.photo ? <img src={`${API_BASE}${m.photo}`} alt="" className="w-full h-full object-cover" /> : initials(m.name)}
                      </div>
                    ))}
                    {tile.members.length > 4 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold"
                        style={{ background: c.border, color: c.text }}>+{tile.members.length - 4}</div>
                    )}
                  </div>
                )}
              </div>
              {!onTileExpand && isActive && tile.items.length > 0 && (
                <div className="mt-1.5 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-ntExpand">
                  <div className="divide-y divide-gray-100 max-h-[200px] overflow-y-auto">
                    {tile.items.slice(0, 6).map((item, i) => (
                      <div key={i} className="px-3 py-2 hover:bg-indigo-50/60 transition-colors cursor-pointer flex items-start gap-2 animate-ntRow"
                        style={{ animationDelay: `${i * 30}ms` }}
                        onClick={(e) => { e.stopPropagation(); navigate(item.nav); }}>
                        {item.member_name ? <MemberAvatar item={item} size="xs" /> : <span className="text-xs mt-0.5">{itemIcon(item.type)}</span>}
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-gray-800 font-medium leading-tight" dangerouslySetInnerHTML={{ __html: item.text }} />
                          {item.time && <p className="text-[9px] text-gray-400 mt-0.5">{timeAgo(item.time)}</p>}
                        </div>
                        <span className="text-gray-300 text-[10px] mt-0.5">›</span>
                      </div>
                    ))}
                    {tile.items.length > 6 && (
                      <div className="px-3 py-1.5 text-center">
                        <span onClick={(e) => { e.stopPropagation(); navigate(tile.nav); }} className="text-[10px] text-indigo-600 font-semibold cursor-pointer hover:underline">View all {tile.count} →</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {!onTileExpand && isActive && tile.items.length === 0 && (
                <div className="mt-1.5 bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center text-gray-400 text-[10px] animate-ntExpand">No updates</div>
              )}
            </div>
          );
        })}
        <style>{`
          @keyframes ntExpand { from { opacity:0; max-height:0; transform:translateY(-8px); } to { opacity:1; max-height:400px; transform:translateY(0); } }
          .animate-ntExpand { animation: ntExpand 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
          @keyframes ntRow { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
          .animate-ntRow { animation: ntRow 0.25s ease-out both; }
        `}</style>
      </div>
    );
  }

  /* ═══ FULL MODE ═══ */
  const rows: TileData[][] = [];
  for (let i = 0; i < tiles.length; i += 3) rows.push(tiles.slice(i, i + 3));

  const renderDetail = (tile: TileData) => (
    <div className="animate-ntExpand">
      <div className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border ${tile.borderColor} overflow-hidden`}>
        <div className={`bg-gradient-to-r ${tile.gradient} px-4 py-2 flex items-center justify-between`}>
          <h3 className="text-white font-bold text-xs">{tile.emoji} {tile.title} — {tile.count} Updates</h3>
          <button onClick={(e) => { e.stopPropagation(); setExpandedTile(null); }} className="text-white/80 hover:text-white text-sm transition">✕</button>
        </div>
        {tile.items.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-xs">No updates</div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
            {tile.items.map((item, i) => (
              <div key={i} className="px-4 py-2 hover:bg-purple-50/60 transition-colors cursor-pointer animate-ntRow flex items-start gap-2"
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={(e) => { e.stopPropagation(); navigate(item.nav); }}>
                {item.member_name ? <MemberAvatar item={item} /> : <span className="text-sm mt-0.5">{itemIcon(item.type)}</span>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-800 font-medium" dangerouslySetInnerHTML={{ __html: item.text }} />
                  {item.time && <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(item.time)}</p>}
                </div>
                <span className="text-gray-300 text-xs mt-0.5">›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="mb-6">
      <p className="text-xs text-gray-500 mb-3 ml-1">📬 My Updates & Notifications</p>
      <div className="flex gap-4 items-start">
        <div ref={gridRef} className="flex-1 min-w-0 flex flex-col gap-3">
          {rows.map((row, rowIdx) => {
            const rowStart = rowIdx * 3;
            const expandedInRow = expandedTile !== null && expandedTile >= rowStart && expandedTile < rowStart + row.length ? expandedTile : null;
            return (
              <div key={rowIdx}>
                <div className="grid grid-cols-3 gap-3">
                  {row.map((tile, colIdx) => {
                    const tileIdx = rowStart + colIdx;
                    const isActive = expandedTile === tileIdx;
                    return (
                      <div key={tile.key}
                        className={`relative bg-gradient-to-br ${tile.gradient} rounded-xl p-3 text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer ${isActive ? 'ring-2 ring-white/50 scale-[1.02]' : ''}`}
                        onClick={() => {
                          const next = isActive ? null : tileIdx;
                          setExpandedTile(next);
                          const updated = { ...seenCounts, [tile.key]: tile.count };
                          setSeenCounts(updated);
                          localStorage.setItem('memberNotifTileSeenCounts', JSON.stringify(updated));
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xs font-bold flex items-center gap-1 truncate">{tile.emoji} {tile.title}</h3>
                            <p className="text-[9px] opacity-75 mt-0.5">{tile.count} update{tile.count !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {tile.count > 0 && tile.count > (seenCounts[tile.key] || 0) && (
                              <span className="bg-white/30 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                {tile.count > 9 ? '9+' : tile.count}
                              </span>
                            )}
                            <div className={`w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold transition-transform duration-300 ${isActive ? 'rotate-45' : ''}`}>+</div>
                          </div>
                        </div>
                        <div className="flex -space-x-1.5 mt-1.5">
                          {tile.members.slice(0, 4).map(m => (
                            <div key={m.id} className="w-6 h-6 rounded-full border-2 border-white/70 overflow-hidden bg-white/25 flex items-center justify-center text-[7px] font-bold" title={m.name}>
                              {m.photo ? <img src={`${API_BASE}${m.photo}`} alt="" className="w-full h-full object-cover" /> : initials(m.name)}
                            </div>
                          ))}
                          {tile.members.length > 4 && (
                            <div className="w-6 h-6 rounded-full border-2 border-white/70 bg-white/30 flex items-center justify-center text-[7px] font-bold">+{tile.members.length - 4}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {expandedInRow !== null && tiles[expandedInRow] && (
                  <div className="mt-3">{renderDetail(tiles[expandedInRow])}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Feed Marquee */}
        <div className="w-[250px] min-w-[250px] bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-200 overflow-hidden flex flex-col"
          style={{ maxHeight: gridHeight || 'auto' }}
          onMouseEnter={() => setMarqueeHovered(true)}
          onMouseLeave={() => setMarqueeHovered(false)}>
          <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 shrink-0">
            <h3 className="text-white text-xs font-bold">🔔 Live Feed</h3>
          </div>
          {allNotifications.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-xs">No notifications</div>
          ) : (
            <div className="flex-1 overflow-hidden relative">
              <div className={`marquee-track-member ${marqueeHovered ? 'paused' : ''}`}
                style={{ '--item-count': allNotifications.length } as React.CSSProperties}>
                {[...allNotifications, ...allNotifications].map((item, i) => (
                  <div key={i} className="px-3 py-2 border-b border-gray-100 hover:bg-purple-50/80 transition-colors cursor-pointer group"
                    onClick={() => navigate(item.nav)}>
                    <div className="flex items-start gap-2">
                      {item.member_name ? <MemberAvatar item={item} size="xs" /> : <span className="text-xs shrink-0">{item.tileEmoji}</span>}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-gray-800 font-medium leading-tight group-hover:text-purple-700 transition-colors line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: item.text }} />
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[8px] text-purple-500 font-semibold">{item.tileTitle}</span>
                          {item.time && <span className="text-[8px] text-gray-400">· {timeAgo(item.time)}</span>}
                        </div>
                      </div>
                      <span className="text-gray-300 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">›</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes ntExpand { from { opacity:0; max-height:0; transform:translateY(-8px); } to { opacity:1; max-height:400px; transform:translateY(0); } }
        .animate-ntExpand { animation: ntExpand 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
        @keyframes ntRow { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
        .animate-ntRow { animation: ntRow 0.25s ease-out both; }
        @keyframes marqueeScrollMember { 0% { transform:translateY(0); } 100% { transform:translateY(-50%); } }
        .marquee-track-member { animation: marqueeScrollMember calc(var(--item-count,10) * 3s) linear infinite; }
        .marquee-track-member.paused { animation-play-state: paused; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>
    </div>
  );
}
