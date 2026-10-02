import Foundation
import MLX
import MLXFast
import MLXNN

typealias Modulation = (shift: MLXArray, scale: MLXArray, gate: MLXArray)

enum StudioRope {
  static let theta: Float = 2000
  static let axes = [32, 32, 32, 32]

  static func tables(_ ids: MLXArray) -> (cos: MLXArray, sin: MLXArray) {
    let positions = ids.asType(.float32)
    var cosParts: [MLXArray] = []
    var sinParts: [MLXArray] = []
    for (axis, dim) in axes.enumerated() {
      let scale = MLXArray(stride(from: 0, to: dim, by: 2).map { Float($0) }) / Float(dim)
      let omega = MLX.pow(MLXArray(theta), -scale)
      let angles = positions[0..., axis][0..., .newAxis] * omega[.newAxis, 0...]
      cosParts.append(MLX.cos(angles))
      sinParts.append(MLX.sin(angles))
    }
    return (concatenated(cosParts, axis: -1), concatenated(sinParts, axis: -1))
  }

  static func apply(_ q: MLXArray, _ k: MLXArray, cos: MLXArray, sin: MLXArray) -> (MLXArray, MLXArray) {
    let c = cos.reshaped(1, 1, cos.shape[0], cos.shape[1])
    let s = sin.reshaped(1, 1, sin.shape[0], sin.shape[1])
    func rotate(_ x: MLXArray) -> MLXArray {
      let shape = x.shape
      let pairs = x.asType(.float32).reshaped(shape[0], shape[1], shape[2], shape[3] / 2, 2)
      let real = pairs[0..., 0..., 0..., 0..., 0]
      let imag = pairs[0..., 0..., 0..., 0..., 1]
      return stacked([real * c - imag * s, imag * c + real * s], axis: -1).reshaped(shape).asType(x.dtype)
    }
    return (rotate(q), rotate(k))
  }
}

final class TimestepEmbedding: Module {
  @ModuleInfo(key: "linear_1") var linear1: Linear
  @ModuleInfo(key: "linear_2") var linear2: Linear

  init(dim: Int) {
    _linear1.wrappedValue = Linear(256, dim, bias: false)
    _linear2.wrappedValue = Linear(dim, dim, bias: false)
  }

  func callAsFunction(_ timestep: MLXArray) -> MLXArray {
    let half = 128
    let freqs = MLX.exp(-Float(Foundation.log(10000.0)) * MLXArray(0..<half).asType(.float32) / Float(half))
    let args = timestep.asType(.float32)[0..., .newAxis] * freqs[.newAxis, 0...]
    let embedding = concatenated([MLX.cos(args), MLX.sin(args)], axis: -1)
    return linear2(silu(linear1(embedding)))
  }
}

final class StudioModulation: Module {
  let sets: Int
  @ModuleInfo var linear: Linear

  init(dim: Int, sets: Int) {
    self.sets = sets
    _linear.wrappedValue = Linear(dim, dim * 3 * sets, bias: false)
  }

  func callAsFunction(_ temb: MLXArray) -> [Modulation] {
    var values = linear(silu(temb))
    if values.ndim == 2 { values = values[0..., .newAxis, 0...] }
    let parts = split(values, parts: 3 * sets, axis: -1)
    return (0..<sets).map { (parts[3 * $0], parts[3 * $0 + 1], parts[3 * $0 + 2]) }
  }
}

enum StudioAttention {
  static func heads(_ x: MLXArray, count: Int, dim: Int) -> MLXArray {
    x.reshaped(x.shape[0], x.shape[1], count, dim).transposed(0, 2, 1, 3)
  }

  static func normed(_ x: MLXArray, _ norm: RMSNorm) -> MLXArray {
    norm(x.asType(.float32)).asType(x.dtype)
  }

  static func attend(_ q: MLXArray, _ k: MLXArray, _ v: MLXArray) -> MLXArray {
    let scale = 1 / Float(q.shape[3]).squareRoot()
    let out = MLXFast.scaledDotProductAttention(queries: q, keys: k, values: v, scale: scale, mask: .none)
    return out.transposed(0, 2, 1, 3).reshaped(out.shape[0], -1, out.shape[1] * out.shape[3])
  }
}

