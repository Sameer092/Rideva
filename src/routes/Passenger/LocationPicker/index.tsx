import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button } from '@components/common';
import RideMap from '@components/map/RideMap';
import { getCurrentLocation, reverseGeocode, searchPlaces } from '@library/location';
import * as CommonActions from '@store/Common/actions';

let connectState = (state) => ({
  pickup: state.Common.common.get('pickup'),
  dropoff: state.Common.common.get('dropoff'),
});

let enhancer = connect(connectState, { ...CommonActions });

function LocationPicker({ navigation, route, pickup, dropoff, setPickup, setDropoff }) {
  const field = route.params.field;
  const existing = field === 'pickup' ? pickup : dropoff;
  const mapRef = useRef(null);
  const timer = useRef(null);
  const [center, setCenter] = useState(existing ? existing.point : null);
  const [initial] = useState(existing ? existing.point : null);
  const [address, setAddress] = useState(existing ? existing.address : '');
  const [resolving, setResolving] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (initial) return;
    getCurrentLocation()
      .then((p) => mapRef.current && mapRef.current.setCenter(p, 15))
      .catch(() => {});
  }, []);

  const onRegion = (c) => {
    setCenter(c);
    setResults([]);
    if (timer.current) clearTimeout(timer.current);
    setResolving(true);
    timer.current = setTimeout(async () => {
      const a = await reverseGeocode(c);
      setAddress(a);
      setResolving(false);
    }, 400);
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    try {
      setResults(await searchPlaces(query.trim(), center));
    } finally {
      setSearching(false);
    }
  };

  const pick = (r) => {
    setResults([]);
    setQuery('');
    Keyboard.dismiss();
    mapRef.current && mapRef.current.setCenter(r.point, 16);
  };

  const useMine = async () => {
    try {
      const p = await getCurrentLocation();
      mapRef.current && mapRef.current.setCenter(p, 16);
    } catch (e) {}
  };

  const confirm = () => {
    if (!center) return;
    const place = { address: address || 'Selected location', point: center };
    field === 'pickup' ? setPickup(place) : setDropoff(place);
    navigation.goBack();
  };

  return (
    <View style={styles.flex}>
      <RideMap ref={mapRef} center={initial} onRegionChange={onRegion} />

      <View style={styles.pin} pointerEvents="none">
        <View style={styles.pinHead}>
          <View style={styles.pinDot} />
        </View>
        <View style={styles.pinTail} />
      </View>

      <SafeAreaView edges={['top']} style={styles.top}>
        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={wp(6)} color={colors.txtDark} />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Icon name="search" size={wp(4.5)} color={colors.txtTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${field}`}
              placeholderTextColor={colors.placeholder}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={runSearch}
              returnKeyType="search"
            />
            {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
        </View>
        {results.length ? (
          <View style={styles.results}>
            <FlatList
              data={results}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultRow} onPress={() => pick(item)}>
                  <Text numberOfLines={2} style={styles.resultText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        ) : null}
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <TouchableOpacity style={styles.locateBtn} onPress={useMine}>
          <Icon name="locate" size={wp(6)} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{field === 'pickup' ? 'PICKUP' : 'DESTINATION'}</Text>
          <Text numberOfLines={2} style={styles.cardAddress}>{resolving ? 'Locating…' : address || 'Move the map to choose'}</Text>
          <Button label={field === 'pickup' ? 'Confirm pickup' : 'Confirm destination'} onPress={confirm} disabled={!center || resolving} buttonStyle={styles.confirmBtn} />
        </View>
      </SafeAreaView>
    </View>
  );
}

export default enhancer(LocationPicker);

const styles = StyleSheet.create({
  flex: {
    flex: 1
  },
  pin: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pinHead: {
    width: wp(7),
    height: wp(7),
    borderRadius: wp(4),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -wp(7)
  },
  pinDot: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(2),
    backgroundColor: colors.white
  },
  pinTail: {
    width: 2,
    height: wp(4),
    backgroundColor: colors.primary,
    marginTop: -wp(0.5)
  },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    paddingHorizontal: wp(4),
    paddingTop: hp(1)
  },
  backBtn: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(6),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(3),
    paddingHorizontal: wp(3.5),
    height: hp(6)
  },
  searchInput: {
    flex: 1,
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtDark
  },
  results: {
    marginHorizontal: wp(4),
    marginTop: hp(1),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(3),
    maxHeight: hp(34)
  },
  resultRow: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.6),
    borderBottomWidth: 1,
    borderBottomColor: colors.divider
  },
  resultText: {
    fontWeight: Regular,
    fontSize: wp(3.4),
    color: colors.txtDark
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0
  },
  locateBtn: {
    alignSelf: 'flex-end',
    marginRight: wp(5),
    marginBottom: hp(1.5),
    width: wp(13),
    height: wp(13),
    borderRadius: wp(7),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    padding: wp(5)
  },
  cardLabel: {
    fontWeight: Bold,
    fontSize: wp(2.8),
    color: colors.txtTertiary,
    letterSpacing: 1
  },
  cardAddress: {
    fontWeight: SemiBold,
    fontSize: wp(4),
    color: colors.txtDark,
    marginTop: hp(0.5),
    marginBottom: hp(2)
  },
  confirmBtn: {}
});
