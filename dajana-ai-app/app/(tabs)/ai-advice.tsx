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
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as FileSystem from '@/lib/safeFileSystem';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { getStyleAdvice, continueConversation, generateChatTitle, AdvisorMessage } from '@/lib/aiAdvisorService';
import { hasAnalysisCredits, deductAnalysisCredit } from '@/lib/creditService';
import { getSavedTryOnImages, SavedTryOnImage } from '@/lib/tryOnService';
import { t, getLanguage } from '@/lib/i18n';
import {
  loadAdviceChats,
  saveAdviceChat,
  buildSavedChat,
  titleFromMessages,
  deleteAdviceChat,
  type SavedAdviceChat,
} from '@/lib/adviceChatStorage';

const CHAT_LOGO = require('@/assets/images/OSB znak POZITIV.png');
const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AdvisorMessage[]>([]);
  const [currentImageBase64, setCurrentImageBase64] = useState<string | null>(null);

  const [savedChats, setSavedChats] = useState<SavedAdviceChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState<string>('');
  const [showChatListModal, setShowChatListModal] = useState(false);

  const isFirstVisit = false;
  // Image picker
  const [savedImages, setSavedImages] = useState<SavedTryOnImage[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SavedTryOnImage | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const typingDots = useRef(new Animated.Value(0)).current;
  const headerFade = useRef(new Animated.Value(0)).current;

  const chatContentOpacity = useSharedValue(1);
  const chatContentTranslateY = useSharedValue(0);

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const chatContentStyle = useAnimatedStyle(() => ({
    opacity: chatContentOpacity.value,
    transform: [{ translateY: chatContentTranslateY.value }],
  }));

  // Load saved images and saved chats when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadSavedImages();
      loadAdviceChats().then(setSavedChats);
    }, [])
  );

  // Naslov ćaska: iz prvog user poruke ili sačuvan
  useEffect(() => {
    if (messages.length > 0 && !currentChatTitle) {
      setCurrentChatTitle(titleFromMessages(messages));
    }
  }, [messages, currentChatTitle]);

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
    const userId = profile?.id ?? useAuthStore.getState().user?.id;
    if (!userId) return;
    try {
      const hasCredits = await hasAnalysisCredits(userId);
      if (!hasCredits) {
        setMessages((prev) => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
content: t('ai_advice.no_credits_message'),
        timestamp: new Date(),
        }]);
        return;
      }
    } catch {
      return;
    }
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
        content: t('ai_advice.try_on_question'),
        imageUri: imagePath,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        if (!currentChatId) setCurrentChatId(`chat-${Date.now()}`);
        return [...prev, userMsg];
      });

      // Prvo skini kredit, pa onda pozovi API
      await deductAnalysisCredit(userId);
      useAuthStore.getState().fetchCredits();

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

      generateChatTitle(userMsg.content, advice).then((title) => {
        if (title) setCurrentChatTitle(title);
      });

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
        content: err.message || t('ai_advice.error_ai'),
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
    if (!profile?.id) return;

    try {
      const hasCredits = await hasAnalysisCredits(profile.id);
      if (!hasCredits) {
        setMessages((prev) => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: t('ai_advice.no_credits_message'),
          timestamp: new Date(),
        }]);
        return;
      }
    } catch {
      return;
    }

    setInputText('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      if (!currentChatId) setCurrentChatId(`chat-${Date.now()}`);
      return next;
    });
    setIsLoading(true);

    try {
      const reply = await continueConversation(
        conversationHistory,
        text,
        currentImageBase64 || undefined,
        profile?.season ?? undefined,
        profile?.body_type ?? undefined
      );
      await deductAnalysisCredit(profile.id);
      useAuthStore.getState().fetchCredits();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const next = [...prev, assistantMsg];
        const wasFirstExchange = prev.length === 1;
        if (wasFirstExchange) {
          generateChatTitle(prev[0].content, reply).then((title) => {
            if (title) setCurrentChatTitle(title);
          });
        }
        return next;
      });

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
        content: err.message || t('ai_advice.error_ai_comm'),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (messages.length > 0) {
      const id = currentChatId || `chat-${Date.now()}`;
      const title = currentChatTitle || `Outfit ${savedChats.length + 1}`;
      const chat = buildSavedChat(id, messages, conversationHistory);
      const toSave: SavedAdviceChat = { ...chat, id, title };
      await saveAdviceChat(toSave);
      setSavedChats((prev) => [toSave, ...prev.filter((c) => c.id !== id)].slice(0, 50));
    }
    setMessages([]);
    setConversationHistory([]);
    setCurrentImageBase64(null);
    setSelectedImage(null);
    setCurrentChatId(null);
    setCurrentChatTitle('');
  };

  const handleDeleteChat = useCallback(
    (chat: SavedAdviceChat) => {
      Alert.alert(
        t('ai_advice.delete_chat_title'),
        t('ai_advice.delete_chat_message'),
        [
          { text: t('cancel') || 'Otkaži', style: 'cancel' },
          {
            text: t('ai_advice.delete_chat_confirm') || 'Obriši',
            style: 'destructive',
            onPress: async () => {
              await deleteAdviceChat(chat.id);
              setSavedChats((prev) => prev.filter((c) => c.id !== chat.id));
              if (currentChatId === chat.id) {
                setMessages([]);
                setConversationHistory([]);
                setCurrentImageBase64(null);
                setSelectedImage(null);
                setCurrentChatId(null);
                setCurrentChatTitle('');
              }
            },
          },
        ]
      );
    },
    [currentChatId]
  );

  const handleOpenChat = (chat: SavedAdviceChat) => {
    setShowChatListModal(false);
    setCurrentChatId(chat.id);
    setCurrentChatTitle(chat.title);
    setMessages(
      (chat.messages ?? []).map((m) => ({
        id: `${m.role}-${m.timestamp}-${Math.random()}`,
        role: m.role,
        content: m.content,
        imageUri: m.imageUri,
        timestamp: new Date(m.timestamp),
      }))
    );
    setConversationHistory(
      (chat.conversationHistoryText ?? []).map((m) => ({ role: m.role, content: m.content }))
    );
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
          <View style={[styles.avatarWrap, { backgroundColor: 'transparent', borderColor: CHAT_BORDER }]}>
            <Image source={CHAT_LOGO} style={styles.avatarLogoImg} resizeMode="contain" />
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
            {item.timestamp.toLocaleTimeString(getLanguage() === 'en' ? 'en-US' : 'sr-RS', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isLoading) return null;

    return (
      <View style={[styles.messageRow, styles.messageRowAssistant]}>
        <View style={[styles.avatarWrap, { backgroundColor: 'transparent', borderColor: CHAT_BORDER }]}>
          <Image source={CHAT_LOGO} style={styles.avatarLogoImg} resizeMode="contain" />
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
            <Text style={[styles.modalTitle, { color: CHAT_DARK }]} numberOfLines={1} ellipsizeMode="tail">{t('ai_advice.modal_title')}</Text>
            <TouchableOpacity onPress={() => setShowImagePicker(false)} style={[styles.modalCloseBtn, { backgroundColor: CHAT_CARD, borderWidth: 1, borderColor: CHAT_BORDER }]}>
              <Ionicons name="close" size={20} color={CHAT_DARK} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalSubtitle, { color: '#6B6560' }]}>
            {t('ai_advice.modal_subtitle')}
          </Text>

          {savedImages.length === 0 ? (
            <View style={styles.noImagesWrap}>
              <Ionicons name="images-outline" size={48} color="#C4BDB2" />
              <Text style={[styles.noImagesText, { color: '#6B6560' }]}>
                {t('ai_advice.no_images')}
              </Text>
              <Text style={[styles.noImagesHint, { color: '#9B9590' }]}>
                {t('ai_advice.no_images_hint')}
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
                    { borderColor: selectedImage?.uri === img.uri ? COLORS.primary : CHAT_BORDER },
                  ]}
                  onPress={() => handleSelectImage(img)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: img.uri }} style={styles.imageGridThumb} resizeMode="cover" />
                  <View style={[styles.imageGridOverlay, { backgroundColor: 'rgba(0,0,0,0.03)' }]}>
                    <View style={[styles.imageGridBadge, { backgroundColor: `${COLORS.primary}22` }]}>
                      <Ionicons name="sparkles" size={10} color={COLORS.primary} />
                      <Text style={[styles.imageGridBadgeText, { color: COLORS.primary }]}>AI</Text>
                    </View>
                  </View>
                  <Text style={[styles.imageGridDate, { color: colors.textSecondary }]}>
                    {new Date(img.timestamp).toLocaleDateString(getLanguage() === 'en' ? 'en-US' : 'sr-RS', { day: 'numeric', month: 'short' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // ---- Empty State: logo + dugme Galerija / Izaberi sliku ----
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Animated.View style={[styles.emptyAvatarContainer, { opacity: headerFade }]}>
        <View style={[styles.emptyAvatar, { backgroundColor: 'transparent', borderWidth: 0 }]}>
          <Image source={CHAT_LOGO} style={styles.emptyLogoImg} resizeMode="contain" />
        </View>
      </Animated.View>
      <View style={styles.emptyStateButtons}>
        <TouchableOpacity
          style={[styles.emptyStateBtn, { borderColor: COLORS.primary, backgroundColor: COLORS.primary }]}
          onPress={() => setShowImagePicker(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="images-outline" size={20} color="#FFFFFF" />
          <Text style={[styles.emptyStateBtnText, { color: '#FFFFFF' }]}>{t('ai_advice.choose_image_btn')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
              <View style={[styles.headerAvatar, { backgroundColor: 'transparent', borderColor: CHAT_BORDER }]}>
                <Image source={CHAT_LOGO} style={styles.headerLogoImg} resizeMode="contain" />
              </View>
              <Text style={[styles.headerName, { color: CHAT_DARK }]} numberOfLines={1} ellipsizeMode="tail">
                {currentChatTitle || 'Outfit 1'}
              </Text>
            </View>
            <View style={styles.headerRight}>
              {savedChats.length > 0 && (
                <TouchableOpacity
                  style={[styles.headerBtn, { backgroundColor: CHAT_INPUT_BG, borderWidth: 1, borderColor: CHAT_BORDER }]}
                  onPress={() => setShowChatListModal(true)}
                >
                  <Feather name="list" size={18} color={CHAT_DARK} />
                </TouchableOpacity>
              )}
              {messages.length > 0 && (
                <>
                  <TouchableOpacity
                    style={[styles.headerBtn, { backgroundColor: `${COLORS.primary}18`, borderWidth: 1, borderColor: COLORS.primary }]}
                    onPress={() => setShowImagePicker(true)}
                  >
                    <Ionicons name="images-outline" size={17} color={COLORS.primary} />
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

            <View style={[styles.inputBarWrap, { paddingBottom: 0 }]}>
              <View style={[styles.inputBarCard, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }]}>
                <View style={styles.inputBar}>
                  <TouchableOpacity
                    style={[styles.attachBtn, { backgroundColor: `${COLORS.primary}18` }]}
                    onPress={() => setShowImagePicker(true)}
                    hitSlop={8}
                  >
                    <Ionicons name="images-outline" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                  <View style={[styles.inputPill, { backgroundColor: CHAT_INPUT_BG }]}>
                    <TextInput
                      style={[styles.textInput, { color: CHAT_DARK }]}
                      placeholder={t('ai_advice.placeholder')}
                      placeholderTextColor="#9B9590"
                      value={inputText}
                      onChangeText={setInputText}
                      multiline
                      maxLength={500}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendBtn,
                        inputText.trim() && !isLoading ? styles.sendBtnActive : styles.sendBtnInactive,
                      ]}
                      onPress={handleSend}
                      disabled={!inputText.trim() || isLoading}
                      hitSlop={8}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={20}
                        color={inputText.trim() && !isLoading ? '#FFFFFF' : '#B8B0A8'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </AnimatedReanimated.View>
      </SafeAreaView>

      {renderImagePickerModal()}

      {/* Lista sačuvanih razgovora */}
      <Modal visible={showChatListModal} animationType="slide" transparent onRequestClose={() => setShowChatListModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.chatListModal, { backgroundColor: CHAT_BG }]}>
            <View style={[styles.modalHeader, { borderBottomColor: CHAT_BORDER }]}>
              <Text style={[styles.modalTitle, { color: CHAT_DARK }]} numberOfLines={1} ellipsizeMode="tail">{t('ai_advice.chat_list_title')}</Text>
              <TouchableOpacity onPress={() => setShowChatListModal(false)} style={[styles.modalCloseBtn, { backgroundColor: CHAT_CARD, borderWidth: 1, borderColor: CHAT_BORDER }]}>
                <Ionicons name="close" size={20} color={CHAT_DARK} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.chatListScroll} showsVerticalScrollIndicator={true}>
              {savedChats.length === 0 ? (
                <Text style={[styles.chatListEmpty, { color: '#6B6560' }]}>{t('ai_advice.chat_list_empty')}</Text>
              ) : (
                savedChats.map((chat) => (
                  <View key={chat.id} style={[styles.chatListItem, { backgroundColor: CHAT_CARD, borderColor: CHAT_BORDER }]}>
                    <TouchableOpacity style={styles.chatListItemContent} onPress={() => handleOpenChat(chat)} activeOpacity={0.8}>
                      <Text style={[styles.chatListItemTitle, { color: CHAT_DARK }]} numberOfLines={1}>{chat.title}</Text>
                      <Text style={[styles.chatListItemDate, { color: '#9B9590' }]}>
                        {new Date(chat.createdAt).toLocaleDateString(getLanguage() === 'en' ? 'en-US' : 'sr-RS', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.chatListItemDelete, { backgroundColor: `${COLORS.error}12` }]}
                      onPress={() => handleDeleteChat(chat)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerLogoImg: {
    width: 28,
    height: 28,
  },
  headerName: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.3,
    flex: 1,
    minWidth: 0,
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
    paddingBottom: 140,
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
    overflow: 'hidden',
  },
  avatarLogoImg: {
    width: 22,
    height: 22,
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
    marginBottom: SPACING.md,
    position: 'relative',
  },
  emptyAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emptyLogoImg: {
    width: 72,
    height: 72,
  },
  emptySubtitle: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    color: '#6B6560',
  },
  emptyStateButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  emptyStateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 24,
    borderWidth: 1,
  },
  emptyStateBtnText: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
  },

  // Input bar – lebdeća zaobljena kutija, odvojena od ivica
  inputBarWrap: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 0,
  },
  inputBarCard: {
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 22,
    paddingLeft: SPACING.md,
    paddingRight: 4,
    paddingVertical: 6,
    minHeight: 48,
    maxHeight: 100,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.md,
    maxHeight: 84,
    minHeight: 36,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingRight: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
  sendBtnInactive: {
    backgroundColor: 'transparent',
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
    gap: SPACING.sm,
  },
  modalTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    letterSpacing: 0.3,
    flex: 1,
    minWidth: 0,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatListModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 24,
  },
  chatListScroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    maxHeight: 400,
  },
  chatListEmpty: {
    fontFamily: FONTS.primary.regular,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  chatListItemContent: {
    flex: 1,
    padding: SPACING.md,
  },
  chatListItemDelete: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatListItemTitle: {
    fontFamily: FONTS.primary.semibold,
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  chatListItemDate: {
    fontFamily: FONTS.primary.regular,
    fontSize: 12,
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
