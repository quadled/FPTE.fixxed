import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { ProfileEffect, ProfileEffectConfig } from "@lib/stores";

export interface FallbackEffectPickerActionSheetProps {
    effects: ProfileEffect[];
    onSelect: (effect: ProfileEffectConfig | null) => void;
    currentEffectId?: string | undefined;
}

export function FallbackEffectPickerActionSheet({
    effects,
    onSelect,
    currentEffectId,
}: FallbackEffectPickerActionSheetProps) {
    
    // Wir packen die Option "Kein Effekt" direkt als erstes Element in die Liste
    const data = [null, ...effects];

    return (
        <View style={{ 
            backgroundColor: "#2b2d31", 
            borderTopLeftRadius: 16, 
            borderTopRightRadius: 16, 
            padding: 16, 
            height: "60%" 
        }}>
            <Text style={{ 
                color: "#fff", 
                fontSize: 18, 
                fontWeight: "bold", 
                marginBottom: 16, 
                textAlign: "center" 
            }}>
                Select Profile Effect
            </Text>
            
            <FlashList
                data={data}
                estimatedItemSize={60}
                keyExtractor={(item, index) => item?.id ?? `none-${index}`}
                renderItem={({ item }) => {
                    const isSelected = item === null ? !currentEffectId : item.id === currentEffectId;
                    
                    return (
                        <TouchableOpacity
                            onPress={() => onSelect(item)}
                            style={{
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                backgroundColor: isSelected ? "#404249" : "transparent",
                                marginBottom: 4,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between"
                            }}
                        >
                            <Text style={{ 
                                color: isSelected ? "#fff" : "#dbdee1", 
                                fontSize: 16,
                                fontWeight: isSelected ? "600" : "400"
                            }}>
                                {item === null ? "None (Remove Effect)" : item.title}
                            </Text>
                            
                            {isSelected && (
                                <Text style={{ color: "#5865f2", fontWeight: "bold" }}>✓</Text>
                            )}
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}
