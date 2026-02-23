// ===========================================
// DAJANA AI - AI Savetnik (AI Advice Chat)
// Phase 6: Fashion advisor chat with GPT-4 Vision
// Pick from saved try-on images, Dajana gives advice
// Cream/white theme matching the rest of the app
// ===========================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedReanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as FileSystem from '@/lib/safeFileSystem';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { getStyleAdvice, continueConversation, AdvisorMessage } from '@/lib/aiAdvisorService';
import { getSavedTryOnImages, SavedTryOnImage } from '@/lib/tryOnService';
import { AtelierFlow } from '@/components/atelier/AtelierFlow';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const getFirstVisitKey = (userId: string | undefined) =>
  userId ? `dajana_chat_first_visit_${userId}` : 'dajana_chat_first_visit';
const WELCOME_AVATAR_SIZE = 100;
const HEADER_AVATAR_SIZE = 40;
const TYPEWRITER_MS = 95;
const PAUSE_AFTER_GREETING_MS = 1400;
const TRANSITION_DURATION_MS = 1200;
const CHAT_BG = '#FAF9F7';
const CHAT_CARD = '#FFFFFF';
const CHAT_BORDER = '#E8E2DA';
const CHAT_INPUT_BG = '#FFFFFF';
const CHAT_GOLD = '#B8956B';
const CHAT_DARK = '#2C2A28';
const CHAT_USER_BUBBLE = '#DCE8E2'; // muted green from brand
const CHAT_BUBBLE_RADIUS = 24;

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  imageUri?: string;
  timestamp: Date;
}

