import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button } from '@components/common';
import { supabase } from '@library/supabase';
import * as AuthActions from '@store/Auth/actions';

const LIVE = ['requested', 'matching', 'accepted', 'arriving', 'arrived', 'in_progress'];

async function loadMetrics() {
  const [users, active, reports, drivers] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('rides').select('id', { count: 'exact', head: true }).in('status', LIVE),
    supabase.from('ride_reports').select('id', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('status', 'online'),
  ]);
  return { users: users.count || 0, active: active.count || 0, reports: reports.count || 0, drivers: drivers.count || 0 };
}

let enhancer = connect(null, { ...AuthActions });

function Dashboard({ signOut }) {
  const [m, setM] = useState({ users: 0, active: 0, reports: 0, drivers: 0 });

  useEffect(() => {
    loadMetrics().then(setM).catch(() => {});
    const t = setInterval(() => loadMetrics().then(setM).catch(() => {}), 15000);
    return () => clearInterval(t);
  }, []);

  const tiles = [
    { label: 'Total users', value: m.users, icon: 'people', color: colors.primary },
    { label: 'Active rides', value: m.active, icon: 'car-sport', color: colors.success },
    { label: 'Online drivers', value: m.drivers, icon: 'radio', color: colors.info },
    { label: 'Open disputes', value: m.reports, icon: 'alert-circle', color: colors.danger },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Admin · Live</Text>
        <LinearGradient colors={[colors.primaryLight, colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Text style={styles.heroLabel}>Active rides right now</Text>
          <Text style={styles.heroValue}>{m.active}</Text>
          <Text style={styles.heroSub}>{m.drivers} drivers online</Text>
        </LinearGradient>

        <View style={styles.tiles}>
          {tiles.map((t) => (
            <View key={t.label} style={styles.tile}>
              <Icon name={t.icon} size={wp(6)} color={t.color} />
              <Text style={styles.tileValue}>{t.value}</Text>
              <Text style={styles.tileLabel}>{t.label}</Text>
            </View>
          ))}
        </View>

        <Button label="Sign out" variant="danger" onPress={() => signOut()} buttonStyle={styles.signout} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(Dashboard);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    padding: wp(5)
  },
  heading: {
    fontWeight: Bold,
    fontSize: wp(6.5),
    color: colors.txtDark,
    marginBottom: hp(1.5)
  },
  hero: {
    borderRadius: wp(6),
    padding: wp(6),
    marginBottom: hp(2)
  },
  heroLabel: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: 'rgba(255,255,255,0.8)'
  },
  heroValue: {
    fontWeight: Bold,
    fontSize: wp(10),
    color: colors.white
  },
  heroSub: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: 'rgba(255,255,255,0.8)'
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3)
  },
  tile: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: wp(4),
    padding: wp(4)
  },
  tileValue: {
    fontWeight: Bold,
    fontSize: wp(7),
    color: colors.txtDark,
    marginTop: hp(0.5)
  },
  tileLabel: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtSecondary
  },
  signout: {
    marginTop: hp(3)
  }
});
