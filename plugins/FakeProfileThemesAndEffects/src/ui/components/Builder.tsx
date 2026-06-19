import { showToast } from "@vendetta/ui/toasts";
import { findByProps } from "@vendetta/metro";
import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Modal } from "react-native";
import { buildFPTE, hasFPTE, stripFPTE } from "@lib/fpte";
import { type ProfileEffectConfig, UserStore, UserProfileStore } from "@lib/stores";
import { useAccentColor, usePrimaryColor, useShowPreview } from "@patches/patchUseProfileTheme";
import { showColorPicker } from "@ui/actionSheets";
import { FallbackEffectPickerActionSheet } from "@ui/actionSheets/FallbackEffectPickerActionSheet";
import { useAvatarColors, useThemeContext } from "@ui/color";
import { BuilderButton, Button, StaticEffect } from "@ui/components";
import { FormCardSection } from "@ui/components/forms";

const UserProfileActionCreators = findByProps("saveProfileChanges");

// Holt den aktuellsten Store für Effekte live aus dem Speicher
const ModernProfileEffectStore = findByProps("profileEffects", "getProfileEffectById");

export interface BuilderProps {
    guildId?: string | undefined;
}

export function Builder({ guildId }: BuilderProps) {
    const [primaryColor, setPrimaryColor] = usePrimaryColor(null);
    const [accentColor, setAccentColor] = useAccentColor(null);
    const [effect, setEffect] = useState<ProfileEffectConfig | null>(null);
    const [preview, setPreview] = useShowPreview(true);
    const [buildLegacy, setBuildLegacy] = useState(false);
    const { theme } = useThemeContext();
    
    const [showEffects, setShowEffects] = useState(false);
    
    const [fgColor, fillerColor] = useMemo(
        () => {
            const isLight = theme === "light";
            return [
                isLight ? "#4f5660" : "#b5bac1",
                isLight ? "#e3e5e8" : "#1e1f22"
            ];
        },
        [theme]
    );

    const avatarColors = useAvatarColors(
        UserStore.getCurrentUser()?.getAvatarURL(guildId, 80) || "",
        fillerColor,
        false
    );
    const [bio, setBio] = useState<string | null>(null);

    useEffect(() => {
        const currentUser = UserStore.getCurrentUser();
        if (!currentUser) return;
        const profile = UserProfileStore.getUserProfile(currentUser.id);
        if (!profile) return;
        setBio(profile.bio ?? null);
    }, []);

    const fpteActive = bio !== null && hasFPTE(bio);
    const hasSelection = primaryColor !== null || accentColor !== null || effect !== null;

    const fpteString = buildFPTE(
        primaryColor ?? -1,
        accentColor ?? -1,
        effect?.id ?? "",
        buildLegacy
    );

    function applyFPTE() {
        const currentUser = UserStore.getCurrentUser();
        if (!currentUser) return;

        let newBio = bio ?? "";

        if (fpteActive && !hasSelection) {
            newBio = stripFPTE(newBio);
            try {
                UserProfileActionCreators.saveProfileChanges({
                    ...UserProfileStore.getUserProfile(currentUser.id),
                    bio: newBio,
                });
                setBio(newBio);
                showToast("FPTE removed!");
            } catch (err) {
                showToast("Failed to update bio!");
                console.error(err);
            }
            return;
        }

        if (!fpteString) return;

        if (hasFPTE(newBio)) {
            newBio = stripFPTE(newBio);
        }
        if (newBio.length > 0) newBio += " ";
        newBio += fpteString;

        try {
            UserProfileActionCreators.saveProfileChanges({
                ...UserProfileStore.getUserProfile(currentUser.id),
                bio: newBio,
            });
            setBio(newBio);
            showToast("FPTE applied!");
        } catch (err) {
            showToast("Failed to update bio!");
            console.error(err);
        }
    }

    const buttonText = fpteActive && !hasSelection ? "Remove FPTE" : "Apply FPTE";
    const applyButtonVisible = hasSelection || fpteActive;

    return (
        <FormCardSection
            title={
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 16, color: "#FFFFFF" }}>FPTE Builder</Text>
                    <Text
                        style={{
                            color: fpteActive ? "#4CAF50" : "#F44336",
                            fontSize: 17,
                            marginLeft: 8,
                        }}
                    >
                        {fpteActive ? "Active" : "Inactive"}
                    </Text>
                </View>
            }
            cardStyle={{ backgroundColor: "transparent" }}
        >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <BuilderButton
                    fgColor={fgColor}
                    label="Primary"
                    bgColor={primaryColor}
                    onPress={() =>
                        showColorPicker({
                            color: primaryColor,
                            onSelect: setPrimaryColor,
                            suggestedColors: avatarColors,
                        })
                    }
                />
                <BuilderButton
                    fgColor={fgColor}
                    label="Accent"
                    bgColor={accentColor}
                    onPress={() =>
                        showColorPicker({
                            color: accentColor,
                            onSelect: setAccentColor,
                            suggestedColors: avatarColors,
                        })
                    }
                />
                
                <BuilderButton fgColor={fgColor} label="Effect" onPress={() => setShowEffects(true)}>
                    {effect && <StaticEffect effect={effect} style={{ width: "140%", height: "100%" }} />}
                </BuilderButton>
                
                <View
                    style={{
                        flexDirection: "column",
                        alignItems: "center",
                        marginLeft: 12,
                    }}
                >
                    <Button
                        text={buttonText}
                        size={Button.Sizes.SMALL}
                        onPress={applyFPTE}
                        style={{ marginBottom: 6, paddingHorizontal: 12, opacity: applyButtonVisible ? 1 : 0 }}
                        pointerEvents={applyButtonVisible ? "auto" : "none"}
                    />
                    <Button
                        text="Reset"
                        look={Button.Looks.LINK}
                        color={Button.Colors.TRANSPARENT}
                        size={Button.Sizes.SMALL}
                        {...(!hasSelection ? { pointerEvents: "none", style: { opacity: 0 } } : {})}
                        onPress={() => {
                            setPrimaryColor(null);
                            setAccentColor(null);
                            setEffect(null);
                        }}
                    />
                </View>
            </View>

            <Modal
                visible={showEffects}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowEffects(false)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
                    <FallbackEffectPickerActionSheet
                        effects={ModernProfileEffectStore?.profileEffects ?? []}
                        currentEffectId={effect?.id}
                        onSelect={(selectedEffect) => {
                            setEffect(selectedEffect);
                            setShowEffects(false);
                        }}
                    />
                    
                    <View style={{ backgroundColor: "#1e1f22", paddingHorizontal: 36, paddingBottom: 24, paddingTop: 8 }}>
                        <Button
                            text="Cancel"
                            look={Button.Looks.FILLED}
                            color={Button.Colors.BRAND}
                            style={{ height: 44, width: "100%", borderRadius: 8 }}
                            onPress={() => setShowEffects(false)}
                        />
                    </View>
                </View>
            </Modal>
        </FormCardSection>
    );
}
