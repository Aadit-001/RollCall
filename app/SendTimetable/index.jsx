import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform, PermissionsAndroid,
  TextInput
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TcpSocket from 'react-native-tcp-socket';
import WifiManager from 'react-native-wifi-reborn';
import { Buffer } from 'buffer';

// Ensure Buffer is available globally
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

const LOCAL_PORT = 12345;

const SendTimetable = () => {
  const [status, setStatus] = useState('Tap to start sharing...');
  const [isInitializing, setIsInitializing] = useState(true);
  const [localIp, setLocalIp] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [isActionActive, setIsActionActive] = useState(false);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(true);

  const serverRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
          if (Platform.Version >= 33) {
            permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
          }

          const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
          const allGranted = Object.values(granted).every(
            res => res === PermissionsAndroid.RESULTS.GRANTED
          );
          if (!allGranted) {
            Alert.alert(
              'Permissions Required',
              'Wi-Fi and Location permissions are needed to share data.'
            );
          }
          setIsPermissionsGranted(allGranted);
        } catch (err) {
          console.warn('Permission error:', err);
          setIsPermissionsGranted(false);
        }
      }
      setIsInitializing(false);
    };
    checkPermissions();
  }, []);

  useEffect(() => () => stopAllActivity(), []);

  const stopAllActivity = () => {
    if (serverRef.current) {
      serverRef.current.close();
      serverRef.current = null;
    }
    setIsActionActive(false);
    setTransferProgress(0);
    setLocalIp(null);
    setStatus('Tap to start sharing...');
  };

  const startSharing = async () => {
    if (!isPermissionsGranted) {
      Alert.alert('Permissions Required', 'Please grant permissions to continue.');
      return;
    }

    setIsActionActive(true);
    setStatus('Setting up server...');
    setTransferProgress(0);

    try {
      // Check Wi-Fi connection
      const isWifiEnabled = await WifiManager.isEnabled();
      if (!isWifiEnabled) {
        Alert.alert(
          'Wi-Fi Required',
          'Please connect to Wi-Fi or enable hotspot to share.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Settings', onPress: () => WifiManager.setEnabled(true) }
          ]
        );
        stopAllActivity();
        return;
      }

      const ip = await WifiManager.getIP();
      if (!ip || ip === '0.0.0.0') {
        Alert.alert('Error', 'Unable to get IP address. Ensure Wi-Fi is connected.');
        stopAllActivity();
        return;
      }
      setLocalIp(ip);
      setStatus(`Waiting for receiver at ${ip}. Ensure devices are on the same Wi-Fi network.`);

      const server = TcpSocket.createServer((socket) => {
        console.log('Receiver connected:', socket.address());
        setStatus('Receiver connected. Awaiting request...');

        let clientState = 'WAITING_FOR_REQUEST';
        let dataBuffer = null;
        let dataSize = 0;
        let sentBytes = 0;
        let transferTimeout;

        const sendNextChunk = () => {
          if (socket.destroyed) return;
          if (sentBytes >= dataSize) {
            setTransferProgress(1);
            setStatus('Transfer complete. Timetable sent successfully!');
            clearTimeout(transferTimeout);
            socket.destroy();
            return;
          }

          const chunkSize = 4096;
          const remaining = dataSize - sentBytes;
          const chunk = dataBuffer.slice(sentBytes, sentBytes + Math.min(chunkSize, remaining));

          try {
            const writeResult = socket.write(chunk);
            if (!writeResult) {
              socket.once('drain', () => sendNextChunk());
              return;
            }
          } catch (err) {
            socket.destroy();
            return;
          }

          sentBytes += chunk.length;
          setTransferProgress(sentBytes / dataSize);
          setStatus(`Sending: ${Math.round((sentBytes / dataSize) * 100)}%`);
          clearTimeout(transferTimeout);
          transferTimeout = setTimeout(() => socket.destroy(), 60000);
          setTimeout(sendNextChunk, 10);
        };

        socket.on('data', async (data) => {
          const msg = data.toString().trim();
          if (clientState === 'WAITING_FOR_REQUEST' && msg === 'REQUEST_DATA') {
            try {
              // Get timetable data from AsyncStorage
              const timetableData = await AsyncStorage.getItem('timetable');
              if (!timetableData) {
                socket.write('ERROR: No timetable data to send.\n');
                socket.destroy();
                return;
              }

              // Parse and prepare the data for sending
              const parsedTimetable = JSON.parse(timetableData);
              console.log('Sending timetable data:', parsedTimetable);

              // Convert back to string for sending
              const dataToSend = JSON.stringify(parsedTimetable);
              dataBuffer = Buffer.from(dataToSend, 'utf8');
              dataSize = dataBuffer.length;
              
              socket.write(`HEADER:${dataSize}\n`);
              clientState = 'WAITING_FOR_ACK';
            } catch (error) {
              console.error('Error preparing data for sending:', error);
              socket.write('ERROR: Failed to prepare timetable data.\n');
              socket.destroy();
            }
          } else if (clientState === 'WAITING_FOR_ACK' && msg === 'ACK_HEADER') {
            clientState = 'SENDING_DATA';
            sendNextChunk();
          }
        });

        socket.on('error', (error) => {
          console.error('Socket error:', error);
          stopAllActivity();
        });
        
        socket.on('close', () => {
          console.log('Socket closed');
          stopAllActivity();
        });
      });

      server.listen({ port: LOCAL_PORT, host: '0.0.0.0' }, () => {
        console.log('Server started on port', LOCAL_PORT);
      });
      
      server.on('error', (error) => {
        console.error('Server error:', error);
        Alert.alert('Server Error', 'Failed to start server. Please try again.');
        stopAllActivity();
      });
      
      serverRef.current = server;
    } catch (err) {
      console.log('Server start error:', err);
      Alert.alert('Error', 'Failed to start sharing. Please try again.');
      stopAllActivity();
    }
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Send Timetable</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{status}</Text>
          </View>

          {!isActionActive ? (
            <>
              <View style={styles.card}>
                <TouchableOpacity style={styles.primaryButton} onPress={startSharing}>
                  <Ionicons name="send-outline" size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>Start Sharing</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.disclaimerContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#4CAF50" />
                <Text style={styles.disclaimerText}>
                  Important: Make sure both devices are on the same Wi-Fi network.
                </Text>
              </View>
            </>
          ) : (
            <View style={[styles.card, styles.activeContainer]}>
              {localIp && (
                <View style={styles.ipContainer}>
                  <Text style={styles.ipLabel}>Your IP Address:</Text>
                  <Text style={styles.ipValue}>{localIp}</Text>
                  <Text style={styles.ipNote}>Share this with the receiver</Text>
                </View>
              )}
              <CustomProgressBar progress={transferProgress} color="#4CAF50" />
              <TouchableOpacity style={styles.stopButton} onPress={stopAllActivity}>
                <Ionicons name="stop" size={20} color="#fff" />
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const CustomProgressBar = ({ progress, color }) => (
  <View style={progressBarStyles.container}>
    <View style={[progressBarStyles.progress, { width: `${progress * 100}%`, backgroundColor: color }]} />
  </View>
);

const progressBarStyles = StyleSheet.create({
  container: {
    height: 10,
    width: 250,
    backgroundColor: '#444',
    borderRadius: 5,
    overflow: 'hidden',
    marginVertical: 10,
  },
  progress: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
    textAlign: 'left',
  },
  backButton: {
    marginRight: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusText: {
    color: '#bbb',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
  },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  disclaimerText: {
    color: '#4CAF50',
    fontSize: 13,
    flex: 1,
  },
  activeContainer: {
    alignItems: 'center',
  },
  ipContainer: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  ipLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  ipValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ipNote: {
    color: '#888',
    fontSize: 12,
    marginTop: 5,
  },
  stopButton: {
    backgroundColor: '#d84315',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SendTimetable;