import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Regular, Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';

function TextField({ label, value, onChangeText, placeholder, error, password, keyboardType, autoCapitalize, icon, editable = true }) {
  const [hidden, setHidden] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, focused && styles.focused, !!error && styles.errorField, !editable && styles.readonly]}>
        {icon ? <Icon name={icon} size={wp(4.5)} color={colors.txtTertiary} style={styles.leftIcon} /> : null}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={password && hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {password ? (
          <TouchableOpacity onPress={() => setHidden((h) => !h)}>
            <Icon name={hidden ? 'eye-off-outline' : 'eye-outline'} size={wp(4.5)} color={colors.txtTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default TextField;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: hp(2)
  },
  label: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.dark700,
    marginBottom: hp(0.8)
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: wp(3),
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: wp(3.5),
    height: hp(6.4)
  },
  focused: {
    borderColor: colors.primary
  },
  errorField: {
    borderColor: colors.danger
  },
  readonly: {
    opacity: 0.6
  },
  leftIcon: {
    marginRight: wp(2)
  },
  input: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  error: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.danger,
    marginTop: hp(0.5)
  }
});
