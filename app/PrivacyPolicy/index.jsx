import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';

const PrivacyPolicy = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Last Updated: June 7, 2025</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.text}>
            RollCall respects your privacy. This Privacy Policy explains how the app handles information. The app is designed to work entirely offline—no user data is collected, shared, or transmitted to any external server or third party.
          </Text>

          <Text style={styles.sectionTitle}>2. Information We Do Not Collect</Text>
          <Text style={styles.text}>
            RollCall does not collect or store any personal data such as your name, email, location, or device identifiers. There is no login or account system, and we do not require any user registration.
          </Text>

          <Text style={styles.sectionTitle}>3. Local Data Storage</Text>
          <Text style={styles.text}>
            Any information you enter—such as attendance, timetables, or reminders—is stored only on your device using local storage (AsyncStorage). We do not have access to it, and it is not uploaded anywhere.
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.text}>
            Since your data never leaves your device, it stays private and secure. However, it is your responsibility to ensure the physical security of your device.
          </Text>

          <Text style={styles.sectionTitle}>5. Permissions</Text>
          <Text style={styles.text}>
            RollCall may request device permissions such as notifications, but we do not use these to collect any information.
          </Text>

          <Text style={styles.sectionTitle}>6. Changes to This Policy</Text>
          <Text style={styles.text}>
            We may update this Privacy Policy to reflect improvements or legal requirements. Changes will be posted within the app and/or on our website.
          </Text>

          <Text style={styles.sectionTitle}>7. Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions or concerns about this Privacy Policy, please contact us at:
            <Text style={styles.contactInfo}> help.pixelvolt.apps@gmail.com</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    marginTop: 20,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 15,
  },
  contactInfo: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 5,
  },
});

export default PrivacyPolicy;