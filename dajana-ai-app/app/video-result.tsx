// ===========================================
// DAJANA AI - Video Result
// Full-screen video player with luxury controls
// Save, share, download actions
// ===========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Sharing from 'expo-sharing';
import * as FileSystem from '@/lib/safeFileSystem';
import { COLORS, FONTS, SPACING } from '@/constants/theme';
import { AppLogo } from '@/components/AppLogo';
import { useVideoStore } from '@/stores/videoStore';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeIn,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const GOLD = '#CF8F5A';
const DARK = '#2C2A28';

export default function VideoResultScreen() {
  const insets = useSafeAreaInsets();

  const resultVideoUrl = useVideoStore((s) => s.resultVideoUrl);
  const resetGeneration = useVideoStore((s) => s.resetGeneration);

  const player = useVideoPlayer(resultVideoUrl ?? '', (p) => {
    p.loop = true;
    p.play();
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [saved, setSaved] = useState(false);

  // Animations
  const sideSlide = useSharedValue(40);
  const bottomSlide = useSharedValue(60);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 600 });
    sideSlide.value = withDelay(400, withTiming(0, { duration: 500 }));
    bottomSlide.value = withDelay(500, withTiming(0, { duration: 500 }));
  }, []);

  const sideStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateX: sideSlide.value }],
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: bottomSlide.value }],
  }));

  const handleClose = () => {
    resetGeneration();
    router.replace('/(tabs)/videos');
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSave = () => {
    setSaved(true);
    Alert.alert('Sačuvano', 'Video je sačuvan u tvoju kolekciju');
  };

  const handleShare = async () => {
    if (!resultVideoUrl) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(resultVideoUrl, {
          mimeType: 'video/mp4',
          dialogTitle: 'Podeli video',
        });
      } else {
        await Share.share({ url: resultVideoUrl, message: 'Pogledaj moj AI fashion video! - Dajana AI' });
      }
    } catch (e) {
      console.error('[Video] Share error', e);
    }
  };

  const handleDownload = async () => {
    if (!resultVideoUrl) return;
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(resultVideoUrl, {
          mimeType: 'video/mp4',
          dialogTitle: 'Sačuvaj video',
          UTI: 'public.movie',
        });
      }
    } catch (e) {
      console.error('[Video] Download error', e);
    }
  };

  const handleNewVideo = () => {
    resetGeneration();
    router.replace('/video-generate' as any);
  };

  const handleGoHome = () => {
    resetGeneration();
    router.replace('/(tabs)');
  };

  if (!resultVideoUrl) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Video nije dostupan</Text>
        <TouchableOpacity style={styles.errorBtn} onPress={handleClose}>
          <Text style={styles.errorBtnText}>Nazad</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen video */}
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
        allowsPictureInPicture={false}
      />

      {/* Dark overlays for text readability */}
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />

      {/* Top bar */}
      <Animated.View
        entering={FadeIn.delay(200).duration(400)}
        style={[styles.topBar, { paddingTop: insets.top + 8 }]}
      >
        <TouchableOpacity style={styles.topBtn} onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.brandWrap}>
          <AppLogo height={28} maxWidth={140} />
        </View>

        <View style={{ width: 40 }} />
      </Animated.View>

      {/* Center play/pause tap */}
      <TouchableOpacity
        style={styles.centerTap}
        onPress={handleTogglePlay}
        activeOpacity={1}
      >
        {!isPlaying && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.pauseIndicator}>
            <Ionicons name="play" size={48} color={COLORS.white} />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Right-side actions */}
      <Animated.View
        style={[styles.sideCol, { paddingBottom: insets.bottom + 100 }, sideStyle]}
      >
        {/* Save / Heart */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleSave} activeOpacity={0.7}>
          <View style={[styles.sideCircle, saved && styles.sideCircleActive]}>
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={22}
              color={saved ? GOLD : COLORS.white}
            />
          </View>
          <Text style={styles.sideBtnLabel}>Sačuvaj</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleShare} activeOpacity={0.7}>
          <View style={styles.sideCircle}>
            <Ionicons name="share-social-outline" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.sideBtnLabel}>Podeli</Text>
        </TouchableOpacity>

        {/* Download */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleDownload} activeOpacity={0.7}>
          <View style={styles.sideCircle}>
            <Ionicons name="download-outline" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.sideBtnLabel}>Preuzmi</Text>
        </TouchableOpacity>

        {/* New video */}
        <TouchableOpacity style={styles.sideBtn} onPress={handleNewVideo} activeOpacity={0.7}>
          <View style={styles.sideCircle}>
            <Ionicons name="refresh-outline" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.sideBtnLabel}>Novi</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom row */}
      <Animated.View
        style={[styles.bottomRow, { paddingBottom: insets.bottom + 14 }, bottomStyle]}
      >
        <TouchableOpacity style={styles.bottomChip} onPress={handleNewVideo} activeOpacity={0.85}>
          <Ionicons name="videocam-outline" size={16} color={COLORS.white} />
          <Text style={styles.bottomChipText}>Ponovo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomChip} onPress={handleGoHome} activeOpacity={0.85}>
          <Ionicons name="home-outline" size={16} color={COLORS.white} />
          <Text style={styles.bottomChipText}>Početna</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: W,
    height: H,
    position: 'absolute',
    top: 0,
    left: 0,
  },

  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  /* Top bar */
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    zIndex: 10,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandWrap: { alignItems: 'center' },
  brandText: {
    fontFamily: FONTS.heading.medium,
    fontSize: 14,
    color: COLORS.white,
    letterSpacing: 3,
    opacity: 0.7,
  },

  /* Center tap */
  centerTap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  pauseIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  /* Side actions */
  sideCol: {
    position: 'absolute',
    right: 14,
    bottom: 0,
    alignItems: 'center',
    gap: 18,
    zIndex: 10,
  },
  sideBtn: {
    alignItems: 'center',
    gap: 4,
  },
  sideCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  sideCircleActive: {
    backgroundColor: 'rgba(207,143,90,0.25)',
    borderColor: GOLD,
  },
  sideBtnLabel: {
    fontFamily: FONTS.primary.medium,
    fontSize: 10,
    color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.3,
  },

  /* Bottom row */
  bottomRow: {
    position: 'absolute',
    bottom: 0,
    left: 14,
    flexDirection: 'row',
    gap: 10,
    zIndex: 10,
  },
  bottomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bottomChipText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 13,
    color: COLORS.white,
  },

  /* Error */
  errorText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 16,
    color: COLORS.gray[500],
    marginBottom: 16,
  },
  errorBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: GOLD,
    borderRadius: 14,
  },
  errorBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: 14,
    color: COLORS.white,
  },
});
