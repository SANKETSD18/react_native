import React, { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
  Image,
} from "react-native";
import NewsDialog from "../components/NewsDialog";
import { useAuth } from "../providers/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

type NewsBase = {
  title: string;
  description: string;
  category: string;
  image_url?: string | null;
  video_url?: string | null;
};

type NewsData = NewsBase & {
  id: string;
};

const News = () => {
  const { user } = useAuth();
  const role: string = user?.user_metadata?.role || "guest";
  const email = user?.user_metadata?.email;
  const username = email?.split("@")[0] || "";

  const [showDialog, setShowDialog] = useState(false);
  const [newsList, setNewsList] = useState<NewsData[]>([]);

  // Fetch news from Supabase on mount
  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching news:", error);
      } else {
        setNewsList(data || []);
      }
    };
    fetchNews();
  }, []);

  // Edit handler (implement as needed)
  const handleEdit = (item: NewsData) => {
    console.log("Edit news:", item);
    // Your edit logic here
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (error) {
      console.error("Delete error:", error);
    } else {
      setNewsList(prev => prev.filter(news => news.id !== id));
    }
  };

  // On submitting new news from dialog
  const handleNewsSubmit = async (data: NewsBase) => {
  const { title, description, category, image_url, video_url } = data;

  const newEntry = { title, description, category, image_url: image_url || null, video_url: video_url || null };

  const { data: insertedData, error } = await supabase.from("news").insert([newEntry]).select();

  if (error) {
    console.error("Insert news error:", error);
    return;
  }

  if (insertedData && insertedData.length > 0) {
    setNewsList(prev => [insertedData[0], ...prev]);
  }
  setShowDialog(false);
};


  // Render each news item
  const renderItem = ({ item }: { item: NewsData }) => (
    <View style={styles.itemContainer}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, { backgroundColor: "#ccc" }]} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.readMore}>Read more</Text>
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back, {username}</Text>
        <Text style={styles.date}>Today, {new Date().toLocaleDateString()}</Text>
      </View>

      {role === "admin" && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowDialog(true)}>
          <Text style={styles.addButtonText}>Add News</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={newsList}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 10 }}
      />

      <NewsDialog visible={showDialog} onClose={() => setShowDialog(false)} onSubmit={handleNewsSubmit} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
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
  date: {
    fontSize: 14,
    color: "#eee",
    marginTop: 5,
  },
  addButton: {
    backgroundColor: "#C62828",
    padding: 10,
    margin: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  itemContainer: {
    flexDirection: "row",
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    elevation: 2,
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
  },
  description: {
    color: "#555",
    marginTop: 2,
  },
  readMore: {
    marginTop: 4,
    color: "#C62828",
    fontWeight: "500",
  },
  actionContainer: {
    justifyContent: "space-between",
    height: 60,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#C62828",
    marginVertical: 2,
    borderRadius: 4,
  },
  actionText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default News;
