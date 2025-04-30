import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import Octicons from "react-native-vector-icons/Octicons";
import Foundation from "react-native-vector-icons/Foundation";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Welcome from "../onboarding/Welcome";

export default function TabLayout() {
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem('onboardingDone');
        setIsOnboardingDone(onboardingDone === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, []);

  return (
    <SafeAreaProvider>
      {isOnboardingDone ? (
        <Tabs
      screenOptions={{
        // headerShown: true,
        tabBarActiveTintColor: "#40E0D0", //ye hai jo active hai uske liye color
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
          borderTopWidth: 0,
          borderWidth: 0,
          position: "absolute",
          bottom: 10,
          marginLeft: "5%",
          // right: "5%",
          // marginHorizontal: 20,
          zIndex: 1000,
        },
        // headerStatusBarHeight: 0,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={Styles.headerTitle}>Hi, </Text>
              <Text style={Styles.title}>Aadit Jha</Text>
            </View>
          ),
          headerStyle: {
            backgroundColor: "black",
          },
          headerLeft: () => (
            <View style={{ marginLeft: 10, marginRight: 10 }}>
              <Ionicons name="menu" size={32} color="white" />
            </View>
          ),
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
          headerShown: true,
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
              <Ionicons name="menu" size={32} color="white" />
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
          headerShown: true,
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
              <Ionicons name="menu" size={32} color="white" />
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
        </Tabs> ) : (
          <Welcome />
        )}
    </SafeAreaProvider>
  );
}

const Styles = StyleSheet.create({
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "green",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
});
