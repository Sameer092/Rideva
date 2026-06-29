import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from '@expo/vector-icons/Ionicons';
import MCIcon from '@expo/vector-icons/MaterialCommunityIcons';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button, TextField, Header } from '@components/common';
import { VEHICLE_CLASSES } from '@config/constant';
import * as AuthActions from '@store/Auth/actions';
import * as LoaderActions from '@store/Loader/actions';

const schema = Yup.object().shape({
  full_name: Yup.string().min(2, 'Enter your name').required('Required'),
  email: Yup.string().email('Enter a valid email').required('Required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Required'),
});

let enhancer = connect(null, { ...AuthActions, ...LoaderActions });

function SignUp({ navigation, signUp, showHUD, hideHUD }) {
  const submit = async (values) => {
    showHUD();
    try {
      const data = await signUp(values);
      if (!data.session) {
        Alert.alert('Confirm your email', 'We sent a confirmation link. Confirm it, then sign in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (e) {
      Alert.alert('Sign up failed', e.message || 'Please try again.');
    } finally {
      hideHUD();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Create account" onBack={() => navigation.goBack()} />
      <Formik
        initialValues={{ full_name: '', email: '', phone: '', password: '', role: 'passenger', vehicle_class: 'economy', vehicle_make: '', license_plate: '' }}
        validationSchema={schema}
        onSubmit={submit}
      >
        {({ handleChange, handleSubmit, setFieldValue, values, errors, touched }) => (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.roles}>
              {[
                { key: 'passenger', label: 'Ride', sub: 'Book rides', icon: 'person' },
                { key: 'driver', label: 'Drive', sub: 'Earn money', icon: 'car-sport' },
              ].map((r) => {
                const active = values.role === r.key;
                return (
                  <TouchableOpacity key={r.key} style={[styles.role, active && styles.roleActive]} onPress={() => setFieldValue('role', r.key)}>
                    <Icon name={r.icon} size={wp(7)} color={active ? colors.primary : colors.txtTertiary} />
                    <Text style={styles.roleLabel}>{r.label}</Text>
                    <Text style={styles.roleSub}>{r.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {values.role === 'driver' ? (
              <View style={styles.vehicles}>
                {VEHICLE_CLASSES.map((vc) => {
                  const active = values.vehicle_class === vc.key;
                  return (
                    <TouchableOpacity key={vc.key} style={[styles.vehicle, active && styles.vehicleActive]} onPress={() => setFieldValue('vehicle_class', vc.key)}>
                      <MCIcon name={vc.icon} size={wp(4.5)} color={active ? colors.primary : colors.txtSecondary} />
                      <Text style={styles.vehicleLabel}>{vc.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}

            <TextField label="Full name" placeholder="Jane Doe" value={values.full_name} onChangeText={handleChange('full_name')} icon="person-outline" error={touched.full_name && errors.full_name} />
            <TextField label="Email" placeholder="you@example.com" value={values.email} onChangeText={handleChange('email')} keyboardType="email-address" autoCapitalize="none" icon="mail-outline" error={touched.email && errors.email} />
            <TextField label="Phone (optional)" placeholder="+1 555 000 0000" value={values.phone} onChangeText={handleChange('phone')} keyboardType="phone-pad" icon="call-outline" />
            {values.role === 'driver' ? (
              <>
                <TextField label="Vehicle" placeholder="White Toyota Corolla" value={values.vehicle_make} onChangeText={handleChange('vehicle_make')} icon="car-outline" />
                <TextField label="Vehicle number" placeholder="ABC-123" value={values.license_plate} onChangeText={handleChange('license_plate')} autoCapitalize="characters" icon="pricetag-outline" />
              </>
            ) : null}
            <TextField label="Password" placeholder="At least 6 characters" value={values.password} onChangeText={handleChange('password')} password icon="lock-closed-outline" error={touched.password && errors.password} />

            <Button label="Create account" onPress={handleSubmit} buttonStyle={styles.submit} />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link}> Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Formik>
    </SafeAreaView>
  );
}

export default enhancer(SignUp);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white
  },
  scroll: {
    padding: wp(6),
    paddingTop: hp(1)
  },
  roles: {
    flexDirection: 'row',
    gap: wp(3),
    marginBottom: hp(2.5)
  },
  role: {
    flex: 1,
    borderRadius: wp(4),
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: wp(4)
  },
  roleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  roleLabel: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.txtDark,
    marginTop: hp(0.6)
  },
  roleSub: {
    fontWeight: Regular,
    fontSize: wp(3),
    color: colors.txtSecondary
  },
  vehicles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
    marginBottom: hp(2.5)
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
  submit: {
    marginTop: hp(1)
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: hp(3)
  },
  footerText: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary
  },
  link: {
    fontWeight: Bold,
    fontSize: wp(3.6),
    color: colors.primaryDark
  }
});
