import 'react-native-url-polyfill/auto';
import React from 'react';
import { LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import FlashMessage from 'react-native-flash-message';
import { store, persistor } from '@store/index';
import Loader from '@components/common/Loader';
import Main from '@stacks/index';

LogBox.ignoreAllLogs(true);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <StatusBar style="dark" />
            <Main />
            <Loader />
            <FlashMessage position="top" />
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
