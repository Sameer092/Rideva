import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '@routes/Auth/Login';
import SignUp from '@routes/Auth/SignUp';
import ForgotPassword from '@routes/Auth/ForgotPassword';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
}

export default AuthStack;
