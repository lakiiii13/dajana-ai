import { useEffect, useState } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { View } from 'react-native';
import { FONTS } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { WardrobeRailTabBar } from '@/components/WardrobeRailTabBar';
import { GuestBlockModal } from '@/components/GuestBlockModal';
import { useTheme } from '@/contexts/ThemeContext';
import { registerForPushNotifications } from '@/lib/notificationService';

const GUEST_PROTECTED_ROUTES = ['capsule', 'videos', 'ai-advice', 'profile'];

export default function TabLayout() {
  useAuthStore((state) => state.language);
  const isGuest = useAuthStore((state) => state.isGuest);
  const guestShowModal = useAuthStore((state) => state.guestShowModal);
  const setGuestShowModal = useAuthStore((state) => state.setGuestShowModal);
  const { colors } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [guestModalVisible, setGuestModalVisible] = useState(false);

  const isProtectedRoute = GUEST_PROTECTED_ROUTES.some((r) => pathname?.includes(r));
  const showGuestBlock = isGuest && isProtectedRoute;

  useEffect(() => {
    if (showGuestBlock) {
      setGuestModalVisible(true);
    }
  }, [showGuestBlock]);

  useEffect(() => {
    if (isGuest && guestShowModal) {
      setGuestModalVisible(true);
      setGuestShowModal(false);
    }
  }, [isGuest, guestShowModal, setGuestShowModal]);

  const handleGuestModalClose = () => {
    setGuestModalVisible(false);
    router.replace('/(tabs)');
  };

  // Kad si u tabovima i ulogovan – registruj push token
  useEffect(() => {
    if (!isGuest) {
      const id = setTimeout(() => registerForPushNotifications(), 300);
      return () => clearTimeout(id);
    }
  }, [isGuest]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => (
          <WardrobeRailTabBar
            {...props}
            isGuest={isGuest}
            onGuestBlock={() => setGuestModalVisible(true)}
          />
        )}
        screenOptions={{
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 0,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          fontFamily: FONTS.heading.semibold,
          fontSize: 18,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="capsule"
        options={{
          title: t('tabs.capsule'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="videos"
        options={{
          title: t('tabs.videos'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="ai-advice"
        options={{
          title: t('tabs.ai_advice'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
    <GuestBlockModal visible={guestModalVisible} onClose={handleGuestModalClose} />
    </View>
  );
}
