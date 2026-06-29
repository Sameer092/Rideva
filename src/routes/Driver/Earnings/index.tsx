import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp, currency, relativeTime } from '@utils/utilities';
import { EmptyState } from '@components/common';
import { getEarnings } from '@store/Driver/api';

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
});

function Earnings({ user }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    getEarnings(user.id).then(setItems).catch(() => {});
  }, [user && user.id]);

  const net = items.reduce((s, e) => s + e.net_amount, 0);
  const gross = items.reduce((s, e) => s + e.gross_amount, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <Text style={styles.heading}>Earnings</Text>
            <LinearGradient colors={[colors.primaryLight, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balance}>
              <Text style={styles.balanceLabel}>Total net payout</Text>
              <Text style={styles.balanceValue}>{currency(net)}</Text>
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{items.length}</Text>
                  <Text style={styles.statLabel}>Rides</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{currency(gross)}</Text>
                  <Text style={styles.statLabel}>Gross</Text>
                </View>
              </View>
            </LinearGradient>
            <Text style={styles.recent}>Recent payouts</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState icon="cash-outline" title="No earnings yet" subtitle="Complete rides to start earning." />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Icon name="car-sport" size={wp(4.5)} color={colors.success} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.payout}>Ride payout</Text>
              <Text style={styles.time}>{relativeTime(item.created_at)}</Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.amount}>+{currency(item.net_amount)}</Text>
              <Text style={styles.fee}>fee {currency(item.platform_fee)}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default connect(connectState)(Earnings);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  flex: {
    flex: 1
  },
  list: {
    padding: wp(4),
    flexGrow: 1
  },
  heading: {
    fontWeight: Bold,
    fontSize: wp(6.5),
    color: colors.txtDark,
    marginBottom: hp(1.5)
  },
  balance: {
    borderRadius: wp(6),
    padding: wp(6),
    alignItems: 'center'
  },
  balanceLabel: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: 'rgba(255,255,255,0.8)'
  },
  balanceValue: {
    fontWeight: Bold,
    fontSize: wp(10),
    color: colors.white
  },
  stats: {
    flexDirection: 'row',
    gap: wp(10),
    marginTop: hp(1)
  },
  stat: {
    alignItems: 'center'
  },
  statValue: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.white
  },
  statLabel: {
    fontWeight: Regular,
    fontSize: wp(2.9),
    color: 'rgba(255,255,255,0.8)'
  },
  recent: {
    fontWeight: Bold,
    fontSize: wp(4.2),
    color: colors.txtDark,
    marginTop: hp(2.5),
    marginBottom: hp(1)
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: colors.dark100,
    borderRadius: wp(4),
    padding: wp(3.5),
    marginBottom: hp(1)
  },
  iconBox: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(3),
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  payout: {
    fontWeight: Bold,
    fontSize: wp(3.8),
    color: colors.txtDark
  },
  time: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary
  },
  amountCol: {
    alignItems: 'flex-end'
  },
  amount: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.success
  },
  fee: {
    fontWeight: Regular,
    fontSize: wp(2.9),
    color: colors.txtTertiary
  }
});
