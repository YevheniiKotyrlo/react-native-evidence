#include <gtest/gtest.h>

extern "C" int android_gtests_main(int argc, char** argv) {
  testing::InitGoogleTest(&argc, argv);
  return RUN_ALL_TESTS();
}
