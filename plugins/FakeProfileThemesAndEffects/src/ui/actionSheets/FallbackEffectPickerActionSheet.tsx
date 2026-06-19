import { chunk } from "lodash";
import React, { type ReactNode, useContext, useMemo, useState } from "react";
import { View, ScrollView, type ViewStyle } from "react-native";

import { HapticFeebackTypes, triggerHapticFeedback } from "@lib/haptics";
import type { ProfileEffect } from "@lib/stores";
import { type EffectPickerActionSheetProps } from "@ui/actionSheets";
import { IMG_NONE } from "@ui/assets";
import { useThemeContext } from "@ui/color";
import { Button, FlashList, Icon, PressableOpacity, StaticEffect, Text } from "@ui/components";
import { Radius, SafeAreaContext, Spacing, useWindowDimensions } from "@ui/length";

const ROW_SIZE = 3;

interface ItemProps {
    label: string;
    isSelected: boolean;
    size: number;
    colors: [bgColor: string, itemColor: string, selectedColor: string];
    onPress: () => void;
    style?: ViewStyle | undefined;
    children: Exclude<ReactNode, number | string>;
}

function Item({ label, isSelected, size, colors, onPress, style, children }: ItemProps) {
    const [bgColor, itemColor, selectedColor] = colors;

    return (
        <PressableOpacity
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            disabled={isSelected}
            onPress={() => {
                triggerHapticFeedback(HapticFeebackTypes.IMPACT_LIGHT);
                onPress();
            }}
            style={[
                {
                    height: size,
                    width: size,
                    overflow: "hidden",
                    backgroundColor: itemColor,
                    borderColor: bgColor,
                    borderRadius: Radius.sm,
                    borderWidth: 2
                },
                isSelected && { borderColor: selectedColor },
                style
            ]}
        >
            {children}
        </PressableOpacity>
    );
}

export type FallbackEffectPickerActionSheetProps = Pick<EffectPickerActionSheetProps, "currentEffectId" | "effects" | "onSelect">;

export function FallbackEffectPickerActionSheet({ currentEffectId, effects, onSelect }: FallbackEffectPickerActionSheetProps) {
    const [selectedId, setSelectedId] = useState(currentEffectId);
    const [itemSize, setItemSize] = useState(0);

    const { theme } = useThemeContext();
    
    // CRASH-FIX 1: Sichere Hex-Farben statt der abstürzenden resolveSemanticColor-Funktion
    const colors: ItemProps["colors"] = useMemo(() => {
        const isLight = theme === "light";
        return [
            isLight ? "#f2f3f5" : "#313338", // BACKGROUND_PRIMARY Ersatz
            isLight ? "#ffffff" : "#232428", // BACKGROUND_FLOATING Ersatz
            "#5865f2"                        // Discord Blurple (Brand Border)
        ];
    }, [theme]);

    const windowDimensions = useWindowDimensions();
    const safeArea = useContext(SafeAreaContext);

    const effectRows = useMemo(() => {
        const effectChunks: (ProfileEffect | null | undefined)[][] = chunk([null, ...effects], ROW_SIZE);
        const lastChunk = effectChunks[effectChunks.length - 1]!;
        while (lastChunk.length < 3) lastChunk.push(undefined);
        return effectChunks;
    }, [effects]);

    // CRASH-FIX 2: Reines View + ScrollView Layout anstelle des alten fehlerhaften BottomSheets
    return (
        <View 
            style={{ 
                height: windowDimensions.height - safeArea.top - 120, 
                backgroundColor: theme === "light" ? "#ffffff" : "#1e1f22",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                overflow: "hidden"
            }}
        >
            <ScrollView scrollEventThrottle={16} scrollsToTop={false}>
                <View
                    style={{
                        flex: 1,
                        flexDirection: "column",
                        alignItems: "center",
                        paddingBottom: 20
                    }}
                >
                    <Text
                        variant="redesign/heading-18/bold"
                        color="header-primary"
                        style={{ margin: Spacing.PX_16, color: theme === "light" ? "#060607" : "#f2f3f5" }}
                    >
                        {currentEffectId ? "Change Effect" : "Add Profile Effect"}
                    </Text>
                    <View
                        style={{
                            width: "72%",
                            minHeight: 38
                        }}
                    >
                        <Text
                            variant="heading-md/bold"
                            color="header-primary"
                            style={{ textAlign: "center", color: theme === "light" ? "#060607" : "#f2f3f5" }}
                        >
                            {effects.find(effect => effect.id === selectedId)?.config.title ?? "None"}
                        </Text>
                    </View>
                    <View
                        style={{
                            flex: 1,
                            width: "92%",
                            marginTop: 3
                        }}
                    >
                        <FlashList
                            accessibilityLabel="Profile Effect Selection Section"
                            numColumns={1}
                            estimatedItemSize={98}
                            ItemSeparatorComponent={() => <View style={{ height: Spacing.PX_16 }} />}
                            contentContainerStyle={{ paddingHorizontal: Spacing.PX_4 }}
                            data={effectRows}
                            extraData={selectedId}
                            renderItem={({ item }) => (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingHorizontal: Spacing.PX_16
                                    }}
                                >
                                    {item.map(effect => effect
                                        ? (
                                            <Item
                                                label={effect.config.accessibilityLabel}
                                                isSelected={effect.id === selectedId}
                                                size={itemSize}
                                                colors={colors}
                                                onPress={() => { setSelectedId(effect.id); }}
                                            >
                                                <StaticEffect effect={effect.config} />
                                            </Item>
                                        )
                                        : effect === null
                                            ? (
                                                <Item
                                                    label="None"
                                                    isSelected={!selectedId}
                                                    size={itemSize}
                                                    colors={colors}
                                                    onPress={() => { setSelectedId(undefined); }}
                                                    style={{
                                                        alignItems: "center",
                                                        justifyContent: "center"
                                                    }}
                                                >
                                                    <Icon
                                                        source={IMG_NONE}
                                                        size={Icon.Sizes.LARGE}
                                                    />
                                                    <Text
                                                        variant="text-sm/medium"
                                                        color="header-primary"
                                                        style={{ marginTop: Spacing.PX_4, color: theme === "light" ? "#313338" : "#dbdee1" }}
                                                    >
                                                        None
                                                    </Text>
                                                </Item>
                                            )
                                            : (
                                                <View
                                                    style={{
                                                        width: itemSize,
                                                        height: itemSize
                                                    }}
                                                />
                                            )
                                    )}
                                </View>
                            )}
                            onLayout={event => { setItemSize((event.nativeEvent.layout.width - 64) / ROW_SIZE); }}
                        />
                    </View>
                </View>
            </ScrollView>
            
            {/* Relatives Layout für den Apply Button, passend zur Modal-Steuerung im Builder */}
            <Button
                text="Apply"
                textStyle={{ fontSize: 16 }}
                onPress={() => { onSelect(effects.find(effect => effect.id === selectedId)?.config ?? null); }}
                style={{
                    height: 48,
                    marginHorizontal: 36,
                    marginTop: 10,
                    marginBottom: 10,
                    borderRadius: Radius.round
                }}
            />
        </View>
    );
}
