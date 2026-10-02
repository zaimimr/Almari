import Foundation
import MLX
import MLXNN

private func groupNorm(_ channels: Int) -> GroupNorm {
  GroupNorm(groupCount: 32, dimensions: channels, eps: 1e-6, pytorchCompatible: true)
}

private func conv(_ input: Int, _ output: Int, kernel: Int = 3, stride: Int = 1, padding: Int = 1) -> Conv2d {
  Conv2d(inputChannels: input, outputChannels: output, kernelSize: .init(kernel), stride: .init(stride),
    padding: .init(padding))
}

final class ResnetBlock: Module {
  @ModuleInfo var norm1: GroupNorm
  @ModuleInfo var conv1: Conv2d
  @ModuleInfo var norm2: GroupNorm
  @ModuleInfo var conv2: Conv2d
  @ModuleInfo(key: "conv_shortcut") var shortcut: Conv2d?

  init(_ input: Int, _ output: Int) {
    _norm1.wrappedValue = groupNorm(input)
    _conv1.wrappedValue = conv(input, output)
    _norm2.wrappedValue = groupNorm(output)
    _conv2.wrappedValue = conv(output, output)
    _shortcut.wrappedValue = input == output ? nil : conv(input, output, kernel: 1, padding: 0)
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray {
    let h = conv2(silu(norm2(conv1(silu(norm1(x))))))
    return (shortcut?(x) ?? x) + h
  }
}

final class MidAttention: Module {
  @ModuleInfo(key: "group_norm") var norm: GroupNorm
  @ModuleInfo(key: "to_q") var toQ: Linear
  @ModuleInfo(key: "to_k") var toK: Linear
  @ModuleInfo(key: "to_v") var toV: Linear
  @ModuleInfo(key: "to_out") var toOut: [Linear]

  init(_ channels: Int) {
    _norm.wrappedValue = groupNorm(channels)
    _toQ.wrappedValue = Linear(channels, channels)
    _toK.wrappedValue = Linear(channels, channels)
    _toV.wrappedValue = Linear(channels, channels)
    _toOut.wrappedValue = [Linear(channels, channels)]
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray {
    let (b, h, w, c) = (x.dim(0), x.dim(1), x.dim(2), x.dim(3))
    let y = norm(x).reshaped(b, h * w, c)
    let weights = softmax(matmul(toQ(y), toK(y).transposed(0, 2, 1)) / Float(c).squareRoot(), axis: -1)
    return x + toOut[0](matmul(weights, toV(y))).reshaped(b, h, w, c)
  }
}

final class MidBlock: Module {
  @ModuleInfo var resnets: [ResnetBlock]
  @ModuleInfo var attentions: [MidAttention]

  init(_ channels: Int) {
    _resnets.wrappedValue = [ResnetBlock(channels, channels), ResnetBlock(channels, channels)]
    _attentions.wrappedValue = [MidAttention(channels)]
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray { resnets[1](attentions[0](resnets[0](x))) }
}

final class Downsample: Module {
  @ModuleInfo var conv: Conv2d

  init(_ channels: Int) {
    _conv.wrappedValue = Conv2d(
      inputChannels: channels, outputChannels: channels, kernelSize: 3, stride: 2, padding: 0)
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray {
    conv(padded(x, widths: [.init((0, 0)), .init((0, 1)), .init((0, 1)), .init((0, 0))]))
  }
}

final class Upsample: Module {
  @ModuleInfo var conv: Conv2d

  init(_ channels: Int) {
    _conv.wrappedValue = Conv2d(
      inputChannels: channels, outputChannels: channels, kernelSize: 3, stride: 1, padding: 1)
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray {
    conv(repeated(repeated(x, count: 2, axis: 1), count: 2, axis: 2))
  }
}

final class DownBlock: Module {
  @ModuleInfo var resnets: [ResnetBlock]
  @ModuleInfo var downsamplers: [Downsample]?

  init(_ input: Int, _ output: Int, last: Bool) {
    _resnets.wrappedValue = [ResnetBlock(input, output), ResnetBlock(output, output)]
    _downsamplers.wrappedValue = last ? nil : [Downsample(output)]
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray {
    let h = resnets.reduce(x) { $1($0) }
    return downsamplers?[0](h) ?? h
  }
}

final class UpBlock: Module {
  @ModuleInfo var resnets: [ResnetBlock]
  @ModuleInfo var upsamplers: [Upsample]?

