import React from "react";
import type { UserRecord } from "@vencord/discord-types";
import type { ProfileEffect, ProfileEffectConfig } from "@lib/stores";
import { FallbackEffectPickerActionSheet } from "./FallbackEffectPickerActionSheet";

export interface EffectPickerActionSheetProps {
    effects: ProfileEffect[];
    onSelect: (effect: ProfileEffectConfig | null) => void;
    user: UserRecord;
    currentEffectId?: string | undefined;
}

// CRASH-FIX: Wir ignorieren Discords fehlerhaften, nativen Picker komplett 
// und leiten direkt auf unser unkaputtbares FallbackEffectPickerActionSheet weiter.
export function EffectPickerActionSheet(props: EffectPickerActionSheetProps) {
    return <FallbackEffectPickerActionSheet {...props} />;
}
