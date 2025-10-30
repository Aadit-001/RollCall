import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, Platform, PermissionsAndroid 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TcpSocket from 'react-native-tcp-socket';
import WifiManager from 'react-native-wifi-reborn';
import QRCode from 'react-native-qrcode-svg';
import { Buffer } from 'buffer';

// Ensure Buffer is polyfilled for React Native
if (typeof Buffer === 'undefined') {
  global.Buffer = require('buffer').Buffer;
}

// Custom, simple progress bar component
const CustomProgressBar = ({ progress, color }) => {
  return (
    <View style={progressBarStyles.container}>
      <View style={[progressBarStyles.progress, { width: `${progress * 100}%`, backgroundColor: color }]} />
    </View>
  );
};

const progressBarStyles = StyleSheet.create({
  container: {
    height: 10,
    width: 250,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 5,
  },
});

// Constants for the TCP server
const LOCAL_PORT = 12345;
const HOTSPOT_SSID = 'TimetableShare'; 
const HOTSPOT_PASSWORD = 'password123'; 

const ShareTT = () => {
  const [role, setRole] = useState(null);
  const [status, setStatus] = useState('Select a role to begin...');
  const [isInitializing, setIsInitializing] = useState(true);
  const [localIp, setLocalIp] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);
  const [isActionActive, setIsActionActive] = useState(false);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(true);

  const serverRef = useRef(null);
  const router = useRouter();

  // Permissions check and initial setup
  useEffect(() => {
    const requestAndCheckPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const permissionsToRequest = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

          // On Android 13+ need NEARBY_WIFI_DEVICES
          if (Platform.Version >= 33) {
            permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES);
          }

          const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);

          const allGranted = Object.values(granted).every(
            res => res === PermissionsAndroid.RESULTS.GRANTED
          );

          setIsPermissionsGranted(allGranted);
        } catch (err) {
          console.warn('Permission error:', err);
          setIsPermissionsGranted(false);
        }
      } else {
        setIsPermissionsGranted(true); // iOS
      }
      setIsInitializing(false);
    };

    requestAndCheckPermissions();
  }, []);

  // Cleanup server on unmount or role change
  useEffect(() => {
    return () => {
      if (serverRef.current) {
        serverRef.current.close();
        serverRef.current = null;
        console.log('TCP Server closed.');
      }
    };
  }, []);

  // --- SENDER LOGIC (SERVER) ---
  const startSharing = async () => {
    if (!isPermissionsGranted) {
      Alert.alert(
        'Permissions Required',
        'Please grant Wi-Fi and Location permissions in settings to use this feature.'
      );
      return;
    }

    setRole('sender');
    setIsActionActive(true);
    setStatus('Setting up server...');
    setTransferProgress(0);

    try {
      const ip = await WifiManager.getIP();
      if (!ip) {
        Alert.alert(
          'Error', 
          'Could not get local IP. Please connect to a Wi-Fi network or enable a mobile hotspot manually. You can also try restarting the app.'
        );
        setIsActionActive(false);
        setRole(null);
        return;
      }
      setLocalIp(ip);
      setStatus(`Waiting for receiver to connect at ${ip}:${LOCAL_PORT}`);

      const server = TcpSocket.createServer((socket) => {
        console.log('Client connected:', socket.address());
        setStatus('Receiver connected. Starting transfer...');
        
        socket.on('data', (data) => {
          if (data.toString().trim() === 'REQUEST_DATA') {
            sendFile(socket);
          }
        });

        socket.on('error', (error) => {
          console.error('Server socket error:', error);
          setStatus('Transfer failed. Server error.');
        });

        socket.on('close', () => {
          console.log('Client disconnected.');
          setStatus('Transfer finished. Receiver disconnected.');
          setIsActionActive(false);
          serverRef.current = null;
        });
      }).listen({ port: LOCAL_PORT, host: '0.0.0.0' }, () => {
        serverRef.current = server;
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      setStatus('Failed to start sharing. Check Wi-Fi and permissions.');
      setIsActionActive(false);
      setRole(null);
    }
  };

  const sendFile = async (socket) => {
    try {
      const timetableData = await AsyncStorage.getItem('timetableData');
      if (!timetableData) {
        socket.write('ERROR: No data to send.');
        Alert.alert('No Data', 'No timetable data found.');
        setIsActionActive(false);
        return;
      }

      const dataBuffer = Buffer.from(timetableData, 'utf8');
      const dataSize = dataBuffer.length;
      
      socket.write(`HEADER:${dataSize}\n`);

      const chunkSize = 1024;
      let sentBytes = 0;

      const sendChunk = () => {
        if (!socket.writable) return; 
        if (sentBytes >= dataSize) {
          socket.write('END_OF_FILE');
          return;
        }
        const chunk = dataBuffer.slice(sentBytes, sentBytes + chunkSize);
        socket.write(chunk);
        sentBytes += chunk.length;
        setTransferProgress(sentBytes / dataSize);
        // Using setImmediate for better performance than setTimeout
        setImmediate(sendChunk);
      };

      sendChunk();

    } catch (error) {
      console.error('Error sending file:', error);
      socket.write('ERROR: Transfer failed.');
      setStatus('Failed to send data.');
    }
  };
  
  // --- RECEIVER LOGIC (CLIENT) ---
  const startReceiving = async () => {
    if (!isPermissionsGranted) {
      Alert.alert('Permissions Required', 'Please grant Wi-Fi and Location permissions in settings to use this feature.');
      return;
    }

    setRole('receiver');
    setIsActionActive(true);
    setStatus('Connecting to sender via Wi-Fi...');
    setTransferProgress(0);

    Alert.prompt(
      'Enter Sender IP',
      'Please enter the IP address of the sender device (from their screen).',
      (ip) => {
        if (ip) {
          // Simple IP address validation
          const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          if (!ipRegex.test(ip)) {
            Alert.alert('Invalid IP', 'Please enter a valid IP address.');
            setIsActionActive(false);
            setRole(null);
            return;
          }
          connectToSender(ip);
        } else {
          setIsActionActive(false);
          setRole(null);
          setStatus('Receiver cancelled.');
        }
      },
      'plain-text'
    );
  };

  const connectToSender = (senderIp) => {
    const client = TcpSocket.createConnection(
        { 
            port: LOCAL_PORT, 
            host: senderIp,
            timeout: 5000 // Add a timeout to prevent indefinite waiting
        }, 
        () => {
            setStatus('Connected. Requesting data...');
            client.write('REQUEST_DATA');
        }
    );

    let receivedData = Buffer.alloc(0);
    let totalBytes = 0;
    let isHeaderReceived = false;

    client.on('data', (data) => {
      // Check for the header with a more robust method
      if (!isHeaderReceived) {
        const headerIndex = data.indexOf('HEADER:');
        if (headerIndex !== -1) {
          const headerString = data.toString('utf8', headerIndex);
          const headerValue = headerString.substring(headerString.indexOf(':') + 1, headerString.indexOf('\n'));
          totalBytes = parseInt(headerValue, 10);
          isHeaderReceived = true;
          // Process any data that came with the header
          const remainingData = data.slice(headerString.indexOf('\n') + 1);
          receivedData = Buffer.concat([receivedData, remainingData]);
          setTransferProgress(receivedData.length / totalBytes);
          return;
        }
      }

      if (data.toString().trim() === 'END_OF_FILE') {
        try {
          const finalData = receivedData.toString('utf8');
          AsyncStorage.setItem('timetableData', finalData);
          Alert.alert('Success', 'Timetable received and saved!');
          setStatus('Transfer complete. Data saved.');
        } catch (error) {
          console.error('Error processing data:', error);
          Alert.alert('Error', 'Failed to process received data.');
          setStatus('Error processing data.');
        }
        client.destroy();
        setIsActionActive(false);
        return;
      }
      
      receivedData = Buffer.concat([receivedData, data]);
      setTransferProgress(receivedData.length / totalBytes);
      setStatus(`Receiving data: ${receivedData.length} of ${totalBytes} bytes`);
    });

    client.on('error', (error) => {
      console.error('Client socket error:', error);
      Alert.alert('Connection Failed', `Could not connect to the sender. Please check the IP address and Wi-Fi connection.`);
      setStatus('Receiver failed to connect.');
      setIsActionActive(false);
    });

    client.on('close', () => {
      console.log('Connection to sender closed.');
    });
  };

  const handleRoleSelection = (selectedRole) => {
    if (selectedRole === 'sender') {
      startSharing();
    } else {
      startReceiving();
    }
  };
  
  // UI logic
  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Checking permissions...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a1a', '#2a2a2a']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {}} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Wi-Fi Share</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={[styles.statusContainer, { borderColor: isActionActive ? '#4CAF50' : '#f44336' }]}>
            <View style={[styles.statusIndicator, { backgroundColor: isActionActive ? '#4CAF50' : '#f44336' }]} />
            <Text style={styles.statusText}>{status}</Text>
          </View>

          {!isActionActive ? (
            <View style={styles.roleButtons}>
              <TouchableOpacity style={[styles.button, styles.roleButton]} onPress={() => handleRoleSelection('sender')}>
                <Ionicons name="wifi" size={24} color="#fff" />
                <Text style={styles.buttonText}>Start as Sender</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.roleButton]} onPress={() => handleRoleSelection('receiver')}>
                <Ionicons name="cloud-download-outline" size={24} color="#fff" />
                <Text style={styles.buttonText}>Start as Receiver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.transferContainer}>
              {role === 'sender' && (
                <View style={styles.qrCodeContainer}>
                  <Text style={styles.qrText}>Scan this code to connect</Text>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={JSON.stringify({ ip: localIp, port: LOCAL_PORT })}
                      size={200}
                      color="#000"
                      backgroundColor="#fff"
                    />
                  </View>
                  <Text style={styles.ipAddressText}>Or enter IP: {localIp}:{LOCAL_PORT}</Text>
                  <View style={styles.progressWrapper}>
                    <Text style={styles.progressLabel}>Transfer Progress</Text>
                    <CustomProgressBar progress={transferProgress} color="#00b894" />
                  </View>
                </View>
              )}
              {role === 'receiver' && (
                <View style={styles.receiverDisplay}>
                  <ActivityIndicator size="large" color="#3fa4ff" />
                  <Text style={styles.receiverText}>Waiting for transfer to begin...</Text>
                  <View style={styles.progressWrapper}>
                    <Text style={styles.progressLabel}>Transfer Progress</Text>
                    <CustomProgressBar progress={transferProgress} color="#00b894" />
                  </View>
                </View>
              )}
              <TouchableOpacity
                style={[styles.button, styles.stopButton]}
                onPress={() => {
                  if (serverRef.current) {
                    serverRef.current.close();
                  }
                  setRole(null);
                  setIsActionActive(false);
                  setTransferProgress(0);
                  setStatus('Select a role to begin...');
                }}
              >
                <Ionicons name="stop" size={24} color="#fff" />
                <Text style={styles.buttonText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: { padding: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, padding: 20 },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f44336'
  },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  statusText: { color: '#fff', fontSize: 14, flex: 1 },
  roleButtons: { flexDirection: 'row', justifyContent: 'center', marginTop: 50 },
  button: {
    backgroundColor: '#3fa4ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#3fa4ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  roleButton: { flex: 1, marginHorizontal: 10, minHeight: 120 },
  stopButton: { marginTop: 20, backgroundColor: '#f44336', padding: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  transferContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  qrCodeContainer: { alignItems: 'center', marginBottom: 20, padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 15 },
  qrText: { color: '#fff', fontSize: 16, marginBottom: 15, textAlign: 'center' },
  qrCodeWrapper: { padding: 10, backgroundColor: '#fff', borderRadius: 10 },
  ipAddressText: { color: '#888', marginTop: 20, fontSize: 12, textAlign: 'center' },
  progressWrapper: { alignItems: 'center', marginTop: 20 },
  progressLabel: { color: '#fff', fontSize: 14, marginBottom: 5 },
  receiverDisplay: { alignItems: 'center', marginTop: 50, padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 15 },
  receiverText: { color: '#fff', marginTop: 15, fontSize: 16, textAlign: 'center' },
  centerContent: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#fff', fontSize: 16, textAlign: 'center', marginVertical: 20, lineHeight: 24 },
});

export default ShareTT;