import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const PrivacyPolicy = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.subtitle}>Last Updated: June 7, 2025</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.text}>
            This Privacy Policy describes how RollCall collects, uses, and shares your personal information when you use our mobile application. 
            We are committed to protecting your privacy and ensuring the security of your data.
          </Text>

          <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          <Text style={styles.text}>
            We collect the following types of information:
          </Text>
          <Text style={styles.listItem}>
            • User Profile Information: Name, email address (if provided)
          </Text>
          <Text style={styles.listItem}>
            • Attendance Data: Your attendance records and tracking information
          </Text>
          <Text style={styles.listItem}>
            • Timetable Data: Your class schedules and timing information
          </Text>
          <Text style={styles.listItem}>
            • Device Information: Basic device information for app functionality
          </Text>

          <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
          <Text style={styles.text}>
            We use your information to:
          </Text>
          <Text style={styles.listItem}>
            • Provide and maintain the RollCall application
          </Text>
          <Text style={styles.listItem}>
            • Track and manage your attendance records
          </Text>
          <Text style={styles.listItem}>
            • Send you notifications about your attendance status
          </Text>
          <Text style={styles.listItem}>
            • Improve our services and features
          </Text>

          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.text}>
            We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
          </Text>

          <Text style={styles.sectionTitle}>5. Data Retention</Text>
          <Text style={styles.text}>
            We retain your information only for as long as necessary to provide the RollCall services to you and for legitimate business purposes.
          </Text>

          <Text style={styles.sectionTitle}>6. Your Rights</Text>
          <Text style={styles.text}>
            You have the right to:
          </Text>
          <Text style={styles.listItem}>
            • Access and view your personal information
          </Text>
          <Text style={styles.listItem}>
            • Request corrections to your personal information
          </Text>
          <Text style={styles.listItem}>
            • Request deletion of your personal information
          </Text>
          <Text style={styles.listItem}>
            • Request a copy of your personal information
          </Text>

          <Text style={styles.sectionTitle}>7. Changes to This Privacy Policy</Text>
          <Text style={styles.text}>
            We may update our Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.
          </Text>

          <Text style={styles.sectionTitle}>8. Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions about this Privacy Policy, please contact us at:
            <Text style={styles.contactInfo}>
                Email: support@rollcallapp.com
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: 40,
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
  listItem: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginBottom: 10,
    marginLeft: 20,
  },
  contactInfo: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 5,
  },
});

export default PrivacyPolicy;