import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BalanceView from './src/components/BalanceView';
import SpinView from './src/components/SpinView';
import Icon from 'react-native-vector-icons/Ionicons';


const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.navbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel || options.title || route.name;
        const isFocused = state.index === index;

        let iconName;
        if (route.name === 'Balances') {
          iconName = isFocused ? 'wallet' : 'wallet-outline';
        } else if (route.name === 'Active Bets') {
          iconName = isFocused ? 'football' : 'football-outline';
        } else if (route.name === 'Spin') {
          iconName = isFocused ? 'refresh-circle' : 'refresh-circle-outline';
        } else if (route.name === 'Terminale') {
          iconName = isFocused ? 'terminal' : 'terminal-outline';
        }

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={index}
            onPress={onPress}
            style={styles.navItem}
          >
            <Icon name={iconName} size={28} color={isFocused ? '#0a84ff' : '#fff'} />
            <Text style={[styles.navText, isFocused && styles.activeNavText]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};



export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="Balances" component={BalanceView} options={{ tabBarLabel: 'Saldi' }} />
        <Tab.Screen name="Spin" component={SpinView} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1c1c1e',
    paddingVertical: 10,
    paddingTop:15,
    paddingBottom:20,
    paddingHorizontal:20,

    borderTopWidth: 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
  },
  activeNavText: {
    color: '#0a84ff',
    fontWeight: 'bold',
  },
});

