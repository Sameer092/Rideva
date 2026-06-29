import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '@colors';
import { SemiBold } from '@fonts';
import { wp, hp } from '@utils/utilities';

function Button({ label, onPress, loading, disabled, buttonStyle, labelStyle, variant = 'primary' }) {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.button, isOutline ? styles.outline : isDanger ? styles.danger : styles.primary, (disabled || loading) && styles.disabled, buttonStyle]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.label, isOutline ? styles.labelOutline : styles.labelPrimary, labelStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

export default Button;

const styles = StyleSheet.create({
  button: {
    height: hp(6.5),
    borderRadius: wp(3.5),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  primary: {
    backgroundColor: colors.primary
  },
  danger: {
    backgroundColor: colors.danger
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.border
  },
  disabled: {
    opacity: 0.5
  },
  label: {
    fontWeight: SemiBold,
    fontSize: wp(4)
  },
  labelPrimary: {
    color: colors.white
  },
  labelOutline: {
    color: colors.txtDark
  }
});
