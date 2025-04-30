import { StyleSheet, Text, View, TouchableOpacity, FlatList } from 'react-native';
import React from 'react';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const subjects = [
  'DBMS', 'OS', 'CCN', 'LA', 'BEE', 'BEE(Lab)'
];

const Notes = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      {/* Header */}
      
      {/*   Grid */}
      <FlatList
        data={subjects}
        keyExtractor={(item) => item}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SubjectNotes', { subject: item })}>
            <Text style={styles.cardText}>{item}</Text>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
      {/* Floating Add Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      {/* Bottom Navigation Bar */}
  
    </View>
  );
};

export default Notes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181818',
    paddingTop: 18,
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
  grid: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 90,
  },
  card: {
    backgroundColor: '#232323',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3fa4ff',
    width: 180,
    height: 140,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  cardText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 80,
    backgroundColor: '#3fa4ff',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
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