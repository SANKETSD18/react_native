import React, { useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import Video from "react-native-video";

type NewsData = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string | null;
  video_url?: string | null;
};

type NewsItemProps = {
  item: NewsData;
  role: string;
  onEdit: (item: NewsData) => void;
  onDelete: (id: string) => void;
};

const NewsItem: React.FC<NewsItemProps> = ({ item, role, onEdit, onDelete }) => {
  const [previewVisible, setPreviewVisible] = useState(false);

  const isImage = Boolean(item.image_url);
  const mediaUri = item.image_url || item.video_url || "";

  return (
    <View style={{ flexDirection: "row", padding: 10, alignItems: "center" }}>
      <TouchableOpacity onPress={() => setPreviewVisible(true)}>
        {isImage ? (
          <Image source={{ uri: mediaUri }} style={{ width: 60, height: 60, borderRadius: 8 }} />
        ) : (
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              backgroundColor: "#000",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff" }}>Video</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ flex: 1, paddingHorizontal: 10 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.title}</Text>
        <Text numberOfLines={2} style={{ color: "#555" }}>
          {item.description}
        </Text>
      </View>

      {role === "admin" && (
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity onPress={() => onEdit(item)} style={{ marginRight: 10 }}>
            <Text style={{ color: "blue" }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(item.id)}>
            <Text style={{ color: "red" }}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={previewVisible} transparent={true} onRequestClose={() => setPreviewVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" }}
          onPress={() => setPreviewVisible(false)}
        >
          {isImage ? (
            <Image source={{ uri: mediaUri }} style={{ width: "90%", height: "70%", borderRadius: 10 }} resizeMode="contain" />
          ) : (
            <Video
              source={{ uri: mediaUri }}
              style={{ width: "90%", height: 220, borderRadius: 10 }}
              controls
              resizeMode="contain"
            />
          )}
          <Text style={{ color: "#fff", marginTop: 10, fontSize: 16, textAlign: "center" }}>{item.title}</Text>
          <Text style={{ color: "#ddd", marginTop: 5, textAlign: "center" }}>{item.description}</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default NewsItem;
