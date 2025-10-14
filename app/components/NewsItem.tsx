import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { NewsData } from "../../types/news";
import { useAuth } from "../providers/AuthProvider";

type Props = {
  item: NewsData;
  onEdit: (item: NewsData) => void;
  onDelete: () => void;
};

const NewsListItem: React.FC<Props> = ({ item, onEdit, onDelete }) => {
  const { user } = useAuth();
  const role: string = user?.user_metadata?.role || "guest";

  return ( // ✅ MANDATORY return
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

      {role === "admin" && (
        <View style={styles.actionContainer}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionButton}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}; // ✅ Closing with return

const styles = StyleSheet.create({
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

export default NewsListItem;
