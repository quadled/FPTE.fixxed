import React from "react";
import { View, Text, TouchableOpacity, FlatList, Dimensions } from "react-native";
import type { ProfileEffect, ProfileEffectConfig } from "@lib/stores";

export interface FallbackEffectPickerActionSheetProps {
    effects: ProfileEffect[] | any;
    onSelect: (effect: ProfileEffectConfig | null) => void;
    currentEffectId?: string | undefined;
}

// Hardcoded Fallbacks, falls der Store leer zurückkommt (canFetch / hasFetched Logik von Discord)
const DEFAULT_DISCORD_EFFECTS = [
    { id: "1153063533446074431", title: "Cyberpunk Glow / Neon" },
    { id: "1154562097787617340", title: "Anime / Sakura Petals" },
    { id: "1168234857508311100", title: "Halloween Ghosts" },
    { id: "1179188373655588935", title: "Winter Wonderland / Snow" },
    { id: "1187123947498590310", title: "New Year Fireworks" },
    { id: "1203094857418491020", title: "Valentine Hearts" },
    { id: "1214092847128491030", title: "Doom / Demonic Flame" }
];

export function FallbackEffectPickerActionSheet({
    effects,
    onSelect,
    currentEffectId,
}: FallbackEffectPickerActionSheetProps) {
    
    // Normalisiert die Store-Daten basierend auf dem echten ProfileEffect-Interface
    const safeEffects = React.useMemo(() => {
        let list: any[] = [];
        if (Array.isArray(effects)) {
            list = effects;
        } else if (effects && typeof effects === "object") {
            list = Object.values(effects);
        }
        
        // Filtert ungültige Einträge heraus
        list = list.filter(item => item !== null && item !== undefined);

        // Fallback-Brücke: Wenn der Store (noch) leer ist, füttern wir die Liste manuell an
        if (list.length === 0) {
            return DEFAULT_DISCORD_EFFECTS.map(eff => ({
                id: eff.id,
                skuId: "",
                config: { id: eff.id, title: eff.title }
            }));
        }
        return list;
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
                    keyExtractor={(item, index) => {
                        // Nutzt die ID auf Root-Ebene oder aus der Config (Typen-konform)
                        return item?.id || item?.config?.id || `none-${index}`;
                    }}
                    renderItem={({ item }) => {
                        const effectId = item?.config?.id || item?.id;
                        const isSelected = item === null ? !currentEffectId : effectId === currentEffectId;
                        
                        // Zieht den korrekten Titel aus dem ProfileEffectConfig-Zweig
                        const title = item === null 
                            ? "None (Remove Effect)" 
                            : (item?.config?.title || item?.title || "Unknown Effect");
                        
                        return (
                            <TouchableOpacity
                                // Übergibt beim Klick das geforderte ProfileEffectConfig-Objekt
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