final class StudioFeedForward: Module {
  @ModuleInfo(key: "linear_in") var linearIn: Linear
  @ModuleInfo(key: "linear_out") var linearOut: Linear

  init(dim: Int, inner: Int) {
    _linearIn.wrappedValue = Linear(dim, inner * 2, bias: false)
    _linearOut.wrappedValue = Linear(inner, dim, bias: false)
  }

  static func swiglu(_ x: MLXArray) -> MLXArray {
    let parts = split(x, parts: 2, axis: -1)
    return silu(parts[0]) * parts[1]
  }

  func callAsFunction(_ x: MLXArray) -> MLXArray { linearOut(Self.swiglu(linearIn(x))) }
}

final class JointAttention: Module {
  let count: Int
  let dim: Int
  @ModuleInfo(key: "to_q") var toQ: Linear
  @ModuleInfo(key: "to_k") var toK: Linear
  @ModuleInfo(key: "to_v") var toV: Linear
  @ModuleInfo(key: "norm_q") var normQ: RMSNorm
  @ModuleInfo(key: "norm_k") var normK: RMSNorm
  @ModuleInfo(key: "to_out") var toOut: Linear
  @ModuleInfo(key: "norm_added_q") var normAddedQ: RMSNorm
  @ModuleInfo(key: "norm_added_k") var normAddedK: RMSNorm
  @ModuleInfo(key: "add_q_proj") var addQ: Linear
  @ModuleInfo(key: "add_k_proj") var addK: Linear
  @ModuleInfo(key: "add_v_proj") var addV: Linear
  @ModuleInfo(key: "to_add_out") var toAddOut: Linear

  init(width: Int, count: Int, dim: Int) {
    self.count = count
    self.dim = dim
    _toQ.wrappedValue = Linear(width, width, bias: false)
    _toK.wrappedValue = Linear(width, width, bias: false)
    _toV.wrappedValue = Linear(width, width, bias: false)
    _normQ.wrappedValue = RMSNorm(dimensions: dim, eps: 1e-5)
    _normK.wrappedValue = RMSNorm(dimensions: dim, eps: 1e-5)
    _toOut.wrappedValue = Linear(width, width, bias: false)
    _normAddedQ.wrappedValue = RMSNorm(dimensions: dim, eps: 1e-5)
    _normAddedK.wrappedValue = RMSNorm(dimensions: dim, eps: 1e-5)
    _addQ.wrappedValue = Linear(width, width, bias: false)
    _addK.wrappedValue = Linear(width, width, bias: false)
    _addV.wrappedValue = Linear(width, width, bias: false)
    _toAddOut.wrappedValue = Linear(width, width, bias: false)
  }

  func callAsFunction(_ image: MLXArray, text: MLXArray, cos: MLXArray, sin: MLXArray) -> (MLXArray, MLXArray) {
    let h = { (x: MLXArray) in StudioAttention.heads(x, count: self.count, dim: self.dim) }
    var q = concatenated(
      [StudioAttention.normed(h(addQ(text)), normAddedQ), StudioAttention.normed(h(toQ(image)), normQ)], axis: 2)
    var k = concatenated(
      [StudioAttention.normed(h(addK(text)), normAddedK), StudioAttention.normed(h(toK(image)), normK)], axis: 2)
    let v = concatenated([h(addV(text)), h(toV(image))], axis: 2)
    (q, k) = StudioRope.apply(q, k, cos: cos, sin: sin)
    let out = StudioAttention.attend(q, k, v)
    let length = text.shape[1]
    return (toOut(out[0..., length..., 0...]), toAddOut(out[0..., ..<length, 0...]))
  }
}

