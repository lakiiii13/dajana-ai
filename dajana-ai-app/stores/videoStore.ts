// ===========================================
// DAJANA AI - Video Store (Zustand)
// Manages video generation state + gallery
// + background job tracking
// ===========================================

import { create } from 'zustand';
import type { SavedVideo } from '@/lib/videoService';
import type { SavedTryOnImage } from '@/lib/tryOnService';
import { toPathString } from '@/lib/fileSystemPath';

export type VideoStatus = 'idle' | 'uploading' | 'generating' | 'polling' | 'done' | 'error';

export interface BackgroundJobMeta {
  jobId: string;
  userId: string;
  sourceImageUrl: string;
  publicImageUrl: string;
  prompt: string;
  duration: '5' | '10';
  startedAt: string;
}

export interface VideoState {
  // Generation (form state)
  status: VideoStatus;
  jobId: string | null;
  sourceImageUrl: string | null;
  prompt: string;
  duration: '5' | '10';
  pollAttempt: number;
  resultVideoUrl: string | null;
  error: string | null;

  // Background job tracking
  backgroundJob: BackgroundJobMeta | null;
  bgPollAttempt: number;

  // Gallery
  savedVideos: SavedVideo[];

  // Jedna lista generisanih slika (iz baze) – koriste je Home i Video tab, isti izvor
  userGeneratedImages: SavedTryOnImage[];

  // Preloaded try-on list from Videos tab (so source screen shows instantly)
  preloadedTryOnImages: SavedTryOnImage[] | null;
  // Local file URIs for pre-downloaded images (remoteUri -> localUri) for fast display
  preloadedLocalUris: Record<string, string>;

  // Actions - form
  setSource: (imageUrl: string | null) => void;
  setPrompt: (prompt: string) => void;
  setDuration: (d: '5' | '10') => void;
  setStatus: (s: VideoStatus) => void;
  setJobId: (id: string) => void;
  setPollAttempt: (n: number) => void;
  setResultVideo: (url: string) => void;
  setError: (msg: string | null) => void;
  setSavedVideos: (vids: SavedVideo[]) => void;
  setUserGeneratedImages: (imgs: SavedTryOnImage[]) => void;
  setPreloadedTryOnImages: (imgs: SavedTryOnImage[] | null) => void;
  setPreloadedLocalUri: (remoteUri: string, localUri: string) => void;
  /** Merge multiple preloaded URIs in one update (reduces re-renders). */
  setPreloadedLocalUrisBatch: (map: Record<string, string>) => void;
  /** Clear preloaded cache (call when image list changes to avoid stale/wrong thumbnails). */
  clearPreloadedLocalUris: () => void;
  resetGeneration: () => void;

  // Actions - background job
  startBackgroundJob: (meta: BackgroundJobMeta) => void;
  setBgPollAttempt: (n: number) => void;
  completeBackgroundJob: (videoUri: string) => void;
  clearBackgroundJob: () => void;
}

const genDefaults = {
  status: 'idle' as VideoStatus,
  jobId: null as string | null,
  sourceImageUrl: null as string | null,
  prompt: '',
  duration: '5' as '5' | '10',
  pollAttempt: 0,
  resultVideoUrl: null as string | null,
  error: null as string | null,
};

export const useVideoStore = create<VideoState>((set) => ({
  ...genDefaults,
  savedVideos: [],
  userGeneratedImages: [],
  preloadedTryOnImages: null,
  preloadedLocalUris: {},
  backgroundJob: null,
  bgPollAttempt: 0,

  // Form actions (normalize path so store never holds object)
  setSource: (imageUrl) => set({ sourceImageUrl: toPathString(imageUrl) || (typeof imageUrl === 'string' ? imageUrl : null) }),
  setPrompt: (prompt) => set({ prompt }),
  setDuration: (d) => set({ duration: d }),
  setStatus: (s) => set({ status: s }),
  setJobId: (id) => set({ jobId: id }),
  setPollAttempt: (n) => set({ pollAttempt: n }),
  setResultVideo: (url) => set({ resultVideoUrl: url, status: 'done' }),
  setError: (msg) => set({ error: msg, status: msg ? 'error' : 'idle' }),
  setSavedVideos: (vids) => set({ savedVideos: vids }),
  setUserGeneratedImages: (imgs) => set({ userGeneratedImages: imgs ?? [] }),
  setPreloadedTryOnImages: (imgs) => set({ preloadedTryOnImages: imgs }),
  setPreloadedLocalUri: (remoteUri, localUri) =>
    set((s) => ({ preloadedLocalUris: { ...s.preloadedLocalUris, [remoteUri]: localUri } })),
  setPreloadedLocalUrisBatch: (map) =>
    set((s) => ({ preloadedLocalUris: { ...s.preloadedLocalUris, ...map } })),
  clearPreloadedLocalUris: () => set({ preloadedLocalUris: {} }),
  resetGeneration: () => set(genDefaults),

  // Background job actions (normalize URLs so no object is stored)
  startBackgroundJob: (meta) =>
    set({
      backgroundJob: {
        ...meta,
        sourceImageUrl: toPathString(meta.sourceImageUrl) || meta.sourceImageUrl || '',
        publicImageUrl: toPathString(meta.publicImageUrl) || meta.publicImageUrl || '',
      },
      bgPollAttempt: 0,
      status: 'idle',
    }),

  setBgPollAttempt: (n) => set({ bgPollAttempt: n }),

  completeBackgroundJob: (videoUri) =>
    set({
      backgroundJob: null,
      bgPollAttempt: 0,
      resultVideoUrl: videoUri,
    }),

  clearBackgroundJob: () =>
    set({ backgroundJob: null, bgPollAttempt: 0 }),
}));
