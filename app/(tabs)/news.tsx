import { supabase } from "@/lib/supabaseClient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NewsData } from "../../types/news";
import NewsDetailView from "../components/NewsDetailView";
import NewsDialog from "../components/NewsDialog";
import NewsListItem from "../components/NewsItem";
import NewsSkeletonLoader from "../components/Skeleton/NewsSkeletonLoader";
import { useAuth } from "../providers/AuthProvider";
import AsyncStorage from "@react-native-async-storage/async-storage";

const News = () => {
  const { user } = useAuth();
  const role: string = user?.user_metadata?.role || "guest";
  const email = user?.user_metadata?.email;
  const username = email?.split("@")[0] || "User";

  const [showDialog, setShowDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newsList, setNewsList] = useState<NewsData[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [highlightedNewsId, setHighlightedNewsId] = useState<string | null>(
    null
  );
  const flatListRef = useRef<FlatList>(null);

  const categories = [
    "All",
    "India",
    "International",
    "Sport",
    "Entertainment",
  ];

  const fetchNews = async () => {
    try {
      // console.log("Fetching news...");
      setLoading(true);
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching news:", error);
      } else {
        setNewsList(data || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews();
    setRefreshing(false);
  };

  // ✅ Check for highlighted news on mount
  useEffect(() => {
    const checkHighlight = async () => {
      const id = await AsyncStorage.getItem("highlighted_news_id");
      if (id) {
        // console.log("🎯 Highlighting news:", id);
        setHighlightedNewsId(id);

        setTimeout(async () => {
          setHighlightedNewsId(null);
          await AsyncStorage.removeItem("highlighted_news_id");
        }, 5000);
      }
    };

    checkHighlight();
  }, []);

  // ✅ Auto-scroll to highlighted news
  // ✅ Scroll to highlighted news after data is loaded
  useEffect(() => {
    if (!highlightedNewsId || newsList.length === 0) return;

    const scrollToHighlighted = () => {
      const index = newsList.findIndex((item) => item.id === highlightedNewsId);
      if (index !== -1 && flatListRef.current) {
        // console.log("🟢 Scrolling to index:", index);
        flatListRef.current.scrollToIndex({ index, animated: true });
      } else {
        console.log("⚠️ Highlighted news not found in list");
      }
    };

    // ✅ थोड़ा delay दो ताकि FlatList render हो जाए
    const timer = setTimeout(scrollToHighlighted, 800);

    return () => clearTimeout(timer);
  }, [highlightedNewsId, newsList]);

  const handleEdit = (item: NewsData) => {
    if (role !== "admin") {
      Alert.alert("Unauthorized", "Only admins can edit news");
      return;
    }
    setSelectedNews(item);
    setIsEditMode(true);
  };

  const handleDelete = async (
    newsId: string,
    imagePath?: string | null,
    videoPath?: string | null
  ) => {
    if (role !== "admin") {
      Alert.alert("Unauthorized", "Only admins can delete news");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this news?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (imagePath) {
                console.log("Deleting image from storage:", imagePath);
                const { error: imageDeleteError } = await supabase.storage
                  .from("news-media")
                  .remove([imagePath]);

                if (imageDeleteError) {
                  console.error("Image delete error:", imageDeleteError);
                }
              }

              if (videoPath) {
                console.log("Deleting video from storage:", videoPath);
                const { error: videoDeleteError } = await supabase.storage
                  .from("news-media")
                  .remove([videoPath]);

                if (videoDeleteError) {
                  console.error("Video delete error:", videoDeleteError);
                }
              }

              const { error: dbError } = await supabase
                .from("news")
                .delete()
                .eq("id", newsId);

              if (dbError) throw dbError;

              Alert.alert("Success", "News deleted successfully!");
              fetchNews();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Unknown error");
            }
          },
        },
      ]
    );
  };

  const handleNewsUpdate = async (
    updatedNews: NewsData & {
      image_path?: string | null;
      video_path?: string | null;
    }
  ) => {
    const { error } = await supabase
      .from("news")
      .update({
        title: updatedNews.title,
        description: updatedNews.description,
        image_url: updatedNews.image_url,
        video_url: updatedNews.video_url,
        image_path: updatedNews.image_path,
        video_path: updatedNews.video_path,
      })
      .eq("id", updatedNews.id);

    if (error) {
      console.error("Update error:", error);
      return;
    }

    fetchNews();
    setSelectedNews(null);
    setIsEditMode(false);
  };

  const handleNewsSubmit = (insertedNews: NewsData) => {
    setNewsList((prev) => [insertedNews, ...prev]);
    setShowDialog(false);
  };

  const filteredNews =
    selectedCategory === "All"
      ? newsList
      : newsList.filter((item) => item.category === selectedCategory);

  const renderItem = ({ item }: { item: NewsData }) => {
    return (
      <View style={styles.newsCard}>
        <TouchableOpacity
          onPress={() => setSelectedNews(item)}
          activeOpacity={0.8}
        >
          <NewsListItem
            item={item}
            onEdit={handleEdit}
            onDelete={() =>
              handleDelete(item.id, item.image_path, item.video_path)
            }
            isHighlighted={item.id === highlightedNewsId}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* ✅ Greeting Section */}
      <View style={styles.greetingSection}>
        <View>
          <Text style={styles.greeting}>Hello, {username} 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
        </View>
        {role === "admin" && (
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#fff" />
          </View>
        )}
      </View>

      {/* ✅ Add News Button (Admin Only) */}
      {role === "admin" && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowDialog(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add News</Text>
        </TouchableOpacity>
      )}

      {/* ✅ Category Filter */}
      <View style={styles.categorySection}>
        <Text style={styles.categoryTitle}>
          <Ionicons name="grid-outline" size={16} color="#333" /> Categories
        </Text>
        <View style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ✅ News Count */}
      <View style={styles.newsCountSection}>
        <Ionicons name="newspaper-outline" size={18} color="#C62828" />
        <Text style={styles.newsCount}>
          {filteredNews.length}{" "}
          {filteredNews.length === 1 ? "Article" : "Articles"}
        </Text>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No News Available</Text>
      <Text style={styles.emptySubtext}>
        {selectedCategory === "All"
          ? "Check back later for updates"
          : `No news in ${selectedCategory} category`}
      </Text>
      {role === "admin" && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => setShowDialog(true)}
        >
          <Text style={styles.emptyButtonText}>Add First News</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (selectedNews) {
    return (
      <NewsDetailView
        news={selectedNews}
        onBack={() => {
          setSelectedNews(null);
          setIsEditMode(false);
        }}
        editable={isEditMode}
        onSave={handleNewsUpdate}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#C62828" barStyle="light-content" />

      {/* ✅ Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="newspaper" size={28} color="#fff" />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>PRADESH TIMES</Text>
            <Text style={styles.headerSubtitle}>Breaking News & Updates</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <NewsSkeletonLoader />
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredNews}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#C62828"]}
              tintColor="#C62828"
            />
          }
        />
      )}

      <NewsDialog
        visible={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={handleNewsSubmit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
  newsCard: {
    borderRadius: 10,
    marginVertical: 5,

    backgroundColor: "transparent",
  },

  header: {
    backgroundColor: "#C62828",
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  greetingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  greeting: {
    fontSize: 20,
    color: "#333",
    fontWeight: "700",
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: "#666",
  },
  adminBadge: {
    backgroundColor: "#2e7d32",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C62828",
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  categorySection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  categoryChipActive: {
    backgroundColor: "#C62828",
    borderColor: "#C62828",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#fff",
  },
  newsCountSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  newsCount: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#999",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: "#C62828",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default News;
