// swift-tools-version: 6.0
import PackageDescription

let package = Package(
  name: "StudioCheck",
  platforms: [.macOS(.v14)],
  dependencies: [.package(url: "https://github.com/ml-explore/mlx-swift", exact: "0.31.6")],
  targets: [
    .executableTarget(
      name: "StudioCheck",
      dependencies: [
        .product(name: "MLX", package: "mlx-swift"),
        .product(name: "MLXNN", package: "mlx-swift"),
        .product(name: "MLXFast", package: "mlx-swift"),
        .product(name: "MLXRandom", package: "mlx-swift"),
      ],
      swiftSettings: [.swiftLanguageMode(.v5)]
    )
  ]
)
