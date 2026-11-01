# #59072: `aria-hidden` on `ScrollView` and `ActivityIndicator`, iOS

[react/react-native#59072](https://github.com/react/react-native/pull/59072)

## Builds

RNTester's Release build from source, with [`A11yProbe.js`](A11yProbe.js) as its root component, on an iPad Pro (12.9-inch, 4th generation) with iOS 27.2, built with Xcode 27.2.

| Tree | Source |
| --- | --- |
| [before](trees/ipad-pro-12.9-4th-gen-ios-27.2/before.xml) | `main` at `b23e9a2677` |
| [after](trees/ipad-pro-12.9-4th-gen-ios-27.2/after.xml) | the same, with `ScrollView.js` and `ActivityIndicator.js` as the PR's head `a669d1bd1f` changes them |
| [with #59379](trees/ipad-pro-12.9-4th-gen-ios-27.2/with-59379.xml) | `main` with #59379 at `c0aa2718ac` |
| [after, with #59381](trees/ipad-pro-12.9-4th-gen-ios-27.2/after-with-59381.xml) | the after build with #59381's `RCTActivityIndicatorViewComponentView.mm` |
| [with #59379 and #59381](trees/ipad-pro-12.9-4th-gen-ios-27.2/with-59379-and-59381.xml) | `main` with both |

```sh
git switch --detach b23e9a2677
# packages/rn-tester/js/A11yProbe.js from this folder, and in packages/rn-tester/js/RNTesterApp.ios.js:
#   AppRegistry.registerComponent('RNTesterApp', () => require('./A11yProbe').default);
# after: git diff b23e9a2677 the PR's head, for ScrollView.js and ActivityIndicator.js, applied
yarn install
node ./scripts/releases/use-hermes-prebuilt.js && yarn install
cd packages/rn-tester
bundle install && bundle exec pod update hermes-engine --no-repo-update
xcodebuild build -workspace RNTesterPods.xcworkspace -scheme RNTester -configuration Release \
  -destination generic/platform=iOS -derivedDataPath build -allowProvisioningUpdates
xcrun devicectl device install app --device <udid> build/Build/Products/Release-iphoneos/RNTester.app
```

The probe renders `probe ready: <build>`, and each tree was read only once that text was in it.

## Steps

With WebDriverAgent serving on the device, a session starts RNTester, and `GET /source` returns the accessibility hierarchy XCUITest reads:

```sh
curl -s -X POST http://<device>:8100/session -H 'Content-Type: application/json' \
  -d '{"capabilities":{"alwaysMatch":{"bundleId":"<RNTester as you signed it>"}}}'
curl -s http://<device>:8100/session/<session id>/source
```

## The trees

Each indicator sits in a row beside its label, and is named by that row.

| In the accessibility tree | before | after | with #59379 | after, with #59381 | with #59379 and #59381 |
| --- | --- | --- | --- | --- | --- |
| text in a `ScrollView` with `aria-hidden` | in | **out** | **out** | **out** | **out** |
| `ActivityIndicator` with `aria-hidden` | in | **out** | **out** | **out** | **out** |
| text in a `ScrollView` with `aria-hidden={false}` over `accessibilityElementsHidden` | **out** | in | in | in | in |
| `ActivityIndicator` with `aria-hidden={false}` over `accessibilityElementsHidden` | **out** | in | in | in | in |
| `ActivityIndicator` whose `aria-hidden` turns off 1.5 s after mount | in | in | in | in | in |
| `Switch` with `aria-hidden` | in | in | **out** | in | **out** |
| control: text in a `View` with `aria-hidden` | **out** | **out** | **out** | **out** | **out** |
| control: text in a `View` with `aria-hidden={false}` over `accessibilityElementsHidden` | in | in | in | in | in |
| control: a `Switch` with `accessibilityElementsHidden` | **out** | **out** | **out** | **out** | **out** |
