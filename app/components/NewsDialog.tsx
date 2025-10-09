import { supabase } from "@/lib/supabaseClient";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from "../providers/AuthProvider";

import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    image_url?: string;
    video_url?: string;
  }) => void;
};

const BUCKET = "news-media";
// const BUCKET = "epaper-pdf";



const NewsDialog: React.FC<Props> = ({ visible, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("India");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);




  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      let uri = asset.uri;
      if (Platform.OS === 'android' && !uri.startsWith('file://')) {
        uri = 'file://' + uri;
      }

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

      const arrayBuffer = Uint8Array.from(
        atob(base64),
        char => char.charCodeAt(0)
      ).buffer;

      const fileExt = asset.type === 'image' ? 'jpg' : 'mp4';
      const fileNameLocal = asset.fileName || `${Date.now()}.${fileExt}`;
      // const filePath = `uploads/${fileNameLocal}`;
      // Yahan add karein ye logic for dynamic folder
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const safeTitle = title.trim().replace(/\s+/g, '-').toLowerCase() || 'default-title';

      // filePath me date aur title add kar rahe hain
      const filePath = `${formattedDate}/${safeTitle}/${fileNameLocal}`;

      setUploading(true);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, arrayBuffer, {
          contentType: asset.type === 'image' ? 'image/jpeg' : 'video/mp4',
          upsert: true,
        });

      setUploading(false);

      if (error) throw error;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

      if (!data?.publicUrl) {
        Alert.alert("Upload Error", "Failed to retrieve public URL.");
        return;
      }

      Alert.alert("Success", `${asset.type ? asset.type.charAt(0).toUpperCase() + asset.type.slice(1) : 'File'} uploaded successfully ✅`);

      // set uploaded file name
      setFileName(fileNameLocal);

      // set image or video URL for preview and form submit
      if (asset.type === 'image') {
        setImageUrl(data.publicUrl);
        setVideoUrl(null);
      } else {
        setVideoUrl(data.publicUrl);
        setImageUrl(null);
      }

      return data.publicUrl;

    } catch (err: any) {
      setUploading(false);
      Alert.alert("Upload Error", err.message);
      console.error("Upload error:", err);
    }
  };

  const handleSubmit = () => {
    if (!title || !description || !category) {
      Alert.alert("Validation Error", "Please fill all fields.");
      return;
    }

    onSubmit({
      title,
      description,
      category,
      image_url: imageUrl || undefined,
      video_url: videoUrl || undefined,
    });

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("India");
    setImageUrl(null);
    setVideoUrl(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.dialog}>
          <Text style={styles.header}>Add News</Text>
          <ScrollView>
            <TextInput
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 80 }]}
              multiline
            />
            <Picker
              selectedValue={category}
              onValueChange={setCategory}
              style={{ height: 50, width: '100%' }}
            >
              <Picker.Item label="India" value="India" />
              <Picker.Item label="International" value="International" />
              <Picker.Item label="Sport" value="Sport" />
              <Picker.Item label="Entertainment" value="Entertainment" />
            </Picker>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickMedia}
              disabled={uploading}
            >
              <Text style={{ color: uploading ? 'gray' : 'white' }}>
                {uploading ? "Uploading..." : "Upload File (Photo/Video)"}
              </Text>
            </TouchableOpacity>

            {imageUrl && <Image source={{ uri: imageUrl }} style={{ width: 100, height: 60, marginTop: 8 }} />}
            {videoUrl && <Text style={{ marginTop: 8, textAlign: "center" }}>Video Uploaded</Text>}
            {fileName && (
              <Text style={{ marginTop: 8, textAlign: "center", color: "#555" }}>
                Uploaded File: {fileName}
              </Text>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={uploading || !title.trim()}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 12,
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C62828",
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  uploadButton: {
    backgroundColor: "#C62828",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: "#C62828",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
    alignItems: "center",
  },
  cancelText: {
    color: "#C62828",
    fontWeight: "600",
  },
});

export default NewsDialog;
