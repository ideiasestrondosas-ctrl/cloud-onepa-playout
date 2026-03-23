import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { channelsAPI, userChannelAPI } from '../services/api';

const DEFAULT_CHANNEL_ID = '00000000-0000-0000-0000-000000000001';
const STORAGE_KEY = 'onepa_active_channel_id';
const USER_KEY   = 'onepa_user';

const ChannelContext = createContext(null);

export function ChannelProvider({ children }) {
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_CHANNEL_ID
  );
  const [loadingChannels, setLoadingChannels] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await channelsAPI.list();
        const allChannels = res.data || [];

        // ── Filter by user_channel_access for non-admin users ────────────────
        // Admins see everything. For other roles, call the access endpoint.
        // An empty allowed list means no restriction is configured → show all.
        let visible = allChannels;
        try {
          const userRaw = localStorage.getItem(USER_KEY);
          const user = userRaw ? JSON.parse(userRaw) : null;
          if (user && user.role !== 'admin' && user.id) {
            const accessRes = await userChannelAPI.getChannels(user.id);
            // Backend returns a plain UUID array: ["uuid1", "uuid2", ...]
            const allowed = Array.isArray(accessRes.data) ? accessRes.data : [];
            if (allowed.length > 0) {
              visible = allChannels.filter(c => allowed.includes(c.id));
            }
          }
        } catch (err) {
          // Non-critical: if access check fails, fall back to all channels
          console.warn('ChannelContext: access filter failed, showing all channels', err);
        }

        setChannels(visible);

        // If the stored channel is no longer in the visible list, fallback
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (visible.length > 0 && storedId && !visible.find(c => c.id === storedId)) {
          const fallback = visible[0].id;
          localStorage.setItem(STORAGE_KEY, fallback);
          setActiveChannelIdState(fallback);
        }
      } catch (err) {
        console.warn('ChannelContext: failed to load channels', err);
      } finally {
        setLoadingChannels(false);
      }
    };
    load();
  }, []);

  const setActiveChannelId = useCallback((id) => {
    localStorage.setItem(STORAGE_KEY, id);
    setActiveChannelIdState(id);
  }, []);

  const activeChannel = channels.find(c => c.id === activeChannelId) || null;

  return (
    <ChannelContext.Provider value={{
      channels,
      loadingChannels,
      activeChannelId,
      activeChannel,
      setActiveChannelId,
    }}>
      {children}
    </ChannelContext.Provider>
  );
}

export function useChannel() {
  const ctx = useContext(ChannelContext);
  if (!ctx) throw new Error('useChannel must be used inside <ChannelProvider>');
  return ctx;
}
