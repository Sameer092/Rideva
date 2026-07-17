import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp, ratingText } from '@utils/utilities';
import { Button, NameAvatar } from '@components/common';
import * as AuthActions from '@store/Auth/actions';

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
});

let enhancer = connect(connectState, { ...AuthActions });

function Row({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>
        <Icon name={icon} size={wp(4.5)} color={colors.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Icon name="chevron-forward" size={wp(4.5)} color={colors.txtTertiary} />
    </TouchableOpacity>
  );
}

function Profile({ navigation, user, signOut }) {
  const isPassenger = user && user.role === 'passenger';
  const soon = (what) => Alert.alert(what, "This section isn't part of the demo yet.");

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primaryLight, colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <SafeAreaView edges={['top']}>
            <TouchableOpacity style={styles.header} onPress={() => navigation.navigate('EditProfile')}>
              <View style={styles.avatarRing}>
                <NameAvatar name={user && user.full_name} uri={user && user.avatar_url} size={wp(22)} />
              </View>
              <Text style={styles.name}>{user && user.full_name}</Text>
              <Text style={styles.email}>{user && user.email}</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{user && user.rating_count > 0 ? `★ ${ratingText(user.rating_avg, user.rating_count)}` : 'New'}</Text>
                <Text style={styles.chipDot}>·</Text>
                <Text style={styles.chipText}>{user && user.role}</Text>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.card}>
            <Row icon="create-outline" label="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
            {isPassenger ? <Row icon="star-outline" label="Saved places" onPress={() => navigation.navigate('SavedLocations')} /> : null}
            <Row icon="receipt-outline" label="Ride history" onPress={() => navigation.navigate(isPassenger ? 'Activity' : 'Rides')} />
            <Row icon="help-buoy-outline" label="Help & support" onPress={() => soon('Help & support')} />
          </View>
          <Button label="Sign out" variant="danger" onPress={() => signOut()} buttonStyle={styles.signout} />
        </View>
      </ScrollView>
    </View>
  );
}

export default enhancer(Profile);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingBottom: hp(4),
    paddingTop: hp(1)
  },
  avatarRing: {
    borderRadius: wp(20),
    borderWidth: 3,
    borderColor: 'rgba(11,15,20,0.25)',
    marginBottom: hp(1.5)
  },
  name: {
    fontWeight: Bold,
    fontSize: wp(6),
    color: colors.ink
  },
  email: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: 'rgba(11,15,20,0.65)'
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: 'rgba(11,15,20,0.12)',
    borderRadius: wp(8),
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.6),
    marginTop: hp(1.5)
  },
  chipText: {
    fontWeight: Bold,
    fontSize: wp(3.4),
    color: colors.ink,
    textTransform: 'capitalize'
  },
  chipDot: {
    color: 'rgba(11,15,20,0.55)'
  },
  body: {
    marginTop: -hp(2.5),
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    backgroundColor: colors.background,
    padding: wp(5)
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(4),
    paddingVertical: hp(0.5),
    marginBottom: hp(2)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8)
  },
  rowIcon: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(2.5),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowLabel: {
    flex: 1,
    fontWeight: SemiBold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  signout: {}
});