final class DoubleBlock: Module {
  @ModuleInfo var norm1: LayerNorm
  @ModuleInfo(key: "norm1_context") var norm1Context: LayerNorm
  @ModuleInfo var attn: JointAttention
  @ModuleInfo var norm2: LayerNorm
  @ModuleInfo var ff: StudioFeedForward
  @ModuleInfo(key: "norm2_context") var norm2Context: LayerNorm
  @ModuleInfo(key: "ff_context") var ffContext: StudioFeedForward

  init(width: Int, count: Int, dim: Int, inner: Int) {
    _norm1.wrappedValue = LayerNorm(dimensions: width, eps: 1e-6, affine: false)
    _norm1Context.wrappedValue = LayerNorm(dimensions: width, eps: 1e-6, affine: false)
    _attn.wrappedValue = JointAttention(width: width, count: count, dim: dim)
    _norm2.wrappedValue = LayerNorm(dimensions: width, eps: 1e-6, affine: false)
    _ff.wrappedValue = StudioFeedForward(dim: width, inner: inner)
    _norm2Context.wrappedValue = LayerNorm(dimensions: width, eps: 1e-6, affine: false)
    _ffContext.wrappedValue = StudioFeedForward(dim: width, inner: inner)
  }

  func callAsFunction(
    _ image: MLXArray, text: MLXArray, imageMod: [Modulation], textMod: [Modulation], cos: MLXArray, sin: MLXArray
  ) -> (text: MLXArray, image: MLXArray) {
    var image = image
    var text = text
    let (imageOut, textOut) = attn(
      (1 + imageMod[0].scale) * norm1(image) + imageMod[0].shift,
      text: (1 + textMod[0].scale) * norm1Context(text) + textMod[0].shift, cos: cos, sin: sin)
    image = image + imageMod[0].gate * imageOut
    text = text + textMod[0].gate * textOut
    image = image + imageMod[1].gate * ff((1 + imageMod[1].scale) * norm2(image) + imageMod[1].shift)
    text = text + textMod[1].gate * ffContext((1 + textMod[1].scale) * norm2Context(text) + textMod[1].shift)
    return (text, image)
  }
}

final class ParallelAttention: Module {
  let count: Int
  let dim: Int
  let width: Int
  @ModuleInfo(key: "to_qkv_mlp_proj") var toQKVMLP: Linear
  @ModuleInfo(key: "norm_q") var normQ: RMSNorm
  @ModuleInfo(key: "norm_k") var normK: RMSNorm
  @ModuleInfo(key: "to_out") var toOut: Linear

  init(width: Int, count: Int, dim: Int, inner: Int) {
    self.count = count
    self.dim = dim
    self.width = width
    _toQKVMLP.wrappedValue = Linear(width, width * 3 + inner * 2, bias: false)
    _normQ.wrappedValue = RMSNorm(dimensions: dim, eps: 1e-5)
    _normK.wrappedValue = RMSNorm(dimensions: dim, eps: 1e-5)
    _toOut.wrappedValue = Linear(width + inner, width, bias: false)
  }

  func callAsFunction(_ x: MLXArray, cos: MLXArray, sin: MLXArray) -> MLXArray {
    let projected = split(toQKVMLP(x), indices: [width * 3], axis: -1)
    let qkv = split(projected[0], parts: 3, axis: -1)
    let h = { (x: MLXArray) in StudioAttention.heads(x, count: self.count, dim: self.dim) }
    var q = StudioAttention.normed(h(qkv[0]), normQ)
    var k = StudioAttention.normed(h(qkv[1]), normK)
    (q, k) = StudioRope.apply(q, k, cos: cos, sin: sin)
    let out = StudioAttention.attend(q, k, h(qkv[2]))
    return toOut(concatenated([out, StudioFeedForward.swiglu(projected[1])], axis: -1))
  }
}

final class SingleBlock: Module {
  @ModuleInfo var norm: LayerNorm
  @ModuleInfo var attn: ParallelAttention

  init(width: Int, count: Int, dim: Int, inner: Int) {
    _norm.wrappedValue = LayerNorm(dimensions: width, eps: 1e-6, affine: false)
    _attn.wrappedValue = ParallelAttention(width: width, count: count, dim: dim, inner: inner)
  }

