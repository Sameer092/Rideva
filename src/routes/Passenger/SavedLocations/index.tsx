import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { EmptyState, Header } from '@components/common';
import { savedLocations } from '@store/Ride/api';

const ICONS = { home: 'home', work: 'briefcase' };

function SavedLocations({ navigation }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    savedLocations().then(setItems).catch(() => {});
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Saved places" onBack={() => navigation.goBack()} />
      <FlatList
        data={items}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState icon="star-outline" title="No saved places" subtitle="Save home and work for faster booking." />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconBox}>
              <Icon name={ICONS[item.label.toLowerCase()] || 'location'} size={wp(4.5)} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>{item.label}</Text>
              <Text numberOfLines={1} style={styles.address}>{item.address}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

export default SavedLocations;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  flex: {
    flex: 1
  },
  list: {
    padding: wp(4),
    flexGrow: 1
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    backgroundColor: colors.dark100,
    borderRadius: wp(4),
    padding: wp(4),
    marginBottom: hp(1.2)
  },
  iconBox: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(3),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontWeight: Bold,
    fontSize: wp(4),
    color: colors.txtDark
  },
  address: {
    fontWeight: Regular,
    fontSize: wp(3.2),
    color: colors.txtSecondary
  }
});
