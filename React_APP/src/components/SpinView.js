import React, {useEffect, useState} from 'react';
import {Image, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {siteImages} from '../siteImages';
import BonusLogModal from './BonusLogModal';

const SpinView = () => {
  const [spinHistory, setSpinHistory] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSite, setSelectedSite] = useState(null);
  const sites = ['goldbet', 'lottomatica', 'snai'];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const fetchSpinHistory = async () => {
    const newSpinHistory = {};
    for (const site of sites) {
      try {
        const response = await fetch(`https://legally-modest-joey.ngrok-free.app/spin-history/${site}`);
        newSpinHistory[site] = await response.json();
      } catch (error) {
        console.error(`Error fetching spin history for ${site}:`, error);
      }
    }
    setSpinHistory(newSpinHistory);
  };

  useEffect(() => {
    fetchSpinHistory();
  }, []);

  const performSpin = async (site) => {
    try {
      const response = await fetch(`https://legally-modest-joey.ngrok-free.app/spin/${site}`, {
        method: 'POST'
      });
      const result = await response.json();
      console.log(`Spin result for ${site}:`, result);
      fetchSpinHistory();
    } catch (error) {
      console.error(`Error performing spin for ${site}:`, error);
    }
  };

  const isSpinExecutedToday = (site) => {
    if (!spinHistory[site] || spinHistory[site].length === 0) {
      return false;
    }
    const lastSpin = spinHistory[site][spinHistory[site].length - 1];
    const spinDate = new Date(lastSpin.date);
    const today = new Date();

    const isSameDay = spinDate.toDateString() === today.toDateString();
    const hasValidBonus = lastSpin.result &&
                          lastSpin.result.tipo &&
                          lastSpin.result.tipo !== 'N/A' &&
                          lastSpin.result.tipo !== null;
    return isSameDay && hasValidBonus;
  };





  const openBonusLog = (site) => {
    setSelectedSite(site);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.title}>Spin</Text>
        <TouchableOpacity style={styles.refreshAllButton} onPress={fetchSpinHistory}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
        {sites.map((site) => (
        <View key={site} style={[styles.card, isSpinExecutedToday(site) && styles.cardExecuted]}>
            <Image source={siteImages[site]} style={styles.icon} />
            <View style={styles.cardContent}>
              <Text style={styles.bonusText}>Ultimo bonus:</Text>
              <Text style={styles.platformText}>
                {spinHistory[site] && spinHistory[site].length > 0
                  ? `${spinHistory[site][spinHistory[site].length - 1].result.tipo}: ${spinHistory[site][spinHistory[site].length - 1].result.valore}`
                  : 'N/A'}
              </Text>
              <TouchableOpacity onPress={() => openBonusLog(site)}>
                <Text style={styles.linkText}>Visualizza log bonus</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={() => performSpin(site)}>
              <Text style={styles.refreshText}>↻</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <BonusLogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        site={selectedSite}
        spinHistory={spinHistory[selectedSite]}
        formatDate={formatDate}
      />
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
    paddingTop: 120,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  refreshAllButton: {
    position: 'absolute',
    top: 120,
    right: 0,
    padding: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardExecuted: {
    backgroundColor: 'rgba(5, 75, 38, 0.5)',
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 20,
  },
  cardContent: {
    flex: 1,
  },
  bonusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  platformText: {
    color: '#fff',
    fontSize: 14,
  },
  linkText: {
    color: '#0a84ff',
    marginTop: 10,
  },
  refreshButton: {
    padding: 10,
  },
  refreshText: {
    color: '#0a84ff',
    fontSize: 20,
  }, dateText: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },

});

export default SpinView;
