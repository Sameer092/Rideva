import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import colors from '@colors';
import { Bold } from '@fonts';
import { getInitials } from '@utils/utilities';

function NameAvatar({ name, uri, size = 48 }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{getInitials(name)}</Text>
    </View>
  );
}

export default NameAvatar;

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDim
  },
  text: {
    fontWeight: Bold,
    color: colors.primaryDark
  }
});
