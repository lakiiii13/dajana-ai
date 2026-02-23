import { Tabs } from 'expo-router';
import { FONTS } from '@/constants/theme';
import { t } from '@/lib/i18n';
import { useAuthStore } from '@/stores/authStore';
import { WardrobeRailTabBar } from '@/components/WardrobeRailTabBar';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  useAuthStore((state) => state.language);
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <WardrobeRailTabBar {...props} />}
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
  );
}
