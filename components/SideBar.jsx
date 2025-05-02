import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const SideBar = ({ onLogout }) => {
    const navigation = useNavigation();
    const [activeItem, setActiveItem] = useState('Profile');

    const sidebarItems = [
        { 
            name: 'Profile', 
            icon: 'person-circle-outline', 
            route: 'Profile' 
        },
        { 
            name: 'Settings', 
            icon: 'settings-outline', 
            route: 'Settings' 
        },
        { 
            name: 'About', 
            icon: 'information-circle-outline', 
            route: 'About' 
        },
        { 
            name: 'Privacy Policy', 
            icon: 'shield-checkmark-outline', 
            route: 'PrivacyPolicy' 
        }
    ];

    const handleItemClick = (item) => {
        setActiveItem(item.name);
        navigation.navigate(item.route);
    };

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        }
        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>RollCall</Text>
            </View>

            <View style={styles.navContainer}>
                {sidebarItems.map((item) => (
                    <TouchableOpacity
                        key={item.name}
                        onPress={() => handleItemClick(item)}
                        style={[
                            styles.navItem,
                            activeItem === item.name && styles.activeNavItem
                        ]}
                    >
                        <Ionicons 
                            name={item.icon} 
                            size={24} 
                            color={activeItem === item.name ? 'white' : 'lightgray'} 
                            style={styles.navItemIcon}
                        />
                        <Text style={[
                            styles.navItemText, 
                            activeItem === item.name && styles.activeNavItemText
                        ]}>
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.logoutContainer}>
                <TouchableOpacity 
                    onPress={handleLogout}
                    style={styles.logoutButton}
                >
                    <Ionicons 
                        name='log-out-outline' 
                        size={24} 
                        color='white' 
                        style={styles.logoutIcon}
                    />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: 250,
        backgroundColor: '#1F2937',
        paddingTop: 40,
    },
    header: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        alignItems: 'center',
    },
    headerText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    navContainer: {
        flex: 1,
        paddingTop: 20,
    },
    navItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
    },
    activeNavItem: {
        backgroundColor: '#2563EB',
    },
    navItemIcon: {
        marginRight: 15,
    },
    navItemText: {
        color: 'lightgray',
        fontSize: 16,
    },
    activeNavItemText: {
        color: 'white',
        fontWeight: 'bold',
    },
    logoutContainer: {
        borderTopWidth: 1,
        borderTopColor: '#374151',
        padding: 20,
    },
    logoutButton: {
        backgroundColor: '#DC2626',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 8,
    },
    logoutIcon: {
        marginRight: 10,
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default SideBar;
