import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { siteImages } from '../siteImages';

const { width } = Dimensions.get('window');
const boxSize = (width - 60) / 2;
const boxHeight = boxSize * 0.7;

const BalanceView = () => {
  const [balances, setBalances] = useState({});
  const sites = ['goldbet', 'bet365', 'eurobet', 'sisal', 'snai', 'lottomatica', 'cplay'];

  const fetchBalance = async (site) => {
    try {
      const response = await fetch(`https://legally-modest-joey.ngrok-free.app/balances/${site}`);
      const data = await response.json();
      setBalances(prev => ({ ...prev, [site]: data.balance }));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Saldi</Text>
        <TouchableOpacity style={styles.refreshAllButton} onPress={() => sites.forEach(fetchBalance)}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
        <View style={styles.cardsContainer}>
          {sites.map((site) => (
            <View key={site} style={styles.card}>
              <View style={styles.cardTop}>
                <Image source={siteImages[site]} style={styles.icon} />
                <TouchableOpacity style={styles.refreshButton} onPress={() => fetchBalance(site)}>
                  <Text style={styles.refreshText}>↻</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceText}>{balances[site] || 'N/A'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  scrollViewContent: {
    paddingTop: 100, // Aumentato da 40
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30, // Aumentato da 20
  },
  refreshAllButton: {
    position: 'absolute',
    top: 40,
    right: 0,
    padding: 10,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: boxSize,
    height: boxHeight,
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  icon: {
    width: 50,
    height: 50,
  },
  balanceText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  refreshButton: {
    padding: 5,
  },
  refreshText: {
    color: '#0a84ff',
    fontSize: 24,
  },
});

export default BalanceView;
