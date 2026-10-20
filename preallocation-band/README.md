# Every new view is created inside a frame on Android

The reproducer is two patches, which apply to `main` at [`928fd149cb`](https://github.com/react/react-native/commit/928fd149cb939f069b76f7d11ed40db542fe6a64):

- [`rntester-preallocation-band-scenes.patch`](rntester-preallocation-band-scenes.patch) adds two examples to RNTester's View examples. Each replaces a band of rows every 250 ms beside a native-driven rotation, 12 rows in `preallocation-band-12` and 48 in `preallocation-band-48`, and each row is a `View`, a circle and a `Text`.
- [`drain-trace-section.patch`](../preallocation-drain-lock-wait/drain-trace-section.patch), from the pre-allocation drain reproducer, puts the call to `drainPreallocateViewsQueue()` in `FabricUIManager`'s frame callback in a trace section, `FabricUIManager::drainPreallocateViewsQueue`.

## Build

Release RNTester for `arm64-v8a`, with Hermes and the JavaScript bundle embedded:

```sh
git switch --detach 928fd149cb
git apply rntester-preallocation-band-scenes.patch ../preallocation-drain-lock-wait/drain-trace-section.patch
yarn install --frozen-lockfile
(cd packages/react-native-codegen && yarn build)
./gradlew :packages:rn-tester:android:app:assembleRelease -PreactNativeArchitectures=arm64-v8a \
  -x :packages:react-native:ReactAndroid:buildCodegenCLI -Preact.internal.useHermesStable=true
```

## Traces

Each scene ran for 24 s after a 9 s warm-up, three times, on a Galaxy S23 (SM-S911B), Android 14, 120 Hz. The trace is Perfetto's, with `sched/sched_switch`, `power/cpu_frequency`, the app's `view`, `gfx` and `input` atrace categories and SurfaceFlinger's frame timeline.

A view's creation is a `SurfaceMountingManager::createViewUnsafe` slice on the main thread, placed by its ancestors:

- inside a `Choreographer#doFrame` slice or not;
- under `MountItemDispatcher::premountViews` (the frame's pre-mount budget);
- under `MountItemDispatcher::mountViews preMountItems` (the pre-mount items a batch runs before itself);
- under `IntBufferBatchMountItem::mountInstructions::CREATE` (a `CREATE` in the batch).

## Readings

Each cell lists the range over the three traces.

| | `preallocation-band-12` | `preallocation-band-48` |
| --- | --- | --- |
| views created inside a frame | all 3348–3384 (719–753 ms) | all 13392–13536 (1553–1617 ms) |
| by the frame's pre-mount budget | 2411–2548 (567–580 ms) | 10112–10373 (1130–1204 ms) |
| by a batch, from the pre-mount queue | 747–852 (127–148 ms) | 1219–1507 (112–146 ms) |
| by a `CREATE` in the batch | 16–125 (4–28 ms) | 1713–2061 (263–312 ms) |
| batches with a `CREATE`, of 93–94 | 7–13, a median 1–6 views each | 32–39, a median 47–57 views each |
| `FabricUIManager::drainPreallocateViewsQueue` | 2777–2779, all inside a frame | 2683–2692, all inside a frame |
| frames past 8.33 ms, of 2741–2780 | 93–94, each trace's longest 19.63–23.06 ms | 123–125, each trace's longest 29.89–32.69 ms |
| frames the frame timeline marks `App Deadline Missed` | 94–96 | 145–153 |

The longest frame of the first `preallocation-band-48` trace, 29.89 ms, created 97 views. `MountItemDispatcher::premountViews` created 25 of them in 2.75 ms, and the batch created the other 72 in a 12.37 ms `CREATE` section of its 19.92 ms. `FabricMountingManager::executeMount` had run 0.60 ms on `mqt_v_js` before that frame.
