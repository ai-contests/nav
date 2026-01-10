'use client';

import React, { useState } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { Bookmark, Loader2 } from 'lucide-react';

interface SubscribeButtonProps {
  contestId: string;
  isSubscribed: boolean;
  onToggle: (newStatus: boolean) => void;
  className?: string;
}

export const SubscribeButton: React.FC<SubscribeButtonProps> = ({
  contestId,
  isSubscribed,
  onToggle,
  className = '',
}) => {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [loading, setLoading] = useState(false);

  const toggleSubscription = async () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    setLoading(true);
    // Optimistic update handled by parent provided onToggle is called immediately?
    // Let's call onToggle optimistically, but handle error fallback?
    // Parent should update state.

    try {
      const newState = !isSubscribed;

      const method = newState ? 'POST' : 'DELETE';
      const res = await fetch('/api/subscription', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contestId }),
      });

      if (!res.ok) {
        throw new Error('Failed');
      }

      onToggle(newState); // Server confirmed
    } catch (e) {
      console.error(e);
      // If we did optimistic update in parent, we would need to revert.
      // For simplicity here, we only update parent state on success.
      // But loading spinner will show activity.
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSubscription();
      }}
      disabled={loading}
      className={`p-2 rounded-full transition-all border ${
        isSubscribed
          ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30'
          : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500'
      } ${className}`}
      title={isSubscribed ? 'Remove bookmark' : 'Bookmark contest'}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bookmark className={`w-4 h-4 ${isSubscribed ? 'fill-current' : ''}`} />
      )}
    </button>
  );
};
