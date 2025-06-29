import { Tabs } from "expo-router";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Octicons from "react-native-vector-icons/Octicons";
import Foundation from "react-native-vector-icons/Foundation";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Welcome from "../onboarding/Welcome";


export default function TabLayout() {
  // Styles for loading screen
  const styles = StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000', // Match your app's background
    },
    loadingText: {
      color: '#3fa4ff',
      fontSize: 18,
      marginBottom: 20,
    }
  });
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [name, setName] = useState('');


  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem('onboardingDone');
        setIsOnboardingDone(onboardingDone === 'true');
        setInitializing(false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, []);

  // useEffect(() => {
  //   const auth = getAuth();
  //   const unsubscribe = onAuthStateChanged(auth, (user) => {
  //     setIsLoggedIn(!!user);
  //     if (initializing) setInitializing(false);
  //   });

  //   // Cleanup subscription on unmount
  //   return () => unsubscribe();
  // }, []);

  useEffect(() => {
    AsyncStorage.getItem('userName').then(name => {
      if (name) {
        setName(name);
      }
    });
  },[])

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3fa4ff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }


  return (
    <SafeAreaProvider>
      {/* <SafeAreaView style={styles.container}> */}
      {isOnboardingDone ? (
        // isLoggedIn ? (
          <Tabs
      screenOptions={{
        // headerShown: false,
        tabBarActiveTintColor: "#3fa4ff", //ye hai jo active hai uske liye color
        tabBarInactiveTintColor: "#9BA1A6",
        tabBarStyle: {
          backgroundColor: "#000",
          height: 70,
          width: "90%",
          borderRadius: 20,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 10,
          paddingRight: 10,
          borderTopWidth: 0.1,
          borderWidth: 0.1,
          borderColor: "#40E0D0",
          position: "absolute",
          bottom: 10,
          marginLeft: "5%",
          // right: "5%",
          // marginHorizontal: 20,
          zIndex: 1000,
          elevation: 12,
          shadowColor: "#121212",
          shadowOffset: { width: 6, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        // headerStatusBarHeight: 0,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          // headerTitle: () => (
          //   <View style={{ flexDirection: "row", alignItems: "baseline" }}>
          //     <Text style={Styles.headerTitle}>Hi, </Text>
          //     <Text style={Styles.title}>{name}</Text>
          //   </View>
          // ),
          // headerStyle: {
          //   backgroundColor: "black",
          // },
          // headerLeft: () => (
          //   <View style={{ marginLeft: 10, marginRight: 10 }}>
          //     <Ionicons name="menu" size={32} color="white"/>
          //   </View>
          // ),
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <Foundation
                name="home"
                color={color}
                size={focused ? size + 5 : size}
              />
            ) : (
              <Octicons
                name="home"
                color={color}
                size={focused ? size + 5 : size}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="Attendance"
        options={{
          tabBarLabel: "Attendance",
          headerShown: false,
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={Styles.title}>Attendance</Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: "black",
          },
          headerLeft: () => (
            <View style={{ marginLeft: 10, marginRight: 10 }}>
              <Ionicons name="menu" size={32} color="white"/>
            </View>
          ),
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <MaterialCommunityIcons
                name="view-agenda"
                color={color}
                size={focused ? size + 4 : size}
              />
            ) : (
              <MaterialCommunityIcons
                name="view-agenda-outline"
                color={color}
                size={focused ? size + 4 : size}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="Notes"
        options={{
          tabBarLabel: "Notes",
          headerShown: false,
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={Styles.title}>Notes</Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: "black",
          },
          headerLeft: () => (
            <View style={{ marginLeft: 10, marginRight: 10 }}>
              <Ionicons name="menu" size={32} color="white"/>
            </View>
          ),
          tabBarIcon: ({ color, size, focused }) =>
            focused ? (
              <Ionicons
                name="calendar-clear"
                color={color}
                size={focused ? size + 4 : size}
              />
            ) : (
              <Ionicons
                name="calendar-clear-outline"
                color={color}
                size={focused ? size + 4 : size}
              />
            ),
        }}
      />
        </Tabs>
        // ) : (
        //   <Signin />
        // )
      ): (
          <Welcome />
        )}
      {/* </SafeAreaView> */}
    </SafeAreaProvider>
  );
}

const Styles = StyleSheet.create({
  // container: {
    // backgroundColor: "#181818",
    // flex: 0,
    // backgroundColor: "#121212",
  // },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "green",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Match your app's background
  },
  loadingText: {
    color: '#3fa4ff',
    fontSize: 18,
    marginBottom: 20,
  }
});
