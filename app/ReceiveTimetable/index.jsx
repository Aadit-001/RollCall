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
import {
  initNotifications,
  scheduleWeeklyLectures,
} from "@/services/Notifications/notificationService";

import { Buffer } from 'buffer';

const LOCAL_PORT = 12345;

// Add your utility functions here
const getRandomGradient = () => {
  const gradients = [
    ["#1FD141", "#1FD141"],
    ["#007BFF", "green"],
    ["#ff5f6d", "pink"],
    ["#F9D142", "blue"],
    ["#E94A87", "indigo"],
    ["#FF6D00", "blue"],
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};

const getSubjectIcon = (name) => {
  if (!name) return "book";
  const lowerName = name.toLowerCase();
  if (lowerName.includes("math")) return "calculator";
  if (
    lowerName.includes("science") ||
    lowerName.includes("chemistry") ||
    lowerName.includes("physics")
  )
    return "flask";
  if (lowerName.includes("history")) return "scroll";
  if (lowerName.includes("language") || lowerName.includes("english"))
    return "language";
  if (lowerName.includes("art")) return "palette";
  if (lowerName.includes("music")) return "music";
  if (lowerName.includes("computer") || lowerName.includes("programming"))
    return "laptop-code";
  return "book";
};

const ReceiveTimetable = () => {
  const [status, setStatus] = useState('Enter sender IP to begin...');
  const [isInitializing, setIsInitializing] = useState(true);
  const [transferProgress, setTransferProgress] = useState(0);
  const [isActionActive, setIsActionActive] = useState(false);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(true);
  const [senderIp, setSenderIp] = useState('');

  const clientRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    initNotifications();
  }, []);

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
              'Wi-Fi and Location permissions are needed to receive data.'
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
    if (clientRef.current) {
      clientRef.current.destroy();
      clientRef.current = null;
    }
    setIsActionActive(false);
    setTransferProgress(0);
    setSenderIp('');
    setStatus('Enter sender IP to begin...');
  };

  const startReceiving = async () => {
    if (!isPermissionsGranted) {
      Alert.alert('Permissions Required', 'Please grant permissions to continue.');
      return;
    }

    const isWifiEnabled = await WifiManager.isEnabled();
    if (!isWifiEnabled) {
      Alert.alert(
        'Wi-Fi Required',
        'Please connect to Wi-Fi to receive data.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Settings', onPress: () => WifiManager.setEnabled(true) }
        ]
      );
      return;
    }

    const ip = senderIp.trim();
    const ipRegex =
      /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    if (!ipRegex.test(ip)) {
      Alert.alert('Invalid IP', 'Please enter a valid IP address.');
      return;
    }

    setIsActionActive(true);
    setStatus(`Connecting to ${ip}...`);
    const client = TcpSocket.createConnection({ port: LOCAL_PORT, host: ip, timeout: 8000 }, () => {
      client.write('REQUEST_DATA\n');
      setStatus('Connected. Requesting app data...');
    });

    clientRef.current = client;
    let buffer = Buffer.alloc(0);
    let totalSize = 0;
    let headerReceived = false;
    let dataBuffer = Buffer.alloc(0);

    client.on('data', async (data) => {
      buffer = Buffer.concat([buffer, data]);

      if (!headerReceived) {
        const newline = buffer.indexOf('\n');
        if (newline === -1) return;

        const header = buffer.toString('utf8', 0, newline);
        const remainingData = buffer.slice(newline + 1);
        buffer = Buffer.alloc(0); // Reset buffer after extracting header

        if (header.startsWith('HEADER:')) {
          totalSize = parseInt(header.split(':')[1]);
          headerReceived = true;
          setStatus(`Receiving ${totalSize} bytes...`);
          client.write('ACK_HEADER\n');

          // Add the data after the header to dataBuffer
          dataBuffer = Buffer.concat([dataBuffer, remainingData]);
        } else if (header.startsWith('ERROR:')) {
          Alert.alert('Error', header.split(':')[1]);
          client.destroy();
          stopAllActivity();
          return;
        }
      } else {
        // Header already received, add data directly to dataBuffer
        dataBuffer = Buffer.concat([dataBuffer, data]);
      }

      const processed = dataBuffer.length;
      const progress = Math.min(processed / totalSize, 1);
      setTransferProgress(progress);

      if (processed >= totalSize) {
        // Ensure we have exactly the right amount of data
        if (dataBuffer.length > totalSize) {
          dataBuffer = dataBuffer.slice(0, totalSize);
        }

        // We have all the data, parse it
        const dataStr = dataBuffer.toString('utf8');

        console.log('Data reception complete:');
        console.log('Expected size:', totalSize);
        console.log('Actual size:', dataBuffer.length);
        console.log('Data string length:', dataStr.length);

        try {
          // Parse the received timetable data
          const receivedData = JSON.parse(dataStr);
          console.log('Received timetable data:', receivedData);

          // Process the received timetable data
          if (receivedData && receivedData.days && Array.isArray(receivedData.days)) {
            // Reset attendance counts to 0 for each subject
            const processedTimetable = {
              ...receivedData,
              days: receivedData.days.map(day => ({
                ...day,
                subjects: day.subjects.map(subject => ({
                  ...subject,
                  attendedClasses: 0,
                  totalClasses: 0,
                }))
              }))
            };

            // Extract unique subject names and create proper subject objects
            const allLectures = processedTimetable.days.flatMap(day => day.subjects);
            const uniqueSubjectNames = [
              ...new Set(allLectures.map(lecture => lecture.name).filter(name => name && name.trim()))
            ];

            // Create proper subject objects with your utility functions
            const uniqueSubjects = uniqueSubjectNames.map(subjectName => ({
              id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: subjectName,
              topics: [],
              color: getRandomGradient(),
              icon: getSubjectIcon(subjectName)
            }));

            console.log('Unique subjects to save:', uniqueSubjects);

            // Schedule notifications for all lectures
            const allLecturesForNotifications = processedTimetable.days.flatMap((day) =>
              day.subjects.map((s) => ({
                id: s.id,
                title: s.name,
                day: day.day,
                startTime: s.startTime,
              }))
            );
            await scheduleWeeklyLectures(allLecturesForNotifications);
            console.log('Notifications scheduled for all lectures');

            // Save the processed timetable data
            await AsyncStorage.setItem('timetable', JSON.stringify(processedTimetable));
            console.log('Timetable saved to AsyncStorage');

            // Save unique subjects to AsyncStorage
            await AsyncStorage.setItem('subjects', JSON.stringify(uniqueSubjects));
            console.log('Unique subjects saved to AsyncStorage');

            setStatus('Transfer complete. Timetable received and processed.');
            Alert.alert(
              'Success',
              'Timetable received successfully! And notifications have been scheduled.'
            );
          } else {
            throw new Error('Invalid timetable data format');
          }

        } catch (parseError) {
          console.error('Error processing received data:', parseError);
          console.error('Received data length:', dataStr.length);
          console.error('Expected data length:', totalSize);
          console.error('First 200 characters of received data:', dataStr.substring(0, 200));

          // If parsing fails, show error
          Alert.alert(
            'Error',
            'Failed to process received data. Please ensure the sender is sharing valid timetable data.'
          );
        }

        client.destroy();
        stopAllActivity();
      }
    });

    client.on('error', (error) => {
      console.error('Connection error:', error);
      Alert.alert('Connection Failed', 'Could not connect to sender. Ensure both devices are on the same Wi-Fi network.');
      stopAllActivity();
    });

    client.on('close', () => {
      console.log('Connection closed');
      stopAllActivity();
    });
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#ff9800" />
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
          <Text style={styles.title}>Receive Timetable</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{status}</Text>
          </View>

          {!isActionActive ? (
            <>
              <View style={styles.card}>
                <TextInput
                  style={styles.ipInput}
                  placeholder="Enter sender IP address (e.g. 192.168.1.100)"
                  placeholderTextColor="#888"
                  value={senderIp}
                  onChangeText={setSenderIp}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={styles.primaryButton} onPress={startReceiving}>
                  <Ionicons name="download-outline" size={22} color="#fff" />
                  <Text style={styles.primaryButtonText}>Receive Timetable</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.disclaimerContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#ff9800" />
                <Text style={styles.disclaimerText}>
                  Important: Ensure both devices are on the same Wi-Fi network.
                </Text>
              </View>
            </>
          ) : (
            <View style={[styles.card, styles.activeContainer]}>
              <CustomProgressBar progress={transferProgress} color="#ff9800" />
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
  progress: { height: '100%', borderRadius: 5 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 20,
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
  content: { alignItems: 'center', padding: 20, gap: 20 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  statusContainer: { alignItems: 'center' , marginTop: 20},
  statusText: { color: '#bbb', fontSize: 16, textAlign: 'center', fontStyle: 'italic' },
  ipInput: {
    width: '100%', borderColor: '#555', borderWidth: 1, borderRadius: 10,
    padding: 15, color: '#fff', textAlign: 'center', fontSize: 16, marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 17 },
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 18,
  },
  disclaimerText: { color: '#ff9800', fontSize: 13, flex: 1 },
  activeContainer: { alignItems: 'center' },
  stopButton: {
    backgroundColor: '#d84315',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  loadingText: { color: '#fff', marginTop: 16, fontSize: 16 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
});

export default ReceiveTimetable;