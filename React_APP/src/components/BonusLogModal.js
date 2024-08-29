import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';

const BonusLogModal = ({ visible, onClose, site, spinHistory, formatDate }) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Log Bonus - {site}</Text>
        <ScrollView style={styles.scrollView}>
          {spinHistory?.map((spin, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.text}>Tipo: {spin.result?.tipo || 'N/A'}</Text>
              <Text style={styles.text}>Valore: {spin.result?.valore || 'N/A'}</Text>
              <Text style={styles.text}>Data: {formatDate(spin.date)}</Text>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.button} onPress={onClose}>
          <Text style={styles.buttonText}>Chiudi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Cancella storia bonus</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollView: {
    maxHeight: 300,
  },
  card: {
    backgroundColor: '#333333',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 5,
  },
  button: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#0a84ff',
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  deleteButton: {
    alignItems: 'center',
    padding: 15,
    marginTop: 10,
  },
  deleteButtonText: {
    color: 'red',
    fontSize: 16,
  },
});

export default BonusLogModal;
