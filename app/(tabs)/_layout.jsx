import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import Octicons from "react-native-vector-icons/Octicons";
import Foundation from "react-native-vector-icons/Foundation";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // headerShown: true,
        tabBarActiveTintColor: "#40E0D0", //ye hai jo active hai uske liye color
        tabBarInactiveTintColor: "#9BA1A6",
        tabBarStyle: {
          backgroundColor: "#000",
          height: 70,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 10,
          paddingBottom: 10,
          paddingLeft: 10,
          paddingRight: 10,
          borderTopWidth: 0,
          borderWidth: 0,
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
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
    </Tabs>
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
