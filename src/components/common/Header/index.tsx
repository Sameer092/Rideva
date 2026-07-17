import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold } from '@fonts';
import { wp, hp } from '@utils/utilities';

function Header({ title, onBack, right }) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Icon name="chevron-back" size={wp(5.5)} color={colors.txtDark} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.iconBtn}>{right}</View>
    </View>
  );
}

export default Header;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    height: hp(7)
  },
  iconBtn: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(6),
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: Bold,
    fontSize: wp(4.8),
    color: colors.txtDark
  }
});
