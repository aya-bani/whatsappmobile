import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ref, update } from "firebase/database";
import React, { useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../../firebase/config';
import GroupsScreen from './GroupsScreen';
import Profile from './ProfileScreen';
import Discussions from './UserListScreen';

const Tab = createBottomTabNavigator();

export default function HomeScreen({ navigation }) {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      navigation.reset({ routes: [{ name: 'Login' }] });
      return;
    }

    const userRef = ref(db, `users/${auth.currentUser.uid}`);

    const setUserActive = async () => {
      try {
        await update(userRef, { isActive: true });
        setIsActive(true);
      } catch (error) {
        console.error("Error updating isActive: ", error);
      }
    };

    setUserActive();

    return () => {
      if (auth.currentUser) {
        update(userRef, { isActive: false }).catch((error) =>
          console.error("Error updating isActive on unmount: ", error)
        );
      }
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (route.name === 'Discussions') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Groups') iconName = focused ? 'people' : 'people-outline';
          return <Icon name={iconName} size={focused ? size + 2 : size} color={color} />;
        },
        tabBarActiveTintColor: '#C8A2C8',
        tabBarInactiveTintColor: '#B19BC8',
        tabBarStyle: { 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 2,
          borderTopColor: 'rgba(212, 181, 232, 0.5)',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#C8A2C8',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen name="Discussions" component={Discussions} />
      <Tab.Screen name="Groups" component={GroupsScreen} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
