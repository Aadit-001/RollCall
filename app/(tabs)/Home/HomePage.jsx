import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, FlatList } from 'react-native-gesture-handler';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const lecturesSample = [
  {
    id: '1',
    name: 'DBMS',
    professor: 'Prof. Rupali Sawant',
  },
  {
    id: '1',
    name: 'DBMS',
    professor: 'Prof. Rupali Sawant',
  },
  {
    id: '1',
    name: 'DBMS',
    professor: 'Prof. Rupali Sawant',
  },
  {
    id: '1',
    name: 'DBMS',
    professor: 'Prof. Rupali Sawant',
  },
  {
    id: '1',
    name: 'DBMS',
    professor: 'Prof. Rupali Sawant',
  },
  {
    id: '1',
    name: 'DBMS',
    professor: 'Prof. Rupali Sawant',
  },
  {
    id: '1',
    name: 'DBMS',
    professor: 'Prof. Rupali Sawant',
  },
  {
    id: '1',
    name: 'DBMS',
    professor: 'Prof. Rupali Sawant',
  },
  // Add more lectures if needed
];

const Home = () => {
  const [lectures, setLectures] = useState(lecturesSample); // Replace with real data
  const [hasTimetable, setHasTimetable] = useState(true); // Set to false to show 'add TT' message

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* Welcome Box */}
          <View style={styles.topBox}>
            <Text style={styles.topBoxText}>Welcome To</Text>
            <Text style={styles.topBoxTextName}>R O L L C A L L</Text>
          </View>
          {/* Today's Lectures Title */}
          <View style={styles.bottomBoxTittle}>
            <Text style={styles.bottomBoxTittleText}>Today's Lectures</Text>
          </View>
          {/* Timetable or Placeholder */}
          {hasTimetable ? (
            <FlatList
              data={lectures}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.lectureCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lectureName}>{item.name}</Text>
                    <Text style={styles.profName}>{item.professor}</Text>
                  </View>
                  <View style={styles.attendanceBtns}>
                    <TouchableOpacity style={styles.attendanceBtnRed}>
                      <MaterialIcons name="close" size={32} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.attendanceBtnGreen}>
                      <MaterialIcons name="check" size={32} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              style={{ width: '95%', alignSelf: 'center', marginTop: 10 }}
            />
          ) : (
            <View style={styles.ttPlaceholderBox}>
              <Text style={styles.ttPlaceholderText}>Please add your TT first ……</Text>
            </View>
          )}
          {/* Add Timetable Button */}
          {/* <TouchableOpacity style={styles.addTTBtn}>
            <Text style={styles.addTTBtnText}>+ Add your time table</Text>
          </TouchableOpacity> */}
        </ScrollView>
        {/* Bottom Navigation Bar */}
        {/* <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navIcon}><Ionicons name="ios-school" size={28} color="#3fa4ff" /></TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}><MaterialIcons name="assignment" size={28} color="#fff" /></TouchableOpacity>
          <TouchableOpacity style={styles.navIcon}><FontAwesome name="pie-chart" size={28} color="#fff" /></TouchableOpacity>
        </View> */}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default Home

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#181818',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  topBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3fa4ff',
    height: 200,
    width: '95%',
    padding: 20,
    margin: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBoxText: {
    color: '#3fa4ff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  topBoxTextName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 4,
  },
  bottomBoxTittle: {
    backgroundColor: 'transparent',
    width: '100%',
    height: 40,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  bottomBoxTittleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  ttPlaceholderBox: {
    backgroundColor: '#222',
    borderRadius: 10,
    margin: 10,
    padding: 16,
    width: '95%',
    alignSelf: 'center',
  },
  ttPlaceholderText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
  },
  lectureCard: {
    backgroundColor: '#222',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    marginTop: 6,
  },
  lectureName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profName: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  attendanceBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  attendanceBtnRed: {
    backgroundColor: '#e53935',
    borderRadius: 8,
    padding: 4,
    marginRight: 8,
  },
  attendanceBtnGreen: {
    backgroundColor: '#43a047',
    borderRadius: 8,
    padding: 4,
  },
  addTTBtn: {
    backgroundColor: '#3fa4ff',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 100,
    width: '90%',
    alignSelf: 'center',
  },
  addTTBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#181818',
    borderTopWidth: 1,
    borderTopColor: '#222',
    height: 56,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  navIcon: {
    flex: 1,
    alignItems: 'center',
  },
});