  init(_ input: Int, _ output: Int, last: Bool) {
    _resnets.wrappedValue = [ResnetBlock(input, output), ResnetBlock(output, output), ResnetBlock(output, output)]
    _upsamplers.wrappedValue = last ? nil : [Upsample(output)]
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray {
    let h = resnets.reduce(x) { $1($0) }
    return upsamplers?[0](h) ?? h
  }
}

final class StudioEncoder: Module {
  @ModuleInfo(key: "conv_in") var convIn: Conv2d
  @ModuleInfo(key: "down_blocks") var downBlocks: [DownBlock]
  @ModuleInfo(key: "mid_block") var midBlock: MidBlock
  @ModuleInfo(key: "conv_norm_out") var normOut: GroupNorm
  @ModuleInfo(key: "conv_out") var convOut: Conv2d

  override init() {
    let channels = [128, 256, 512, 512]
    _convIn.wrappedValue = conv(3, 128)
    _downBlocks.wrappedValue = channels.indices.map {
      DownBlock($0 == 0 ? 128 : channels[$0 - 1], channels[$0], last: $0 == channels.count - 1)
    }
    _midBlock.wrappedValue = MidBlock(512)
    _normOut.wrappedValue = groupNorm(512)
    _convOut.wrappedValue = conv(512, 64)
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray {
    convOut(silu(normOut(midBlock(downBlocks.reduce(convIn(x)) { $1($0) }))))
  }
}

final class StudioDecoder: Module {
  @ModuleInfo(key: "conv_in") var convIn: Conv2d
  @ModuleInfo(key: "mid_block") var midBlock: MidBlock
  @ModuleInfo(key: "up_blocks") var upBlocks: [UpBlock]
  @ModuleInfo(key: "conv_norm_out") var normOut: GroupNorm
  @ModuleInfo(key: "conv_out") var convOut: Conv2d

  override init() {
    let channels = [512, 512, 256, 128]
    _convIn.wrappedValue = conv(32, 512)
    _midBlock.wrappedValue = MidBlock(512)
    _upBlocks.wrappedValue = channels.indices.map {
      UpBlock($0 == 0 ? 512 : channels[$0 - 1], channels[$0], last: $0 == channels.count - 1)
    }
    _normOut.wrappedValue = groupNorm(128)
    _convOut.wrappedValue = conv(128, 3)
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray {
    convOut(silu(normOut(upBlocks.reduce(midBlock(convIn(x))) { $1($0) })))
  }
}

final class StudioAutoencoder: Module {
  @ModuleInfo var encoder: StudioEncoder
  @ModuleInfo var decoder: StudioDecoder
  @ModuleInfo(key: "quant_conv") var quantConv: Conv2d
  @ModuleInfo(key: "post_quant_conv") var postQuantConv: Conv2d
  var mean = MLXArray.zeros([1, 1, 1, 128])
  var deviation = MLXArray.ones([1, 1, 1, 128])

  override init() {
    _encoder.wrappedValue = StudioEncoder()
    _decoder.wrappedValue = StudioDecoder()
    _quantConv.wrappedValue = conv(64, 64, kernel: 1, padding: 0)
    _postQuantConv.wrappedValue = conv(32, 32, kernel: 1, padding: 0)
  }

  static func load(_ url: URL) throws -> StudioAutoencoder {
    let model = StudioAutoencoder()
    var weights: [String: MLXArray] = [:]
    var stats: [String: MLXArray] = [:]
    for (key, value) in try MLX.loadArrays(url: url) {
      if key.hasPrefix("bn.") {
        stats[key] = value.asType(.float32)
        continue
      }
      weights[key] = (value.ndim == 4 ? value.transposed(0, 2, 3, 1) : value).asType(.float32)
    }
    guard let mean = stats["bn.running_mean"], let variance = stats["bn.running_var"] else {
      throw StudioError.weights
    }
    try model.update(parameters: ModuleParameters.unflattened(weights), verify: [.all])
    model.mean = mean.reshaped(1, 1, 1, -1)
    model.deviation = MLX.sqrt(variance + 1e-4).reshaped(1, 1, 1, -1)
    eval(model, model.mean, model.deviation)
    return model
  }

  func encode(_ image: MLXArray) -> MLXArray {
    let latent = quantConv(encoder(image))[0..., 0..., 0..., ..<32]
    let (b, h, w) = (latent.dim(0), latent.dim(1) / 2 * 2, latent.dim(2) / 2 * 2)
    let patches = latent[0..., ..<h, ..<w, 0...]
      .reshaped(b, h / 2, 2, w / 2, 2, 32)
      .transposed(0, 1, 3, 5, 2, 4)
      .reshaped(b, h / 2, w / 2, 128)
    return (patches - mean) / deviation
  }

  func decode(_ patches: MLXArray) -> MLXArray {
    let (b, h, w) = (patches.dim(0), patches.dim(1), patches.dim(2))
    let latent = (patches * deviation + mean)
      .reshaped(b, h, w, 32, 2, 2)
      .transposed(0, 1, 4, 2, 5, 3)
      .reshaped(b, h * 2, w * 2, 32)
    return decoder(postQuantConv(latent))
  }
}
