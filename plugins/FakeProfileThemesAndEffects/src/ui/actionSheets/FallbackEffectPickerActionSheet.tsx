import React from "react";
import { View, Text, TouchableOpacity, FlatList, Dimensions } from "react-native";
import type { ProfileEffect, ProfileEffectConfig } from "@lib/stores";

export interface FallbackEffectPickerActionSheetProps {
    effects: ProfileEffect[] | any;
    onSelect: (effect: ProfileEffectConfig | null) => void;
    currentEffectId?: string | undefined;
}

export function FallbackEffectPickerActionSheet({
    effects,
    onSelect,
    currentEffectId,
}: FallbackEffectPickerActionSheetProps) {
    
    // Konvertiert die Effekte in ein Array, falls Discord ein Map-Objekt zurückgibt
    const safeEffects = React.useMemo(() => {
        if (!effects) return [];
        if (Array.isArray(effects)) return effects;
        if (typeof effects === "object") return Object.values(effects);
        return [];
    }, [effects]);

    const data = [null, ...safeEffects];
    const screenHeight = Dimensions.get("window").height;

    return (
        <View style={{ 
            backgroundColor: "#1e1f22", 
            borderTopLeftRadius: 16, 
            borderTopRightRadius: 16, 
            padding: 16, 
            height: screenHeight * 0.5,
            flexDirection: "column"
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
            
            <View style={{ flex: 1 }}>
                <FlatList
                    data={data}
                    keyExtractor={(item, index) => item?.id ?? `none-${index}`}
                    renderItem={({ item }) => {
                        const effectId = item?.id || item?.config?.id;
                        const isSelected = item === null ? !currentEffectId : effectId === currentEffectId;
                        const title = item === null ? "None (Remove Effect)" : (item?.config?.title || item?.title || "Unknown Effect");
                        
                        return (
                            <TouchableOpacity
                                onPress={() => onSelect(item ? (item.config || item) : null)}
                                style={{
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    borderRadius: 8,
                                    backgroundColor: isSelected ? "#35373c" : "transparent",
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
                                    {title}
                                </Text>
                                
                                {isSelected && (
                                    <Text style={{ color: "#5865f2", fontWeight: "bold" }}>✓</Text>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
    );
}
