import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform
} from "react-native";
import { useLocalSearchParams } from "expo-router";


const newsData = [
  {
    id: "1",
    category: "STYLE & BEAUTY",
    title: "Jane Birkin, actor, singer and style icon, dies at 76 in Paris",
    time: "20 minutes ago",
    image: "https://via.placeholder.com/150", // replace with real url
  },
  {
    id: "2",
    category: "SPORT",
    title: "Salt Bae touched the World Cup trophy after Argentina win...",
    time: "21 minutes ago",
    image: "https://via.placeholder.com/150",
  },
  {
    id: "3",
    category: "TECH",
    title: "New AI tool changes everything in development...",
    time: "30 minutes ago",
    image: "https://via.placeholder.com/150",
  },
];

const News = ({ route }: { route: any }) => {
  const { user } = useLocalSearchParams(); // Login से name pass कर सकते हो

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <Text style={styles.category}>{item.category}</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.time}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
  <SafeAreaView style={styles.container}>
      {/* Top Greeting Section */}
      <View style={styles.header}>
         <Text style={styles.greeting}>Good Morning {user || "Guest"},</Text>
        <Text style={styles.update}>Update news today</Text>
        <Text style={styles.date}>Today, 19 July 2023</Text>
      </View>

      {/* Horizontal Scroll News */}
      <FlatList
        data={newsData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0, // 👈 Fix
  },
  header: {
    backgroundColor: "#C62828",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  update: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 10,
  },
  date: {
    fontSize: 14,
    color: "#eee",
    marginTop: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginRight: 12,
    width: 200,
    padding: 10,
     boxShadow: "0px 3px 6px rgba(0,0,0,0.16)",
  },
  cardImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  category: {
    fontSize: 12,
    color: "#C62828",
    fontWeight: "bold",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 5,
    color: "#333",
  },
  time: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
});

export default News;
