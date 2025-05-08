import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons

const AttendanceCard = ({ 
  subject, 
  professor, 
  initialAttended = 0, 
  initialTotal = 0, 
  attendanceThreshold, 
  onCountsChange 
}) => {
  const [attendedClasses, setAttendedClasses] = useState(initialAttended);
  const [totalClasses, setTotalClasses] = useState(initialTotal);

  // Update local state if initial props change (e.g., due to a global refresh)
  useEffect(() => {
    setAttendedClasses(initialAttended);
  }, [initialAttended]);

  useEffect(() => {
    setTotalClasses(initialTotal);
  }, [initialTotal]);
  
  const percentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

  const size = 80; // Reduced SVG size slightly
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = totalClasses > 0 ? circumference - (percentage / 100) * circumference : circumference;

  const handleIncrementAttended = () => {
    if (attendedClasses < totalClasses) {
      const newAttended = attendedClasses + 1;
      setAttendedClasses(newAttended);
      if (onCountsChange) onCountsChange(subject, newAttended, totalClasses);
    }
  };

  const handleDecrementAttended = () => {
    if (attendedClasses > 0) {
      const newAttended = attendedClasses - 1;
      setAttendedClasses(newAttended);
      if (onCountsChange) onCountsChange(subject, newAttended, totalClasses);
    }
  };

  const handleIncrementTotal = () => {
    const newTotal = totalClasses + 1;
    setTotalClasses(newTotal);
    if (onCountsChange) onCountsChange(subject, attendedClasses, newTotal);
  };

  const handleDecrementTotal = () => {
    if (totalClasses > attendedClasses && totalClasses > 0) {
      const newTotal = totalClasses - 1;
      setTotalClasses(newTotal);
      if (onCountsChange) onCountsChange(subject, attendedClasses, newTotal);
    }
  };

  const calculateBunkable = () => {
    if (totalClasses === 0 || percentage >= attendanceThreshold) {
      // How many can be missed to still be >= threshold
      // (A / (T + X)) * 100 = P_threshold  => 100A = P_threshold * T + P_threshold * X
      // X = (100A - P_threshold * T) / P_threshold
      const bunkableCount = Math.floor((100 * attendedClasses - attendanceThreshold * totalClasses) / attendanceThreshold);
      return Math.max(0, bunkableCount);
    } else {
      // How many more needed to reach threshold
      // ((A+Y) / (T+Y)) * 100 = P_threshold => 100A + 100Y = P_threshold*T + P_threshold*Y
      // Y (100-P_threshold) = P_threshold*T - 100A
      // Y = (P_threshold*T - 100A) / (100-P_threshold)
      // If attendanceThreshold is 100, and you are below, it's impossible unless P_threshold also 100.
      if (attendanceThreshold === 100 && percentage < 100) return "N/A"; // Cannot reach 100% by bunking
      const needed = Math.ceil((attendanceThreshold * totalClasses - 100 * attendedClasses) / (100 - attendanceThreshold));
      return -Math.max(0,needed); // Negative indicates classes needed
    }
  };

  const bunkableLectures = calculateBunkable();
  const meetsThreshold = percentage >= attendanceThreshold;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.cardHeader}>
          <Text style={styles.subject}>{subject}</Text>
          <Text style={styles.prof}>{professor}</Text>
        </View>
        
        <View style={styles.percentContainer}>
          <Svg width={size} height={size}>
            <G rotation="-90" origin={`${size/2}, ${size/2}`}>
              <Circle
                stroke="#555" // Darker background for the track
                fill="none"
                cx={size/2}
                cy={size/2}
                r={radius}
                strokeWidth={strokeWidth}
              />
              <Circle
                stroke={meetsThreshold ? '#4CAF50' : '#F44336'} // Green or Red
                fill="none"
                cx={size/2}
                cy={size/2}
                r={radius}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={progress}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.percentTextContainer}>
            <Text style={[styles.percent, { color: meetsThreshold ? '#4CAF50' : '#F44336' }]}>{percentage}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Attended</Text>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={handleDecrementAttended} style={styles.button}>
              <Ionicons name="remove-circle-outline" size={28} color="#FF6B6B" />
            </TouchableOpacity>
            <Text style={styles.countText}>{attendedClasses}</Text>
            <TouchableOpacity onPress={handleIncrementAttended} style={styles.button}>
              <Ionicons name="add-circle-outline" size={28} color="#6BCB77" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Total Classes</Text>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity onPress={handleDecrementTotal} style={styles.button}>
              <Ionicons name="remove-circle-outline" size={28} color="#FF6B6B" />
            </TouchableOpacity>
            <Text style={styles.countText}>{totalClasses}</Text>
            <TouchableOpacity onPress={handleIncrementTotal} style={styles.button}>
              <Ionicons name="add-circle-outline" size={28} color="#6BCB77" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.bunkableRow}>
        {bunkableLectures >= 0 ? (
          <Text style={styles.bunkableText}>
            Can bunk: <Text style={{fontWeight: 'bold', color: '#4CAF50'}}>{bunkableLectures}</Text> lecture(s) (to maintain {attendanceThreshold}%)
          </Text>
        ) : (
          <Text style={styles.bunkableText}>
            Need to attend: <Text style={{fontWeight: 'bold', color: '#F44336'}}>{-bunkableLectures}</Text> more (for {attendanceThreshold}%)
          </Text>
        )}
         {bunkableLectures === "N/A" && (
            <Text style={styles.bunkableText}>
              Cannot reach {attendanceThreshold}% by missing classes.
            </Text>
          )}
      </View>
    </View>
  );
};

export default AttendanceCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2C2C2E', // Slightly darker card
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    marginHorizontal: -3, // Added horizontal margin
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardHeader: {
    flex: 1, // Allow header to take available space
    marginRight: 10, // Space between header and SVG
    marginLeft: 10,
  },
  subject: {
    color: '#fff',
    fontSize: 32, // Slightly smaller
    fontWeight: 'bold',
    marginBottom: 2,
  },
  prof: {
    color: '#ccc', // Lighter professor text
    fontSize: 14,
  },
  percentContainer: {
    position: 'relative',
    width: 80, // Matched to SVG size
    height: 80,
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
    fontSize: 20, // Slightly smaller percentage text
    fontWeight: 'bold',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#444',
    paddingVertical:10,
  },
  controlGroup: {
    alignItems: 'center',
  },
  controlLabel: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 5, // Easier to tap
  },
  countText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 30, // Ensure space for 2 digits
    textAlign: 'center',
    marginHorizontal: 8,
  },
  bunkableRow: {
    marginTop: 5,
    alignItems: 'center',
  },
  bunkableText: {
    color: '#ddd',
    fontSize: 13,
    textAlign: 'center',
  },
});
