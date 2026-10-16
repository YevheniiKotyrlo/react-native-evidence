# `contextMenuHidden` and paste from a keyboard or VoiceOver

[react/react-native#59143](https://github.com/react/react-native/issues/59143)

The reproducer is [`RNTesterPlayground.js`](RNTesterPlayground.js): a field holding `123456`, a field with `contextMenuHidden`, a field without it, and a line that shows what the second and the third field hold.

## Builds

RNTester from `main` at `e04aaf62f7`, with the reproducer as its Playground and the JavaScript bundle embedded.

| Platform | Build |
| --- | --- |
| iOS | Release for a device, built with Xcode 27, signed with a development profile and installed with `xcrun devicectl device install app` |
| Android | debug for x86_64 |

```sh
git switch --detach e04aaf62f7
# the reproducer in packages/rn-tester/js/examples/Playground/RNTesterPlayground.js

# iOS
yarn install --frozen-lockfile
(cd packages/react-native-codegen && yarn build)
cd packages/rn-tester
pod update hermes-engine --no-repo-update
xcodebuild -workspace RNTesterPods.xcworkspace -scheme RNTester -configuration Release -sdk iphoneos \
  -destination generic/platform=iOS CODE_SIGNING_ALLOWED=NO build

# Android, with debuggableVariants = listOf() in packages/rn-tester/android/app/build.gradle.kts so the debug build embeds its bundle
./gradlew :packages:rn-tester:android:app:assembleDebug -PreactNativeArchitectures=x86_64 \
  -x :packages:react-native:ReactAndroid:buildCodegenCLI -Preact.internal.useHermesStable=true
```

## Steps

**iPad Pro, iPadOS 27.0.1**, through a WebDriverAgent runner. The Playground is opened from RNTester's Playground tab; Cmd+A and Cmd+C are pressed in the first field, then each other field is tapped and Cmd+V pressed in it, in both orders. The chords go through the runner's `keyboardInput`; a chord sent first after a tap did nothing in either field, so a right-arrow key goes ahead of them. WebDriverAgent reads an empty field as its placeholder, so the line under the fields is what each field holds.

RNTester draws a field's text in black, and its dark theme puts the fields on black, so the pictures of the fields are taken in light appearance; the readings are the same in both.

With VoiceOver and its Caption Panel on, each field is touched, then double-tapped to edit it, and the rotor is turned with the runner's rotate gesture, one call per turn, clockwise and then counter-clockwise, while the screen is recorded. The rotor's label and the Caption Panel, which shows everything VoiceOver says, are read off the recording. In the field without the prop, flicks down on the Edit item step through its actions, and a double-tap runs one.

**Android 16 emulator** (stock, API 36, 1140 × 2400). [`tools/keyboard-paste.sh`](../tools/keyboard-paste.sh) copies the first field with Ctrl+A and Ctrl+C, then pastes with Ctrl+V into each other field:

```sh
tools/keyboard-paste.sh <serial> 570 343 570 520 570 697
```

## Readings

| Paste from a keyboard | iPad: Cmd+V | Android: Ctrl+V |
| --- | --- | --- |
| the field with `contextMenuHidden` | nothing is pasted | `123456` is pasted |
| the field without it | `123456` is pasted | `123456` is pasted |

On the iPad, while each field is edited:

- **VoiceOver's rotor.** In the field with `contextMenuHidden`, 16 turns each way pass Typing mode, Headings, Containers, Speaking Rate, Words, Characters and Misspelt Words, and VoiceOver never says Edit. In the field without it, the same turns land on Edit every few turns; its actions are paste and scan text, and paste puts `123456` in the field.
- **The keyboard's Paste key** is greyed out in the field with `contextMenuHidden` and enabled in the field without it.

The readings are in [`readings/`](readings).

<img src="../images/context-menu-hidden-ipad-cmd-v.png" width="640">

After Cmd+V in the field with `contextMenuHidden`, then in the field without it.

<img src="../images/context-menu-hidden-ipad-paste-key.png" width="240">

The keyboard's shortcut bar while the field without the prop (top) and the field with it (bottom) is edited.

<img src="../images/context-menu-hidden-ipad-voiceover-rotor.png" width="700">

The rotor's label after each clockwise turn: the field without the prop (top), the field with it (bottom).

| The Caption Panel, counter-clockwise: the field with `contextMenuHidden` | the field without it |
| --- | --- |
| <img src="../images/context-menu-hidden-ipad-voiceover-captions-with.png" width="350"> | <img src="../images/context-menu-hidden-ipad-voiceover-captions-without.png" width="350"> |

Each caption once, in the order VoiceOver said it; a yellow word is the one being spoken.

<img src="../images/context-menu-hidden-ipad-voiceover-paste.png" width="640">

The field without the prop: the rotor on Edit, a flick down to its paste action, and the field after a double-tap on it.