export default function AIAdviceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);

  const handleExitChat = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  // Entering Dajana's Atelier: 3-screen flow before chat
  const [atelierStep, setAtelierStep] = useState<1 | 2 | 3 | 'chat'>(1);
  const handleAtelierNext = useCallback((next: 2 | 3) => setAtelierStep(next), []);
  const handleAtelierComplete = useCallback(() => setAtelierStep('chat'), []);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AdvisorMessage[]>([]);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);

  // First visit / welcome animation
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  const [greetingText, setGreetingText] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);
  const greetingFull = `Zdravo ${profile?.full_name?.trim() || 'ti'}.\n\nSpremna sam da ti pomognem.`;

  // Image picker
  const [savedImages, setSavedImages] = useState<SavedTryOnImage[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SavedTryOnImage | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingDots = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  // Reanimated: first-visit welcome
  const overlayOpacity = useSharedValue(1);
  const avatarScale = useSharedValue(1);
  const avatarTranslateX = useSharedValue(0);
  const avatarTranslateY = useSharedValue(0);
  const greetingOpacity = useSharedValue(1);
  const chatContentOpacity = useSharedValue(0);
  const chatContentTranslateY = useSharedValue(36);

  const userId = useAuthStore((s) => s.profile?.id);

  // Check first visit from AsyncStorage (per user)
  useEffect(() => {
    if (userId === undefined) return;
    let cancelled = false;
    const key = getFirstVisitKey(userId);
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (!cancelled) setIsFirstVisit(stored !== 'false');
      } catch {
        if (!cancelled) setIsFirstVisit(true);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // Typewriter effect when first visit
  useEffect(() => {
    if (isFirstVisit !== true || greetingFull.length === 0) return;
    let i = 0;
    setGreetingText('');
    const id = setInterval(() => {
      i += 1;
      if (i <= greetingFull.length) {
        setGreetingText(greetingFull.slice(0, i));
      } else {
        clearInterval(id);
        setTypewriterDone(true);
      }
    }, TYPEWRITER_MS);
    return () => clearInterval(id);
  }, [isFirstVisit, greetingFull]);

  // Transition: avatar to header, greeting fade, chat fade in, overlay fade out
  useEffect(() => {
    if (!typewriterDone || isFirstVisit !== true) return;
    const headerX = SPACING.md + HEADER_AVATAR_SIZE / 2 - SCREEN_WIDTH / 2;
    const headerY = insets.top + SPACING.sm + 2 + HEADER_AVATAR_SIZE / 2 - SCREEN_HEIGHT / 2;
    const scale = HEADER_AVATAR_SIZE / WELCOME_AVATAR_SIZE;

    const key = getFirstVisitKey(userId);
    const finishFirstVisit = () => {
      setIsFirstVisit(false);
      AsyncStorage.setItem(key, 'false').catch(() => {});
    };

    const t = setTimeout(() => {
      // Start avatar move + greeting fade after pause
      avatarScale.value = withDelay(
        PAUSE_AFTER_GREETING_MS,
        withTiming(scale, { duration: TRANSITION_DURATION_MS, easing: Easing.out(Easing.cubic) })
      );
      avatarTranslateX.value = withDelay(
        PAUSE_AFTER_GREETING_MS,
        withTiming(headerX, { duration: TRANSITION_DURATION_MS, easing: Easing.out(Easing.cubic) })
      );
      avatarTranslateY.value = withDelay(
        PAUSE_AFTER_GREETING_MS,
        withTiming(headerY, { duration: TRANSITION_DURATION_MS, easing: Easing.out(Easing.cubic) })
      );
      greetingOpacity.value = withDelay(
        PAUSE_AFTER_GREETING_MS,
        withTiming(0, { duration: TRANSITION_DURATION_MS * 0.75 })
      );
      // Chat content fades in from bottom (midway through avatar move)
      chatContentOpacity.value = withDelay(
        PAUSE_AFTER_GREETING_MS + 480,
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
      );
      chatContentTranslateY.value = withDelay(
        PAUSE_AFTER_GREETING_MS + 480,
        withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
      );
      // Fade out overlay and mark first visit done
      overlayOpacity.value = withDelay(
        PAUSE_AFTER_GREETING_MS + TRANSITION_DURATION_MS + 500,
        withTiming(0, { duration: 380 }, () => {
          runOnJS(finishFirstVisit)();
        })
      );
    }, 80);
    return () => clearTimeout(t);
  }, [typewriterDone, isFirstVisit, insets.top, userId]);

  // Normal header fade + show chat content when not first visit
  useEffect(() => {
    if (isFirstVisit !== false) return;
    chatContentOpacity.value = withTiming(1, { duration: 300 });
    chatContentTranslateY.value = withTiming(0, { duration: 300 });
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isFirstVisit]);

  const welcomeOverlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));
  const welcomeAvatarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: avatarTranslateX.value },
      { translateY: avatarTranslateY.value },
      { scale: avatarScale.value },
    ],
  }));
  const welcomeGreetingStyle = useAnimatedStyle(() => ({
    opacity: greetingOpacity.value,
  }));
  const chatContentStyle = useAnimatedStyle(() => ({
    opacity: chatContentOpacity.value,
    transform: [{ translateY: chatContentTranslateY.value }],
  }));

  // Load saved images when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadSavedImages();
    }, [])
  );

  // Typing dots animation
  useEffect(() => {
    if (isLoading) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(typingDots, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [isLoading]);

  const loadSavedImages = async () => {
    try {
      const images = await getSavedTryOnImages();
      setSavedImages(images);
    } catch (err) {
      console.error('[Advice] Error loading images:', err);
    }
  };

  const handleSelectImage = async (image: SavedTryOnImage) => {
    setShowImagePicker(false);
    setSelectedImage(image);
    setIsLoading(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setCurrentImageBase64(base64);

      const imagePath = typeof image.uri === 'string' ? image.uri : (image.uri as any)?.uri ?? (image.uri as any)?.path ?? '';
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: 'Isprobala sam ovaj outfit virtuelno. Kako mi stoji? Daj mi savete!',
        imageUri: imagePath,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Call GPT-4o Vision (sezona + građa za univerzalni prompt analize)
      const advice = await getStyleAdvice(
        base64,
        null,
        undefined,
        profile?.season ?? undefined,
        profile?.body_type ?? undefined
      );

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: advice,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Store conversation history for follow-ups
      setConversationHistory([
        {
          role: 'user',
          content: [
            { type: 'text', text: userMsg.content },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}`, detail: 'high' } },
          ],
        },
        { role: 'assistant', content: advice },
      ]);
    } catch (err: any) {
      console.error('[Advice] Error:', err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err.message || 'Izvinite, desila se greška. Pokušajte ponovo.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const reply = await continueConversation(
        conversationHistory,
        text,
        currentImageBase64 || undefined,
        profile?.season ?? undefined,
        profile?.body_type ?? undefined
      );

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Update conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: err.message || 'Greška u komunikaciji sa AI.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setCurrentImageBase64(null);
    setSelectedImage(null);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowUser : styles.messageRowAssistant,
        ]}
      >
        {!isUser && (
          <View style={[styles.avatarWrap, { backgroundColor: `${CHAT_GOLD}14`, borderColor: CHAT_BORDER }]}>
            <Text style={styles.avatarText}>D</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: CHAT_USER_BUBBLE, borderWidth: 1, borderColor: CHAT_BORDER }]
              : [styles.assistantBubble, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }],
          ]}
        >
          {item.imageUri && (
            <View style={styles.messageImageWrap}>
              <Image source={{ uri: item.imageUri }} style={styles.messageImage} resizeMode="cover" />
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : { color: CHAT_DARK },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isUser ? styles.userTimeText : { color: '#9B9590' },
            ]}
          >
            {item.timestamp.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageRow, styles.messageRowAssistant]}>
        <View style={[styles.avatarWrap, { backgroundColor: `${CHAT_GOLD}14`, borderColor: CHAT_BORDER }]}>
          <Text style={styles.avatarText}>D</Text>
        </View>
        <View style={[styles.typingBubble, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }]}>
          <Animated.View style={[styles.typingDot, { opacity: typingDots, backgroundColor: CHAT_GOLD }]} />
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: typingDots.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                backgroundColor: CHAT_GOLD,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              {
                opacity: typingDots.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
                backgroundColor: CHAT_GOLD,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  // ---- Image Picker Modal ----
  const renderImagePickerModal = () => (
    <Modal
      visible={showImagePicker}
      animationType="slide"
      transparent
      onRequestClose={() => setShowImagePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: CHAT_BG }]}>
          {/* Modal header */}
          <View style={[styles.modalHeader, { borderBottomColor: CHAT_BORDER }]}>
            <Text style={[styles.modalTitle, { color: CHAT_DARK }]}>Izaberi sliku</Text>
            <TouchableOpacity onPress={() => setShowImagePicker(false)} style={[styles.modalCloseBtn, { backgroundColor: CHAT_CARD, borderWidth: 1, borderColor: CHAT_BORDER }]}>
              <Ionicons name="close" size={20} color={CHAT_DARK} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalSubtitle, { color: '#6B6560' }]}>
            Izaberi generisanu sliku za Dajanin savet
          </Text>

          {savedImages.length === 0 ? (
            <View style={styles.noImagesWrap}>
              <Ionicons name="images-outline" size={48} color="#C4BDB2" />
              <Text style={[styles.noImagesText, { color: '#6B6560' }]}>
                Nemaš generisane slike
              </Text>
              <Text style={[styles.noImagesHint, { color: '#9B9590' }]}>
                Isprobaj outfit u Kapsuli pa se vrati ovde
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.imageGrid}
              showsVerticalScrollIndicator={false}
            >
              {savedImages.map((img) => (
                <TouchableOpacity
                  key={img.uri}
                  style={[
                    styles.imageGridItem,
                    { borderColor: selectedImage?.uri === img.uri ? CHAT_GOLD : CHAT_BORDER },
                  ]}
                  onPress={() => handleSelectImage(img)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: img.uri }} style={styles.imageGridThumb} resizeMode="cover" />
                  <View style={[styles.imageGridOverlay, { backgroundColor: 'rgba(0,0,0,0.03)' }]}>
                    <View style={[styles.imageGridBadge, { backgroundColor: `${CHAT_GOLD}22` }]}>
                      <Ionicons name="sparkles" size={10} color={CHAT_GOLD} />
                      <Text style={[styles.imageGridBadgeText, { color: CHAT_GOLD }]}>AI</Text>
                    </View>
                  </View>
                  <Text style={[styles.imageGridDate, { color: colors.textSecondary }]}>
                    {new Date(img.timestamp).toLocaleDateString('sr-RS', { day: 'numeric', month: 'short' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // ---- Empty State ----
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Animated.View style={[styles.emptyAvatarContainer, { opacity: headerFade }]}>
        <View style={[styles.emptyAvatar, { backgroundColor: `${CHAT_GOLD}12`, borderWidth: 1.5, borderColor: CHAT_BORDER }]}>
          <Text style={styles.emptyAvatarLetter}>D</Text>
        </View>
        <View style={[styles.onlineIndicator, { backgroundColor: '#7BA57B', borderColor: CHAT_BG }]} />
      </Animated.View>

      <Text style={[styles.emptyTitle, { color: CHAT_DARK }]}>Pitaj Dajanu</Text>
      <Text style={[styles.emptySubtitle, { color: '#6B6560' }]}>
        Tvoj lični AI modni savetnik
      </Text>

      <TouchableOpacity
        style={[styles.pickImageBtn, { backgroundColor: CHAT_CARD, borderWidth: 1.5, borderColor: CHAT_BORDER }]}
        onPress={() => setShowImagePicker(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="images-outline" size={20} color={CHAT_GOLD} />
        <Text style={[styles.pickImageBtnText, { color: CHAT_GOLD }]}>Izaberi generisanu sliku</Text>
      </TouchableOpacity>

      <Text style={[styles.pickImageHint, { color: '#9B9590' }]}>
        Dajana će analizirati outfit i dati ti savete
      </Text>

      <View style={[styles.divider, { backgroundColor: CHAT_BORDER }]} />
      <Text style={[styles.dividerText, { color: '#9B9590' }]}>ili postavi pitanje o modi</Text>

      <View style={styles.suggestionsWrap}>
        <TouchableOpacity
          style={[styles.suggestionChip, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }]}
          onPress={() => setInputText('Koji su trendovi za ovu sezonu?')}
        >
          <Ionicons name="trending-up-outline" size={14} color={CHAT_GOLD} />
          <Text style={[styles.suggestionText, { color: CHAT_DARK }]}>Trendovi sezone</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suggestionChip, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }]}
          onPress={() => setInputText('Kako da kombinujem boje u outfitu?')}
        >
          <Ionicons name="color-palette-outline" size={14} color={CHAT_GOLD} />
          <Text style={[styles.suggestionText, { color: CHAT_DARK }]}>Kombinovanje boja</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suggestionChip, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }]}
          onPress={() => setInputText('Šta da obučem za poslovni sastanak?')}
        >
          <Ionicons name="briefcase-outline" size={14} color={CHAT_GOLD} />
          <Text style={[styles.suggestionText, { color: CHAT_DARK }]}>Poslovni outfit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.suggestionChip, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }]}
          onPress={() => setInputText('Koji aksesori idu uz malu crnu haljinu?')}
        >
          <Ionicons name="diamond-outline" size={14} color={CHAT_GOLD} />
          <Text style={[styles.suggestionText, { color: CHAT_DARK }]}>Aksesori savet</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const showWelcomeOverlay = isFirstVisit === true;

  if (atelierStep !== 'chat') {
    return (
      <AtelierFlow
        userName={profile?.full_name}
        step={atelierStep}
        onNext={handleAtelierNext}
        onComplete={handleAtelierComplete}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: CHAT_BG }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Chat content (header + messages + input) – fades in from bottom on first visit */}
        <AnimatedReanimated.View style={[styles.chatContentWrap, chatContentStyle]}>
          <Animated.View style={[styles.header, { opacity: headerFade, borderBottomColor: CHAT_BORDER }]}>
            <TouchableOpacity
              style={[styles.headerBackBtn, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }]}
              onPress={handleExitChat}
              activeOpacity={0.8}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={22} color={CHAT_DARK} />
            </TouchableOpacity>
            <View style={styles.headerLeft}>
              <View style={[styles.headerAvatar, { backgroundColor: `${CHAT_GOLD}18`, borderColor: `${CHAT_GOLD}30` }]}>
                <Text style={styles.headerAvatarText}>D</Text>
              </View>
              <View>
                <Text style={[styles.headerName, { color: CHAT_DARK }]}>Dajana</Text>
                <View style={styles.headerOnlineRow}>
                  <View style={[styles.headerOnlineDot, { backgroundColor: '#7BA57B' }]} />
                  <Text style={[styles.headerOnlineText, { color: '#6B8E6B' }]}>Online</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              {messages.length > 0 && (
                <>
                  <TouchableOpacity
                    style={[styles.headerBtn, { backgroundColor: `${CHAT_GOLD}12`, borderWidth: 1, borderColor: CHAT_BORDER }]}
                    onPress={() => setShowImagePicker(true)}
                  >
                    <Ionicons name="images-outline" size={17} color={CHAT_GOLD} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.headerBtn, { backgroundColor: CHAT_INPUT_BG, borderWidth: 1, borderColor: CHAT_BORDER }]}
                    onPress={handleNewChat}
                  >
                    <Feather name="plus" size={18} color={CHAT_DARK} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>

          <KeyboardAvoidingView
            style={styles.chatArea}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            {messages.length === 0 && !isLoading ? (
              renderEmptyState()
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={renderTypingIndicator}
              />
            )}

            <View style={[styles.inputBar, { backgroundColor: CHAT_BG, borderTopColor: CHAT_BORDER, paddingBottom: insets.bottom + SPACING.sm }]}>
              <TouchableOpacity
                style={[styles.attachBtn, { backgroundColor: CHAT_CARD, borderWidth: 1, borderColor: CHAT_BORDER }]}
                onPress={() => setShowImagePicker(true)}
              >
                <Ionicons name="images-outline" size={20} color={CHAT_GOLD} />
              </TouchableOpacity>
              <View style={[styles.inputWrap, { backgroundColor: CHAT_INPUT_BG, borderColor: CHAT_BORDER }]}>
                <TextInput
                  style={[styles.textInput, { color: CHAT_DARK }]}
                  placeholder="Opiši kako želiš da izgledaš danas…"
                  placeholderTextColor="#9B9590"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  inputText.trim() && !isLoading
                    ? { backgroundColor: CHAT_GOLD }
                    : { backgroundColor: CHAT_CARD, borderWidth: 1, borderColor: CHAT_BORDER },
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="arrow-up"
                  size={20}
                  color={inputText.trim() && !isLoading ? '#FFFFFF' : '#9B9590'}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </AnimatedReanimated.View>

        {/* First-visit welcome overlay */}
        {showWelcomeOverlay && (
          <AnimatedReanimated.View style={[styles.welcomeOverlay, welcomeOverlayStyle]} pointerEvents="box-none">
            <View style={styles.welcomeCenter}>
              <AnimatedReanimated.View style={[styles.welcomeAvatarWrap, welcomeAvatarStyle]}>
                <View style={styles.welcomeAvatar}>
                  <Text style={styles.welcomeAvatarLetter}>D</Text>
                </View>
                <View style={styles.welcomeOnlineDot} />
              </AnimatedReanimated.View>
              <AnimatedReanimated.Text style={[styles.welcomeGreeting, welcomeGreetingStyle]}>
                {greetingText}
              </AnimatedReanimated.Text>
            </View>
          </AnimatedReanimated.View>
        )}
      </SafeAreaView>

      {renderImagePickerModal()}
    </View>
  );
}

const GRID_GAP = 10;
const GRID_COLS = 3;
const GRID_ITEM_SIZE = (SCREEN_WIDTH - SPACING.lg * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const GOLD = '#CF8F5A';
const DARK = '#2C2A28';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  chatContentWrap: {
    flex: 1,
  },

  // First-visit welcome
  welcomeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CHAT_BG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeAvatarWrap: {
    width: WELCOME_AVATAR_SIZE,
    height: WELCOME_AVATAR_SIZE,
  },
  welcomeAvatar: {
    width: WELCOME_AVATAR_SIZE,
    height: WELCOME_AVATAR_SIZE,
    borderRadius: WELCOME_AVATAR_SIZE / 2,
    backgroundColor: '#FAF9F7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: CHAT_BORDER,
  },
  welcomeAvatarLetter: {
    fontFamily: FONTS.heading.bold,
    fontSize: 44,
    color: GOLD,
  },
  welcomeOnlineDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#7BA57B',
    borderWidth: 2,
    borderColor: CHAT_BG,
  },
  welcomeGreeting: {
    fontFamily: FONTS.heading.medium,
    fontSize: 22,
    color: DARK,
    letterSpacing: 1.2,
    marginTop: 28,
    textAlign: 'center',
    lineHeight: 32,
    paddingHorizontal: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm + 2,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerAvatarText: {
    fontFamily: FONTS.heading.bold,
    fontSize: 18,
    color: GOLD,
  },
  headerName: {
    fontFamily: FONTS.logo,
    fontSize: 22,
    letterSpacing: 1,
  },
  headerOnlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  headerOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerOnlineText: {
    fontFamily: FONTS.primary.medium,
    fontSize: 11,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat area
  chatArea: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: 120,
  },

  // Messages
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  messageRowAssistant: {
    alignSelf: 'flex-start',
    alignItems: 'flex-end',
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 4,
    borderWidth: 1,
  },
  avatarText: {
    fontFamily: FONTS.heading.bold,
    fontSize: 14,
    color: GOLD,
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: CHAT_BUBBLE_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  messageImageWrap: {
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  messageImage: {
    width: SCREEN_WIDTH * 0.55,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: BORDER_RADIUS.lg,
  },
  messageText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  userMessageText: {
    color: CHAT_DARK,
  },
  messageTime: {
    fontFamily: FONTS.primary.light,
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: '#9B9590',
  },

  // Typing indicator
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    borderRadius: CHAT_BUBBLE_RADIUS,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyAvatarContainer: {
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyAvatarLetter: {
    fontFamily: FONTS.heading.bold,
    fontSize: 36,
    color: GOLD,
  },
  onlineIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    bottom: 4,
    right: 4,
    borderWidth: 2,
  },
  emptyTitle: {
    fontFamily: FONTS.logo,
    fontSize: FONT_SIZES['3xl'],
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xl,
  },

  // Pick Image CTA
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.sm,
  },
  pickImageBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    letterSpacing: 0.3,
  },
  pickImageHint: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.lg,
  },

  // Divider
  divider: {
    width: 60,
    height: 1,
    marginBottom: SPACING.sm,
  },
  dividerText: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.md,
  },

  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md - 2,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  suggestionText: {
    fontFamily: FONTS.primary.medium,
    fontSize: FONT_SIZES.xs,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderTopWidth: 1,
    gap: SPACING.sm,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 1 : 0,
  },
  inputWrap: {
    flex: 1,
    borderRadius: CHAT_BUBBLE_RADIUS,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm + 2 : SPACING.xs,
    maxHeight: 100,
  },
  textInput: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    maxHeight: 80,
    minHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 1 : 0,
  },

  // ---- Image Picker Modal ----
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontFamily: FONTS.heading.semibold,
    fontSize: FONT_SIZES.lg,
    letterSpacing: 0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },

  // No images
  noImagesWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl + 20,
  },
  noImagesText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.md,
  },
  noImagesHint: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },

  // Image grid
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: GRID_GAP,
    paddingBottom: SPACING.lg,
  },
  imageGridItem: {
    width: GRID_ITEM_SIZE,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
  },
  imageGridThumb: {
    width: '100%',
    height: GRID_ITEM_SIZE * 1.3,
  },
  imageGridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 6,
    alignItems: 'flex-end',
  },
  imageGridBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  imageGridBadgeText: {
    fontFamily: FONTS.primary.bold,
    fontSize: 9,
  },
  imageGridDate: {
    fontFamily: FONTS.primary.regular,
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 4,
  },
});
