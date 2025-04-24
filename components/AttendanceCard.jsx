import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const AttendanceCard = ({ subject, professor, percentage, status }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.subject}>{subject}</Text>
      <Text style={styles.prof}>{professor}</Text>
      <Text style={styles.percent}>{percentage}%</Text>
      <Text style={styles.status}>{status}</Text>
    </View>
  );
};

export default AttendanceCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#232323',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    alignItems: 'center',
  },
  subject: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  prof: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 4,
  },
  percent: {
    color: '#3fa4ff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  status: {
    color: '#24c46b',
    fontSize: 16,
    marginTop: 6,
  },
});
