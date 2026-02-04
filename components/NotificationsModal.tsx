import React, { useEffect, useState } from 'react';
import { Notification, User } from '../types';
import { dbService } from '../services/database';

interface NotificationsModalProps {
    currentUser: User;
    onClose: () => void;
    onRefresh: () => void; // Trigger app data refresh
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ currentUser, onClose, onRefresh }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        const data = await dbService.getNotifications(currentUser.id);
        setNotifications(data);
        setLoading(false);
    };

    const handleAcceptTrial = async (notif: Notification) => {
        if (!notif.actionData?.teamId || !notif.actionData?.playerId) return;
        
        const success = await dbService.acceptTrial(notif.id, notif.actionData.teamId, notif.actionData.playerId);
        if (success) {
            alert("Jogador aceito no time!");
            await loadNotifications();
            onRefresh();
        } else {
            alert("Erro ao aceitar jogador.");
        }
    };

    const handleMarkRead = async (id: string) => {
        await dbService.markNotificationRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[1000] flex items-start justify-center pt-20 px-4">
             <div className="bg-pitch-950 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp max-h-[80vh] flex flex-col">
                
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/50">
                    <h3 className="text-xl font-display font-bold text-white uppercase tracking-wide">Notificações</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-8"><div className="w-6 h-6 border-2 border-neon border-t-transparent rounded-full animate-spin mx-auto"></div></div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            <span className="text-4xl block mb-2">🔕</span>
                            <p>Tudo tranquilo por aqui.</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n.id} className={`p-4 rounded-xl border transition-all ${n.read ? 'bg-white/5 border-transparent opacity-60' : 'bg-pitch-900 border-neon/30 shadow-lg'}`}>
                                <div className="flex gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex-shrink-0 overflow-hidden">
                                        {n.relatedImage ? (
                                            <img src={n.relatedImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-lg">🔔</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white text-sm">{n.title}</h4>
                                            <span className="text-[10px] text-gray-500">{new Date(n.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-300 mt-1">{n.message}</p>
                                        
                                        {/* Actions for Trial Requests */}
                                        {n.type === 'TRIAL_REQUEST' && !n.read && (
                                            <div className="flex gap-2 mt-3">
                                                <button 
                                                    onClick={() => handleAcceptTrial(n)}
                                                    className="flex-1 bg-neon text-black text-xs font-bold py-2 rounded hover:bg-white transition-colors"
                                                >
                                                    Aceitar no Time
                                                </button>
                                                <button 
                                                    onClick={() => handleMarkRead(n.id)}
                                                    className="flex-1 bg-white/10 text-white text-xs font-bold py-2 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                                >
                                                    Recusar
                                                </button>
                                            </div>
                                        )}
                                        
                                        {!n.read && n.type !== 'TRIAL_REQUEST' && (
                                            <button 
                                                onClick={() => handleMarkRead(n.id)}
                                                className="text-[10px] text-neon mt-2 font-bold hover:underline"
                                            >
                                                Marcar como lida
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
        </div>
    );
};