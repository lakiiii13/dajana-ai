// ===========================================
// DAJANA AI - Background Video Task
// Polls TheNewBlack API when app is backgrounded
// via expo-task-manager background fetch
// ===========================================

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVideoResult, saveVideo } from './videoService';
import { notifyVideoReady, notifyVideoFailed } from './notificationService';
import { toPathString } from './fileSystemPath';

export const VIDEO_POLL_TASK = 'DAJANA_VIDEO_POLL_TASK';
const STORAGE_KEY = '@dajana_bg_video_job';
const MAX_BG_ATTEMPTS = 60; // ~10 min worth of attempts across all bg invocations

export interface BackgroundJobData {
  jobId: string;
  userId?: string; // opciono zbog starih zapisa u AsyncStorage
  sourceImageUrl: string;
  publicImageUrl: string;
  prompt: string;
  duration: '5' | '10';
  startedAt: string;
  bgAttempts: number;
}

/**
 * Save a background video job to AsyncStorage.
 */
export async function saveBackgroundJob(job: Omit<BackgroundJobData, 'bgAttempts'>): Promise<void> {
  const data: BackgroundJobData = {
    ...job,
    bgAttempts: 0,
    sourceImageUrl: toPathString(job.sourceImageUrl) || (typeof job.sourceImageUrl === 'string' ? job.sourceImageUrl : ''),
    publicImageUrl: toPathString(job.publicImageUrl) || (typeof job.publicImageUrl === 'string' ? job.publicImageUrl : ''),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  console.log('[BGVideo] Job saved to AsyncStorage:', job.jobId);
}

/**
 * Get the current background video job (if any).
 * Normalizes sourceImageUrl/publicImageUrl to string (avoids path-as-object errors).
 */
export async function getBackgroundJob(): Promise<BackgroundJobData | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BackgroundJobData;
    return {
      ...parsed,
      sourceImageUrl: toPathString(parsed.sourceImageUrl) || (typeof parsed.sourceImageUrl === 'string' ? parsed.sourceImageUrl : ''),
      publicImageUrl: toPathString(parsed.publicImageUrl) || (typeof parsed.publicImageUrl === 'string' ? parsed.publicImageUrl : ''),
    };
  } catch {
    return null;
  }
}

/**
 * Clear the background video job.
 */
export async function clearBackgroundJob(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  console.log('[BGVideo] Job cleared from AsyncStorage');
}

/**
 * Define the background task. Runs when the OS allows it (e.g. when app is backgrounded).
 */
TaskManager.defineTask(VIDEO_POLL_TASK, async () => {
  console.log('[BGVideo] Background task invoked');

  try {
    const job = await getBackgroundJob();
    if (!job) {
      console.log('[BGVideo] No pending job, skipping');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    if (job.bgAttempts >= MAX_BG_ATTEMPTS) {
      console.log('[BGVideo] Max background attempts reached, giving up');
      await notifyVideoFailed();
      await clearBackgroundJob();
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const result = await getVideoResult(job.jobId);

    if (result.videoUrl) {
      console.log('[BGVideo] Video ready! Downloading...');
      const saved = await saveVideo(
        result.videoUrl,
        job.publicImageUrl,
        job.prompt,
        job.duration
      );
      if (job.userId) {
        const { logVideoGeneration } = await import('./generationLog');
        await logVideoGeneration(job.userId, saved.uri);
      }
      await notifyVideoReady(saved.uri, job.userId ?? undefined);
      await clearBackgroundJob();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }

    job.bgAttempts += 1;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(job));
    console.log('[BGVideo] Not ready yet, attempt:', job.bgAttempts);
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BGVideo] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background fetch task with the OS.
 */
export async function registerBackgroundVideoTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(VIDEO_POLL_TASK);
    if (isRegistered) {
      console.log('[BGVideo] Task already registered');
      return;
    }

    await BackgroundFetch.registerTaskAsync(VIDEO_POLL_TASK, {
      minimumInterval: 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('[BGVideo] Background task registered');
  } catch (error) {
    console.warn('[BGVideo] Could not register background task:', error);
  }
}

/**
 * Unregister the background fetch task.
 */
export async function unregisterBackgroundVideoTask(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(VIDEO_POLL_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(VIDEO_POLL_TASK);
      console.log('[BGVideo] Background task unregistered');
    }
  } catch (error) {
    console.warn('[BGVideo] Could not unregister task:', error);
  }
}
