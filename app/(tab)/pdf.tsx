import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, Linking, ActivityIndicator } from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "@/supabaseClient";

interface PdfItem {
  id: number;
  title: string;
  pdf_url: string;
  date?: string; // optional
}

export default function PdfScreen() {
  const [pdfList, setPdfList] = useState<PdfItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // Fetch PDFs by date (if date selected) or all
  const fetchPdfs = async (date?: string) => {
    setLoading(true);
    setMessage("");

    let query = supabase.from("epapers").select("*").order("id", { ascending: false });

    if (date) {
      query = query.eq("date", date);
    }

    const { data, error } = await query;

    setLoading(false);

    if (error) {
      console.log("Fetch Error:", error);
      setMessage("Error fetching PDFs");
    } else if (!data || data.length === 0) {
      setPdfList([]);
      setMessage(date ? "No PDF found for this date" : "No PDFs available");
    } else {
      setPdfList(data as PdfItem[]);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Select Date:</Text>
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          fetchPdfs(day.dateString);
        }}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#1E325D" },
        }}
      />

      {loading && <ActivityIndicator size="large" style={{ marginVertical: 20 }} />}

      {message !== "" && !loading && (
        <Text style={{ marginTop: 20, fontSize: 16, color: "red" }}>{message}</Text>
      )}

      <FlatList
        data={pdfList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              marginVertical: 5,
              backgroundColor: "#f0f0f0",
              borderRadius: 10,
            }}
          >
            <Text style={{ marginBottom: 5 }}>{item.title}</Text>
            <Button title="View PDF" onPress={() => Linking.openURL(item.pdf_url)} />
          </View>
        )}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}
