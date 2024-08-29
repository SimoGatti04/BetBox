import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { siteImages } from '../siteImages';
import { Ionicons } from '@expo/vector-icons';

const SpinBox = ({ site, lastBonus, onSpin, onViewHistory }) => {
  const colorScheme = useColorScheme();

  const renderBonus = () => {
    if (lastBonus && lastBonus.result) {
      return `${lastBonus.result.tipo}: ${lastBonus.result.valore}`;
    }
    return 'N/A';
  };

  return (
    <View style={[styles.box, { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }]}>
      <Image source={siteImages[site]} style={styles.logo} />
      <View style={styles.bonusContainer}>
        <Text style={[styles.bonusText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          Ultimo bonus: {renderBonus()}
        </Text>
        <TouchableOpacity onPress={onViewHistory} style={styles.historyButton}>
          <Text style={[styles.historyButtonText, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
            Visualizza cronologia
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onSpin} style={styles.spinButton}>
        <Ionicons name="refresh" size={24} color={colorScheme === 'dark' ? '#fff' : '#000'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10,
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
  bonusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  spinButton: {
    alignSelf: 'flex-end',
  },
  historyButton: {
    marginTop: 5,
  },
  historyButtonText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});

export default SpinBox