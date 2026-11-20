set(ANDROID_GTESTS_GOOGLETEST ${ANDROID_NDK}/sources/third_party/googletest)

add_library(android_gtests_googletest STATIC ${ANDROID_GTESTS_GOOGLETEST}/src/gtest-all.cc)
target_include_directories(android_gtests_googletest
  PUBLIC ${ANDROID_GTESTS_GOOGLETEST}/include
  PRIVATE ${ANDROID_GTESTS_GOOGLETEST})
target_compile_options(android_gtests_googletest PRIVATE -std=c++20)
set_target_properties(android_gtests_googletest PROPERTIES POSITION_INDEPENDENT_CODE ON)

add_library(android_gtests SHARED ${ANDROID_GTEST_SOURCES} ${CMAKE_CURRENT_LIST_DIR}/main.cpp)
target_link_libraries(android_gtests reactnative android_gtests_googletest)
target_compile_reactnative_options(android_gtests PRIVATE)

add_executable(android_gtests_launcher ${CMAKE_CURRENT_LIST_DIR}/launcher.cpp)
target_link_libraries(android_gtests_launcher dl)
target_compile_options(android_gtests_launcher PRIVATE -Wall -Werror -std=c++20)
