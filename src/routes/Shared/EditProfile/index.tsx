import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import MCIcon from '@expo/vector-icons/MaterialCommunityIcons';
import colors from '@colors';
import { Bold, SemiBold, Medium } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button, TextField, Header, NameAvatar } from '@components/common';
import { VEHICLE_CLASSES } from '@config/constant';
import { uploadAvatar, updateDriver, getDriver } from '@store/Auth/api';
import * as AuthActions from '@store/Auth/actions';
import * as LoaderActions from '@store/Loader/actions';

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
});

let enhancer = connect(connectState, { ...AuthActions, ...LoaderActions });

function EditProfile({ navigation, user, updateProfile, showHUD, hideHUD }) {
  const isDriver = user && user.role === 'driver';
  const [fullName, setFullName] = useState(user ? user.full_name : '');
  const [phone, setPhone] = useState(user && user.phone ? user.phone : '');
  const [avatar, setAvatar] = useState(user ? user.avatar_url : null);
  const [base64, setBase64] = useState(null);
  const [vehicleClass, setVehicleClass] = useState('economy');
  const [vehicleMake, setVehicleMake] = useState('');
  const [plate, setPlate] = useState('');

  useEffect(() => {
    if (!isDriver || !user) return;
    getDriver(user.id).then((d) => {
      if (d) {
        setVehicleClass(d.vehicle_class);
        setVehicleMake(d.vehicle_make || '');
        setPlate(d.license_plate || '');
      }
    });
  }, []);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access to change your picture.');
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
    if (res.canceled || !res.assets[0]) return;
    setAvatar(res.assets[0].uri);
    setBase64(res.assets[0].base64);
  };

  const save = async () => {
    showHUD();
    try {
      let avatarUrl;
      if (base64) avatarUrl = await uploadAvatar(user.id, base64, 'jpg');
      const updates = { full_name: fullName.trim(), phone: phone || null };
      if (avatarUrl) updates.avatar_url = avatarUrl;
      await updateProfile(user.id, updates);
      if (isDriver) await updateDriver(user.id, { vehicle_class: vehicleClass, vehicle_make: vehicleMake.trim() || null, license_plate: plate.trim() || null });
      Alert.alert('Saved', 'Your profile has been updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert("Couldn't save", e.message || 'Please try again.');
    } finally {
      hideHUD();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Edit profile" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarWrap}>
          <NameAvatar name={fullName} uri={avatar} size={wp(26)} />
          <TouchableOpacity style={styles.changeBtn} onPress={pickPhoto}>
            <Text style={styles.changeText}>Change photo</Text>
          </TouchableOpacity>
        </View>

        <TextField label="Full name" value={fullName} onChangeText={setFullName} icon="person-outline" />
        <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" placeholder="+1 555 000 0000" />

        <Text style={styles.readLabel}>Email (can't be changed)</Text>
        <View style={styles.readonly}>
          <Text style={styles.readText}>{user && user.email}</Text>
        </View>

        {isDriver ? (
          <>
            <Text style={styles.readLabel}>Vehicle type</Text>
            <View style={styles.vehicles}>
              {VEHICLE_CLASSES.map((vc) => {
                const active = vehicleClass === vc.key;
                return (
                  <TouchableOpacity key={vc.key} style={[styles.vehicle, active && styles.vehicleActive]} onPress={() => setVehicleClass(vc.key)}>
                    <MCIcon name={vc.icon} size={wp(4.5)} color={active ? colors.primary : colors.txtSecondary} />
                    <Text style={styles.vehicleLabel}>{vc.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextField label="Vehicle" value={vehicleMake} onChangeText={setVehicleMake} icon="car-outline" placeholder="White Toyota Corolla" />
            <TextField label="Vehicle number" value={plate} onChangeText={setPlate} autoCapitalize="characters" icon="pricetag-outline" placeholder="ABC-123" />
          </>
        ) : null}

        <Button label="Save changes" onPress={save} buttonStyle={styles.save} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default enhancer(EditProfile);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6)
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: hp(2.5),
    gap: hp(1)
  },
  changeBtn: {
    backgroundColor: colors.primarySoft,
    borderRadius: wp(8),
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8)
  },
  changeText: {
    fontWeight: Bold,
    fontSize: wp(3.4),
    color: colors.primaryDark
  },
  readLabel: {
    fontWeight: Medium,
    fontSize: wp(3.4),
    color: colors.dark700,
    marginBottom: hp(0.8)
  },
  readonly: {
    backgroundColor: colors.dark100,
    borderRadius: wp(3),
    paddingHorizontal: wp(3.5),
    height: hp(6.4),
    justifyContent: 'center',
    marginBottom: hp(2)
  },
  readText: {
    fontWeight: Medium,
    fontSize: wp(3.8),
    color: colors.txtSecondary
  },
  vehicles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(2)
  },
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(1.5),
    borderRadius: wp(8),
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1)
  },
  vehicleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  vehicleLabel: {
    fontWeight: SemiBold,
    fontSize: wp(3.4),
    color: colors.txtDark
  },
  save: {
    marginTop: hp(1)
  }
});
