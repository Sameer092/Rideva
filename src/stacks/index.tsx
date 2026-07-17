import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { connect } from 'react-redux';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import colors from '@colors';
import * as AuthActions from '@store/Auth/actions';
import { onAuthStateChange } from '@store/Auth/api';
import AuthStack from '@stacks/AuthStack';
import PassengerStack from '@stacks/PassengerStack';
import DriverStack from '@stacks/DriverStack';
import AdminStack from '@stacks/AdminStack';

let connectState = (state) => ({
  user: state.Auth.auth.get('user'),
  ready: state.Auth.auth.get('ready'),
});

let enhancer = connect(connectState, { ...AuthActions });

function Main({ user, ready, setUser, loadCurrentUser, getSession }) {
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const session = await getSession();
        if (!mounted) return;
        if (session) await loadCurrentUser();
        else setUser(null);
      } catch {
        if (mounted) setUser(null);
      }
    })();

    const { data } = onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') setUser(null);
      else if (session) setTimeout(() => mounted && loadCurrentUser(), 0);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderStack = () => {
    if (!user) return <AuthStack />;
    if (user.role === 'admin') return <AdminStack />;
    if (user.role === 'driver') return <DriverStack />;
    return <PassengerStack />;
  };

  return <NavigationContainer theme={navTheme}>{renderStack()}</NavigationContainer>;
}

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.txtDark,
    border: colors.border,
    primary: colors.primary,
  },
};

export default enhancer(Main);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background
  }
});
