# Disable unity shortcuts in GameView

```
#if UNITY_EDITOR
using System;
using System.Reflection;
using System.Runtime.InteropServices;
using UnityEditor;
using UnityEngine;

namespace DreamingSaints.Scripts.Editor
{
    /// <summary>
    /// Only when in play mode AND Game view is focused: disables Unity editor shortcuts (e.g. Ctrl+Z won't undo editor changes, CTRL+S won't save the scene).
    /// When focus is on Inspector/Scene/etc. or when not in play mode, editor shortcuts work normally.
    /// When Right Control is held, shortcuts are not disabled so Ctrl+P can start/stop Play.
    /// </summary>
    [InitializeOnLoad]
    public static class DisableEditorShortcutsInGameView
    {
#if UNITY_EDITOR_WIN
        private const int VK_RCONTROL = 0xA3; // Right Control key

        [DllImport("user32.dll")]
        private static extern short GetAsyncKeyState(int vKey);// Note: using it instead of InptuSystem.Keyboard, because editor doesn't read it
#endif

        private const string AssemblyCoreModule = "UnityEditor.CoreModule";
        private const string TypeShortcutIntegration = "UnityEditor.ShortcutManagement.ShortcutIntegration";
        private const string PropertyIgnoreWhenPlayModeFocused = "ignoreWhenPlayModeFocused";
        private const string TypeGameView = "UnityEditor.GameView";
        private const string AssemblyUnityEditorPrefix = "UnityEditor,";

        private static MethodInfo s_setIgnoreWhenPlayModeFocused;
        private static Type s_gameViewType;
        private static bool s_reflectionResolved;
        private static bool? s_lastIgnoreValue;

        static DisableEditorShortcutsInGameView()
        {
            EditorApplication.update += OnUpdate;
        }

        private static void OnUpdate()
        {
            if (!ResolveReflection())
                return;

            bool gameViewFocused = s_gameViewType is not null
                && EditorWindow.focusedWindow is not null
                && s_gameViewType.IsInstanceOfType(EditorWindow.focusedWindow);
            // When Right Control is held, don't ignore shortcuts so Ctrl+P can start/stop Play.
            // Input System doesn't receive key state when polling from EditorApplication.update (Editor quirk), so use Win32 on Windows.
            bool rightCtrlHeld = IsRightControlHeld();
            bool shouldIgnore = EditorApplication.isPlaying && gameViewFocused && !rightCtrlHeld;

            if (shouldIgnore == s_lastIgnoreValue)
                return;
            s_lastIgnoreValue = shouldIgnore;

            SetIgnoreWhenPlayModeFocused(shouldIgnore);
        }

        private static bool IsRightControlHeld()
        {
#if UNITY_EDITOR_WIN
            return (GetAsyncKeyState(VK_RCONTROL) & 0x8000) != 0;
#endif
        }

        private static bool ResolveReflection()
        {
            if (s_reflectionResolved)
            {
                if (s_setIgnoreWhenPlayModeFocused is not null)
                    return true;

                Debug.Log("[DisableEditorShortcutsInPlayMode] ResolveReflection: s_setIgnoreWhenPlayModeFocused is null");
                return false;
            }

            s_reflectionResolved = true;
            Assembly[] assemblies = AppDomain.CurrentDomain.GetAssemblies();

            foreach (Assembly assembly in assemblies)
            {
                if (assembly.FullName.Contains(AssemblyCoreModule))
                {
                    Type shortcutIntegration = assembly.GetType(TypeShortcutIntegration);
                    if (shortcutIntegration is null) continue;

                    PropertyInfo property = shortcutIntegration.GetProperty(
                        PropertyIgnoreWhenPlayModeFocused,
                        BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic
                    );
                    if (property is null) break;

                    MethodInfo setter = property.GetSetMethod(nonPublic: true);
                    if (setter is null) break;

                    s_setIgnoreWhenPlayModeFocused = setter;
                    break;
                }
            }

            foreach (Assembly assembly in assemblies)
            {
                if (assembly.FullName.StartsWith(AssemblyUnityEditorPrefix))
                {
                    s_gameViewType = assembly.GetType(TypeGameView);
                    if (s_gameViewType is not null) break;
                }
            }

            if (s_setIgnoreWhenPlayModeFocused is null)
                Debug.LogWarning("DisableEditorShortcutsInPlayMode: Unable to find ShortcutIntegration.ignoreWhenPlayModeFocused.");
            if (s_gameViewType is null)
                Debug.LogWarning("DisableEditorShortcutsInPlayMode: Unable to find UnityEditor.GameView type.");

            return s_setIgnoreWhenPlayModeFocused is not null;
        }

        private static void SetIgnoreWhenPlayModeFocused(bool value)
        {
            if (s_setIgnoreWhenPlayModeFocused is null)
                return;
            try
            {
                s_setIgnoreWhenPlayModeFocused.Invoke(null, new object[] { value });
            }
            catch (Exception e)
            {
                Debug.LogWarning("DisableEditorShortcutsInPlayMode: " + e.Message);
            }
        }
    }
}
#endif
