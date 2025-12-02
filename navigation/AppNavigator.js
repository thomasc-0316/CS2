// navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LineupGridScreen from '../screens/LineupGridScreen';
import LineupDetailScreen from '../screens/LineupDetailScreen';
import PostScreen from '../screens/PostScreen';
import PreviewPostScreen from '../screens/PreviewPostScreen';
import TacticsHubScreen from '../screens/TacticsHubScreen';
import TacticDetailScreen from '../screens/TacticDetailScreen';
import TacticsMapSelectScreen from '../screens/TacticsMapSelectScreen';
import RoomScreen from '../screens/RoomScreen';
import TacticsHubScreen from '../screens/TacticsHubScreen';
import TacticDetailScreen from '../screens/TacticDetailScreen';
import TacticsMapSelectScreen from '../screens/TacticsMapSelectScreen';
import RoomScreen from '../screens/RoomScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import SearchLineupsScreen from '../screens/SearchLineupsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import PlayerSearchScreen from '../screens/PlayerSearchScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const renderBackArrow = (navigation, canGoBack) => {
  if (!canGoBack) return null;
  return (
    <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: 8 }}>
      <Ionicons
        name="arrow-back"
        size={22}
        color="#FF6800"
      />
    </TouchableOpacity>
  );
};

const commonStackOptions = ({ navigation, route }) => ({
  headerStyle: {
    backgroundColor: '#0a0a0a',
  },
  headerTintColor: '#FF6800',
  headerTitleStyle: {
    fontWeight: 'bold',
  },
  headerBackTitleVisible: false,
  headerLeft: ({ canGoBack }) => renderBackArrow(navigation, canGoBack),
});

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LineupGrid" component={LineupGridScreen} options={({ route }) => ({ title: route.params?.map?.name || 'Lineups' })} />
      <Stack.Screen name="LineupDetail" component={LineupDetailScreen} options={{ title: 'Lineup Detail' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={({ route }) => ({ title: route.params?.username || 'User Profile' })} />
      <Stack.Screen name="PlayerSearch" component={PlayerSearchScreen} options={{ title: 'Find Player' }} />
    </Stack.Navigator>
  );
}

// Tactics Stack (explore + detail)
function TacticsStack() {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen
        name="TacticsMapSelect"
        component={TacticsMapSelectScreen}
        options={{ title: 'Tactics' }}
      />
      <Stack.Screen
        name="TacticsMain"
        component={TacticsHubScreen}
        options={({ route }) => ({
          title: route.params?.map?.name || 'Tactics'
        })}
      />
      <Stack.Screen
        name="TacticDetail"
        component={TacticDetailScreen}
        options={({ route }) => ({
          title: route.params?.tactic?.title || 'Tactic'
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
        name="LineupGrid"
        component={LineupGridScreen}
        options={({ route }) => ({
          title: route.params?.map?.name || 'Lineups'
        })}
      />
    </Stack.Navigator>
  );
}

// Tactics Stack (explore + detail)
function TacticsStack() {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen
        name="TacticsMapSelect"
        component={TacticsMapSelectScreen}
        options={{ title: 'Tactics' }}
      />
      <Stack.Screen
        name="TacticsMain"
        component={TacticsHubScreen}
        options={({ route }) => ({
          title: route.params?.map?.name || 'Tactics'
        })}
      />
      <Stack.Screen
        name="TacticDetail"
        component={TacticDetailScreen}
        options={({ route }) => ({
          title: route.params?.tactic?.title || 'Tactic'
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
        name="LineupGrid"
        component={LineupGridScreen}
        options={({ route }) => ({
          title: route.params?.map?.name || 'Lineups'
        })}
      />
    </Stack.Navigator>
  );
}

// Post Stack
function PostStack() {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen 
        name="PostMain" 
        component={PostScreen}
        options={{
          title: 'Create Lineup',
          // headerLeft will be set by PostScreen itself
        }}
      />
      <Stack.Screen name="PreviewPost" component={PreviewPostScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SearchLineups" component={SearchLineupsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="LineupDetail" component={LineupDetailScreen} options={{ title: 'Lineup Detail' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={({ route }) => ({ title: route.params?.username || 'User Profile' })} />
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
          } else if (route.name === 'Tactics') {
            iconName = focused ? 'layers' : 'layers-outline';
          } else if (route.name === 'Post') {
            return (
              <View style={styles.postButton}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            );
          } else if (route.name === 'Room') {
            iconName = focused ? 'people' : 'people-outline';
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
        name="Tactics" 
        component={TacticsStack}
        name="Tactics" 
        component={TacticsStack}
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
        name="Room" 
        component={RoomScreen}
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
