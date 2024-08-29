import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { siteImages } from '../siteImages';
import { Ionicons } from '@expo/vector-icons';

const BalanceBox = ({ site, balance, onRefresh }) => {
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();

  const handleRefresh = async () => {
    setIsLoading(true);
    await onRefresh();
    setIsLoading(false);
  };

  return (
    <View style={[styles.box, { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }]}>
      <Image source={siteImages[site.toLowerCase()]} style={styles.logo} />
      <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} disabled={isLoading}>
        <Ionicons
          name="refresh"
          size={20}
          color={colorScheme === 'dark' ? '#fff' : '#000'}
        />
      </TouchableOpacity>
      <Text style={[styles.balance, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>{balance}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flex: 1,
    justifyContent: 'space-between',
    borderRadius: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logo: {
    width: 50,
    height: 50,
    alignSelf: 'flex-start',
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'center',
  },
});

export default BalanceBox;
