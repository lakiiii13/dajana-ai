import { Text, TextProps } from './Themed';
import { FONTS } from '@/constants/theme';

export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: FONTS.primary.regular }]} />;
}
