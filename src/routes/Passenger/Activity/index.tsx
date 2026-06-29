import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp, currency, formatDistance, relativeTime } from '@utils/utilities';
import { EmptyState, StatusBadge } from '@components/common';
import { history } from '@store/Ride/api';

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
});

function Activity({ user }) {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    if (!user) return;
    history(user.id, user.role).then(setRides).catch(() => {});
  }, [user && user.id]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.heading}>Your rides</Text>
      <FlatList
        data={rides}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="receipt-outline" title="No rides yet" subtitle="Your completed rides will appear here." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Icon name="location" size={wp(4.5)} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text numberOfLines={1} style={styles.dest}>{item.dropoff_address}</Text>
              <Text style={styles.meta}>{relativeTime(item.requested_at)} · {formatDistance(item.distance_m)}</Text>
              <View style={styles.badge}>
                <StatusBadge label={item.status} tone={item.status === 'completed' ? 'success' : 'danger'} />
              </View>
            </View>
            <Text style={styles.fare}>{currency(item.fare_final || item.fare_estimate)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default connect(connectState)(Activity);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  flex: {
    flex: 1
  },
  heading: {
    fontWeight: Bold,
    fontSize: wp(6.5),
    color: colors.txtDark,
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    paddingBottom: hp(1)
  },
  list: {
    padding: wp(4),
    flexGrow: 1
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(3),
    backgroundColor: colors.dark100,
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(1.2)
  },
  iconBox: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(3),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dest: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  meta: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtSecondary,
    marginTop: hp(0.3)
  },
  badge: {
    marginTop: hp(0.8)
  },
  fare: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark
  }
});
