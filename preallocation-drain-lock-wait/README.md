# The pre-allocation drain waits for `executeMount` on Android

The reproducer is two patches, which apply to `main` at [`202d93931c`](https://github.com/react/react-native/commit/202d93931ca8d2f326d02fa111178a511f5e800f) and at [`b8ec87e457`](https://github.com/react/react-native/commit/b8ec87e457c72377dab85599e1ae8c176eb242e7), before #58890:

- [`rntester-premount-scenes.patch`](rntester-premount-scenes.patch) adds six examples to RNTester's View examples, each 300 or 1200 items of two `View`s: mounted and unmounted in turn every 1.5 s beside a native-driven `Animated.spring` (`premount-burst-300`, `premount-burst-1200`), mounted or unmounted at each fling of a horizontal `ScrollView` (`premount-fling-1200`), and every 1.5 s over 40, 80 or 160 translucent full-window views (`premount-gpu40-1200`, `premount-gpu80-1200`, `premount-gpu160-1200`).
- [`drain-trace-section.patch`](drain-trace-section.patch) puts the call to `drainPreallocateViewsQueue()` in `FabricUIManager`'s frame callback in a trace section, `FabricUIManager::drainPreallocateViewsQueue`.

## Builds

Release RNTester for `arm64-v8a`, with Hermes and the JavaScript bundle embedded:

```sh
git switch --detach 202d93931c
git apply rntester-premount-scenes.patch drain-trace-section.patch
yarn install --frozen-lockfile
(cd packages/react-native-codegen && yarn build)
./gradlew :packages:rn-tester:android:app:assembleRelease -PreactNativeArchitectures=arm64-v8a \
  -x :packages:react-native:ReactAndroid:buildCodegenCLI -Preact.internal.useHermesStable=true
```

## Traces

Each scene ran for 24 s after a 9 s warm-up. On Android 14 and 16 the trace is Perfetto's, with `sched/sched_switch`, `power/cpu_frequency`, the app's `view`, `gfx` and `input` atrace categories and SurfaceFlinger's frame timeline; on Android 10 it is atrace's, with `view gfx input sched freq`. A wait is a stretch of 1 ms or more in which the main thread sleeps inside a `FabricUIManager::drainPreallocateViewsQueue` slice. Whether that drain had views queued is read from the `FabricMountingManager::preallocateRegisteredView` slices inside it, which `main` writes since #59065.

## Readings

`main` at 202d93931c. A wait listed without a note had nothing queued and fell inside `FabricMountingManager::executeMount` on `mqt_v_js`.

| Scene | Galaxy S23 (SM-S911B), Android 14, 120 Hz | RedMagic NX809J, Android 16, 120 Hz | Mi MIX 3, Android 10, 60 Hz |
| --- | --- | --- | --- |
| `premount-burst-1200` | 14 mounts; 2.95, 7.90, 6.17, 7.16 ms | 14 mounts; 1.94 ms | 14 mounts; 6.26, 6.24, 3.47, 3.80, 4.33, 3.39, 7.04, 3.78, 2.13, 5.24, 1.12, 1.04, 2.51, 2.47, 2.37, 2.11, 3.43, 2.25 ms, and 1.35 ms with 261 views queued, outside `executeMount` |
| `premount-burst-300` | 14 mounts; 1.24 ms | 15 mounts; none | 14 mounts; 2.98 ms with 138 views queued, outside `executeMount` |
| `premount-fling-1200` | 8 mounts; none | 8 mounts; none | 6 mounts; 2.32, 3.51, 2.91 ms |
| `premount-gpu160-1200` | 14 mounts; 5.18, 4.36, 2.89, 6.02, 2.58, 3.95, 4.49 ms | 14 mounts; 1.60 ms | 14 mounts; 1.87, 2.02, 3.65 ms |

In `premount-burst-1200` on the S23, where frames are 8.34 ms apart, the frames that waited 2.95, 7.90, 6.17 and 7.16 ms ran 4.46, 9.28, 7.82 and 8.83 ms. In the two waits read against `executeMount`'s own slice, the main thread slept from 0.09 and 0.32 ms after `executeMount` began until 0.40 and 0.42 ms before it returned.

`main` at b8ec87e457, on the S23: no wait of 1 ms or more in `premount-burst-1200` (14 mounts), `premount-burst-300` (14) or `premount-fling-1200` (8).
