'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, Edit3, RotateCcw, X, Loader2 } from 'lucide-react';

export interface PostSaveToastProps {
  versionNo: number;
  additions: number;
  deletions: number;
  onAddNote: (note: string) => Promise<void> | void;
  onRevert?: () => Promise<void> | void;
  onClose: () => void;
  autoDismissTimeout?: number;
}

export const PostSaveToast: React.FC<PostSaveToastProps> = ({
  versionNo,
  additions,
  deletions,
  onAddNote,
  onRevert,
  onClose,
  autoDismissTimeout = 4000,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing || isHovered || isSubmitting || isReverting) {
      return;
    }
    const timer = setTimeout(() => {
      onClose();
    }, autoDismissTimeout);
    return () => clearTimeout(timer);
  }, [isEditing, isHovered, isSubmitting, isReverting, autoDismissTimeout, onClose]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSubmitNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!note.trim()) {
      setIsEditing(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await onAddNote(note.trim());
      setIsEditing(false);
      onClose();
    } catch {
      setIsSubmitting(false);
    }
  };

  const handleRevert = async () => {
    if (!onRevert) return;
    setIsReverting(true);
    try {
      await onRevert();
      onClose();
    } catch {
      setIsReverting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isEditing) {
        setIsEditing(false);
      } else {
        onClose();
      }
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      className="fixed bottom-10 right-6 z-50 flex items-center bg-[#1e1e1e] border border-neutral-700/80 text-white shadow-2xl rounded-lg px-3.5 py-2 text-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {!isEditing ? (
        <div className="flex items-center gap-3">
          {/* Status & Version */}
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
            <span>Saved as <span className="font-semibold text-emerald-400">v{versionNo}</span></span>
          </div>

          {/* Diff stats badge */}
          {(additions > 0 || deletions > 0) && (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700/60 font-mono text-[11px]">
              {additions > 0 && <span className="text-emerald-400">+{additions}</span>}
              {deletions > 0 && <span className="text-rose-400">-{deletions}</span>}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 border-l border-neutral-700 pl-2.5">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
              title="Add note to this version"
            >
              <Edit3 className="w-3 h-3 text-neutral-400" />
              <span>Add Note</span>
            </button>

            {onRevert && (
              <button
                type="button"
                onClick={handleRevert}
                disabled={isReverting}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-300 transition-colors disabled:opacity-50"
                title="Revert this snapshot"
              >
                {isReverting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                <span>Revert</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitNote} className="flex items-center gap-2">
          <Edit3 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe this version (e.g. update MySQL pool size)..."
            className="bg-neutral-900 border border-blue-500/50 rounded px-2.5 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-2 py-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
