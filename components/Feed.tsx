import React, { useState } from 'react';
import { Post, User, Comment, UserRole } from '../types';
import { MOCK_TEAMS } from '../constants';

interface FeedProps {
  posts: Post[];
  currentUser: User;
}

export const Feed: React.FC<FeedProps> = ({ posts: initialPosts, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'following' | 'explore'>('following');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  // --- Filtering Logic ---
  
  // 1. Filter posts from followed teams
  const followingPosts = posts
    .filter(post => currentUser.following.includes(post.teamId))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // 2. Filter explore posts (Anyone NOT followed, prioritized by recency for this demo)
  // In a real app, this would use geolocation and ranking algorithms.
  const explorePosts = posts
    .filter(post => !currentUser.following.includes(post.teamId))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // 3. Decision: If user follows no one, force Explore view or show empty state instructions
  const isFollowingEmpty = currentUser.following.length === 0;
  
  const displayPosts = activeTab === 'following' && !isFollowingEmpty ? followingPosts : explorePosts;

  // --- Actions ---

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, likes: p.likes + 1 };
      }
      return p;
    }));
  };

  const toggleComments = (postId: string) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
    } else {
      setExpandedComments(postId);
      setNewComment('');
    }
  };

  const handlePostComment = (postId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `c-${Date.now()}`,
      authorName: currentUser.name,
      content: newComment,
      timestamp: new Date()
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...p.comments, comment] };
      }
      return p;
    }));

    setNewComment('');
  };

  // --- Helper to get Team Info ---
  const getTeamInfo = (teamId: string) => MOCK_TEAMS.find(t => t.id === teamId);

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      
      {/* Header & Tabs */}
      <div className="sticky top-0 z-30 pt-4 pb-2 bg-pitch-950/80 backdrop-blur-md">
         <div className="flex items-center justify-between px-2 mb-4">
            <h2 className="text-2xl font-display font-bold text-white uppercase italic tracking-wide">
              Feed <span className="text-neon">Social</span>
            </h2>
            <div className="flex bg-pitch-900 rounded-full p-1 border border-pitch-800">
               <button 
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'following' ? 'bg-neon text-black shadow-neon' : 'text-gray-400 hover:text-white'}`}
               >
                  Meus Times
               </button>
               <button 
                  onClick={() => setActiveTab('explore')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === 'explore' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
               >
                  Explorar
               </button>
            </div>
         </div>
      </div>

      {/* Empty State for Following */}
      {activeTab === 'following' && isFollowingEmpty && (
         <div className="glass-card p-8 rounded-3xl text-center border-dashed border-2 border-pitch-700">
             <div className="text-4xl mb-4">🔭</div>
             <h3 className="text-xl font-bold text-white mb-2">Está quieto por aqui...</h3>
             <p className="text-gray-400 text-sm mb-6">Você ainda não segue nenhum time. Mude para <b>Explorar</b> para encontrar times locais e começar a dominar!</p>
             <button onClick={() => setActiveTab('explore')} className="bg-white text-black font-bold px-6 py-2 rounded-xl hover:bg-gray-200">Ir para Explorar</button>
         </div>
      )}

      {/* Posts List */}
      <div className="space-y-8">
        {displayPosts.map((post) => {
          const team = getTeamInfo(post.teamId);
          
          return (
            <div key={post.id} className="glass-card rounded-[2rem] overflow-hidden relative group border border-white/5 hover:border-white/10 transition-all duration-300">
              
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent z-20 backdrop-blur-[2px]">
                <div className="flex items-center gap-3">
                    {/* Avatar Ring: Gold for Owner, Gray for Player */}
                    <div className={`w-12 h-12 rounded-full p-[2px] shadow-lg ${post.authorRole === UserRole.OWNER ? 'bg-gradient-to-tr from-gold to-yellow-900' : 'bg-gradient-to-tr from-gray-500 to-gray-800'}`}>
                       <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden relative">
                          {/* Use team logo if available, else letter */}
                          {team?.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover opacity-80" /> : <span className="font-display font-bold text-white text-lg">{post.authorName.charAt(0)}</span>}
                       </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm drop-shadow-md tracking-wide">{team?.name || "Time Desconhecido"}</h4>
                          {post.authorRole === UserRole.OWNER && <span className="bg-gold text-black text-[8px] font-bold px-1 rounded uppercase">Dono</span>}
                      </div>
                      <p className="text-[10px] text-gray-300 font-medium">{post.authorName} • 2h atrás</p>
                    </div>
                </div>
                
                {/* Logic: If explore tab, show Follow button */}
                {activeTab === 'explore' && !currentUser.following.includes(post.teamId) && (
                    <button className="text-xs font-bold bg-white/10 hover:bg-neon hover:text-black text-neon border border-neon/50 px-3 py-1 rounded-full transition-colors">
                        + Seguir
                    </button>
                )}
              </div>
              
              {/* Content / Match Badge */}
              {post.matchContext && (
                  <div className="mx-4 mt-2 mb-2 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <span className="text-xl">⚔️</span>
                          <div>
                              <p className="text-[10px] text-blue-300 uppercase font-bold">Atualização de Jogo</p>
                              <p className="text-sm font-bold text-white">vs {post.matchContext.opponentName}</p>
                          </div>
                      </div>
                      {post.matchContext.result && (
                          <span className="bg-neon text-black font-display font-bold text-lg px-2 rounded">{post.matchContext.result}</span>
                      )}
                  </div>
              )}

              {/* Main Visual/Text */}
              {post.imageUrl ? (
                 <div className="relative aspect-[4/5] bg-pitch-950 group-hover:brightness-110 transition-all duration-700 ease-in-out">
                    <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                 </div>
              ) : (
                 <div className="p-8 bg-gradient-to-br from-pitch-900 to-black min-h-[200px] flex items-center justify-center relative overflow-hidden">
                     {/* Abstract BG */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 rounded-full blur-[50px]"></div>
                     <p className="text-xl font-display text-white text-center leading-relaxed relative z-10 italic">"{post.content}"</p>
                 </div>
              )}
              
              {/* Post Caption (if Image) */}
              {post.imageUrl && (
                   <div className="absolute bottom-16 left-4 right-4 z-20">
                        <p className="text-sm text-gray-200 leading-snug drop-shadow-md">
                            <span className="font-bold text-white mr-2">{post.authorName}</span>
                            {post.content}
                        </p>
                   </div>
              )}

              {/* Actions Bar */}
              <div className="relative bg-pitch-950/50 backdrop-blur-md p-4 border-t border-white/5">
                 <div className="flex items-center gap-6">
                    <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-2 group/btn"
                    >
                       <div className="p-2 rounded-full bg-white/5 group-hover/btn:bg-neon/20 transition-colors">
                           <svg className="w-6 h-6 stroke-white group-hover/btn:stroke-neon transition-colors" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                       </div>
                       <span className="text-sm font-bold text-white">{post.likes}</span>
                    </button>
                    
                    <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-2 group/btn"
                    >
                        <div className="p-2 rounded-full bg-white/5 group-hover/btn:bg-blue-500/20 transition-colors">
                           <svg className="w-6 h-6 stroke-white group-hover/btn:stroke-blue-400 transition-colors" viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <span className="text-sm font-bold text-white">{post.comments.length}</span>
                    </button>
                 </div>
                 
                 {/* Comments Section */}
                 {expandedComments === post.id && (
                     <div className="mt-4 pt-4 border-t border-white/5 animate-slideUp">
                         <div className="space-y-3 max-h-40 overflow-y-auto mb-3">
                             {post.comments.length === 0 ? (
                                 <p className="text-xs text-gray-500 italic text-center">Sem comentários. Seja o primeiro!</p>
                             ) : (
                                 post.comments.map(comment => (
                                     <div key={comment.id} className="text-sm">
                                         <span className="font-bold text-neon mr-2">{comment.authorName}</span>
                                         <span className="text-gray-300">{comment.content}</span>
                                     </div>
                                 ))
                             )}
                         </div>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Escreva um comentário..." 
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon"
                             />
                             <button 
                                onClick={() => handlePostComment(post.id)}
                                disabled={!newComment}
                                className="text-neon font-bold text-xs uppercase disabled:opacity-50"
                             >
                                Publicar
                             </button>
                         </div>
                     </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};