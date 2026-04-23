import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const API_BASE = '';
const REACTIONS = ['👍', '❤️', '🎉', '🔥', '👏', '😂'];

interface Comment { id: number; user_name: string; user_photo: string | null; content: string; created_at: string; }
interface Post {
  id: number; user_id: number; user_name: string; user_photo: string | null; user_role: string;
  post_type: string; content: string; emoji: string | null; image_url: string | null; is_pinned: boolean; created_at: string;
  reaction_counts: Record<string, number>; total_reactions: number; user_reaction: string | null;
  comments: Comment[]; comment_count: number;
}

function Avatar({ name, photo, size = 'w-10 h-10' }: { name: string; photo: string | null; size?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  if (photo) {
    const url = photo.startsWith('http') ? photo : `${API_BASE}${photo}`;
    return <img src={url} alt={name} className={`${size} rounded-full object-cover`} />;
  }
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
  return <div className={`${size} rounded-full ${colors[name.charCodeAt(0) % colors.length]} text-white flex items-center justify-center font-bold text-xs`}>{initials}</div>;
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function PostCard({ post, userId, onReact, onComment, onDelete }: {
  post: Post; userId: number;
  onReact: (postId: number, reaction: string) => void;
  onComment: (postId: number, content: string) => void;
  onDelete: (postId: number) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md bg-white border-gray-100">
      {post.is_pinned && <div className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 flex items-center gap-1">📌 Pinned Post</div>}
      <div className="px-4 pt-3 pb-2 flex items-center gap-3">
        <Avatar name={post.user_name} photo={post.user_photo} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-900 truncate">{post.user_name}</span>
            {post.user_role === 'manager' && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">Manager</span>}
          </div>
          <span className="text-[11px] text-gray-400">{timeAgo(post.created_at)}</span>
        </div>
        {post.user_id === userId && <button onClick={() => onDelete(post.id)} className="text-gray-300 hover:text-red-400 text-sm">✕</button>}
      </div>
      <div className="px-4 pb-3">
        {post.emoji && <span className="text-3xl mr-2">{post.emoji}</span>}
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        {post.image_url && <img src={post.image_url.startsWith('data:') || post.image_url.startsWith('http') ? post.image_url : `${API_BASE}${post.image_url}`} alt="" className="mt-3 rounded-xl border border-gray-200 w-full shadow-sm" />}
      </div>
      {post.total_reactions > 0 && (
        <div className="px-4 pb-2 flex items-center gap-1 text-xs text-gray-500">
          {Object.entries(post.reaction_counts).map(([emoji, count]) => <span key={emoji}>{emoji}{count > 1 && <span className="ml-0.5">{count}</span>}</span>)}
          <span className="ml-1">• {post.total_reactions}</span>
        </div>
      )}
      <div className="px-4 py-2 border-t border-gray-100/80 flex items-center gap-1">
        <div className="relative flex-1">
          <button onClick={() => setShowReactions(!showReactions)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${post.user_reaction ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}>
            {post.user_reaction || '👍'} {post.user_reaction ? 'Reacted' : 'React'}
          </button>
          {showReactions && (
            <div className="absolute bottom-full left-0 mb-1 bg-white rounded-full shadow-lg border px-2 py-1 flex gap-1 z-10">
              {REACTIONS.map(r => <button key={r} onClick={() => { onReact(post.id, r); setShowReactions(false); }} className={`text-lg hover:scale-125 transition-transform p-0.5 ${post.user_reaction === r ? 'bg-blue-100 rounded-full' : ''}`}>{r}</button>)}
            </div>
          )}
        </div>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100 text-gray-500">
          💬 {post.comment_count > 0 ? post.comment_count : 'Comment'}
        </button>
      </div>
      {showComments && (
        <div className="px-4 pb-3 border-t border-gray-100/80 bg-gray-50/50">
          {post.comments.map(c => (
            <div key={c.id} className="flex gap-2 py-2">
              <Avatar name={c.user_name} photo={c.user_photo} size="w-7 h-7" />
              <div className="bg-white rounded-xl px-3 py-2 flex-1 border border-gray-100">
                <span className="font-semibold text-xs text-gray-800">{c.user_name}</span>
                <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
                <span className="text-[10px] text-gray-400">{timeAgo(c.created_at)}</span>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && commentText.trim() && (onComment(post.id, commentText), setCommentText(''))}
              placeholder="Write a comment..." className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white" />
            <button onClick={() => { if (commentText.trim()) { onComment(post.id, commentText); setCommentText(''); } }} disabled={!commentText.trim()}
              className="px-3 py-2 bg-blue-500 text-white rounded-full text-xs font-medium hover:bg-blue-600 disabled:opacity-40">Post</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WallOfFamePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    loadPosts();
    api.get('/api/profile').then(res => {
      if (res.data.profilePhoto) setUserPhoto(res.data.profilePhoto.url);
    }).catch(() => {});
  }, []);

  const loadPosts = async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/wall/posts?page=${p}`);
      if (p === 1) setPosts(res.data.posts); else setPosts(prev => [...prev, ...res.data.posts]);
      setHasMore(res.data.has_more); setPage(p);
    } catch { toast.error('Failed to load wall'); }
    finally { setLoading(false); }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;
    try { const res = await api.post('/api/wall/posts', { content: newPost }); setPosts([res.data, ...posts]); setNewPost(''); toast.success('Posted!'); }
    catch { toast.error('Failed to post'); }
  };

  const handleReact = async (postId: number, reaction: string) => {
    try { await api.post(`/api/wall/posts/${postId}/react`, { reaction }); loadPosts(); } catch { toast.error('Failed to react'); }
  };

  const handleComment = async (postId: number, content: string) => {
    try { await api.post(`/api/wall/posts/${postId}/comment`, { content }); loadPosts(); } catch { toast.error('Failed to comment'); }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Delete this post?')) return;
    try { await api.delete(`/api/wall/posts/${postId}`); setPosts(posts.filter(p => p.id !== postId)); toast.success('Post deleted'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center text-2xl shadow-lg">🏆</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wall of Fame</h1>
          <p className="text-xs text-gray-500">Celebrate wins & team moments</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <div className="flex gap-3">
          <Avatar name={user.name || 'U'} photo={userPhoto} />
          <div className="flex-1">
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="Share something with your team... 🎉"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent" rows={2} />
            <div className="flex justify-end mt-2">
              <button onClick={createPost} disabled={!newPost.trim()} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-md disabled:opacity-40 transition-all">Post ✨</button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading && posts.length === 0 ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="text-5xl mb-3">🏆</div>
            <p className="text-gray-500 font-medium">No posts yet</p>
            <p className="text-gray-400 text-sm mt-1">Be the first to share something!</p>
          </div>
        ) : (
          <>
            {posts.map(post => <PostCard key={post.id} post={post} userId={user.id} onReact={handleReact} onComment={handleComment} onDelete={handleDelete} />)}
            {hasMore && <button onClick={() => loadPosts(page + 1)} className="w-full py-3 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-xl transition-colors">Load more posts...</button>}
          </>
        )}
      </div>
    </div>
  );
}
