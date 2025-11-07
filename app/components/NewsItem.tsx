import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { NewsData } from "../../types/news";
import { useAuth } from "../providers/AuthProvider";

type Props = {
  item: NewsData;
  onEdit: (item: NewsData) => void;
  onDelete: () => void;
  isHighlighted?: boolean; // ✅ यह prop parent से आएगा
};

const NewsListItem: React.FC<Props> = ({
  item,
  onEdit,
  onDelete,
  isHighlighted,
}) => {
  const { user } = useAuth();
  const role: string = user?.user_metadata?.role || "guest";

  // ✅ Animation value (अब अंदर)
  const highlightAnim = useRef(new Animated.Value(0)).current;

  // ✅ जब isHighlighted true हो तब animation चलाओ
  useEffect(() => {
    if (isHighlighted) {
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: false,
        }),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isHighlighted]);

  // ✅ Green overlay के लिए opacity interpolate करो
  const overlayOpacity = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5], // 0 → 0.6 opacity fade
  });

  return (
    <View style={styles.itemWrapper}>
      {/* ✅ Animated overlay layer */}
      {isHighlighted && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "#A5D6A7", // light green
              opacity: overlayOpacity,
              zIndex: 5,
            },
          ]}
        />
      )}

      {/* ✅ Actual content */}
      <View style={[styles.itemContainer, { zIndex: 2 }]}>
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
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={styles.actionButton}
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemWrapper: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 10,
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    elevation: 3, // ✅ थोड़ा shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
