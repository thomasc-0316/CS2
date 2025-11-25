import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LineupGridScreen from '../screens/LineupGridScreen';
import LineupDetailScreen from '../screens/LineupDetailScreen';
import HotScreen from '../screens/HotScreen';
import PostScreen from '../screens/PostScreen';
import PreviewPostScreen from '../screens/PreviewPostScreen';
import TacticsScreen from '../screens/TacticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SearchLineupsScreen from '../screens/SearchLineupsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import CreatorProfileScreen from '../screens/CreatorProfileScreen'; // NEW
import { getUserById } from '../data/users'; // NEW

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LineupGrid"
        component={LineupGridScreen}
        options={({ route }) => ({
          title: route.params?.map?.name || 'Lineups'
        })}
      />
      <Stack.Screen
        name="LineupDetail"
        component={LineupDetailScreen}
        options={{ title: 'Lineup Detail' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({
          title: route.params?.username || 'User Profile'
        })}
      />
      <Stack.Screen
        name="CreatorProfile"
        component={CreatorProfileScreen}
        options={({ route }) => ({
          title: getUserById(route.params?.userId)?.username || 'Creator Profile'
        })}
      />
    </Stack.Navigator>
  );
}

// Hot Stack
function HotStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HotMain"
        component={HotScreen}
        options={{ title: '🔥 Hot Lineups' }}
      />
      <Stack.Screen
        name="LineupDetail"
        component={LineupDetailScreen}
        options={{ title: 'Lineup Detail' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({
          title: route.params?.username || 'User Profile'
        })}
      />
      <Stack.Screen
        name="CreatorProfile"
        component={CreatorProfileScreen}
        options={({ route }) => ({
          title: getUserById(route.params?.userId)?.username || 'Creator Profile'
        })}
      />
    </Stack.Navigator>
  );
}

// Post Stack (to include Preview)
function PostStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="PostMain" 
        component={PostScreen}
        options={({ navigation }) => ({
          title: 'Create Lineup',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={{ marginLeft: 10 }}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen 
        name="PreviewPost" 
        component={PreviewPostScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a0a0a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchLineups"
        component={SearchLineupsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LineupDetail"
        component={LineupDetailScreen}
        options={{ title: 'Lineup Detail' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({
          title: route.params?.username || 'User Profile'
        })}
      />
      <Stack.Screen
        name="CreatorProfile"
        component={CreatorProfileScreen}
        options={({ route }) => ({
          title: getUserById(route.params?.userId)?.username || 'Creator Profile'
        })}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Hot') {
            iconName = focused ? 'flame' : 'flame-outline';
          } else if (route.name === 'Post') {
            return (
              <View style={styles.postButton}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            );
          } else if (route.name === 'Tactics') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#1a1a1a',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Hot" 
        component={HotStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Post" 
        component={PostStack}
        options={{ 
          headerShown: false,
          tabBarLabel: '',
        }}
      />
      <Tab.Screen 
        name="Tactics" 
        component={TacticsScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  postButton: {
    width: 52,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FF6800',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6800',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});