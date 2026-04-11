// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Moonshine",
    platforms: [
        .iOS(.v14),
        .macOS(.v13),
    ],
    products: [
        .library(name: "Moonshine", type: .static, targets: ["MoonshineVoice"])
    ],
    targets: [
        .binaryTarget(
            name: "Moonshine",
            // use the locally-downloaded xcframework instead of fetching from network
            path: "Moonshine.xcframework"
            // url: "https://github.com/moonshine-ai/moonshine-swift/releases/download/v0.0.49/Moonshine.xcframework.zip",
            // checksum: "f90602a78beaead62b98d46a30a20e386e9e0b3e57815ea8d3c560f3e939283c"
        ),
        .target(
            name: "MoonshineVoice",
            dependencies: ["Moonshine"],
            path: "Sources/MoonshineVoice",
            linkerSettings: [
                .linkedLibrary("c++"),
                .linkedFramework("CoreML"),
                .linkedFramework("AVFoundation"),
                .linkedFramework("Accelerate"),
                .linkedFramework("CoreMedia")
            ]
        ),
        .testTarget(
            name: "MoonshineVoiceTests",
            dependencies: ["MoonshineVoice"],
            path: "Tests/MoonshineVoiceTests",
            resources: [
                .copy("test-assets")
            ]
        ),
    ]
)
