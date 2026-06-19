import type { DisplayProfile, ProfileThemeColors, UserRecord } from "@vencord/discord-types";
import { findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";
import { useState } from "react";

import { FluxDispatcher } from "@lib/flux";
import type { ProfileEffectConfig } from "@lib/stores";
import { getProfileTheme, type Theme } from "@ui/color";
import { storage } from "@vendetta/plugin";
import React from "react";

import { findParentInTree, getComponentNameFromType, isElement, type RN } from "@lib/reactNativeRenderTree";
import { Builder } from "@ui/components";

function updatePreview() {
    FluxDispatcher.dispatch({ type: "USER_SETTINGS_ACCOUNT_SUBMIT_SUCCESS" });
}

let showPreview = true;
export function useShowPreview(initialState: typeof showPreview) {
    const [state, setState] = useState(() => showPreview = initialState);
    return [
        state,
        (preview: typeof showPreview) => {
            setState(showPreview = preview);
            updatePreview();
        }
    ] as const;
}

let primaryColor: number | null = null;
export function usePrimaryColor(initialState: typeof primaryColor) {
    const [state, setState] = useState(() => primaryColor = initialState);
    return [
        state,
        (color: typeof primaryColor) => {
            setState(primaryColor = color);
            if (showPreview) updatePreview();
        }
    ] as const;
}

let accentColor: number | null = null;
export function useAccentColor(initialState: typeof accentColor) {
    const [state, setState] = useState(() => accentColor = initialState);
    return [
        state,
        (color: typeof accentColor) => {
            setState(accentColor = color);
            if (showPreview) updatePreview();
        }
    ] as const;
}

// TEMP
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let profileEffect: ProfileEffectConfig | null = null;
export function useProfileEffect(initialState: typeof profileEffect) {
    const [state, setState] = useState(() => profileEffect = initialState);
    return [
        state,
        (effect: typeof profileEffect) => {
            setState(profileEffect = effect);
            if (showPreview) updatePreview();
        }
    ] as const;
}

export let previewUserId: string | undefined;

export function setPreviewUserId(userId: typeof previewUserId) {
    previewUserId = userId;
}

export const patchUseProfileTheme = (() => {
    let funcParent = findByName("useProfileTheme", false);
    if (funcParent)
        return () => after(
            "default",
            funcParent,
            (([options]: [UseProfileThemeOptions], profileTheme: ProfileTheme) => {
                const { user } = options;
                
                // Falls profileTheme selbst undefined vom Client kommt
                if (!profileTheme) {
                    profileTheme = {
                        theme: "dark" as any,
                        primaryColor: 2829622,
                        secondaryColor: 2829622
                    };
                }

                if (
                    (user != null && user.id === previewUserId
                    || "pendingThemeColors" in options)
                    && showPreview
                ) {
                    if (primaryColor !== null) {
                        profileTheme.theme = getProfileTheme(primaryColor);
                        profileTheme.primaryColor = primaryColor;
                        profileTheme.secondaryColor = accentColor ?? primaryColor;
                    } else if (accentColor !== null) {
                        profileTheme.theme = getProfileTheme(accentColor);
                        profileTheme.primaryColor = accentColor;
                        profileTheme.secondaryColor = accentColor;
                    }
                }

                // Sicheres Zahlen-Fallback für das neue native Design
                if (profileTheme.primaryColor == null) profileTheme.primaryColor = 2829622;
                if (profileTheme.secondaryColor == null) profileTheme.secondaryColor = 2829622;

                return profileTheme;
            }) as any
        );

    funcParent = findByName("useProfileThemeColors", false);
    if (funcParent)
        return () => after(
            "default",
            funcParent,
            (([user, _displayProfile, previewProps]: UseProfileThemeColorsArgs, origRet: PartialProfileThemeColors) => {
                if (
                    (user != null && user.id === previewUserId
                    || previewProps)
                    && showPreview
                ) {
                    if (primaryColor !== null)
                        return [primaryColor, accentColor ?? primaryColor];
                    if (accentColor !== null)
                        return [accentColor, accentColor];
                }
                
                // Crash-Schutz: Verhindert unvollständige Arrays oder undefined-Werte im neuen Design
                if (!origRet || !Array.isArray(origRet) || origRet[0] == null || origRet[1] == null) {
                    return [2829622, 2829622]; 
                }

                return origRet;
            }) as any
        );

    return () => () => true;
})();

const editFormParent = findByName("UserProfileEditForm", false);

export const patchUserProfileEditForm = () =>
  after("default", editFormParent, (_args: unknown[], tree: RN.Node) => {
    if (storage.hideBuilder) return tree;

    const parent = findParentInTree(tree, (children): children is RN.Node[] =>
      Array.isArray(children) &&
      children.some(child =>
        isElement(child) &&
        getComponentNameFromType(child.type) === "UserProfileEditFormTextField"
      )
    );

    if (parent) {
      const index = parent.props.children.reduce<number[]>((acc, child, i) => {
        if (
          isElement(child) &&
          getComponentNameFromType(child.type) === "UserProfileEditFormTextField"
        ) acc.push(i);
        return acc;
      }, []);

      if (index.length >= 3) {
        parent.props.children.splice(index[2] + 1, 0, <Builder />);
      }
    }

    return tree;
  });

interface UseProfileThemeOptions {
    user?: UserRecord | null | undefined;
    displayProfile?: DisplayProfile | null | undefined;
    pendingThemeColors: ProfileThemeColors | undefined;
    pendingAvatar?: UserRecord["avatar"] | undefined;
    isPreview?: boolean | null | undefined;
}

interface ProfileTheme {
    theme: Theme;
    primaryColor: number | null;
    secondaryColor: number | null;
}

type UseProfileThemeColorsArgs = [
    user: UserRecord | null | undefined,
    displayProfile: DisplayProfile | null | undefined,
    previewProps?: {
        pendingThemeColors: ProfileThemeColors | undefined;
        pendingAvatar?: UserRecord["avatar"] | undefined;
        isPreview?: boolean;
    } | undefined
];

type PartialProfileThemeColors = [primaryColor: number | null, accentColor: number | null];
