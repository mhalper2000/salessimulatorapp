import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Item = { label: string; value: string } | string;

export default function Dropdown({
  items = [],
  value,
  onChangeValue,
  placeholder,
  style,
}: {
  items: Item[];
  value: any;
  onChangeValue: (v: any) => void;
  placeholder?: string;
  style?: any;
}) {
  const [visible, setVisible] = useState(false);

  const renderLabel = (it: Item) => (typeof it === "string" ? it : it.label);

  const displayLabel = (val: any) => {
    if (val == null) return placeholder ?? "Select";
    // Look up the matching item to show its label
    const match = items.find((it) =>
      typeof it === "string" ? it === val : it.value === val,
    );
    if (match) return renderLabel(match);
    if (typeof val === "string") return val;
    if (typeof val === "object") return val.label ?? String(val.value ?? "");
    return String(val);
  };

  return (
    <View style={style}>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setVisible((v) => !v)}
      >
        <Text style={styles.valueText}>{displayLabel(value)}</Text>
        <Text style={styles.arrow}>{visible ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {visible && (
        <View style={styles.listContainer}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {items.map((item, idx) => (
              <TouchableOpacity
                key={typeof item === "string" ? item : (item.value ?? `${idx}`)}
                style={styles.item}
                onPress={() => {
                  setVisible(false);
                  onChangeValue(
                    typeof item === "string" ? item : (item.value ?? item),
                  );
                }}
              >
                <Text style={styles.itemText}>{renderLabel(item)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  valueText: { color: "black", flex: 1 },
  arrow: { fontSize: 12, color: "#666", marginLeft: 8 },
  listContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: "white",
    maxHeight: 200,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  item: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  itemText: { color: "black" },
});
