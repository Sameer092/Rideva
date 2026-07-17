import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button, TextField, Header } from '@components/common';
import * as AuthActions from '@store/Auth/actions';
import * as LoaderActions from '@store/Loader/actions';

const schema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email').required('Required'),
});

let enhancer = connect(null, { ...AuthActions, ...LoaderActions });

function ForgotPassword({ navigation, forgotPassword, showHUD, hideHUD }) {
  const submit = async (values) => {
    showHUD();
    try {
      await forgotPassword(values.email);
      Alert.alert('Check your inbox', 'We sent a password reset link.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Please try again.');
    } finally {
      hideHUD();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Reset password" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <View style={styles.iconBox}>
          <Icon name="key-outline" size={wp(8)} color={colors.primary} />
        </View>
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>

        <Formik initialValues={{ email: '' }} validationSchema={schema} onSubmit={submit}>
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <TextField label="Email" placeholder="you@example.com" value={values.email} onChangeText={handleChange('email')} keyboardType="email-address" autoCapitalize="none" icon="mail-outline" error={touched.email && errors.email} />
              <Button label="Send reset link" onPress={handleSubmit} />
            </View>
          )}
        </Formik>
      </View>
    </SafeAreaView>
  );
}

export default enhancer(ForgotPassword);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  body: {
    flex: 1,
    padding: wp(6),
    justifyContent: 'center'
  },
  iconBox: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(5),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2)
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(6),
    color: colors.txtDark
  },
  subtitle: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary,
    marginTop: hp(0.5),
    marginBottom: hp(3)
  },
  form: {}
});
