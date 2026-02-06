import React, { useState, useEffect } from 'react';
import { Post, User, Comment, UserRole, Team } from '../types';

interface FeedProps {
  posts: Post[];
  teams: Team[];
  currentUser: User;
}

export const Feed: React.FC<FeedProps> = ({ posts: initialPosts, teams, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'following' | 'explore'>('following');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  // Update local state when parent posts change (e.g. from DB fetch)
  useEffect(() => {
      setPosts(initialPosts);
  }, [initialPosts]);

  // --- Filtering Logic ---
  
  // 1. Filter posts from followed teams
  const followingPosts = posts
    .filter(post => currentUser.following.includes(post.teamId) || post.teamId === currentUser.teamId) // Include own team posts in following
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // 2. Filter explore posts (Anyone NOT followed AND NOT own team)
  const explorePosts = posts
    .filter(post => !currentUser.following.includes(post.teamId) && post.teamId !== currentUser.teamId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const isFollowingEmpty = currentUser.following.length === 0 && !currentUser.teamId;
  
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
  const getTeamInfo = (teamId: string) => teams.find(t => t.id === teamId);

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      
      {/* Header & Tabs */}
      <div className="sticky top-0 z-30 pt-4 pb-4 bg-pitch-950/90 backdrop-blur-xl border-b border-white/5 shadow-2xl">
         <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-3xl font-display font-bold text-white uppercase italic tracking-wide">
              Feed <span className="text-neon">Social</span>
            </h2>
         </div>
         <div className="flex bg-pitch-900 mx-4 rounded-xl p-1 border border-white/5">
            <button 
                onClick={() => setActiveTab('following')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'following' ? 'bg-white/10 text-neon shadow-[0_0_15px_rgba(57,255,20,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Meus Times
            </button>
            <button 
                onClick={() => setActiveTab('explore')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'explore' ? 'bg-blue-600/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
                Explorar
            </button>
         </div>
      </div>

      {/* Empty State for Following */}
      {activeTab === 'following' && isFollowingEmpty && (
         <div className="mx-4 bg-gradient-to-br from-pitch-900 to-black p-8 rounded-3xl text-center border border-dashed border-white/10 shadow-2xl">
             <div className="w-20 h-20 bg-pitch-800 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl animate-pulse">📡</div>
             <h3 className="text-xl font-display font-bold text-white mb-2 uppercase">Sinal Perdido...</h3>
             <p className="text-gray-400 text-sm mb-6 leading-relaxed">Seu radar está vazio. Siga times na aba <b>Explorar</b> para encher seu feed de lances e rivalidades.</p>
             <button onClick={() => setActiveTab('explore')} className="bg-neon text-pitch-950 font-bold px-8 py-3 rounded-xl hover:scale-105 transition-transform shadow-neon uppercase tracking-widest text-xs">Explorar Agora</button>
         </div>
      )}

      {/* Posts List */}
      <div className="space-y-8 px-4 md:px-0">
        {displayPosts.length === 0 && !isFollowingEmpty && (
            <p className="text-center text-gray-500 py-10">Nenhuma postagem encontrada.</p>
        )}

        {displayPosts.map((post) => {
          const team = getTeamInfo(post.teamId);
          const isOwnerPost = post.authorRole === UserRole.OWNER;
          
          return (
            <article key={post.id} className="group relative bg-pitch-900/40 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-500 shadow-xl">
              
              {/* 1. Header: Author & Context */}
              <div className="p-4 flex items-center justify-between relative z-20">
                <div className="flex items-center gap-3">
                    {/* Avatar with Role Ring */}
                    <div className="relative">
                        <div className={`w-12 h-12 rounded-full p-[2px] ${isOwnerPost ? 'bg-gradient-to-tr from-gold to-yellow-600' : 'bg-gradient-to-tr from-gray-600 to-gray-800'}`}>
                           <img src={team?.logoUrl || "https://via.placeholder.com/50"} className="w-full h-full rounded-full object-cover bg-black" />
                        </div>
                        {isOwnerPost && (
                            <div className="absolute -bottom-1 -right-1 bg-gold text-black text-[8px] font-bold px-1.5 rounded-sm border border-black shadow-sm">DONO</div>
                        )}
                    </div>
                    
                    <div>
                        <h4 className="font-display font-bold text-lg text-white leading-none tracking-wide flex items-center gap-2">
                            {team?.name || "Time Desconhecido"}
                            {/* Verified/Official check if needed */}
                            {isOwnerPost && <span className="text-blue-400 text-xs" title="Perfil Oficial">✓</span>}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            @{post.authorName ? post.authorName.replace(/\s/g, '').toLowerCase() : 'usuario'} • <span className="text-gray-500">{post.timestamp.toLocaleDateString()}</span>
                        </p>
                    </div>
                </div>

                {/* Follow Button (Explore Only) */}
                {activeTab === 'explore' && !currentUser.following.includes(post.teamId) && (
                    <button className="text-[10px] font-bold bg-white/5 hover:bg-neon hover:text-black text-neon border border-neon/30 px-4 py-2 rounded-full transition-all uppercase tracking-widest">
                        Seguir
                    </button>
                )}
              </div>

              {/* 2. Match Context Bar (Optional) */}
              {post.matchContext && (
                  <div className="mx-4 mb-4 relative overflow-hidden rounded-xl border border-white/5">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40 opacity-50"></div>
                      <div className="relative p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <span className="text-xl">🆚</span>
                              <div>
                                  <p className="text-[9px] text-blue-300 uppercase font-bold tracking-widest mb-0.5">Resultado Final</p>
                                  <p className="text-sm font-bold text-white uppercase tracking-wide">vs {post.matchContext.opponentName}</p>
                              </div>
                          </div>
                          {post.matchContext.result && (
                              <div className="bg-black/40 backdrop-blur px-3 py-1 rounded-lg border border-white/10">
                                  <span className="font-display font-bold text-xl text-white tracking-widest">{post.matchContext.result}</span>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* 3. Main Content */}
              <div className="relative">
                  {post.imageUrl ? (
                     <div className="relative aspect-[4/5] bg-black group-hover:brightness-105 transition-all duration-700">
                        <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />
                        
                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-pitch-950 via-transparent to-transparent opacity-90"></div>
                        
                        {/* Caption Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                             <p className="text-sm text-gray-200 leading-relaxed font-medium drop-shadow-md">
                                <span className="font-bold text-white mr-2">{post.authorName}</span>
                                {post.content}
                             </p>
                        </div>
                     </div>
                  ) : (
                     // Text-Only Post Styling
                     <div className="px-6 py-10 bg-carbon bg-cover relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-br from-pitch-900/90 to-black/90"></div>
                         {/* Decorative Quote */}
                         <div className="absolute top-4 left-4 text-6xl text-white/5 font-serif font-black">“</div>
                         
                         <p className="relative z-10 text-xl md:text-2xl font-display font-bold text-white text-center leading-normal tracking-wide italic">
                             {post.content}
                         </p>
                         
                         <div className="absolute bottom-4 right-4 text-6xl text-white/5 font-serif font-black rotate-180">“</div>
                     </div>
                  )}
              </div>

              {/* 4. Action Bar */}
              <div className="p-4 flex items-center justify-between bg-black/20 border-t border-white/5">
                 <div className="flex gap-3">
                    <button 
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-neon/10 hover:text-neon border border-transparent hover:border-neon/30 transition-all group/btn"
                    >
                       <svg className={`w-5 h-5 ${post.likes > 0 ? 'fill-neon text-neon' : 'fill-none text-gray-400 group-hover/btn:text-neon'} transition-colors`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                       </svg>
                       <span className="text-xs font-bold">{post.likes || 'Curtir'}</span>
                    </button>
                    
                    <button 
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-blue-500/10 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all group/btn"
                    >
                        <svg className="w-5 h-5 text-gray-400 group-hover/btn:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs font-bold">{post.comments.length || 'Comentar'}</span>
                    </button>
                 </div>
                 
                 <button className="text-gray-500 hover:text-white transition-colors">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                     </svg>
                 </button>
              </div>
                 
              {/* 5. Comments Drawer */}
              {expandedComments === post.id && (
                 <div className="bg-black/40 border-t border-white/5 p-4 animate-slideUp">
                     <div className="space-y-3 max-h-48 overflow-y-auto mb-4 pr-2 custom-scrollbar">
                         {post.comments.length === 0 ? (
                             <div className="text-center py-4">
                                 <p className="text-[10px] text-gray-500 uppercase tracking-widest">Seja o primeiro a comentar</p>
                             </div>
                         ) : (
                             post.comments.map(comment => (
                                 <div key={comment.id} className="flex gap-2 items-start text-sm">
                                     <span className="font-bold text-neon text-xs mt-0.5 whitespace-nowrap">{comment.authorName}</span>
                                     <span className="text-gray-300 bg-white/5 px-2 py-1 rounded-lg rounded-tl-none">{comment.content}</span>
                                 </div>
                             ))
                         )}
                     </div>
                     <div className="relative">
                         <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escreva seu comentário..." 
                            className="w-full bg-pitch-950/50 border border-white/10 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon placeholder-gray-600 pr-12 transition-all"
                         />
                         <button 
                            onClick={() => handlePostComment(post.id)}
                            disabled={!newComment}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neon font-bold text-[10px] uppercase bg-neon/10 px-2 py-1 rounded-md hover:bg-neon hover:text-black transition-all disabled:opacity-0"
                         >
                            Enviar
                         </button>
                     </div>
                 </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};