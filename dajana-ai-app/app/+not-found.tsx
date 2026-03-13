import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { t } from '@/lib/i18n';
import { FONTS } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: t('not_found_title') }} />
      <View style={styles.container}>
        <Text style={styles.title}>{t('not_found_message')}</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{t('not_found_link')}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.heading.semibold,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    fontFamily: FONTS.primary.medium,
    color: '#2e78b7',
  },
});
