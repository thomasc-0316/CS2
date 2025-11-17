import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// We'll create these screens next
import PostScreen from '../screens/PostScreen';
import MessagesScreen from '../screens/MessagesScreen';
import MapSelectionScreen from '../screens/MapSelectionScreen';
import SideSelectionScreen from '../screens/SideSelectionScreen';
import SiteSelectionScreen from '../screens/SiteSelectionScreen';
import LineupGridScreen from '../screens/LineupGridScreen';
import LineupDetailScreen from '../screens/LineupDetailScreen';
import HotScreen from '../screens/HotScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack - this handles all the lineup browsing
function HomeStack() {
    return (
      <Stack.Navigator>
        <Stack.Screen 
          name="MapSelection" 
          component={MapSelectionScreen}
          options={{ title: 'CS Lineups' }}
        />
        <Stack.Screen 
          name="LineupGrid" 
          component={LineupGridScreen}
        />
        <Stack.Screen 
          name="LineupDetail" 
          component={LineupDetailScreen}
          options={{ title: 'Lineup Detail' }}
        />
      </Stack.Navigator>
    );
  }

export default function AppNavigator() {
    return (
      <NavigationContainer>
        <Tab.Navigator>
            <Tab.Screen 
                name="Home" 
                component={HomeStack}
                options={{ headerShown: false }}
            />
            <Tab.Screen name="Hot" component={HotScreen} />
            <Tab.Screen name="Post" component={PostScreen} />
            <Tab.Screen name="Messages" component={MessagesScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>
      </NavigationContainer>
    );
  }