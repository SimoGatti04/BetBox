import React from 'react';
import BalanceView from '../components/BalanceView';
import { SafeAreaView } from 'react-native-safe-area-context';
import {useColorScheme} from "react-native";

export default function BalanceScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: useColorScheme() === 'dark' ? '#000' : '#f0f0f0' }}>
      <BalanceView />
    </SafeAreaView>
  );
}
