import { StyleSheet, Text, View, Dimensions } from 'react-native';
import React from 'react';
import Svg, { Circle, G } from 'react-native-svg';

const AttendanceCard = ({ subject, professor, percentage, status }) => {
  const size = 100;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.subject}>{subject}</Text>
        <Text style={styles.prof}>{professor}</Text>
      </View>
      
      <View style={styles.percentContainer}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size/2}, ${size/2}`}>
            <Circle
              stroke="#e6e6e6"
              fill="none"
              cx={size/2}
              cy={size/2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <Circle
              stroke= {percentage < 75 ? 'red' : 'green'}
              fill="none"
              cx={size/2}
              cy={size/2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={progress}
            />
          </G>
        </Svg>
        
        
        <View style={styles.percentTextContainer}>
          <Text style={[styles.percent, { color: percentage < 75 ? 'red' : 'green' }]}>{percentage}%</Text>
        </View>
      </View>
      
      {/* <Text style={styles.status}>{status}</Text> */}
    </View>
  );
};

export default AttendanceCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#232323',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    alignItems: 'center',
  },
  cardHeader: {
    width: '50%',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  percentContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    marginVertical: 12,
  },
  percentTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percent: {
    
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    color: '#24c46b',
    fontSize: 16,
    marginTop: 6,
  },
});
