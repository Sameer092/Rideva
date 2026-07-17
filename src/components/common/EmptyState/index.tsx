import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';

function EmptyState({ icon = 'file-tray-outline', title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>
        <Icon name={icon} size={wp(9)} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export default EmptyState;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(8)
  },
  circle: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2)
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(4.6),
    color: colors.txtDark,
    textAlign: 'center'
  },
  subtitle: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary,
    textAlign: 'center',
    marginTop: hp(0.8)
  }
});
