#include <dlfcn.h>

#include <cstdio>

namespace {

void* openLibrary(const char* name) {
  void* library = dlopen(name, RTLD_NOW);
  if (library == nullptr) {
    std::fprintf(stderr, "%s\n", dlerror());
  }
  return library;
}

} // namespace

int main(int argc, char** argv) {
  // As in an app's process, the platform's libraries load before libreactnative.so, so none binds a weak symbol to it.
  if (openLibrary("libandroid.so") == nullptr) {
    return 2;
  }
  void* tests = openLibrary("libandroid_gtests.so");
  if (tests == nullptr) {
    return 2;
  }
  using TestsMain = int (*)(int, char**);
  auto runTests = reinterpret_cast<TestsMain>(dlsym(tests, "android_gtests_main"));
  if (runTests == nullptr) {
    std::fprintf(stderr, "%s\n", dlerror());
    return 2;
  }
  return runTests(argc, argv);
}