  func callAsFunction(_ x: MLXArray, mod: Modulation, cos: MLXArray, sin: MLXArray) -> MLXArray {
    x + mod.gate * attn((1 + mod.scale) * norm(x) + mod.shift, cos: cos, sin: sin)
  }
}

final class OutputNorm: Module {
  let width: Int
  @ModuleInfo var linear: Linear
  @ModuleInfo var norm: LayerNorm

  init(width: Int) {
    self.width = width
    _linear.wrappedValue = Linear(width, width * 2, bias: false)
    _norm.wrappedValue = LayerNorm(dimensions: width, eps: 1e-6, affine: false)
  }

  func callAsFunction(_ x: MLXArray, _ temb: MLXArray) -> MLXArray {
    let values = linear(silu(temb))
    return norm(x) * (1 + values[0..., ..<width])[0..., .newAxis, 0...] + values[0..., width...][0..., .newAxis, 0...]
  }
}

final class StudioTransformer: Module {
  @ModuleInfo(key: "time_guidance_embed") var timeEmbed: TimestepEmbedding
  @ModuleInfo(key: "double_stream_modulation_img") var imageModulation: StudioModulation
  @ModuleInfo(key: "double_stream_modulation_txt") var textModulation: StudioModulation
  @ModuleInfo(key: "single_stream_modulation") var singleModulation: StudioModulation
  @ModuleInfo(key: "x_embedder") var xEmbedder: Linear
  @ModuleInfo(key: "context_embedder") var contextEmbedder: Linear
  @ModuleInfo(key: "transformer_blocks") var doubleBlocks: [DoubleBlock]
  @ModuleInfo(key: "single_transformer_blocks") var singleBlocks: [SingleBlock]
  @ModuleInfo(key: "norm_out") var normOut: OutputNorm
  @ModuleInfo(key: "proj_out") var projOut: Linear

  override init() {
    let width = 3072
    let inner = 9216
    _timeEmbed.wrappedValue = TimestepEmbedding(dim: width)
    _imageModulation.wrappedValue = StudioModulation(dim: width, sets: 2)
    _textModulation.wrappedValue = StudioModulation(dim: width, sets: 2)
    _singleModulation.wrappedValue = StudioModulation(dim: width, sets: 1)
    _xEmbedder.wrappedValue = Linear(128, width, bias: false)
    _contextEmbedder.wrappedValue = Linear(7680, width, bias: false)
    _doubleBlocks.wrappedValue = (0..<5).map { _ in DoubleBlock(width: width, count: 24, dim: 128, inner: inner) }
    _singleBlocks.wrappedValue = (0..<20).map { _ in SingleBlock(width: width, count: 24, dim: 128, inner: inner) }
    _normOut.wrappedValue = OutputNorm(width: width)
    _projOut.wrappedValue = Linear(width, 128, bias: false)
  }

  func callAsFunction(
    _ image: MLXArray, text: MLXArray, timestep: Float, imageIds: MLXArray, textIds: MLXArray
  ) -> MLXArray {
    let temb = timeEmbed(MLXArray([timestep]))
    var image = xEmbedder(image)
    var text = contextEmbedder(text)
    let imageRope = StudioRope.tables(imageIds)
    let textRope = StudioRope.tables(textIds)
    let cos = concatenated([textRope.cos, imageRope.cos], axis: 0)
    let sin = concatenated([textRope.sin, imageRope.sin], axis: 0)
    let imageMod = imageModulation(temb)
    let textMod = textModulation(temb)
    for block in doubleBlocks {
      (text, image) = block(image, text: text, imageMod: imageMod, textMod: textMod, cos: cos, sin: sin)
      eval(text, image)
    }
    var joined = concatenated([text, image], axis: 1)
    let mod = singleModulation(temb)[0]
    for block in singleBlocks {
      joined = block(joined, mod: mod, cos: cos, sin: sin)
      eval(joined)
    }
    return projOut(normOut(joined[0..., text.shape[1]..., 0...], temb))
  }
}
