import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '@colors';
import { Bold } from '@fonts';
import { wp, hp } from '@utils/utilities';

function Button({ label, onPress, loading, disabled, buttonStyle, labelStyle, variant = 'primary' }) {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const base = isOutline ? styles.outline : isDanger ? styles.danger : styles.primary;
  const elevated = variant === 'primary' && !disabled && !loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled || loading}
      onPress={onPress}
      style={[styles.button, base, elevated && styles.shadow, (disabled || loading) && styles.disabled, buttonStyle]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.ink} />
      ) : (
        <Text style={[styles.label, isOutline ? styles.labelOutline : isDanger ? styles.labelDanger : styles.labelPrimary, labelStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default Button;

const styles = StyleSheet.create({
  button: {
    height: hp(6.8),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  primary: {
    backgroundColor: colors.primary
  },
  danger: {
    backgroundColor: colors.dangerSoft
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1.5,
    borderColor: colors.border
  },
  shadow: {
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6
  },
  disabled: {
    opacity: 0.45
  },
  label: {
    fontWeight: Bold,
    fontSize: wp(4.2)
  },
  labelPrimary: {
    color: colors.ink
  },
  labelDanger: {
    color: colors.danger
  },
  labelOutline: {
    color: colors.txtDark
  }
});
