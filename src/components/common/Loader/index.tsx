import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import colors from '@colors';

function Loader({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </View>
  );
}

const connectState = (state) => ({
  visible: state.Loader.loader.get('visible'),
});

export default connect(connectState)(Loader);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999
  },
  box: {
    width: 86,
    height: 86,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
