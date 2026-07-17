import React from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular, SemiBold } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button, TextField } from '@components/common';
import * as AuthActions from '@store/Auth/actions';
import * as LoaderActions from '@store/Loader/actions';

const schema = Yup.object().shape({
  email: Yup.string().email('Enter a valid email').required('Required'),
  password: Yup.string().min(6, 'Min 6 characters').required('Required'),
});

let enhancer = connect(null, { ...AuthActions, ...LoaderActions });

function Login({ navigation, signIn, showHUD, hideHUD }) {
  const submit = async (values) => {
    showHUD();
    try {
      await signIn(values);
    } catch (e) {
      Alert.alert('Login Failed', e.message || 'Check your credentials.');
    } finally {
      hideHUD();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Icon name="location" size={wp(8)} color={colors.ink} />
          </View>
          <Text style={styles.brand}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your journey</Text>

          <Formik initialValues={{ email: '', password: '' }} validationSchema={schema} onSubmit={submit}>
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View style={styles.form}>
                <TextField
                  label="Email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail-outline"
                  error={touched.email && errors.email}
                />
                <TextField
                  label="Password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChangeText={handleChange('password')}
                  password
                  icon="lock-closed-outline"
                  error={touched.password && errors.password}
                />
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
                <Button label="Sign In" onPress={handleSubmit} />
              </View>
            )}
          </Formik>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.link}> Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default enhancer(Login);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  flex: {
    flex: 1
  },
  scroll: {
    flexGrow: 1,
    padding: wp(6),
    justifyContent: 'center'
  },
  logo: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(6),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: hp(2.5)
  },
  brand: {
    fontWeight: Bold,
    fontSize: wp(8),
    color: colors.txtDark,
    textAlign: 'center'
  },
  subtitle: {
    fontWeight: Regular,
    fontSize: wp(3.8),
    color: colors.txtSecondary,
    textAlign: 'center',
    marginBottom: hp(4)
  },
  form: {
    marginBottom: hp(2)
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: hp(2)
  },
  forgotText: {
    fontWeight: SemiBold,
    fontSize: wp(3.4),
    color: colors.primary
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
    color: colors.primary
  }
});
