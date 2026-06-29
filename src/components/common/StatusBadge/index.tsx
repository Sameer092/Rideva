import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '@colors';
import { SemiBold } from '@fonts';
import { wp, hp } from '@utils/utilities';

const TONES = {
  neutral: { bg: colors.dark100, text: colors.txtSecondary },
  success: { bg: colors.successSoft, text: colors.success },
  danger: { bg: colors.dangerSoft, text: colors.danger },
  brand: { bg: colors.primarySoft, text: colors.primaryDark },
};

function StatusBadge({ label, tone = 'neutral' }) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.text, { color: t.text }]}>{label}</Text>
    </View>
  );
}

export default StatusBadge;

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: wp(10),
    paddingHorizontal: wp(2.8),
    paddingVertical: hp(0.4)
  },
  text: {
    fontWeight: SemiBold,
    fontSize: wp(3),
    textTransform: 'capitalize'
  }
});
